"""
Review Routes for Nexus Wholesale Hub
Customer product ratings/reviews, with automatic Product.rating recomputation
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from utils.limiter import limiter
from models import db, Review, Product, User, Order, OrderItem
from utils.security import safe_error_response

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')


def _is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


def _recompute_product_rating(product_id):
    """Recompute Product.rating/review_count from existing Review rows.

    Leaves the product's rating untouched once it has ever had reviews,
    even if all reviews are later deleted (no "original" value is retained).
    """
    product = Product.query.get(product_id)
    if not product:
        return

    stats = (
        db.session.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id == product_id)
        .first()
    )
    avg_rating, count = stats if stats else (None, 0)

    if count:
        product.rating = round(float(avg_rating), 2)
        product.review_count = count


def _has_delivered_purchase(user_id, product_id):
    return db.session.query(OrderItem.id).join(Order).filter(
        Order.user_id == user_id,
        Order.status == 'delivered',
        OrderItem.product_id == product_id,
    ).first() is not None


@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    """Public: list reviews for a product, paginated, with a rating breakdown"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)
        if page < 1:
            page = 1

        query = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)

        breakdown = dict(
            db.session.query(Review.rating, func.count(Review.id))
            .filter(Review.product_id == product_id)
            .group_by(Review.rating)
            .all()
        )

        return jsonify({
            'message': 'Reviews retrieved successfully',
            'data': {
                'reviews': [r.to_dict() for r in paginate.items],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages,
                    'has_next': paginate.has_next,
                    'has_prev': paginate.has_prev,
                },
                'rating_breakdown': {str(i): breakdown.get(i, 0) for i in range(1, 6)},
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve reviews')


@reviews_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def submit_review():
    """
    Create or update the current user's review for a product (one per user/product)

    Request body:
    {
        "product_id": 1,
        "rating": 5,
        "title": "Great quality",
        "body": "Exactly as described, fast delivery."
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data or not data.get('product_id') or not data.get('rating'):
            return jsonify({'error': 'product_id and rating are required'}), 400

        product_id = data.get('product_id')
        rating = data.get('rating')

        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'rating must be an integer between 1 and 5'}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        review = Review.query.filter_by(user_id=user_id, product_id=product_id).first()
        is_verified = _has_delivered_purchase(user_id, product_id)

        if review:
            review.rating = rating
            review.title = data.get('title', review.title)
            review.body = data.get('body', review.body)
            review.is_verified_purchase = is_verified
            status_code = 200
        else:
            review = Review(
                product_id=product_id,
                user_id=user_id,
                rating=rating,
                title=data.get('title'),
                body=data.get('body'),
                is_verified_purchase=is_verified,
            )
            db.session.add(review)
            status_code = 201

        db.session.flush()
        _recompute_product_rating(product_id)
        db.session.commit()

        return jsonify({
            'message': 'Review submitted successfully',
            'data': review.to_dict()
        }), status_code

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to submit review')


@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review (owner or admin only)"""
    try:
        user_id = int(get_jwt_identity())
        review = Review.query.get(review_id)

        if not review:
            return jsonify({'error': 'Review not found'}), 404

        if review.user_id != user_id and not _is_admin(user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        product_id = review.product_id
        db.session.delete(review)
        db.session.flush()
        _recompute_product_rating(product_id)
        db.session.commit()

        return jsonify({'message': 'Review deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to delete review')
