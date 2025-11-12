from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note


# Serializer for the User model
# - Converts User instances to JSON and vice versa
# - Handles user creation with password hashing
# - Password is write-only, can be set but not returned
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    # Override create method to use Django's create_user
    # Ensures the password is hashed correctly
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    

# Serializer for the Note model
# - Converts Note instances to JSON and vice versa for API responses and requests
# - Includes id, title, content, timestamps, and author fields
# - Author field is read-only, so it cannot be modified via the API
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note  # Model to serialise
        fields = ['id', 'title', 'content', 'created_at', 'updated_at', 'author']  # Fields included
        extra_kwargs = {'author': {'read_only': True}}  # Author is read-only

