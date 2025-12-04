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

# Load environment variables from .env file (used for local development)
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'
# BASE_DIR points to the 'backend' directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
# SECRET_KEY: Used for cryptographic signing - should be kept secret in production
# DEBUG: Shows detailed error pages when True - should always be False in production
# ALLOWED_HOSTS: List of domain names that Django will serve - prevents HTTP Host header attacks
SECRET_KEY = os.environ.get('SECRET_KEY', "django-insecure-nma=xi6x2p-crjg^ifqqkapyu1qjd0l=+wn)-rijk_o%$!k3w_")
DEBUG = os.environ.get('DEBUG', 'True') == 'True'  # Set DEBUG to True for development
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
        "DIRS": [BASE_DIR.parent / "frontend" / "dist"],
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
STATIC_URL = "static/"  # URL prefix for static files
STATIC_ROOT = BASE_DIR / "staticfiles"  # Directory where collectstatic gathers files
STATICFILES_DIRS = [
    # Include React's built assets in static files
    BASE_DIR.parent / "frontend" / "dist" / "assets",
    BASE_DIR.parent / "frontend" / "public",
]
# Use WhiteNoise's storage backend for efficient static file serving with compression
# For development, we disable manifest checking to avoid errors with missing files
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage" if DEBUG else "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Default primary key field type for models
# BigAutoField allows for larger range of IDs than standard AutoField
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Cross-Origin Resource Sharing (CORS) configuration
# These settings control which domains can make requests to this API
CORS_ALLOW_ALL_ORIGINS = True  # Development mode: allow requests from any origin
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
SESSION_COOKIE_SECURE = True     # Require HTTPS for session cookie (production security)
CSRF_COOKIE_SECURE = True        # Require HTTPS for CSRF cookie (production security)
