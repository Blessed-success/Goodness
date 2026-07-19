"""
Competitor Price Tracking System
Scrapes competitor websites (Jumia, AliExpress, etc.) for price comparison
"""

import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
import time
from urllib.parse import urlparse
import logging

class CompetitorScraper:
    """Base class for competitor price scraping"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def scrape_product(self, url):
        """
        Scrape product data from competitor URL
        Returns: {
            'success': bool,
            'title': str,
            'price': float,
            'currency': str,
            'is_available': bool,
            'error': str (if failed)
        }
        """
        try:
            # Validate URL
            if not self._is_valid_url(url):
                return {
                    'success': False,
                    'error': 'Invalid URL format'
                }

            # Make request
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract data using competitor-specific logic
            competitor = self._identify_competitor(url)

            if competitor == 'jumia':
                return self._scrape_jumia(soup, url)
            elif competitor == 'aliexpress':
                return self._scrape_aliexpress(soup, url)
            elif competitor == 'amazon':
                return self._scrape_amazon(soup, url)
            else:
                return self._scrape_generic(soup, url)

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Request failed: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Scraping failed: {str(e)}'
            }

    def _identify_competitor(self, url):
        """Identify competitor from URL"""
        domain = urlparse(url).netloc.lower()

        if 'jumia' in domain:
            return 'jumia'
        elif 'aliexpress' in domain:
            return 'aliexpress'
        elif 'amazon' in domain:
            return 'amazon'
        else:
            return 'generic'

    def _is_valid_url(self, url):
        """Validate URL format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False

    def _scrape_jumia(self, soup, url):
        """Scrape Jumia product page"""
        try:
            # Extract title
            title_elem = soup.find('h1', class_=re.compile(r'-title'))
            if not title_elem:
                title_elem = soup.find('h1')
            title = title_elem.get_text().strip() if title_elem else "Unknown Product"

            # Extract price
            price = None
            price_elem = soup.find('span', class_=re.compile(r'-price'))
            if price_elem:
                price_text = price_elem.get_text().strip()
                # Remove currency symbols and extract number
                price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                if price_match:
                    price = float(price_match.group().replace(',', ''))

            # Check availability
            availability = True
            out_of_stock = soup.find(text=re.compile(r'out of stock|sold out', re.I))
            if out_of_stock:
                availability = False

            return {
                'success': True,
                'title': title,
                'price': price,
                'currency': 'GHS',
                'is_available': availability
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Jumia scraping failed: {str(e)}'
            }

    def _scrape_aliexpress(self, soup, url):
        """Scrape AliExpress product page"""
        try:
            # Extract title
            title_elem = soup.find('h1', class_=re.compile(r'title'))
            if not title_elem:
                title_elem = soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "Unknown Product"

            # Extract price
            price = None
            # Look for price in various formats
            price_patterns = [
                r'class="[^"]*price[^"]*"[^>]*>([^<]+)',
                r'data-price="([^"]+)"',
                r'price[^>]*>([^<]+)'
            ]

            for pattern in price_patterns:
                price_match = re.search(pattern, str(soup), re.I)
                if price_match:
                    price_text = price_match.group(1)
                    # Extract numeric value
                    num_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                    if num_match:
                        price = float(num_match.group().replace(',', ''))
                        break

            # Check availability
            availability = True
            out_of_stock = soup.find(text=re.compile(r'out of stock|temporarily unavailable', re.I))
            if out_of_stock:
                availability = False

            return {
                'success': True,
                'title': title,
                'price': price,
                'currency': 'USD',  # AliExpress often shows USD
                'is_available': availability
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'AliExpress scraping failed: {str(e)}'
            }

    def _scrape_amazon(self, soup, url):
        """Scrape Amazon product page"""
        try:
            # Extract title
            title_elem = soup.find('span', id='productTitle')
            if not title_elem:
                title_elem = soup.find('h1')
            title = title_elem.get_text().strip() if title_elem else "Unknown Product"

            # Extract price
            price = None
            price_elem = soup.find('span', class_=re.compile(r'a-price-whole'))
            if price_elem:
                whole = price_elem.get_text().strip()
                fraction_elem = soup.find('span', class_=re.compile(r'a-price-fraction'))
                fraction = fraction_elem.get_text().strip() if fraction_elem else '00'
                price_text = f"{whole}.{fraction}"
                price = float(price_text.replace(',', ''))

            # Check availability
            availability = True
            out_of_stock = soup.find('span', text=re.compile(r'currently unavailable|out of stock', re.I))
            if out_of_stock:
                availability = False

            return {
                'success': True,
                'title': title,
                'price': price,
                'currency': 'GHS',  # Amazon Ghana
                'is_available': availability
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Amazon scraping failed: {str(e)}'
            }

    def _scrape_generic(self, soup, url):
        """Generic scraping for unknown competitors"""
        try:
            # Extract title
            title_elem = soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "Unknown Product"

            # Extract price (look for common patterns)
            price = None
            price_patterns = [
                r'\$[\d,]+\.?\d*',
                r'₵[\d,]+\.?\d*',
                r'GHS?\s*[\d,]+\.?\d*',
                r'price[^>]*>([^<]+)'
            ]

            for pattern in price_patterns:
                match = re.search(pattern, str(soup), re.I)
                if match:
                    price_text = match.group()
                    # Extract numeric value
                    num_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                    if num_match:
                        price = float(num_match.group().replace(',', ''))
                        break

            # Check availability
            availability = True
            unavailable_indicators = ['out of stock', 'sold out', 'unavailable', 'not available']
            for indicator in unavailable_indicators:
                if soup.find(text=re.compile(indicator, re.I)):
                    availability = False
                    break

            return {
                'success': True,
                'title': title,
                'price': price,
                'currency': 'GHS',  # Default assumption
                'is_available': availability
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Generic scraping failed: {str(e)}'
            }


