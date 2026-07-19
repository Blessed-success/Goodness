"""
Translation and AI Content Generation for Product Imports
Handles translation from Chinese to English and auto-generates marketing content
"""

try:
    from google.cloud import translate_v2
    GOOGLE_TRANSLATE_AVAILABLE = True
except ImportError:
    GOOGLE_TRANSLATE_AVAILABLE = False

import requests
import os


def translate_text(text, source_language='zh-CN', target_language='en'):
    """
    Translate text from one language to another
    
    Tries multiple translation methods:
    1. Google Translate API (if credentials available)
    2. Microsoft Translator API (if key available)
    3. Free translation API (fallback)
    
    Args:
        text (str): Text to translate
        source_language (str): Source language code
        target_language (str): Target language code
        
    Returns:
        dict: Translation result
    """
    
    if not text or len(text.strip()) == 0:
        return {'success': True, 'translated_text': text, 'method': 'none'}
    
    # Try Google Translate API
    if GOOGLE_TRANSLATE_AVAILABLE:
        try:
            result = translate_with_google(text, source_language, target_language)
            if result['success']:
                return result
        except Exception as e:
            print(f"Google Translate failed: {e}")
    
    # Try Azure Translator
    try:
        result = translate_with_azure(text, source_language, target_language)
        if result['success']:
            return result
    except Exception as e:
        print(f"Azure Translator failed: {e}")
    
    # Fallback: Use free translation API
    try:
        result = translate_with_free_api(text, source_language, target_language)
        if result['success']:
            return result
    except Exception as e:
        print(f"Free API translation failed: {e}")
    
    # If all fail, return original text
    return {
        'success': False,
        'translated_text': text,
        'method': 'none',
        'error': 'All translation services failed'
    }


def translate_with_google(text, source_language, target_language):
    """Translate using Google Cloud Translation API"""
    try:
        credentials_path = os.getenv('GOOGLE_TRANSLATE_CREDENTIALS')
        if not credentials_path:
            return {'success': False, 'error': 'No Google credentials'}
        
        # Setup client
        translate_client = translate_v2.Client()
        
        result = translate_client.translate_text(
            text,
            source_language=source_language,
            target_language=target_language
        )
        
        return {
            'success': True,
            'translated_text': result['translatedText'],
            'method': 'google'
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def translate_with_azure(text, source_language, target_language):
    """Translate using Azure Translator"""
    try:
        api_key = os.getenv('AZURE_TRANSLATOR_KEY')
        if not api_key:
            return {'success': False, 'error': 'No Azure key'}
        
        headers = {
            'Ocp-Apim-Subscription-Key': api_key,
            'Content-Type': 'application/json'
        }
        
        params = {
            'api-version': '3.0',
            'from': source_language,
            'to': target_language
        }
        
        data = [{'Text': text}]
        
        response = requests.post(
            'https://api.cognitive.microsofttranslator.com/translate',
            headers=headers,
            params=params,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            translated_text = result[0]['translations'][0]['text']
            return {
                'success': True,
                'translated_text': translated_text,
                'method': 'azure'
            }
        else:
            return {'success': False, 'error': f'Status {response.status_code}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def translate_with_free_api(text, source_language, target_language):
    """Translate using free MyMemory API (no key required)"""
    try:
        # Convert language codes
        src = source_language.split('-')[0]  # zh-CN -> zh
        tgt = target_language.split('-')[0]  # en -> en
        
        url = 'https://api.mymemory.translated.net/get'
        params = {
            'q': text[:500],  # Limit to 500 chars
            'langpair': f'{src}|{tgt}'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['responseStatus'] == 200:
                return {
                    'success': True,
                    'translated_text': data['responseData']['translatedText'],
                    'method': 'mymemory'
                }
        
        return {'success': False, 'error': 'API returned error'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_seo_title(original_title, translated_title, category):
    """
    Generate SEO-optimized product title
    
    Args:
        original_title (str): Original Chinese title
        translated_title (str): English translation
        category (str): Product category
        
    Returns:
        str: SEO-optimized title
    """
    
    # Clean up title
    title = translated_title.strip()
    
    # Remove excess punctuation
    title = title.replace('  ', ' ')
    
    # Limit to 60 chars for SEO
    if len(title) > 60:
        # Try to cut at word boundary
        title = ' '.join(title[:60].split()[:-1])
    
    # Add category as prefix if not already included
    if category.lower() not in title.lower():
        title = f"{category} - {title}"
    
    return title[:60]


def generate_marketing_description(translated_title, price_ghs, category, rating=4.5):
    """
    Generate marketing description for product
    
    Args:
        translated_title (str): Product title
        price_ghs (float): Price in GHS
        category (str): Product category
        rating (float): Product rating
        
    Returns:
        str: Marketing description
    """
    
    rating_stars = '⭐' * int(rating)
    
    description = f"""
Wholesale {category.lower()} - {translated_title}

✅ Premium Quality Product
✅ Competitive Pricing: GHS {price_ghs:.2f}
✅ Bulk Orders Available
✅ Direct Supplier
✅ Fast Delivery
{rating_stars} ({rating}/5 stars)

Perfect for: Retailers, Resellers, Wholesalers

Features:
• Authentic product from reliable manufacturer
• Bulk discounts available
• Guaranteed quality
• Quick turnaround

📍 Available in Ghana
💰 Special bulk pricing
📱 Order via WhatsApp or Online

Contact us for:
→ Bulk quotations
→ Custom orders
→ Payment plans
    """.strip()
    
    return description


def generate_whatsapp_caption(translated_title, price_ghs, category, quantity=1):
    """
    Generate WhatsApp-friendly product caption
    
    Args:
        translated_title (str): Product title
        price_ghs (float): Price in GHS
        category (str): Product category
        quantity (int): Default quantity
        
    Returns:
        str: WhatsApp-friendly caption
    """
    
    total = price_ghs * quantity
    
    caption = f"""
📦 *{translated_title}*

Category: {category}
💰 Price: GHS {price_ghs:.2f}/unit
📊 Qty: {quantity} units
💹 Total: GHS {total:.2f}

✅ 100% Original
✅ Quality Guaranteed
✅ Bulk Discount Available

🎯 *Special Offer:*
Buy 5+ units → 10% discount
Buy 20+ units → 15% discount

📞 Order Now: Reply or Call
🚀 Fast Delivery
    """
    
    return caption.strip()


def detect_language(text):
    """
    Detect language of text
    
    Args:
        text (str): Text to detect language for
        
    Returns:
        dict: Language detection result
    """
    try:
        # Simple heuristic: check for Chinese characters
        if any('\u4e00' <= char <= '\u9fff' for char in text):
            return {
                'success': True,
                'language': 'Chinese',
                'code': 'zh-CN'
            }
        else:
            return {
                'success': True,
                'language': 'English',
                'code': 'en'
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def clean_product_text(text):
    """
    Clean product text (remove special chars, normalize)
    
    Args:
        text (str): Text to clean
        
    Returns:
        str: Cleaned text
    """
    if not text:
        return ''
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # Remove common non-ASCII if not Chinese
    if not any('\u4e00' <= char <= '\u9fff' for char in text):
        # Keep alphanumeric and common punctuation
        text = ''.join(char for char in text if ord(char) < 128 or ord(char) > 127)
    
    return text.strip()
