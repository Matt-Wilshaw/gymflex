"""
Main URL configuration for GymFlex Django project.

This module defines the top-level routing for the entire application, including:
- Admin panel access
- User authentication and registration endpoints
- JWT token generation and refresh endpoints
- API endpoint delegation to the api app
- Static file serving for React frontend assets
- Catch-all route to serve the React single-page application

URL Resolution Order:
Django processes URL patterns sequentially from top to bottom. The first matching
pattern handles the request. The catch-all pattern at the end ensures any unmatched
routes serve the React app (enabling client-side routing).
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Django admin panel - provides web interface for database management
    # Accessible at /admin/ and requires staff/superuser permissions
    path("admin/", admin.site.urls),

    # User registration endpoint - allows new users to create accounts
    # POST request to /api/user/register/ with username, email, password
    path("api/user/register/", CreateUserView.as_view(), name="register"),

    # JWT token authentication endpoints
    # These are exempt from CSRF protection because:
    # 1. JWT authentication is immune to CSRF attacks (tokens sent explicitly, not automatically)
    # 2. CSRF protection relies on cookies, but JWT uses Authorization headers
    # 3. Our custom middleware also exempts /api/ paths for consistency
    path("api/token/", csrf_exempt(TokenObtainPairView.as_view()), name="get_token"),
    path("api/token/refresh/", csrf_exempt(TokenRefreshView.as_view()), name="refresh"),

    # Django REST Framework's browsable API authentication
    # Provides login/logout forms when viewing API endpoints in a browser
    path("api-auth/", include("rest_framework.urls")),

    # Delegate all /api/ routes to the api app's URL configuration
    # This includes Session viewsets, user endpoints, and custom actions
    path("api/", include("api.urls")),
    
    # Serve React's static assets (JavaScript, CSS, images) from frontend/dist/assets/
    # This regex pattern matches any path starting with /assets/ and serves files directly
    # WhiteNoise middleware handles compression and caching for production efficiency
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets'}),
    
    # Catch-all route: serve React's index.html for all unmatched paths
    # This enables React Router to handle client-side routing for SPA navigation
    # MUST be the last pattern so it doesn't override other routes
    # Any route not matched above (e.g., /, /login, /sessions/23) serves index.html
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
]
