# Heroku process definition file - specifies how to start the web application
# 
# Execution sequence on deployment:
# 1. cd backend                       → Navigate to Django project directory
# 2. python manage.py migrate         → Apply database migrations (creates/updates tables)
# 3. gunicorn backend.wsgi            → Start Gunicorn WSGI server for Django
#    --bind 0.0.0.0:$PORT             → Listen on all interfaces, port provided by Heroku
#    --log-file -                     → Send logs to stdout (captured by Heroku logs)
#
# Process type "web" is required by Heroku for web applications (receives HTTP traffic)
web: cd backend && python manage.py migrate && gunicorn backend.wsgi --bind 0.0.0.0:$PORT --log-file -