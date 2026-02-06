"""
Django REST Framework serializers for the GymFlex API.

Serializers handle the conversion between complex Python objects (like Django model instances)
and JSON data that can be sent over HTTP. They also handle deserialization (parsing incoming
JSON into validated Python objects) and validation of input data.

This module includes:
- UserSerializer: User registration and authentication data
- NoteSerializer: Legacy note model serialization
- SessionSerializer: Complex session serialization with role-based data masking

Role-Based Data Masking:
SessionSerializer implements intelligent privacy controls:
- Staff/trainers see all attendee details
- Booked users see full session info but only their own booking
- Unbooked users see limited info (slots available, but not who's attending)
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note, Session, SessionAttendee

# -------------------
# SessionAttendee Serializer
# -------------------
class SessionAttendeeSerializer(serializers.ModelSerializer):
    """
    Serializer for attendance tracking through the SessionAttendee model.
    
    Used by admin users to view and manage attendance for past sessions.
    Shows which users attended vs marked as no-show.
    """
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = SessionAttendee
        fields = ['id', 'user', 'username', 'attended']
        read_only_fields = ['user']

# -------------------
# User Serializer
# -------------------
class UserSerializer(serializers.ModelSerializer):
    """
    Handles user registration and serialisation of User data.
    
    Security considerations:
    - Password field is write-only (never returned in API responses)
    - Uses Django's create_user method to properly hash passwords
    - Validates username uniqueness automatically
    
    Used by:
    - CreateUserView for user registration (POST /api/user/register/)
    - Any endpoint that needs to return basic user info
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {
            'password': {
                'write_only': True  # Password never appears in GET responses
            }
        }

    def create(self, validated_data):
        """
        Create new user with properly hashed password.
        Username is normalized to lowercase for case-insensitive login/registration.
        """
        validated_data['username'] = validated_data['username'].lower()
        user = User.objects.create_user(**validated_data)
        return user


# -------------------
# Note Serializer
# -------------------
class NoteSerializer(serializers.ModelSerializer):
    """
    Converts Note model instances to/from JSON format.
    
    This serializer appears to be from an earlier version of GymFlex and may not
    be actively used in the current application. The model still exists but there
    are no viewsets or endpoints actively exposing notes.
    
    Author assignment:
    - Author field is read-only (set automatically by the view)
    - Prevents users from creating notes attributed to other users
    """
    class Meta:
        model = Note
        fields = ['id', 'title', 'created_at', 'updated_at', 'author']
        extra_kwargs = {
            'author': {
                'read_only': True  # Set by view, not by client
            }
        }


