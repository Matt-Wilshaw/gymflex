from django.contrib.auth.models import User
from rest_framework import generics, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Note, Session
from .serializers import UserSerializer, NoteSerializer, SessionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# -----------------------------
# Note Views
# -----------------------------
class NoteListCreate(generics.ListCreateAPIView):
    """
    View for listing and creating Notes for the logged-in user.
    Only the author can see their own notes.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only notes created by the current user
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the author to the logged-in user
        serializer.save(author=self.request.user)

class NoteDelete(generics.DestroyAPIView):
    """
    View for deleting notes.
    Only the author can delete their notes.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow deletion of notes created by the current user
        return Note.objects.filter(author=self.request.user)

# -----------------------------
# User Creation
# -----------------------------
class CreateUserView(generics.CreateAPIView):
    """
    API view for creating new users (registration).
    Open to anyone (AllowAny permission).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# -----------------------------
# Session Views
# -----------------------------
class IsTrainerOrReadOnly(permissions.BasePermission):
    """
    Custom permission class:
    - Trainers (users with is_staff=True) can create and edit sessions.
    - Regular users can only view sessions (read-only).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            # GET, HEAD, OPTIONS requests are allowed for authenticated users
            return request.user and request.user.is_authenticated
        # Only staff can create or modify sessions
        return request.user and request.user.is_staff

class SessionViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for gym sessions.
    - Trainers (admin) can create/edit/delete.
    - Clients can view sessions and book/unbook them.
    """
    queryset = Session.objects.all().order_by('date', 'time')
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        """
        Custom action to allow users to book/unbook a session.
        - Toggles booking for the logged-in user.
        - Ensures capacity is not exceeded.
        """
        session = self.get_object()
        user = request.user
        
        if user in session.attendees.all():
            # If already booked, remove user
            session.attendees.remove(user)
            return Response({"status": "unbooked"})
        else:
            if session.attendees.count() < session.capacity:
                # Add user if capacity allows
                session.attendees.add(user)
                return Response({"status": "booked"})
            else:
                # Capacity reached
                return Response({"status": "full"}, status=400)
