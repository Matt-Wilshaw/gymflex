# GymFlex Testing Documentation

## Introduction

This document outlines the testing process for **GymFlex**, a gym management web application that allows users to register, book sessions, and interact with trainers through an intuitive interface.

Testing was conducted to ensure that all features of GymFlex function as intended, that the user experience is consistent across devices and browsers, and that both clients and trainers can interact with the system without errors or usability issues.

The testing strategy followed a combination of **Behaviour-Driven Development (BDD)** and **Test-Driven Development (TDD)** principles:

- **BDD (Behaviour-Driven Development):** Focused on real-world user stories, such as *“As a user, I want to book a session so that I can reserve my spot in advance.”*  
- **TDD (Test-Driven Development):** Automated tests were written before implementing each feature to ensure correctness and maintainable code.

Both **manual** and **automated** testing methods were used to validate the functionality, usability, and accessibility of the application.

Key areas covered in testing include:
- User registration and authentication  
- Session booking and cancellation  
- Trainer session management  
- Data integrity and permission control  
- Cross-browser and mobile responsiveness  
- Accessibility compliance (WCAG standards)

For each user story, **black box testing** was applied — evaluating the system purely from the user's perspective without knowledge of internal code logic.  

All discovered bugs, fixes, and retests are documented throughout this file.

For additional project details and technical information, including instructions on running the site, please refer to the [README.md](./README.md)

---

## Testing Environments

GymFlex is tested in two environments with different purposes and workflows:

### Local Development (http://localhost:8000/api)
- **Purpose:** Feature development, debugging, rapid iteration
- **Database:** SQLite (`db.sqlite3`)
- **Start:** `python manage.py runserver` (backend) + `npm run dev` (frontend at `localhost:5173`)
- **Use for:**
  - New feature development before committing
  - Database migrations and schema changes
  - Debugging with print statements or breakpoints
  - Django admin access: `http://localhost:8000/admin`
- **Fast feedback loop:** Code changes reflect immediately without deployment delay

### Production (Heroku) (https://gymflex-5bb1d582f94c.herokuapp.com)
- **Purpose:** End-to-end validation, user acceptance testing
- **Database:** PostgreSQL (via `DATABASE_URL`)
- **Deploy:** `git push heroku main` (triggers build, migrations, restart)
- **Use for:**
  - Post-deployment smoke tests (see README smoke test checklist)
  - Cross-browser/device testing on live URL
  - Role-based masking verification (client vs trainer vs staff)
  - Performance checks (cold start latency, real-world load)
- **Monitor:** `heroku logs --tail` for errors

### Workflow Summary
1. **Develop locally** → test locally → commit when working
2. **Push to GitHub** (`git push origin main`) for version control
3. **Deploy to Heroku** (`git push heroku main`) when ready to release
4. **Run production smoke tests** (authentication, session CRUD, masking logic)
5. **Check Heroku logs** for runtime errors
6. If issues found → debug locally → redeploy

**Important:** Always test destructive operations (delete, bulk updates) locally first. Never experiment directly on production data.

---

## User Acceptance Testing (UAT)

## 1. User Registration

**Story:**  
As a new user, I want to create an account so that I can access GymFlex features like booking sessions and tracking my workouts.

**Acceptance Criteria:**  
- When I provide valid information and submit the registration form  
- Then my account is created  
- And I can log in immediately after registration

**Tasks:**  
- [ ] Design registration form UI  
- [ ] Implement backend registration logic  
- [ ] Validate input and handle errors  
- [ ] Test registration workflow  

**Bug Tracking / Notes:**  

---

## 2. User Login

**Story:**  
As a registered user, I want to log in to my account so that I can access my bookings and book new sessions.

**Acceptance Criteria:**  
- Given I have a registered account  
- When I provide valid username and password  
- Then I am logged in and redirected to the home page  
- And I receive a valid JWT access token

**Tasks:**  
- [ ] Design login form UI  
- [ ] Implement JWT authentication backend  
- [ ] Handle invalid credentials gracefully  
- [ ] Test token refresh mechanism  

**Bug Tracking / Notes:**

---

## 3. View Timetable

**Story:**  
As a user, I want to view the gym timetable so that I can see available sessions and plan my schedule.

**Acceptance Criteria:**  
- Given I am logged in  
- When I access the timetable page  
- Then I can see all upcoming sessions with time, trainer, and availability  
- And sessions are updated in real-time if changes occur

**Tasks:**  
- [ ] Design timetable UI  
- [ ] Implement backend session retrieval  
- [ ] Test real-time updates or refresh functionality  

**Bug Tracking / Notes:**

---

## 4. Book a Session

**Story:**  
As a user, I want to book a gym session so that I can reserve my spot in advance.

**Acceptance Criteria:**  
- Given I view a session with available spots  
- When I click “Book”  
- Then my booking is confirmed  
- And the availability updates immediately

**Tasks:**  
- [ ] Implement booking button and backend logic  
- [ ] Handle capacity constraints and conflicts  
- [ ] Provide confirmation feedback to the user  
- [ ] Test booking process  

**Bug Tracking / Notes:**

---

## 5. Cancel a Booking

**Story:**  
As a user, I want to cancel a previously booked session so that I can free up my spot if I cannot attend.

