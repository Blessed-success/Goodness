"""
Rate Limiter Configuration
Centralized rate limiting for the Flask application
"""

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Create limiter instance - will be initialized with app later
limiter = Limiter(
    key_func=get_remote_address,
    # Baseline anti-abuse guard for routes without their own @limiter.limit().
    # GET /api/products alone is called ~4x per homepage load and again on
    # every products-page filter change, so this needs headroom for normal
    # browsing, not just scripted abuse (sensitive actions already have
    # tighter per-route limits, e.g. auth, admin writes).
    default_limits=["2000 per day", "300 per hour"],
    storage_uri="memory://"
)

def init_limiter(app):
    """Initialize the limiter with the Flask app"""
    limiter.init_app(app)