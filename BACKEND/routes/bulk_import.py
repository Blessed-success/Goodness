"""
Advanced Bulk Import Routes for BlessedNet Wholesale Hub
Handles multi-URL imports, CSV uploads, and background job processing
"""

from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User, Product, ImportJob, ImportTask
from utils.translation import (
    translate_text, generate_seo_title, 
    generate_marketing_description, generate_whatsapp_caption
)
from utils.import_helper import (
    validate_1688_url, extract_1688_product_data,
    convert_rmb_to_ghs, create_product_slug
)
from datetime import datetime
import uuid
import csv
import os
import json
from io import StringIO, BytesIO

bulk_import_bp = Blueprint('bulk_import', __name__, url_prefix='/api/import')

# Configuration
ALLOWED_CSV_SIZE = 5 * 1024 * 1024  # 5MB
MAX_CSV_ROWS = 200


def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


@bulk_import_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_import_jobs():
    """Get all import jobs for current user (or all if admin)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if user.is_admin:
            # Admins see all jobs
            query = ImportJob.query
        else:
            # Users see only their jobs
            query = ImportJob.query.filter_by(user_id=user_id)
        
        query = query.order_by(ImportJob.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        jobs = [job.to_dict() for job in paginate.items]
        
        return jsonify({
            'message': 'Jobs retrieved successfully',
            'data': {
                'jobs': jobs,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to retrieve jobs'}), 500


@bulk_import_bp.route('/jobs/<job_id>', methods=['GET'])
@jwt_required()
def get_job_details(job_id):
    """Get detailed information about a specific import job"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        job = ImportJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check authorization
        if not user.is_admin and job.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        include_tasks = request.args.get('include_tasks', 'false').lower() == 'true'
        
        return jsonify({
            'message': 'Job details retrieved',
            'data': job.to_dict(include_tasks=include_tasks)
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to retrieve job'}), 500


@bulk_import_bp.route('/csv-upload', methods=['POST'])
@jwt_required()
def bulk_import_csv():
    """
    Upload and import products from CSV file
    
    CSV Format:
    product_url,profit_margin
    https://www.1688.com/offer/123,40
    https://www.1688.com/offer/456,50
    """
    try:
        user_id = get_jwt_identity()
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files allowed'}), 400
        
        if file.content_length > ALLOWED_CSV_SIZE:
            return jsonify({'error': f'File too large. Max: {ALLOWED_CSV_SIZE / 1024 / 1024}MB'}), 413
        
        # Read and parse CSV
        try:
            stream = file.read().decode('utf-8')
            csv_reader = csv.DictReader(StringIO(stream))
            
            urls = []
            for idx, row in enumerate(csv_reader):
                if idx >= MAX_CSV_ROWS:
                    return jsonify({'error': f'Maximum {MAX_CSV_ROWS} rows allowed'}), 400
                
                product_url = row.get('product_url', '').strip()
                profit_margin = float(row.get('profit_margin', 40))
                
                if not product_url:
                    continue
                
                if validate_1688_url(product_url):
                    urls.append({
                        'url': product_url,
                        'profit_margin': profit_margin
                    })
            
            if len(urls) == 0:
                return jsonify({'error': 'No valid URLs found in CSV'}), 400
            
            # Create import job
            job_id = f"JOB-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            import_job = ImportJob(
                user_id=user_id,
                job_id=job_id,
                total_products=len(urls),
                status='pending',
                import_type='csv'
            )
            
            db.session.add(import_job)
            db.session.commit()
            
            # Create import tasks
            for item in urls:
                task = ImportTask(
                    job_id=import_job.id,
                    product_url=item['url'],
                    status='pending'
                )
                db.session.add(task)
            
            db.session.commit()
            
            # Background: Start importing (in production, use Celery)
            # For now, we'll process synchronously with progress updates
            process_import_job(import_job.id)
            
            # Refresh job
            import_job = ImportJob.query.get(import_job.id)
            
            return jsonify({
                'message': 'CSV import started',
                'data': {
                    'job_id': job_id,
                    'total_products': import_job.total_products,
                    'status': import_job.status
                }
            }), 202
        
        except Exception as e:
            current_app.logger.exception(e)
            return jsonify({'error': f'CSV parse error: {str(e)}'}), 400
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Upload failed'}), 500


@bulk_import_bp.route('/urls', methods=['POST'])
@jwt_required()
def bulk_import_urls():
    """
    Import products from multiple URLs at once
    
    Request body:
    {
        "urls": [
            "https://www.1688.com/offer/123",
            "https://www.1688.com/offer/456"
        ],
        "profit_margin_percent": 40,
        "auto_publish": true
    }
    """
    try:
        user_id = get_jwt_identity()
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data or 'urls' not in data:
            return jsonify({'error': 'urls array is required'}), 400
        
        urls = data.get('urls', [])
        profit_margin = data.get('profit_margin_percent', 40)
        
        if not isinstance(urls, list) or len(urls) == 0:
            return jsonify({'error': 'urls must be a non-empty array'}), 400
        
        if len(urls) > 50:
            return jsonify({'error': 'Maximum 50 products per batch'}), 400
        
        # Validate all URLs
        valid_urls = []
        for url in urls:
            if validate_1688_url(url.strip()):
                valid_urls.append({
                    'url': url.strip(),
                    'profit_margin': profit_margin
                })
        
        if len(valid_urls) == 0:
            return jsonify({'error': 'No valid 1688 URLs found'}), 400
        
        # Create import job
        job_id = f"JOB-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        import_job = ImportJob(
            user_id=user_id,
            job_id=job_id,
            total_products=len(valid_urls),
            status='pending',
            import_type='bulk'
        )
        
        db.session.add(import_job)
        db.session.commit()
        
        # Create tasks
        for item in valid_urls:
            task = ImportTask(
                job_id=import_job.id,
                product_url=item['url'],
                status='pending'
            )
            db.session.add(task)
        
        db.session.commit()
        
        # Start processing (background in production)
        process_import_job(import_job.id)
        
        # Refresh
        import_job = ImportJob.query.get(import_job.id)
        
        return jsonify({
            'message': 'Bulk import started',
            'data': {
                'job_id': job_id,
                'total_products': import_job.total_products,
                'status': import_job.status,
                'progress_percent': import_job.progress_percent
            }
        }), 202
    
    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Import failed'}), 500