# -------------------
# Session Serializer
# -------------------
class SessionSerializer(serializers.ModelSerializer):
    """
    Complex serializer for Session model with computed fields and role-based data masking.
    
    Computed Fields (calculated on-the-fly, not stored in database):
    - trainer_username: Readable trainer name instead of just ID
    - attendees_count: How many people have booked this session
    - available_slots: Remaining spots (capacity - booked)
    - booked: Boolean indicating if current user has booked this session
    
    Data Masking Logic:
    The to_representation method customises output based on who's requesting:
    - Staff/trainers: See all attendee details (IDs + usernames)
    - Booked users: See full session info but only their own ID in attendees
    - Unbooked users: See limited info (activity type, slots, but trainer shows as "TBA")
    
    This approach protects user privacy whilst allowing necessary functionality.
    """
    
    # Computed fields using SerializerMethodField (calls get_<field_name> methods)
    trainer_username = serializers.ReadOnlyField(source="trainer.username")
    attendees_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    booked = serializers.SerializerMethodField()
    has_started = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "activity_type",
            "trainer_username",
            "date",
            "time",
            "duration_minutes",
            "capacity",
            "attendees_count",
            "available_slots",
            "booked",
            "has_started",
            "attendees",
        ]
        extra_kwargs = {
            "attendees": {"read_only": True},  # Modified via book action, not direct POST
            "trainer": {"read_only": True},     # Assigned automatically on creation
        }

    # -------------------
    # Computed Field Methods
    # -------------------
    def get_attendees_count(self, obj):
        """
        Calculate how many users have booked this session.
        
        Args:
            obj: Session model instance
            
        Returns:
            int: Number of attendees currently booked
        """
        return obj.attendees.count()

    def get_available_slots(self, obj):
        """
        Calculate remaining capacity for bookings.
        
        Args:
            obj: Session model instance
            
        Returns:
            int: Number of spots still available (can be 0 if full)
        """
        return obj.capacity - obj.attendees.count()

    def get_booked(self, obj):
        """
        Check if the current requesting user has booked this session.
        
        Requires request context to be passed when instantiating serializer.
        Used by frontend to show "Book" vs "Cancel Booking" buttons.
        
        Args:
            obj: Session model instance
            
        Returns:
            bool: True if authenticated user is in attendees, False otherwise
        """
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.attendees.filter(pk=request.user.pk).exists()
        return False

    def get_has_started(self, obj):
        """
        Check if the session has already started (past date+time).
        
        Compares session datetime against current time to determine if the
        session is in the past. Used by frontend to grey out and disable
        booking for sessions that have already occurred.
        
        Args:
            obj: Session model instance
            
        Returns:
            bool: True if session datetime is in the past, False otherwise
        """
        from datetime import datetime
        now = datetime.now()
        session_datetime = datetime.combine(obj.date, obj.time)
        return session_datetime < now

    # -------------------
    # Custom Creation Logic
    # -------------------
    def create(self, validated_data):
        """
        Automatically assign a trainer when creating new sessions.
        
        Business logic:
        - Trainer field is read-only in the API (users don't select trainers directly)
        - System assigns the first staff user as trainer
        - If no staff users exist, falls back to any user (edge case handling)
        
        Args:
            validated_data: Validated session data from request
            
        Returns:
            Session: Newly created Session instance with trainer assigned
        """
        admin_user = User.objects.filter(is_staff=True).first()
        validated_data['trainer'] = admin_user if admin_user else User.objects.first()
        return super().create(validated_data)

    # -------------------
    # Role-Based Visibility / Masking Logic
    # -------------------
    def to_representation(self, instance):
        """
        Customise JSON output based on requesting user's role and booking status.
        
        This method runs after basic serialisation and modifies the output dictionary
        before it's sent to the client. Implements privacy controls:
        
        For staff/trainers:
        - Full visibility: all attendee IDs and usernames
        - Accurate trainer information
        - Used for admin booking management interface
        
        For booked clients:
        - Full session details (trainer, time, capacity)
        - Attendees list shows only their own ID (privacy protection)
        - Used to display their confirmed bookings
        
        For unbooked clients:
        - Limited visibility: activity type, capacity, available slots
        - Trainer shown as "TBA" (To Be Announced) to prevent stalking/favouritism
        - Attendees list is empty (who's attending is private until you book)
        - Activity type IS shown so calendar can display class types
        
        Args:
            instance: Session model instance being serialised
            
        Returns:
            dict: Modified representation dictionary with role-appropriate data
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Staff/trainers see everything - needed for admin booking management
        if user and user.is_staff:
            # For past sessions, include full attendance details
            from datetime import datetime
            now = datetime.now()
            session_datetime = datetime.combine(instance.date, instance.time)
            is_past = session_datetime < now
            
            if is_past:
                # Show detailed attendance for past sessions
                attendee_data = SessionAttendee.objects.filter(session=instance).select_related('user')
                representation['attendees'] = [
                    {
                        "id": sa.user.id,
                        "username": sa.user.username,
                        "attended": sa.attended,
                        "attendance_id": sa.id
                    }
                    for sa in attendee_data
                ]
            else:
                # For future sessions, just show basic attendee info
                attendees_qs = instance.attendees.all()
                representation['attendees'] = [
                    {"id": a.id, "username": a.username} for a in attendees_qs
                ]
            # Ensure trainer username is accurate for staff views
            representation['trainer_username'] = instance.trainer.username
            return representation

        # Check if current user has booked this session
        is_booked = representation.get('booked', False)

        if is_booked:
            # Booked clients see full details but only their own ID in attendees
            # Protects other attendees' privacy whilst confirming their own booking
            representation['attendees'] = [user.id] if user else []
            return representation
        else:
            # Unbooked clients see minimal info - encourages booking to see details
            representation['trainer_username'] = "TBA"  # Hide trainer until booked
            representation['attendees'] = []            # Hide who's attending
            # Keep activity type visible so calendar can show class types
            representation['activity_type'] = instance.activity_type
            return representation
