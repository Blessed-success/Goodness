"""
Price Monitoring Service for 1688 Products
Automatically detects price changes and updates store prices
"""

from datetime import datetime, timedelta
import logging
from flask import current_app
from models import db, Product, PriceAlert
from utils.import_helper import extract_1688_product_data, convert_rmb_to_ghs

logger = logging.getLogger(__name__)


class PriceMonitor:
    """Monitor and update product prices from suppliers"""
    
    def __init__(self):
        self.updated_count = 0
        self.alert_count = 0
        self.error_count = 0
    
    def check_all_products(self, force_recheck=False):
        """
        Check prices for all monitored products
        
        Args:
            force_recheck: If True, recheck all products. Otherwise, only check ones
                          not checked in the last 6 hours
        
        Returns:
            dict with summary of updates and alerts
        """
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=6)
            
            if force_recheck:
                # Check all monitored products
                query = Product.query.filter(
                    Product.is_price_monitored == True,
                    Product.source_url.isnot(None)
                )
            else:
                # Check products that haven't been checked recently
                query = Product.query.filter(
                    Product.is_price_monitored == True,
                    Product.source_url.isnot(None),
                    db.or_(
                        Product.last_scraped_at.is_(None),
                        Product.last_scraped_at < cutoff_time
                    )
                )
            
            products_to_check = query.all()
            logger.info(f"Starting price check for {len(products_to_check)} products")
            
            self.updated_count = 0
            self.alert_count = 0
            self.error_count = 0
            
            for product in products_to_check:
                self.check_product_price(product)
            
            db.session.commit()
            
            result = {
                'success': True,
                'products_checked': len(products_to_check),
                'prices_updated': self.updated_count,
                'alerts_created': self.alert_count,
                'errors': self.error_count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Price check complete: {result}")
            return result
        
        except Exception as e:
            logger.exception(f"Error during price check: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def check_product_price(self, product):
        """
        Check price for a single product and update if needed
        
        Args:
            product: Product model instance
        """
        try:
            if not product.source_url or not product.supplier_price_rmb:
                logger.warning(f"Product {product.id} missing source_url or supplier_price_rmb")
                self.error_count += 1
                return
            
            # Fetch current price from supplier
            extraction = extract_1688_product_data(product.source_url)
            
            if not extraction['success']:
                logger.warning(f"Failed to fetch {product.source_url}: {extraction.get('error')}")
                product.last_scraped_at = datetime.utcnow()
                self.error_count += 1
                return
            
            new_price_rmb = extraction['data'].get('price_rmb')
            old_price_rmb = product.supplier_price_rmb
            
            if not new_price_rmb:
                logger.warning(f"No price found for product {product.id}")
                product.last_scraped_at = datetime.utcnow()
                self.error_count += 1
                return
            
            # Mark as scraped
            product.last_scraped_at = datetime.utcnow()
            
            # Check if price changed
            if abs(new_price_rmb - old_price_rmb) < 0.01:
                # No significant change
                logger.debug(f"Product {product.id}: Price unchanged ({old_price_rmb} RMB)")
                return
            
            # Calculate percentage change
            price_change_percent = ((new_price_rmb - old_price_rmb) / old_price_rmb) * 100
            
            # Calculate new GHS price
            price_conversion = convert_rmb_to_ghs(
                new_price_rmb,
                product.profit_margin_percent
            )
            new_price_ghs = price_conversion['data']['final_price_ghs']
            old_price_ghs = product.price
            
            logger.info(
                f"Product {product.id}: "
                f"RMB {old_price_rmb} → {new_price_rmb} "
                f"(GHS {old_price_ghs:.2f} → {new_price_ghs:.2f}) "
                f"Change: {price_change_percent:.1f}%"
            )
            
            # Determine alert type
            alert_type = 'price_increase' if new_price_rmb > old_price_rmb else 'price_decrease'
            
            # Create price alert
            alert = PriceAlert(
                product_id=product.id,
                old_price_rmb=old_price_rmb,
                new_price_rmb=new_price_rmb,
                old_price_ghs=old_price_ghs,
                new_price_ghs=new_price_ghs,
                price_change_percent=price_change_percent,
                alert_type=alert_type
            )
            
            db.session.add(alert)
            self.alert_count += 1
            
            # Auto-update price if it decreased
            if price_change_percent < 0:
                # Price dropped - auto-update to stay competitive
                product.price = new_price_ghs
                product.supplier_price_rmb = new_price_rmb
                alert.status = 'auto_updated'
                alert.auto_update_applied = True
                self.updated_count += 1
                logger.info(f"Product {product.id}: Auto-updated price to GHS {new_price_ghs:.2f}")
            else:
                # Price increased - wait for admin approval
                alert.status = 'pending'
                logger.info(f"Product {product.id}: Price increase detected, pending admin approval")
        
        except Exception as e:
            logger.exception(f"Error checking product {product.id}: {e}")
            self.error_count += 1


class PriceAlertManager:
    """Manage price alerts - approve, dismiss, or apply updates"""
    
    @staticmethod
    def approve_alert(alert_id):
        """Admin approves a price alert and updates product price"""
        try:
            alert = PriceAlert.query.get(alert_id)
            if not alert:
                return {'success': False, 'error': 'Alert not found'}
            
            product = alert.product
            if not product:
                return {'success': False, 'error': 'Product not found'}
            
            # Update product price
            product.price = alert.new_price_ghs
            product.supplier_price_rmb = alert.new_price_rmb
            alert.status = 'approved'
            alert.auto_update_applied = True
            alert.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            logger.info(f"Alert {alert_id}: Approved and applied to product {product.id}")
            return {
                'success': True,
                'message': f'Price updated to GHS {alert.new_price_ghs:.2f}',
                'product': product.to_dict(include_stock=True)
            }
        
        except Exception as e:
            logger.exception(f"Error approving alert {alert_id}: {e}")
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def dismiss_alert(alert_id, notes=None):
        """Admin dismisses a price alert (price increase) without updating"""
        try:
            alert = PriceAlert.query.get(alert_id)
            if not alert:
                return {'success': False, 'error': 'Alert not found'}
            
            alert.status = 'dismissed'
            alert.admin_notes = notes
            alert.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            logger.info(f"Alert {alert_id}: Dismissed by admin")
            return {'success': True, 'message': 'Alert dismissed'}
        
        except Exception as e:
            logger.exception(f"Error dismissing alert {alert_id}: {e}")
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_pending_alerts(product_id=None, alert_type=None, limit=50):
        """Get pending price alerts"""
        try:
            query = PriceAlert.query.filter_by(status='pending')
            
            if product_id:
                query = query.filter_by(product_id=product_id)
            
            if alert_type:
                query = query.filter_by(alert_type=alert_type)
            
            alerts = query.order_by(
                PriceAlert.created_at.desc()
            ).limit(limit).all()
            
            return {
                'success': True,
                'count': len(alerts),
                'alerts': [alert.to_dict() for alert in alerts]
            }
        
        except Exception as e:
            logger.exception(f"Error fetching alerts: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_alert_summary():
        """Get summary of all pending alerts"""
        try:
            pending_count = PriceAlert.query.filter_by(status='pending').count()
            
            # Count increases vs decreases
            increases = PriceAlert.query.filter_by(
                status='pending',
                alert_type='price_increase'
            ).count()
            
            decreases = PriceAlert.query.filter_by(
                status='pending',
                alert_type='price_decrease'
            ).count()
            
            # Get highest increase/decrease
            highest_increase = db.session.query(
                PriceAlert.price_change_percent
            ).filter_by(
                status='pending',
                alert_type='price_increase'
            ).order_by(
                PriceAlert.price_change_percent.desc()
            ).first()
            
            highest_decrease = db.session.query(
                PriceAlert.price_change_percent
            ).filter_by(
                status='pending',
                alert_type='price_decrease'
            ).order_by(
                PriceAlert.price_change_percent.asc()
            ).first()
            
            return {
                'success': True,
                'total_pending': pending_count,
                'price_increases': increases,
                'price_decreases': decreases,
                'highest_increase_percent': highest_increase[0] if highest_increase else 0,
                'highest_decrease_percent': abs(highest_decrease[0]) if highest_decrease else 0,
            }
        
        except Exception as e:
            logger.exception(f"Error getting alert summary: {e}")
            return {'success': False, 'error': str(e)}