**Acceptance Criteria:**  
- Given I have a booking  
- When I click “Cancel”  
- Then the booking is removed  
- And the session availability updates

**Tasks:**  
- [ ] Implement cancel booking UI  
- [ ] Update backend booking status  
- [ ] Test cancellation flow and availability updates  

**Bug Tracking / Notes:**

---

## 6. Trainer Session Management

**Story:**  
As a trainer, I want to create, edit, and delete sessions so that I can manage my classes and client bookings effectively.

**Acceptance Criteria:**  
- Given I am a trainer  
- When I add, edit, or remove a session  
- Then the timetable updates for all users  
- And users are notified of changes if applicable

**Tasks:**  
- [ ] Design trainer dashboard UI  
- [ ] Implement session CRUD functionality  
- [ ] Test session updates on client dashboards  

**Bug Tracking / Notes:**

---

## 7. Track Bookings

**Story:**  
As a user, I want to view my past and upcoming bookings so that I can track my gym activities.

**Acceptance Criteria:**  
- Given I am logged in  
- When I navigate to “My Bookings”  
- Then I can see all current and past bookings with details  
- And bookings are ordered chronologically

**Tasks:**  
- [ ] Implement bookings list UI  
- [ ] Fetch data from backend  
- [ ] Test correct ordering and completeness  

**Bug Tracking / Notes:**

---

## 8. Accessibility

**Story:**  
As a visually impaired or mobility-challenged user, I want to navigate GymFlex using assistive technologies so that I can independently browse, book, and manage sessions.

**Acceptance Criteria:**  
- Given I use a screen reader or keyboard navigation  
- When I browse and interact with the timetable, bookings, or forms  
- Then all interactive elements are accessible and labeled clearly  
- And layouts remain functional under zoom or high-contrast settings

**Tasks:**  
- [ ] Apply semantic HTML and ARIA labels  
- [ ] Test keyboard-only navigation  
- [ ] Verify screen reader compatibility  
- [ ] Ensure responsive layout under zoom/high-contrast  

**Bug Tracking / Notes:**

---

| #   | Area / Feature                  | Bug Description                                                               | Priority | Status | Notes (cause & fix)                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------- | ----------------------------------------------------------------------------- | :------: | :----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | User Registration / App Start   | ImportError: cannot import name 'Note' from api.models                        |   High   | Fixed  | Cause: serializers.py referenced a non-existent Note import.<br>Fix: Removed the bad import; application starts normally.                                                                                                                                                                                                                                |
| 2   | Database connection / App Start | OperationalError: connection to PostgreSQL failed due to no password supplied |   High   | Fixed  | Cause: Django attempted to connect to PostgreSQL without credentials in dev environment.<br>Fix: Switched DATABASES to use SQLite for local development (backend/settings.py). Migrations run successfully.                                                                                                                                              |
| 3   | App Routing / URL Mapping       | Root path (/) returned no matching URL patterns                               |  Medium  | Fixed  | Cause: No default route/homepage configured; root returned a "no matching URL patterns" message.<br>Fix: Added a default route/homepage entry in backend/urls.py to resolve the issue.                                                                                                                                                                   |
| 4   | Booking UI / Modal              | Modal didn't refresh after booking a session (stale availability)             |  Medium  | Fixed  | Reproduction: Open day modal, click a session to book/unbook; modal continued to display stale availability until closed and reopened.<br>Fix: In frontend/src/pages/Home.jsx, after a booking request the client now re-fetches sessions and, when the modal is open, updates modalEvents so availability and the Booked indicator refresh immediately. |
| 5   | Session Booking / Validation    | Users can book sessions with historic dates (e.g., yesterday)                 |  Medium  |  Open  | Reproduction: Create or view a session with a past date; booking is allowed even though the session has already occurred.<br>Expected: System should prevent bookings for past dates and optionally hide/archive past sessions from the timetable.                                                                                                       |

---

## Appendix: Adding Test Data

### Using Django Admin

1. **Create a superuser** (if needed):

```bash
# Activate virtual environment
# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Create superuser
cd backend
python manage.py createsuperuser
```

2. **Access Django admin**: Navigate to `http://localhost:8000/admin` and log in.
3. **Add test data**: Create users, sessions, and bookings manually via the admin interface.

### Using Django Shell

1. **Open Django shell**:

```bash
# Activate environment and navigate to backend
.\venv\Scripts\activate
cd backend
python manage.py shell
```

2. **Add test data**:

```python
from django.contrib.auth.models import User
from api.models import Session
from datetime import time, timedelta
from django.utils import timezone

# Get existing users
admin_trainer = User.objects.get(username='admin')
test_user = User.objects.get(username='client')

# Create sessions
session1, created = Session.objects.get_or_create(
    title="Morning Strength",
    trainer=admin_trainer,
    date=timezone.now().date() + timedelta(days=1),
    time=time(9, 0),
    capacity=12
)

session2, created = Session.objects.get_or_create(
    title="Evening Cardio",
    trainer=admin_trainer,
    date=timezone.now().date() + timedelta(days=1),
    time=time(18, 0),
    capacity=15
)

# Add test user as attendee
session1.attendees.add(test_user)
session2.attendees.add(test_user)
```

3. **Verify data**: Check via admin panel or API endpoint (`GET /api/sessions/`).
