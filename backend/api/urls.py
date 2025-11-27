"""
URL routing configuration for the GymFlex API app.

This module defines the URL patterns for all API endpoints provided by the api app.
These routes are included under the /api/ prefix by the main project urls.py.

URL Structure:
- /api/users/register/ → User registration
- /api/users/me/ → Current user information
- /api/notes/ → Note list/create (legacy endpoints)
- /api/notes/{id}/ → Note deletion
- /api/sessions/ → Session list/create
- /api/sessions/{id}/ → Session detail/update/delete
- /api/sessions/{id}/book/ → Custom booking action
- /api/sessions/{id}/remove_attendee/ → Custom admin action

Router Usage:
Django REST Framework's DefaultRouter automatically generates URL patterns for
ModelViewSet classes, including:
- List endpoint (GET /sessions/)
- Detail endpoint (GET /sessions/{id}/)
- Create (POST /sessions/)
- Update (PUT/PATCH /sessions/{id}/)
- Delete (DELETE /sessions/{id}/)
- Custom actions (decorated with @action in the viewset)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for automatic URL pattern generation
# DefaultRouter generates conventional REST endpoints for registered viewsets
router = DefaultRouter()

# Register SessionViewSet with the router
# This creates all standard CRUD endpoints plus custom @action endpoints:
# - GET/POST /sessions/
# - GET/PUT/PATCH/DELETE /sessions/{id}/
# - POST /sessions/{id}/book/ (custom action)
# - POST /sessions/{id}/remove_attendee/ (custom action)
router.register(r'sessions', views.SessionViewSet, basename='session')

urlpatterns = [
    # User registration endpoint - allows new users to create accounts
    # POST /api/users/register/ with JSON: {"username": "...", "password": "..."}
    path('users/register/', views.CreateUserView.as_view(), name='register'),

    # Current user information endpoint - returns authenticated user's data
    # GET /api/users/me/ → {"id": 1, "username": "admin", "is_staff": true, ...}
    # Used by frontend to determine whether to show admin features
    path('users/me/', views.CurrentUserView.as_view(), name='current-user'),

    # Note endpoints (legacy features - may not be actively used in current app)
    # GET /api/notes/ → List all notes for current user
    # POST /api/notes/ → Create new note
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    
    # DELETE /api/notes/{id}/ → Delete specific note (if owned by user)
    path('notes/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),

    # Health check (public) - basic diagnostics: DB engine, counts
    path('health/', views.health, name='health'),

    # Include all router-generated URLs for sessions
    # This adds the SessionViewSet endpoints at /api/sessions/
    # The router handles both standard CRUD and custom actions automatically
    path('', include(router.urls)),
]
