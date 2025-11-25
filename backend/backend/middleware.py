"""
Custom Django middleware for GymFlex application.

This module defines middleware classes that process requests and responses globally
across the Django application before they reach views or after views process them.
"""

from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForAPI(MiddlewareMixin):
    """
    Disable Cross-Site Request Forgery (CSRF) protection for JWT-authenticated API endpoints.
    
    Why disable CSRF for API endpoints?
    - JWT tokens are immune to CSRF attacks because they're explicitly sent in headers
    - CSRF attacks rely on cookies being automatically sent by browsers
    - JWT authentication requires explicit inclusion of the token in each request
    - This middleware exempts /api/ paths from Django's CSRF checks
    
    How it works:
    - Processes each incoming HTTP request before it reaches the view
    - Checks if the request path starts with '/api/'
    - If so, sets a flag telling Django not to enforce CSRF checks for this request
    - All other paths (like /admin/) still have full CSRF protection
    """
    def process_request(self, request):
        """
        Process incoming request and conditionally disable CSRF checking.
        
        Args:
            request: Django HttpRequest object containing path, method, headers, etc.
            
        Behaviour:
            Sets the _dont_enforce_csrf_checks attribute to True for all API paths,
            exempting them from Django's CSRF middleware validation.
        """
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
