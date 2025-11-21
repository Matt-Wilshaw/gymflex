from rest_framework import serializers
from django.contrib.auth.models import User
# Assuming your models are correctly defined here, particularly Session
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

    The fields mapped directly to the database are:
    activity_type, trainer, date, time, capacity, attendees (M2M)
    """
    # ReadOnlyField to display the trainer's username instead of their ID
    trainer_username = serializers.ReadOnlyField(source="trainer.username")

    # Computed fields (read-only)
    attendees_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    booked = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "activity_type",
            "trainer_username", # Derived from 'trainer' foreign key
            "date",
            "time",
            "capacity",
            "attendees_count",  # Computed
            "available_slots",  # Computed
            "booked",           # Computed based on current user
            "attendees",        # M2M field used for calculations and admin view
        ]
        extra_kwargs = {
            "attendees": {"read_only": True},  # Managed via custom API actions (book/unbook)
            "trainer": {"read_only": True},    # Automatically assigned to an admin/staff user on creation
        }

    # -------------------
    # Computed fields implementation
    # -------------------
    def get_attendees_count(self, obj):
        """Return the current number of booked attendees."""
        return obj.attendees.count()

    def get_available_slots(self, obj):
        """Return the number of remaining slots based on capacity."""
        # obj.capacity is the total limit
        # obj.attendees.count() is the current count
        return obj.capacity - obj.attendees.count()

    def get_booked(self, obj):
        """
        Checks if the currently logged-in user has booked this session.
        Requires the request context to be passed to the serializer.
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            # Check if the authenticated user is in the attendees list
            return obj.attendees.filter(pk=request.user.pk).exists()
        return False

    # -------------------
    # Custom creation logic
    # -------------------
    def create(self, validated_data):
        """
        Automatically assigns the trainer as the first staff user found.
        """
        # Find the first user who is marked as staff/superuser to act as the trainer
        admin_user = User.objects.filter(is_staff=True).first()
        if admin_user:
            validated_data['trainer'] = admin_user
        else:
            # Fallback: if no staff user, assign to any user, or raise an error
            # For robustness, we assume you have at least one User in the DB.
            validated_data['trainer'] = User.objects.all().first()

        return super().create(validated_data)

    # -------------------
    # Role-Based Visibility / Masking Logic (Core Privacy Rule)
    # -------------------
    def to_representation(self, instance):
        """
        Custom method to mask or reveal data based on user role (is_staff)
        and booking status (is_booked).
        """
        # 1. Get the initial, unmasked representation of the object
        representation = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # --- CASE 1: Trainer/Admin Access (Full Visibility) ---
        if user and user.is_staff:
            # Staff see everything, including the actual list of all attendee IDs.
            attendee_ids = list(instance.attendees.all().values_list('id', flat=True))
            representation['attendees'] = attendee_ids
            return representation

        # --- CASE 2 & 3: Regular Client or Anonymous Access ---
        is_booked = representation.get('booked', False)

        if is_booked:
            # --- CASE 2: Client is Booked (Partial Visibility) ---
            # Client sees all details, but only their own ID in the attendees list.
            current_user_id = user.id if user else None
            # Overwrite the M2M list (which contained all IDs) with just the current user's ID
            representation['attendees'] = [current_user_id] if current_user_id is not None else []
            # All other fields (activity_type, trainer_username, date, time, capacity) remain unmasked (real value)
            return representation
        
        else:
            # --- CASE 3: Client is NOT Booked OR is Anonymous (Maximum Masking) ---
            
            # Mask sensitive or identifying information
            representation['activity_type'] = "Private Session"
            representation['trainer_username'] = "TBA"

            # Hide the list of attendees completely
            representation['attendees'] = []

            # Keep capacity, available_slots, date, and time visible (these are non-sensitive planning details)
            return representation