class CompetitorPriceManager:
    """Manages competitor price tracking and alerts"""

    def __init__(self, db_session):
        self.db = db_session
        self.scraper = CompetitorScraper()

    def add_competitor_tracking(self, product_id, competitor_url, competitor_name=None, check_frequency_hours=24):
        """Add a competitor product to track"""
        from models import CompetitorPrice, Product

        # Auto-detect competitor if not provided
        if not competitor_name:
            competitor_name = self._identify_competitor_from_url(competitor_url)

        # Check if already tracking
        existing = CompetitorPrice.query.filter_by(
            product_id=product_id,
            competitor_url=competitor_url
        ).first()

        if existing:
            return {'success': False, 'error': 'Already tracking this competitor URL'}

        # Create new tracking entry
        competitor_price = CompetitorPrice(
            product_id=product_id,
            competitor_url=competitor_url,
            competitor_name=competitor_name,
            competitor_price=0,  # Will be updated on first check
            check_frequency_hours=check_frequency_hours
        )

        self.db.add(competitor_price)
        self.db.commit()

        # Perform initial price check
        self.update_competitor_price(competitor_price.id)

        return {'success': True, 'competitor_price_id': competitor_price.id}

    def update_competitor_price(self, competitor_price_id):
        """Update price for a specific competitor tracking"""
        from models import CompetitorPrice, CompetitorAlert

        competitor_price = CompetitorPrice.query.get(competitor_price_id)
        if not competitor_price:
            return {'success': False, 'error': 'Competitor price tracking not found'}

        # Scrape current price
        result = self.scraper.scrape_product(competitor_price.competitor_url)

        if not result['success']:
            competitor_price.is_available = False
            self.db.commit()
            return {'success': False, 'error': result['error']}

        # Update competitor price
        old_price = competitor_price.competitor_price
        competitor_price.competitor_product_title = result['title']
        competitor_price.competitor_price = result['price']
        competitor_price.competitor_currency = result['currency']
        competitor_price.is_available = result['is_available']
        competitor_price.last_checked = datetime.utcnow()

        # Check for significant price changes
        if old_price > 0 and abs(result['price'] - old_price) / old_price > 0.05:  # 5% change
            self._create_price_alert(competitor_price, old_price, result['price'])

        self.db.commit()

        return {
            'success': True,
            'old_price': old_price,
            'new_price': result['price'],
            'price_changed': old_price != result['price']
        }

    def update_all_competitor_prices(self):
        """Update all active competitor price trackings"""
        from models import CompetitorPrice
        from datetime import timedelta

        # Get trackings that need updating
        cutoff_time = datetime.utcnow() - timedelta(hours=1)  # Allow some buffer

        trackings = CompetitorPrice.query.filter(
            CompetitorPrice.is_active == True,
            CompetitorPrice.last_checked < cutoff_time
        ).all()

        results = []
        for tracking in trackings:
            try:
                result = self.update_competitor_price(tracking.id)
                results.append({
                    'tracking_id': tracking.id,
                    'success': result['success'],
                    'error': result.get('error')
                })
            except Exception as e:
                results.append({
                    'tracking_id': tracking.id,
                    'success': False,
                    'error': str(e)
                })

        return results

    def get_price_comparison(self, product_id):
        """Get price comparison for a product"""
        from models import CompetitorPrice, Product

        product = Product.query.get(product_id)
        if not product:
            return {'success': False, 'error': 'Product not found'}

        competitors = CompetitorPrice.query.filter_by(
            product_id=product_id,
            is_active=True
        ).all()

        comparison = {
            'product': {
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'currency': 'GHS'
            },
            'competitors': [comp.to_dict() for comp in competitors],
            'summary': {
                'total_competitors': len(competitors),
                'cheaper_competitors': len([c for c in competitors if c.is_competitor_cheaper]),
                'best_deal': all(c.is_best_deal for c in competitors if c.is_available)
            }
        }

        return {'success': True, 'data': comparison}

    def _identify_competitor_from_url(self, url):
        """Identify competitor from URL"""
        domain = urlparse(url).netloc.lower()

        if 'jumia' in domain:
            return 'Jumia'
        elif 'aliexpress' in domain or 'ali' in domain:
            return 'AliExpress'
        elif 'amazon' in domain:
            return 'Amazon'
        else:
            return 'Unknown'

    def _create_price_alert(self, competitor_price, old_price, new_price):
        """Create alert for significant price change"""
        from models import CompetitorAlert

        # Calculate price gap change
        if competitor_price.product:
            old_gap = old_price - competitor_price.product.price
            new_gap = new_price - competitor_price.product.price
            gap_change = new_gap - old_gap
        else:
            gap_change = None

        # Determine alert type and recommendation
        if new_price < competitor_price.product.price:
            alert_type = 'competitor_cheaper'
            recommendation = f"Competitor is now cheaper by GHS {competitor_price.product.price - new_price:.2f}. Consider price reduction."
        else:
            alert_type = 'price_gap_increased'
            recommendation = f"Competitor price increased. You now have a GHS {new_price - competitor_price.product.price:.2f} advantage."

        alert = CompetitorAlert(
            competitor_price_id=competitor_price.id,
            alert_type=alert_type,
            old_competitor_price=old_price,
            new_competitor_price=new_price,
            price_gap_change=gap_change,
            recommendation=recommendation
        )

        self.db.add(alert)
        self.db.commit()