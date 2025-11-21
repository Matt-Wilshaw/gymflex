from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note, Session

# -------------------
# User Serializer
# -------------------
class UserSerializer(serializers.ModelSerializer):
    """
    Handles creation and serialization of User instances.
    Ensures that password is write-only and hashed correctly.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        """
        Uses Django's create_user to ensure password is hashed.
        """
        user = User.objects.create_user(**validated_data)
        return user

# -------------------
# Note Serializer
# -------------------
class NoteSerializer(serializers.ModelSerializer):
    """
    Converts Note instances to JSON and vice versa.
    Author is read-only and automatically assigned.
    """
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at', 'author']
        extra_kwargs = {'author': {'read_only': True}}

# -------------------
# Session Serializer
# -------------------
class SessionSerializer(serializers.ModelSerializer):
    """
    Handles serialization of Session instances for the frontend, applying
    role-based masking logic via to_representation.
    """
    trainer_username = serializers.ReadOnlyField(source="trainer.username")
    attendees_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    booked = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "activity_type",
            "trainer_username",
            "date",
            "time",
            "capacity",
            "attendees_count",
            "available_slots",
            "booked",
            "attendees",
        ]
        extra_kwargs = {
            "attendees": {"read_only": True},
            "trainer": {"read_only": True},
        }

    # -------------------
    # Computed fields
    # -------------------
    def get_attendees_count(self, obj):
        return obj.attendees.count()

    def get_available_slots(self, obj):
        return obj.capacity - obj.attendees.count()

    def get_booked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.attendees.filter(pk=request.user.pk).exists()
        return False

    # -------------------
    # Custom creation logic
    # -------------------
    def create(self, validated_data):
        admin_user = User.objects.filter(is_staff=True).first()
        validated_data['trainer'] = admin_user if admin_user else User.objects.first()
        return super().create(validated_data)

    # -------------------
    # Role-Based Visibility / Masking Logic
    # -------------------
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Trainer/Admin sees full details
        if user and user.is_staff:
            representation['attendees'] = list(instance.attendees.values_list('id', flat=True))
            return representation

        is_booked = representation.get('booked', False)

        if is_booked:
            # Booked client sees all details, only their own ID in attendees
            representation['attendees'] = [user.id] if user else []
            return representation
        else:
            # Unbooked client sees session name and slots, but not attendees
            representation['trainer_username'] = "TBA"
            representation['attendees'] = []
            # Keep the real activity_type so calendar shows it
            representation['activity_type'] = instance.activity_type
            return representation
