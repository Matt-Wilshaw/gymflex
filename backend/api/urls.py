from django.urls import path
from . import views

urlpatterns = [
    # Endpoint to list all notes for the authenticated user and create new notes
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),

    # Endpoint to delete a specific note by its primary key (id)
    path('notes/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
]