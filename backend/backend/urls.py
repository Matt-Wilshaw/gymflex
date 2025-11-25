from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),

    # User registration endpoint
    path("api/user/register/", CreateUserView.as_view(), name="register"),

    # JWT token endpoints (CSRF exempt for API authentication)
    path("api/token/", csrf_exempt(TokenObtainPairView.as_view()), name="get_token"),
    path("api/token/refresh/", csrf_exempt(TokenRefreshView.as_view()), name="refresh"),

    # DRF browsable API login/logout
    path("api-auth/", include("rest_framework.urls")),

    # Include all app-specific API endpoints
    path("api/", include("api.urls")),
    
    # Serve static files from frontend/dist
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets'}),
    
    # Serve React app for all other routes (must be last)
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
]
