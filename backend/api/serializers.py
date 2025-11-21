from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note, Session

# -------------------
# User Serializer
# -------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

# -------------------
# Note Serializer
# -------------------
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at', 'author']
        extra_kwargs = {'author': {'read_only': True}}

# -------------------
# Session Serializer
# -------------------
class SessionSerializer(serializers.ModelSerializer):
    trainer_username = serializers.ReadOnlyField(source="trainer.username")
    available_slots = serializers.SerializerMethodField()
    booked = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "title",
            "activity_type",
            "trainer_username",
            "date",
            "time",
            "capacity",
            "attendees_count",
            "available_slots",
            "booked",
        ]
        extra_kwargs = {
            "attendees": {"read_only": True},
            "trainer": {"read_only": True},
        }

    def get_attendees_count(self, obj):
        return obj.attendees.count()

    def get_available_slots(self, obj):
        return obj.capacity - obj.attendees.count()

    def get_booked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user in obj.attendees.all()
        return False
