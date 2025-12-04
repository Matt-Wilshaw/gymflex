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
## 7. Admin Attendance Management

**Story:**  
As an admin, I want to mark clients as attended or no-show for past sessions so that attendance records are accurate and no-shows are tracked.

**Acceptance Criteria:**  
- Given I am an admin viewing a past session  
- When I click the "Mark No Show" or "Mark Attended" button next to a client  
- Then the client's attendance status updates immediately  
- And the UI reflects the change (strikethrough for no-show, color for attended)

**Tasks:**  
- [x] Implement attendance toggle button in admin bookings list  
- [x] Update backend to support attendance status changes  
- [x] Test UI feedback (strikethrough, color)  
- [x] Verify API updates attendance status  
- [ ] Add automated test for attendance toggle (future)

**Bug Tracking / Notes:**  
Manual testing confirms admins can mark clients as attended or no-show for any past session. UI updates instantly and backend persists changes. No automated test yet; recommend adding one for regression coverage.

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
- [x] Implement bookings list UI  
- [x] Fetch data from backend  
- [x] Test correct ordering and completeness  

**Bug Tracking / Notes:**  
*Enhancement (November 27, 2025):* Added day/week grouping with toggle buttons to improve readability and prevent long flat lists when users have many bookings. Users can switch between "By Day" view (sessions grouped by exact date) and "By Week" view (sessions grouped by week range with day labels). This proactive UX improvement addresses scalability concerns before they impact user experience. Deployed with Heroku release v42.

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
- [x] Add mobile-responsive CSS for calendar display

**Bug Tracking / Notes:**  
*Enhancement (December 2, 2025):* Added mobile-responsive CSS with media queries for tablet (≤768px) and mobile (≤480px) devices. Calendar now adjusts toolbar button sizes, reduces calendar height, scales down font sizes for emojis and session counts, and optimizes cell padding to ensure proper display on smaller screens. Mobile users can now properly view calendar cells with emojis and session information without overflow issues. Implemented in `frontend/src/mobile.css` and imported in `App.jsx`.

---

## 9. Security & Data Protection

**Story:**  
As a developer, I want to ensure that no sensitive information (passwords, API keys, secrets) has been accidentally committed to version control so that user data and system credentials remain secure.

**Acceptance Criteria:**  
- Given the project is under version control  
- When I audit Git history for sensitive files  
- Then no `.env` files, passwords, or API keys are found in commit history  
- And `.gitignore` properly prevents future leaks

**Tasks:**  
- [x] Verify `.env` files are not tracked by Git  
- [x] Confirm `.gitignore` includes `.env` patterns  
- [x] Audit Git history for accidentally committed secrets  
- [x] Document findings and risk assessment  

**Bug Tracking / Notes:**  
Historical audit completed on November 26, 2025. One `.env` file was found in early commit (f6811aa) but contained only non-sensitive localhost URL (`VITE_API_URL="http://localhost:8000"`). No passwords, API keys, or secrets were leaked. Risk level: Very Low. `.gitignore` now properly configured to prevent future leaks.

---