def process_import_job(job_id):
    """
    Process an import job and its tasks
    (In production, this would be a background Celery task)
    """
    try:
        job = ImportJob.query.get(job_id)
        if not job:
            return
        
        job.status = 'processing'
        job.started_at = datetime.utcnow()
        db.session.commit()
        
        tasks = ImportTask.query.filter_by(job_id=job_id).all()
        
        for idx, task in enumerate(tasks):
            try:
                process_import_task(task)
                
                # Update job progress
                job.progress_percent = ((idx + 1) / len(tasks)) * 100
                if task.status == 'success':
                    job.successful_count += 1
                else:
                    job.failed_count += 1
                
                db.session.commit()
            
            except Exception as e:
                current_app.logger.exception(e)
                task.status = 'failed'
                task.error_message = str(e)
                job.failed_count += 1
                db.session.commit()
        
        # Mark job as completed
        job.status = 'completed'
        job.completed_at = datetime.utcnow()
        job.progress_percent = 100
        db.session.commit()
    
    except Exception as e:
        current_app.logger.exception(e)
        job.status = 'failed'
        job.error_message = str(e)
        db.session.commit()


def process_import_task(task):
    """
    Process a single import task
    """
    try:
        task.status = 'processing'
        db.session.commit()
        
        # Extract product data
        extraction = extract_1688_product_data(task.product_url)
        
        if not extraction['success']:
            task.status = 'failed'
            task.error_message = extraction.get('error', 'Extraction failed')
            db.session.commit()
            return
        
        product_data = extraction['data']
        task.original_title = product_data['title']
        task.price_rmb = product_data['price_rmb']
        
        # Translate title
        translation = translate_text(product_data['title'], 'zh-CN', 'en')
        translated_title = translation.get('translated_text', product_data['title'])
        task.translated_title = translated_title
        
        # Convert price
        if not product_data['price_rmb']:
            task.status = 'failed'
            task.error_message = 'Price not available'
            db.session.commit()
            return
        
        price_conversion = convert_rmb_to_ghs(
            product_data['price_rmb'],
            40  # Default profit margin
        )
        
        final_price = price_conversion['data']['final_price_ghs']
        task.price_ghs = final_price
        
        # Check for duplicate
        existing = Product.query.filter_by(name=translated_title).first()
        if existing:
            task.status = 'failed'
            task.error_message = f'Duplicate product: {existing.id}'
            db.session.commit()
            return
        
        # Generate descriptions
        seo_title = generate_seo_title(product_data['title'], translated_title, product_data['category'])
        marketing_desc = generate_marketing_description(translated_title, final_price, product_data['category'])
        whatsapp_caption = generate_whatsapp_caption(translated_title, final_price, product_data['category'])
        
        # Create product
        slug = create_product_slug(translated_title)
        sku = f"1688-{slug}-{int(datetime.utcnow().timestamp())}"[:50]
        
        product = Product(
            name=translated_title,
            description=marketing_desc,
            category=product_data['category'],
            price=final_price,
            image_url=product_data['images'][0] if product_data['images'] else None,
            sku=sku,
            stock_quantity=10,
            rating=4.5,
            is_featured=False
        )
        
        db.session.add(product)
        db.session.commit()
        
        # Update task
        task.product_id = product.id
        task.status = 'success'
        task.completed_at = datetime.utcnow()
        db.session.commit()
    
    except Exception as e:
        current_app.logger.exception(e)
        task.status = 'failed'
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.session.commit()


@bulk_import_bp.route('/export-results/<job_id>', methods=['GET'])
@jwt_required()
def export_import_results(job_id):
    """Export import job results as CSV"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        job = ImportJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check authorization
        if not user.is_admin and job.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Generate CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Status', 'Product URL', 'Original Title', 
            'Translated Title', 'Price RMB', 'Price GHS', 'Error'
        ])
        
        tasks = ImportTask.query.filter_by(job_id=job.id).all()
        for task in tasks:
            writer.writerow([
                task.status,
                task.product_url,
                task.original_title or '',
                task.translated_title or '',
                task.price_rmb or '',
                task.price_ghs or '',
                task.error_message or ''
            ])
        
        # Convert to bytes
        output.seek(0)
        bytes_data = BytesIO(output.getvalue().encode('utf-8'))
        
        return send_file(
            bytes_data,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'import-results-{job_id}.csv'
        ), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Export failed'}), 500
