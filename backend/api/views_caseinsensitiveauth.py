from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CaseInsensitiveTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Lowercase the username before authentication
        attrs['username'] = attrs['username'].lower()
        return super().validate(attrs)

class CaseInsensitiveTokenObtainPairView(TokenObtainPairView):
    serializer_class = CaseInsensitiveTokenObtainPairSerializer
