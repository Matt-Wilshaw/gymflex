from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),

    # User registration endpoint
    path("api/user/register/", CreateUserView.as_view(), name="register"),

    # JWT token endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),  # Get access and refresh tokens
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),  # Refresh access token

    # DRF browsable API login/logout
    path("api-auth/", include("rest_framework.urls")),

    # Include all app-specific API endpoints
    path("api/", include("api.urls")),
]
