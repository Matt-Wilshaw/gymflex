from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# URL configuration for GymFlex API
urlpatterns = [
    # Admin site URL
    path('admin/', admin.site.urls),

    # User registration endpoint
    # - Uses CreateUserView to handle POST requests for creating new users
    path('api/register/', CreateUserView.as_view(), name='register'),

    # JWT authentication endpoints
    # - token/ issues a new access and refresh token pair
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # - token/refresh/ issues a new access token using a valid refresh token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Optional DRF browsable API login/logout views
    # - Allows users to authorise via the browsable interface
    path('api-auth/', include('rest_framework.urls')),
]