| #   | Area / Feature                     | Bug Description                                                                                                         | Priority | Status | Notes (cause & fix)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | :------: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | User Registration / App Start      | ImportError: cannot import name 'Note' from api.models                                                                  |   High   | Fixed  | Cause: serializers.py referenced a non-existent Note import.<br>Fix: Removed the bad import; application starts normally.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2   | Database connection / App Start    | OperationalError: connection to PostgreSQL failed due to no password supplied                                           |   High   | Fixed  | Cause: Django attempted to connect to PostgreSQL without credentials in dev environment.<br>Fix: Switched DATABASES to use SQLite for local development (backend/settings.py). Migrations run successfully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3   | App Routing / URL Mapping          | Root path (/) returned no matching URL patterns                                                                         |  Medium  | Fixed  | Cause: No default route/homepage configured; root returned a "no matching URL patterns" message.<br>Fix: Added a default route/homepage entry in backend/urls.py to resolve the issue.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4   | Booking UI / Modal                 | Modal didn't refresh after booking a session (stale availability)                                                       |  Medium  | Fixed  | Reproduction: Open day modal, click a session to book/unbook; modal continued to display stale availability until closed and reopened.<br>Fix: In frontend/src/pages/Home.jsx, after a booking request the client now re-fetches sessions and, when the modal is open, updates modalEvents so availability and the Booked indicator refresh immediately.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | Session Booking / Validation       | Users can book sessions with historic dates (e.g., yesterday)                                                           |  Medium  | Fixed  | Reproduction: Create or view a session with a past date; booking is allowed even though the session has already occurred.<br>Fix: Added date validation in backend/api/views.py book() action to return 400 error with {"status": "past"} for sessions with dates before today. Added has_started computed field to SessionSerializer that checks if session datetime is in the past. Updated frontend BookingsModal.jsx to grey out past sessions (opacity 0.6, grey background), display "Past" badge instead of slots, set cursor to "not-allowed", and prevent onClick from firing. Past sessions now clearly marked and non-interactive.                                                                                                                                                           |
| 6   | Admin Panel / Routing              | Admin panel link on deployed site routes to localhost instead of production URL                                         |  Medium  | Fixed  | Reproduction: Click "Admin" button on deployed Heroku site; redirected to `http://127.0.0.1:8000/admin/` instead of production URL.<br>Fix: Modified frontend/src/pages/Home.jsx to use `import.meta.env.VITE_API_URL.replace('/api', '/admin/')` instead of hardcoded localhost. Updated root package.json build script to pass VITE_API_URL environment variable to frontend build. Admin button now correctly routes to production URL on Heroku.                                                                                                                                                                                                                                                                                                                                                    |
| 7   | Django Admin / Static Files        | Django admin returns 500 Server Error on production deployment                                                          |   High   | Fixed  | Reproduction: After fixing bug #6, clicking admin panel button routes correctly to production admin URL but displays 500 Server Error instead of login page.<br>Cause: `DISABLE_COLLECTSTATIC=1` Heroku config var prevented Django from collecting admin static files (CSS/JS) during deployment.<br>Fix: Removed `DISABLE_COLLECTSTATIC` config var with `heroku config:unset DISABLE_COLLECTSTATIC`. Triggered rebuild - Django successfully collected 163 static files. Admin panel now displays properly with styling.                                                                                                                                                                                                                                                                             |
| 8   | Session Booking / Time Validation  | Sessions are greyed out for entire day instead of checking actual start time                                            |  Medium  | Fixed  | Reproduction: Original bug #5 fix only checked session date, not time. A session scheduled for 6:00 PM today was greyed out even at 2:00 PM.<br>Cause: Backend validation used `session.date < date.today()` which only compared dates, not actual datetime.<br>Fix: Updated backend/api/views.py book() action to combine date and time: `session_datetime = datetime.combine(session.date, session.time)` then compare against `datetime.now()`. Frontend already correctly handled this via `has_started` field from SessionSerializer. Sessions now remain bookable until their actual start time passes. Also updated CalendarView.jsx to grey out past dates in calendar cells (opacity 0.5, grey background, cursor "not-allowed").                                                              |
| 9   | Booking Cancellation / Validation  | Users can cancel bookings for sessions that have already started and finished                                           |  Medium  | Fixed  | Fix: Added backend guard in `backend/api/views.py` within `SessionViewSet.book()` to prevent unbooking once the session has started by checking `datetime.combine(session.date, session.time) < datetime.now()` and returning 400 with `{status: "past"}`. UI already hides past bookings from "My Bookings" via `upcomingBookings` filter in `frontend/src/pages/Home.jsx`. Behaviour is now consistent: users cannot cancel after start, and past bookings are not shown in the list.                                                                                                                                                                                                                                                                                                                 |
| 10  | Timetable / Data Loading           | Calendar showed no sessions on initial load; data only appeared after interacting (e.g., changing the activity filter). |  Medium  | Fixed  | Cause: `frontend/src/pages/Home.jsx` did not fetch sessions on mount and relied on user interaction to trigger loading. Also ensured proper order of fetching current user before staff/admin-dependent data. Fix: Added an effect to fetch current user, sessions, and booked sessions on initial mount; added a separate effect to re-fetch sessions when `activityFilter` changes; confirmed `useNavigate()` initialization to avoid post-login blank page. Deployed with Heroku release v41.                                                                                                                                                                                                                                                                                                        |
| 11  | Login / Routing                    | After successful login, the app showed a blank page instead of navigating to Home.                                      |  Medium  | Fixed  | Cause: `navigate` was referenced before initialization in `frontend/src/pages/Home.jsx`, causing a runtime error that left a blank screen. Fix: Initialized `navigate` via `useNavigate()` and ensured post-login navigation flows through `ProtectedRoute`. Deployed with Heroku release v40.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 12  | Calendar / Client Navigation       | Client calendar didn't follow booking navigation arrows - stayed on current month when using ← → buttons.               |  Medium  | Fixed  | Cause: Multiple issues compounded - (1) `upcomingBookings` array recreated on every render causing unstable useMemo dependencies, (2) `selectedClientDate` not initialized so calendar defaulted to today, (3) `selectedAdminDate` was checked first even for clients causing today to always be selected, (4) React Big Calendar's default "today" styling showed extra border. Fix: Wrapped `sortedUpcomingBookings` in useMemo with `bookedSessions` dependency; initialized `selectedClientDate` with today's date like admin; fixed `isSelected` logic to check `currentUser?.is_staff` before using `selectedAdminDate`; added comprehensive CSS overrides to remove all default "today" styling. Calendar now properly navigates to booking month and highlights selected date with blue border. |
| 13  | Calendar / Month Navigation        | Calendar month navigation arrows (← Today →) didn't work - clicking them had no effect.                                 |  Medium  | Fixed  | Cause: `onNavigate` handler in CalendarView.jsx only logged the new date without updating state, so the calendar stayed on the current month. Fix: Updated `onNavigate` to call `setSelectedAdminDate(dateStr)` for admin users, allowing proper month-to-month navigation. For clients, the handler now allows manual navigation while still respecting booking arrow overrides. Deployed with Heroku release v58.                                                                                                                                                                                                                                                                                                                                                                                     |
| 14  | Calendar / Client Month Navigation | Client users couldn't navigate between months using calendar toolbar arrows.                                            |  Medium  | Fixed  | Cause: `setSelectedClientDate` was not passed to CalendarView component, and `onNavigate` handler didn't update client date state - only admin state was updated. Fix: Passed `setSelectedClientDate` from Home.jsx to CalendarView, added it to component props, and updated `onNavigate` handler to call `setSelectedClientDate(dateStr)` for non-staff users. Clients can now use ← Today → buttons to navigate months independently of their booking arrows.                                                                                                                                                                                                                                                                                                                                        |

