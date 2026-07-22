"""
Hero Banner Routes for Nexus Wholesale Hub
Public endpoint returning the currently-effective homepage hero banner.
"""

from datetime import datetime
from flask import Blueprint, jsonify, current_app
from models import HeroBanner
from utils.security import safe_error_response

hero_bp = Blueprint('hero', __name__, url_prefix='/api/hero-banner')


@hero_bp.route('', methods=['GET'])
def get_active_hero_banner():
    """
    Get the single currently-effective hero banner: active, and within its
    scheduling window (if one is set). Returns null data when none is
    configured yet so the frontend can fall back to its default hero copy.
    """
    try:
        now = datetime.utcnow()

        banner = (
            HeroBanner.query
            .filter(HeroBanner.is_active.is_(True))
            .filter((HeroBanner.starts_at.is_(None)) | (HeroBanner.starts_at <= now))
            .filter((HeroBanner.ends_at.is_(None)) | (HeroBanner.ends_at >= now))
            .order_by(HeroBanner.display_order.asc(), HeroBanner.updated_at.desc())
            .first()
        )

        return jsonify({
            'message': 'Hero banner retrieved successfully',
            'data': banner.to_dict() if banner else None
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve hero banner')
