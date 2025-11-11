from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note

# Serializer for the User model
# - Converts User instances to JSON and vice versa
# - Handles user creation with password hashing
# - Password is write-only, so it can be set but not returned in API responses
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    # Override create method to use Django's create_user
    # This ensures the password is hashed properly
    def create(self, validated_data):
        print(validated_data)  # For debugging: shows incoming data
        user = User.objects.create_user(**validated_data)
        return user


# Serializer for the Note model
# - Converts Note instances to JSON and vice versa
# - Author is read-only because it will be set automatically from request.user
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "author"]
        extra_kwargs = {"author": {"read_only": True}}
