from django.contrib.auth.models import User
from rest_framework import generics, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Note, Session
from .serializers import UserSerializer, NoteSerializer, SessionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# -----------------------------
# Existing Note Views
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
# User creation
# -----------------------------
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# -----------------------------
# Session Views
# -----------------------------
class IsTrainerOrReadOnly(permissions.BasePermission):
    """Custom permission: trainers (is_staff) can create/edit sessions"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by('date', 'time')
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTrainerOrReadOnly]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
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
