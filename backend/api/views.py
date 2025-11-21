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
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NoteDelete(generics.DestroyAPIView):
    """
    Delete notes. Only the author can delete their notes.
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
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
    Custom permission:
    - Trainers (is_staff=True) can create/edit sessions
    - Regular users can only view (read-only)
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class SessionViewSet(viewsets.ModelViewSet):
    """
    CRUD for gym sessions.
    - Trainers can create/edit/delete.
    - Clients can view sessions and book/unbook.
    """
    queryset = Session.objects.all().order_by("date", "time")
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    # Pass request context to serializer for 'booked' field
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        """
        Toggle booking for logged-in user.
        - Ensures capacity is not exceeded.
        """
        session = self.get_object()
        user = request.user

        if user in session.attendees.all():
            session.attendees.remove(user)
            return Response({"status": "unbooked"})
        else:
            if session.attendees.count() < session.capacity:
                session.attendees.add(user)
                return Response({"status": "booked"})
            else:
                return Response({"status": "full"}, status=400)
