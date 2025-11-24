from django.contrib.auth.models import User
from rest_framework import generics, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Note, Session
from .serializers import UserSerializer, NoteSerializer, SessionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# -----------------------------
# Note Views
# -----------------------------
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(author=self.request.user)


# -----------------------------
# User Creation
# -----------------------------
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# -----------------------------
# Custom Permission for Sessions
# -----------------------------
class IsTrainerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


# -----------------------------
# Session ViewSet
# -----------------------------
class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by("date", "time")
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
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

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsTrainerOrReadOnly])
    def remove_attendee(self, request, pk=None):
        """
        Admin-only endpoint to remove an attendee from a session.
        Expects JSON payload: { "user_id": <id> }
        """
        session = self.get_object()
        if not request.user.is_staff:
            return Response({"detail": "Not authorized"}, status=403)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

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
    Returns the currently logged-in user's info.
    Frontend uses this to show admin button if user is superuser.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Make sure is_superuser is included in the serialized data
        serializer = UserSerializer(request.user)
        data = serializer.data
        data['is_superuser'] = request.user.is_superuser
        # Also include is_staff so frontend can detect admin users correctly
        data['is_staff'] = request.user.is_staff
        return Response(data)
