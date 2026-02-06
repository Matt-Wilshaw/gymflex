"""
Django settings for GymFlex backend project.

This file contains all the configuration settings for the Django application,
including database connections, installed apps, middleware, and security settings.
The settings automatically adapt between local development (SQLite) and production (PostgreSQL on Heroku).
"""

from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os
import secrets

# Load environment variables from .env file (used for local development)
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'
# BASE_DIR points to the 'backend' directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
# SECRET_KEY: Used for cryptographic signing - should be kept secret in production
# DEBUG: Shows detailed error pages when True - should always be False in production
# ALLOWED_HOSTS: List of domain names that Django will serve - prevents HTTP Host header attacks
SECRET_KEY = os.environ.get("SECRET_KEY")

IS_HEROKU = os.environ.get("DYNO") is not None

# If SECRET_KEY isn't provided via environment variables, create or reuse a
# machine-local key that is not committed to git. This keeps the repository
# free of secrets while allowing stable local development.
if not SECRET_KEY:
    local_secret_path = BASE_DIR / ".local_secret_key"
    try:
        if local_secret_path.exists():
            SECRET_KEY = local_secret_path.read_text(encoding="utf-8").strip()
        else:
            SECRET_KEY = secrets.token_urlsafe(50)
            local_secret_path.write_text(SECRET_KEY, encoding="utf-8")
    except OSError:
        # Fallback: generate an in-memory key (tokens will reset on restart)
        SECRET_KEY = secrets.token_urlsafe(50)

DEBUG = False

ALLOWED_HOSTS = ['gymflex-5bb1d582f94c.herokuapp.com', '.herokuapp.com', 'localhost', '127.0.0.1']

# REST Framework configuration - handles API behaviour
# Configures JWT (JSON Web Token) authentication for secure API access
REST_FRAMEWORK = {
    # Use JWT tokens for authenticating API requests
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Require authentication by default for all API endpoints
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],

    # Rate limiting (throttling)
    # - Global throttles are intentionally generous to avoid impacting normal usage
    # - Sensitive endpoints (login/register) use ScopedRateThrottle with stricter limits
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Global defaults
        "anon": "200/day",
        "user": "2000/day",

        # Scoped throttles for auth endpoints
        "login": "10/min",
        "register": "5/hour",
    },
}

# JWT token lifetime settings
# ACCESS_TOKEN: Short-lived token for API requests (30 minutes)
# REFRESH_TOKEN: Longer-lived token used to obtain new access tokens (1 day)
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

# Installed applications - Django apps that are active in this project
INSTALLED_APPS = [
    "django.contrib.admin",           # Admin interface at /admin/
    "django.contrib.auth",            # User authentication system
    "django.contrib.contenttypes",    # Content type framework
    "django.contrib.sessions",        # Session framework
    "django.contrib.messages",        # Messaging framework
    "django.contrib.staticfiles",     # Static file serving (CSS, JS, images)
    "api",                            # Our custom GymFlex API app
    "rest_framework",                 # Django REST Framework for building APIs
    "corsheaders",                    # Handles Cross-Origin Resource Sharing (CORS)
]

# Middleware - processing layers that handle requests and responses
# These run in order from top to bottom for requests, and bottom to top for responses
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",      # Adds security enhancements
    "whitenoise.middleware.WhiteNoiseMiddleware",         # Serves static files efficiently on Heroku
    "corsheaders.middleware.CorsMiddleware",              # Handles CORS headers (must be near top)
    "django.contrib.sessions.middleware.SessionMiddleware",  # Manages sessions
    "django.middleware.common.CommonMiddleware",          # Adds common functionality
    "backend.middleware.DisableCSRFForAPI",               # Disables CSRF checks for /api/ endpoints
    "django.middleware.csrf.CsrfViewMiddleware",          # Protects against Cross-Site Request Forgery
    "django.contrib.auth.middleware.AuthenticationMiddleware",  # Associates users with requests
    "django.contrib.messages.middleware.MessageMiddleware",     # Handles temporary messages
    "django.middleware.clickjacking.XFrameOptionsMiddleware",   # Protects against clickjacking attacks
]

