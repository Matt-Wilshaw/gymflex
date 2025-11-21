# ---------------------
# Session model
# ---------------------
class Session(models.Model):
    # Name or type of the session
    title = models.CharField(max_length=100)

    # Activity type for dropdown (cardio, weights, etc.)
    ACTIVITY_CHOICES = [
        ('cardio', 'Cardio'),
        ('weights', 'Weightlifting'),
        ('yoga', 'Yoga'),
        ('hiit', 'HIIT'),
        ('pilates', 'Pilates'),
    ]
    activity_type = models.CharField(
        max_length=20,
        choices=ACTIVITY_CHOICES,
        default='cardio'
    )

    # Which trainer runs this session
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trainer_sessions")

    # Date and time of the session
    date = models.DateField()
    time = models.TimeField()

    # Maximum number of clients who can attend
    capacity = models.IntegerField(default=10)

    # Users who have booked this session
    attendees = models.ManyToManyField(User, related_name="booked_sessions", blank=True)

    # String representation for admin/debugging
    def __str__(self):
        return f"{self.title} ({self.activity_type}) with {self.trainer.username} on {self.date} at {self.time}"
