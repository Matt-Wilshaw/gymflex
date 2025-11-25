"""
Django REST Framework views for the GymFlex API.

This module defines the API endpoints (views) that handle HTTP requests and return responses.
Django REST Framework provides class-based views that reduce boilerplate code for common patterns:
- CreateAPIView: Handles POST requests to create resources
- ListCreateAPIView: Handles GET (list) and POST (create) requests
- DestroyAPIView: Handles DELETE requests
- ModelViewSet: Provides full CRUD operations (Create, Read, Update, Delete) plus custom actions

Endpoints defined in this module:
- Note CRUD operations (legacy/unused)
- User registration
- Session CRUD with custom booking actions
- Current user info endpoint
"""

from django.contrib.auth.models import User
from rest_framework import generics, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Note, Session
from .serializers import UserSerializer, NoteSerializer, SessionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# -----------------------------
# Note Views (Legacy)
# -----------------------------
class NoteListCreate(generics.ListCreateAPIView):
    """
    List all notes for authenticated user and create new notes.
    
    Endpoints:
    - GET /api/notes/ → List all notes created by the current user
    - POST /api/notes/ → Create a new note (author set automatically)
    
    Security:
    - Requires authentication (JWT token in Authorization header)
    - Users can only see their own notes (filtered by author)
    - Author field is automatically set to the requesting user
    
    Note: This view appears to be from an earlier version of GymFlex.
    No frontend code currently uses the notes feature.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter notes to only show those created by the requesting user.
        
        This ensures users cannot see each other's notes, even if they
        know the API endpoint. Privacy protection at the database query level.
        """
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        """
        Automatically set the author field when creating a new note.
        
        This prevents users from creating notes attributed to other users,
        as the author is always set to the authenticated request user.
        """
        serializer.save(author=self.request.user)


class NoteDelete(generics.DestroyAPIView):
    """
    Delete a specific note (DELETE /api/notes/{id}/).
    
    Security:
    - Requires authentication
    - Users can only delete their own notes (enforced by get_queryset filter)
    - Attempting to delete another user's note returns 404 Not Found
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Restrict deletion to notes owned by the requesting user.
        
        If a user tries to delete someone else's note, Django won't find
        it in their filtered queryset and will return 404 instead of 403,
        preventing information leakage about note existence.
        """
        return Note.objects.filter(author=self.request.user)


