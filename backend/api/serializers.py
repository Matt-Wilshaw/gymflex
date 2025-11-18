from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note, Session

# -----------------------------------
# User Serializer
# -----------------------------------
# Handles user creation and authentication
# Ensures password is write-only and automatically hashed
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Use Django's create_user to hash the password correctly
        user = User.objects.create_user(**validated_data)
        return user


# -----------------------------------
# Note Serializer
# -----------------------------------
# Converts Note instances to JSON and vice versa
# Author is automatically assigned and cannot be edited via API
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at', 'author']
        extra_kwargs = {'author': {'read_only': True}}


# -----------------------------------
# Session Serializer (Timetable Feature)
# -----------------------------------
# For creating, listing, and managing gym sessions
class SessionSerializer(serializers.ModelSerializer):
    # Trainer username is useful to show in frontend
    trainer_username = serializers.ReadOnlyField(source="trainer.username")

    # Computed field: how many people have booked
    attendees_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "title",
            "trainer",
            "trainer_username",
            "date",
            "time",
            "capacity",
            "attendees",
            "attendees_count",
        ]
        extra_kwargs = {
            "trainer": {"read_only": True},      # Backend sets trainer
            "attendees": {"read_only": True},    # Booking handled by view functions
        }

    def get_attendees_count(self, obj):
        return obj.attendees.count()
