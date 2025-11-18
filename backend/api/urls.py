from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register the SessionViewSet
router = DefaultRouter()
router.register(r'sessions', views.SessionViewSet, basename='session')

urlpatterns = [
    # Note endpoints
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    path('notes/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),

    # Include router URLs for sessions
    path('', include(router.urls)),
]
