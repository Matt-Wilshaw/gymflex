from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, NoteSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note


# View to list and create notes for the logged-in user
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    # Only return notes authored by the current user
    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    # Save a new note with the current user as the author
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)


# View to delete a note belonging to the logged-in user
class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    # Only allow deletion of notes authored by the current user
    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)


# View to create a new user
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