---

## Manual Test: NotFound (404) Page

**Purpose:** Ensure users see a branded 404 page when navigating to an undefined route.

**Steps:**
1. Start the frontend dev server (`npm run dev` in the `frontend` folder).
2. In your browser, visit a URL that does not match any defined route, e.g. `http://localhost:5173/xyz` or `http://localhost:5173/thispagedoesnotexist`.
3. Observe the result:
    - You should see the custom GymFlex 404 page, styled with blue branding, a rounded card, and a "Go Home" button.
    - The message should read: "404 - Page Not Found. The page you are looking for does not exist. Please check the URL or return to the home page."
    - The "Go Home" button should return you to the main dashboard.

**Expected Outcome:**
- The NotFound page appears for all undefined routes.
- The design matches GymFlex branding and is responsive on all devices.
- No redirect to home occurs unless the user clicks the button.

**Notes:**
- This test ensures correct routing and user experience for invalid URLs.
- If you see the home page instead, check that the catch-all route in `App.jsx` uses `<NotFound />` and not `<Navigate to="/" />`.

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

### Using Django Fixtures

To restore all test data at once, use:

```powershell
python manage.py loaddata backend/users.json
python manage.py loaddata backend/sessions.json
python manage.py loaddata backend/attendees.json
```

This ensures your local environment matches the expected test scenarios.