# URL configuration - points to the main URL routing file
ROOT_URLCONF = "backend.urls"

# Template configuration - tells Django where to find HTML templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # DIRS: Look for templates in the React build folder (frontend/dist)
        "DIRS": [
            BASE_DIR.parent / "frontend" / "dist",
            BASE_DIR / "api" / "templates",
            BASE_DIR / "templates",
        ],
        "APP_DIRS": True,  # Also look for templates within each installed app
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# WSGI application - the entry point for WSGI-compatible web servers (like Gunicorn)
WSGI_APPLICATION = "backend.wsgi.application"

# Database configuration
# Uses dj-database-url to parse database connection strings
import dj_database_url

# Default database configuration - uses SQLite for local development
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Production database configuration
# If DATABASE_URL environment variable exists (set automatically by Heroku),
# override the default database with PostgreSQL settings
if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.config(conn_max_age=600, ssl_require=True)

# Password validation - enforces strong password requirements
AUTH_PASSWORD_VALIDATORS = [
    {
        # Prevents passwords too similar to user attributes (username, email, etc.)
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        # Requires minimum password length
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        # Prevents use of commonly-used passwords
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        # Prevents purely numeric passwords
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalisation settings
LANGUAGE_CODE = "en-us"  # Default language for the application
TIME_ZONE = "UTC"         # Timezone for storing dates (UTC is standard)
USE_I18N = True           # Enable Django's internationalisation system
USE_TZ = True             # Use timezone-aware datetimes

# Static files configuration (CSS, JavaScript, images)
STATIC_URL = "/static/"  # URL prefix for static files
STATIC_ROOT = BASE_DIR / "staticfiles"  # Directory where collectstatic gathers files
STATICFILES_DIRS = [
    # Include React's built assets in static files
    BASE_DIR.parent / "frontend" / "dist" / "assets",
    BASE_DIR.parent / "frontend" / "public",
]

# With DEBUG=False, Django's dev server will not serve static files.
# WhiteNoise can still serve them locally if it is allowed to use Django's finders.
WHITENOISE_USE_FINDERS = not IS_HEROKU

# Use WhiteNoise's storage backend for efficient static file serving with compression
# In production (e.g., Heroku), use manifest storage for cache-busting.
# For local development, avoid requiring collectstatic/manifest to prevent admin styling issues.
STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
    if IS_HEROKU
    else "whitenoise.storage.CompressedStaticFilesStorage"
)

# Default primary key field type for models
# BigAutoField allows for larger range of IDs than standard AutoField
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Cross-Origin Resource Sharing (CORS) configuration
# These settings control which domains can make requests to this API
if IS_HEROKU:
    # In production, the frontend is served from the same origin as the API,
    # so permissive CORS isn't required.
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "https://gymflex-5bb1d582f94c.herokuapp.com",
    ]
else:
    # Local development: allow the Vite dev server to call the API.
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True  # Allow cookies/auth headers in cross-origin requests

# Cross-Site Request Forgery (CSRF) protection settings
# Note: Our custom DisableCSRFForAPI middleware exempts /api/ endpoints from CSRF checks
# because JWT authentication provides its own protection against CSRF attacks
CSRF_TRUSTED_ORIGINS = [
    'https://gymflex-5bb1d582f94c.herokuapp.com',  # Allow Heroku domain for CSRF validation
]
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read CSRF cookie (needed for React)
CSRF_USE_SESSIONS = False     # Don't store CSRF token in session (use cookie instead)

# Session and cookie security settings
# These control how authentication cookies behave across requests
SESSION_COOKIE_SAMESITE = 'Lax'  # Prevent CSRF whilst allowing normal navigation
CSRF_COOKIE_SAMESITE = 'Lax'     # Same protection for CSRF token cookie
SESSION_COOKIE_SECURE = IS_HEROKU     # Require HTTPS for session cookie (production)
CSRF_COOKIE_SECURE = IS_HEROKU        # Require HTTPS for CSRF cookie (production)
