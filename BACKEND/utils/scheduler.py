"""
Background Job Scheduler for Price Monitoring and Competitor Tracking
Uses APScheduler to run price checks and competitor updates automatically
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from utils.price_monitor import PriceMonitor
from utils.competitor_tracker import CompetitorPriceManager

logger = logging.getLogger(__name__)


class SchedulerManager:
    """Manage background jobs for price monitoring and competitor tracking"""
    
    _scheduler = None
    _price_monitor = None
    _competitor_manager = None
    
    @classmethod
    def initialize(cls, app):
        """Initialize the scheduler with Flask app context"""
        try:
            cls._scheduler = BackgroundScheduler()
            cls._price_monitor = PriceMonitor()
            cls._competitor_manager = CompetitorPriceManager(app.db.session)
            
            # Schedule price check every 6 hours
            cls._scheduler.add_job(
                func=cls._run_price_check,
                trigger=IntervalTrigger(hours=6),
                id='price_monitor_6h',
                name='Price Monitor (6-hour)',
                replace_existing=True,
                misfire_grace_time=60
            )
            
            # Schedule competitor price check every 12 hours
            cls._scheduler.add_job(
                func=cls._run_competitor_check,
                trigger=IntervalTrigger(hours=12),
                id='competitor_check_12h',
                name='Competitor Price Check (12-hour)',
                replace_existing=True,
                misfire_grace_time=60
            )
            
            # Run initial checks at startup (after 30 second delay)
            cls._scheduler.add_job(
                func=cls._run_price_check,
                trigger='date',
                run_date=None,
                id='price_monitor_startup',
                name='Initial Price Check',
                replace_existing=True
            )
            
            cls._scheduler.add_job(
                func=cls._run_competitor_check,
                trigger='date',
                run_date=None,
                id='competitor_check_startup',
                name='Initial Competitor Check',
                replace_existing=True
            )
            
            # Store app context for job execution
            cls._app = app
            
            if not cls._scheduler.running:
                cls._scheduler.start()
                logger.info("Price monitor scheduler started")
            
            return True
        
        except Exception as e:
            logger.exception(f"Error initializing scheduler: {e}")
            return False
    
    @classmethod
    def _run_price_check(cls):
        """Run price check within Flask app context"""
        if not cls._app:
            logger.error("Flask app context not available")
            return
        
        with cls._app.app_context():
            try:
                logger.info("=" * 60)
                logger.info("Starting automatic price monitoring")
                logger.info("=" * 60)
                
                result = cls._price_monitor.check_all_products(force_recheck=False)
                
                logger.info("=" * 60)
                logger.info(f"Price monitoring complete: {result}")
                logger.info("=" * 60)
                
                return result
            
            except Exception as e:
                logger.exception(f"Error in scheduled price check: {e}")
    
    @classmethod
    def _run_competitor_check(cls):
        """Run competitor price check within Flask app context"""
        if not cls._app:
            logger.error("Flask app context not available")
            return
        
        with cls._app.app_context():
            try:
                logger.info("=" * 60)
                logger.info("Starting automatic competitor price tracking")
                logger.info("=" * 60)
                
                results = cls._competitor_manager.update_all_competitor_prices()
                
                successful = len([r for r in results if r['success']])
                failed = len([r for r in results if not r['success']])
                
                logger.info("=" * 60)
                logger.info(f"Competitor tracking complete: {successful} successful, {failed} failed")
                logger.info("=" * 60)
                
                return {
                    'total_processed': len(results),
                    'successful': successful,
                    'failed': failed
                }
            
            except Exception as e:
                logger.exception(f"Error in scheduled competitor check: {e}")
    
    @classmethod
    def trigger_manual_check(cls):
        """Manually trigger price check (for admin)"""
        if not cls._app:
            logger.error("Flask app context not available")
            return {'success': False, 'error': 'Scheduler not initialized'}
        
        with cls._app.app_context():
            try:
                logger.info("Manual price check triggered by admin")
                result = cls._price_monitor.check_all_products(force_recheck=True)
                return result
            
            except Exception as e:
                logger.exception(f"Error in manual price check: {e}")
                return {'success': False, 'error': str(e)}
    
    @classmethod
    def trigger_competitor_check(cls):
        """Manually trigger competitor price check (for admin)"""
        if not cls._app:
            logger.error("Flask app context not available")
            return {'success': False, 'error': 'Scheduler not initialized'}
        
        with cls._app.app_context():
            try:
                logger.info("Manual competitor check triggered by admin")
                results = cls._competitor_manager.update_all_competitor_prices()
                
                successful = len([r for r in results if r['success']])
                failed = len([r for r in results if not r['success']])
                
                return {
                    'total_processed': len(results),
                    'successful': successful,
                    'failed': failed,
                    'results': results
                }
            
            except Exception as e:
                logger.exception(f"Error in manual competitor check: {e}")
                return {'success': False, 'error': str(e)}
    
    @classmethod
    def shutdown(cls):
        """Shutdown the scheduler"""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown()
            logger.info("Price monitor scheduler stopped")
    
    @classmethod
    def get_status(cls):
        """Get scheduler status"""
        if not cls._scheduler:
            return {'status': 'not_initialized'}
        
        return {
            'status': 'running' if cls._scheduler.running else 'stopped',
            'jobs': [
                {
                    'id': job.id,
                    'name': job.name,
                    'next_run': job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in cls._scheduler.get_jobs()
            ]
        }