# -----------------------------
# User Registration
# -----------------------------
class CreateUserView(generics.CreateAPIView):
    """
    User registration endpoint (POST /api/user/register/).
    
    Accepts JSON with username and password, creates new user account.
    
    Example request:
    POST /api/user/register/
    {
        "username": "newuser",
        "password": "securepassword123"
    }
    
    Response:
    {
        "id": 5,
        "username": "newuser"
    }
    
    Security:
    - AllowAny permission (no authentication required for registration)
    - Password is hashed by UserSerializer.create method (never stored in plain text)
    - Password is write-only and not returned in the response
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Public endpoint - anyone can register


# -----------------------------
# Custom Permission Class
# -----------------------------
class IsTrainerOrReadOnly(permissions.BasePermission):
    """
    Custom permission: staff users can modify, authenticated users can read.
    
    Applied to Session endpoints to control who can create/update/delete sessions:
    - GET/HEAD/OPTIONS (safe methods): Any authenticated user can view sessions
    - POST/PUT/PATCH/DELETE: Only staff users (trainers/admins) can modify sessions
    
    This implements a common pattern where regular users are consumers and
    staff users are content managers.
    """
    def has_permission(self, request, view):
        """
        Determine if the requesting user has permission for this action.
        
        Args:
            request: Django HttpRequest with user and method information
            view: The view being accessed (SessionViewSet in this case)
            
        Returns:
            bool: True if permission granted, False otherwise
            
        Logic:
        - Safe methods (GET, HEAD, OPTIONS): Require authentication only
        - Unsafe methods (POST, PUT, DELETE): Require staff status
        """
        # SAFE_METHODS are read-only: GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Modification methods require staff/trainer permissions
        return request.user and request.user.is_staff


# -----------------------------
# Session ViewSet
# -----------------------------
class SessionViewSet(viewsets.ModelViewSet):
    """
    Full CRUD operations for Session model with custom booking actions.
    
    Endpoints provided by ModelViewSet:
    - GET /api/sessions/ → List all sessions (ordered by date, time)
    - POST /api/sessions/ → Create new session (staff only)
    - GET /api/sessions/{id}/ → Retrieve specific session
    - PUT /api/sessions/{id}/ → Update entire session (staff only)
    - PATCH /api/sessions/{id}/ → Partial update (staff only)
    - DELETE /api/sessions/{id}/ → Delete session (staff only)
    
    Custom actions (defined with @action decorator):
    - POST /api/sessions/{id}/book/ → Book or cancel booking
    - POST /api/sessions/{id}/remove_attendee/ → Remove user from session (staff only)
    
    Permissions:
    - List/retrieve: Any authenticated user
    - Create/update/delete: Staff users only (trainers/admins)
    - Custom actions: Vary by action (see individual methods)
    
    Data masking:
    - SessionSerializer applies role-based visibility rules
    - Staff see all attendee details
    - Booked users see full session info
    - Unbooked users see limited details (encourages booking)
    """
    queryset = Session.objects.all().order_by("date", "time")
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    def get_serializer_context(self):
        """
        Pass request context to serializer for role-based masking.
        
        SessionSerializer needs access to request.user to determine:
        - Whether user is staff (full visibility)
        - Whether user has booked this session (partial visibility)
        - Whether user is unbooked (minimal visibility)
        
        Returns:
            dict: Context dictionary with 'request' key added
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        """
        Toggle booking status for the requesting user (POST /api/sessions/{id}/book/).
        
        Behaviour:
        - If user is already booked: Remove them (cancel booking)
        - If user is not booked and space available: Add them (confirm booking)
        - If session is full: Return error
        
        Example request:
        POST /api/sessions/5/book/
        Authorization: Bearer <access_token>
        
        Responses:
        - {"status": "booked"} - User successfully booked
        - {"status": "unbooked"} - Booking cancelled
        - {"status": "full"} - Session at capacity (400 error)
        
        Security:
        - Requires authentication (users can only book for themselves)
        - Uses self.get_object() which respects view-level permissions
        
        Args:
            request: Django Request object with authenticated user
            pk: Primary key of the session to book (from URL parameter)
            
        Returns:
            Response: JSON with status message and HTTP status code
        """
        session = self.get_object()  # Retrieves Session with pk={pk}
        user = request.user

        # Check if user is already booked - toggle behaviour
        if user in session.attendees.all():
            session.attendees.remove(user)
            return Response({"status": "unbooked"})
        else:
            # Check capacity before adding
            if session.attendees.count() < session.capacity:
                session.attendees.add(user)
                return Response({"status": "booked"})
            else:
                return Response({"status": "full"}, status=400)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsTrainerOrReadOnly])
    def remove_attendee(self, request, pk=None):
        """
        Admin/trainer action to remove a specific user from a session.
        
        Endpoint: POST /api/sessions/{id}/remove_attendee/
        
        Use case:
        - Trainers managing bookings from admin interface
        - Removing no-shows or cancellations on behalf of users
        - Emergency capacity management
        
        Example request:
        POST /api/sessions/5/remove_attendee/
        Authorization: Bearer <staff_access_token>
        {
            "user_id": 12
        }
        
        Responses:
        - {"status": "removed"} - User successfully removed from session
        - {"status": "not_booked"} - User wasn't booked (400 error)
        - {"detail": "Not authorized"} - Non-staff user attempted action (403)
        - {"detail": "user_id is required"} - Missing parameter (400)
        - {"detail": "User not found"} - Invalid user_id (404)
        
        Security:
        - Requires authentication + staff status (double-checked in method)
        - Prevents regular users from manipulating other users' bookings
        
        Args:
            request: Django Request with staff user and JSON body
            pk: Primary key of the session (from URL parameter)
            
        Returns:
            Response: JSON with status message and appropriate HTTP status code
        """
        session = self.get_object()
        
        # Extra security check (belt-and-braces approach with permission class)
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)

        # Extract user_id from request body
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)

        # Validate user exists
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        # Remove user if they're booked, otherwise return error
        if user in session.attendees.all():
            session.attendees.remove(user)
            return Response({"status": "removed"})
        else:
            return Response({"status": "not_booked"}, status=400)


# -----------------------------
# Current User View
# -----------------------------
class CurrentUserView(APIView):
    """
    Return information about the currently authenticated user.
    
    Endpoint: GET /api/users/me/
    
    Response includes:
    - id: User's database ID
    - username: User's login name
    - is_superuser: Boolean indicating if user has all permissions
    - is_staff: Boolean indicating if user can access admin panel
    
    Frontend usage:
    - Determines whether to show "Admin" button in navigation
    - Displays current username in header
    - Controls access to trainer-only features
    
    Example response:
    {
        "id": 1,
        "username": "admin",
        "is_superuser": true,
        "is_staff": true
    }
    
    Security:
    - Requires authentication (JWT token)
    - Users can only see their own information
    - Read-only endpoint (GET only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Serialise the requesting user's information with role flags.
        
        Augments UserSerializer output with is_superuser and is_staff flags
        which aren't included in the serializer by default but are needed
        by the frontend for role-based UI rendering.
        
        Args:
            request: Django Request with authenticated user
            
        Returns:
            Response: JSON with user data including role flags
        """
        serializer = UserSerializer(request.user)
        data = serializer.data
        # Add role flags for frontend role-based rendering
        data['is_superuser'] = request.user.is_superuser
        data['is_staff'] = request.user.is_staff
        return Response(data)
