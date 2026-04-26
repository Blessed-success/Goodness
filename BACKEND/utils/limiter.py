"""
Rate Limiter Configuration
Centralized rate limiting for the Flask application
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Create limiter instance - will be initialized with app later
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def init_limiter(app):
    """Initialize the limiter with the Flask app"""
    limiter.init_app(app)