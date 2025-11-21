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
    List and create Notes for the logged-in user.
    Only the author can see their own notes.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter notes to only show those created by the logged-in user
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the note author
        serializer.save(author=self.request.user)


class NoteDelete(generics.DestroyAPIView):
    """
    Delete notes. Only the author can delete their own notes.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow deletion of notes created by the logged-in user
        return Note.objects.filter(author=self.request.user)


# -----------------------------
# User Creation
# -----------------------------
class CreateUserView(generics.CreateAPIView):
    """
    API view for user registration.
    Open to anyone (no authentication required).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# -----------------------------
# Custom Permission for Sessions
# -----------------------------
class IsTrainerOrReadOnly(permissions.BasePermission):
    """
    Custom permission for sessions:
    - Trainers (is_staff=True) can create, edit, or delete sessions
    - Regular users can only view sessions (read-only)
    """
    def has_permission(self, request, view):
        # SAFE_METHODS = GET, HEAD, OPTIONS -> allow authenticated users to read
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Only staff (trainer/admin) can modify
        return request.user and request.user.is_staff


# -----------------------------
# Session ViewSet
# -----------------------------
class SessionViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for gym sessions.
    - Trainers can create/edit/delete sessions.
    - Regular users can view sessions and book/unbook them.
    """
    queryset = Session.objects.all().order_by("date", "time")
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    def get_serializer_context(self):
        """
        Pass additional context to the serializer.
        This allows the serializer to check if the logged-in user has booked a session.
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        """
        Custom action to toggle booking for the logged-in user.
        - Adds the user to the session attendees if not already booked.
        - Removes the user if they are already booked (unbook).
        - Checks session capacity before booking.
        """
        session = self.get_object()  # Get the session being booked
        user = request.user  # Current logged-in user

        if user in session.attendees.all():
            # If the user is already booked, remove them
            session.attendees.remove(user)
            return Response({"status": "unbooked"})
        else:
            if session.attendees.count() < session.capacity:
                # If capacity allows, add the user to attendees
                session.attendees.add(user)
                return Response({"status": "booked"})
            else:
                # Session is full, cannot book
                return Response({"status": "full"}, status=400)
