"""
Lightweight image analysis for "search by photo".

No external vision/AI API — this computes a dominant color (average pixel
RGB, downsampled to a small thumbnail for speed) from an image file and
compares products by color-distance. This is deliberately approximate:
it groups visually-similar-colored products together, it does not
recognize objects or categories.
"""

from PIL import Image
from urllib.parse import urlparse
import io
import math
import os
import requests

# Cloudinary always serves from this fixed CDN hostname regardless of which
# account/cloud_name uploaded the asset, so allowlisting just the host (not
# the full URL, which is attacker-influenced) lets us fetch our own uploaded
# images for color analysis without opening up a general SSRF-capable fetch.
TRUSTED_REMOTE_IMAGE_HOSTS = {'res.cloudinary.com'}
MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024  # 10MB


def compute_dominant_color(file_stream):
    """Returns a '#rrggbb' hex string for the average color of the image,
    or None if the file can't be read as an image."""
    try:
        file_stream.seek(0)
        with Image.open(file_stream) as img:
            img = img.convert('RGB')
            img.thumbnail((50, 50))
            pixels = list(img.getdata())
            if not pixels:
                return None
            r = sum(p[0] for p in pixels) // len(pixels)
            g = sum(p[1] for p in pixels) // len(pixels)
            b = sum(p[2] for p in pixels) // len(pixels)
            return f'#{r:02x}{g:02x}{b:02x}'
    except Exception:
        return None
    finally:
        try:
            file_stream.seek(0)
        except Exception:
            pass


def _compute_dominant_color_for_local_path(image_url):
    """For a locally-served upload path like '/uploads/products/foo.jpg',
    reads the file straight off disk."""
    relative_path = image_url.lstrip('/')
    if not os.path.isfile(relative_path):
        return None

    with open(relative_path, 'rb') as f:
        return compute_dominant_color(f)


def _compute_dominant_color_for_remote_url(image_url):
    """Fetches an image from a known-trusted CDN host (our own Cloudinary
    uploads) and returns its dominant color. Not a general-purpose URL
    fetcher: the host allowlist keeps this from being usable as an SSRF
    vector even though image_url itself is stored data, not a fixed value."""
    try:
        parsed = urlparse(image_url)
        if parsed.hostname not in TRUSTED_REMOTE_IMAGE_HOSTS:
            return None

        response = requests.get(image_url, timeout=5, stream=True)
        response.raise_for_status()

        chunks = []
        total = 0
        for chunk in response.iter_content(chunk_size=65536):
            total += len(chunk)
            if total > MAX_REMOTE_IMAGE_BYTES:
                return None
            chunks.append(chunk)

        return compute_dominant_color(io.BytesIO(b''.join(chunks)))
    except Exception:
        return None


def compute_dominant_color_for_image_url(image_url):
    """Returns the dominant color for a product's image_url, whether it's a
    locally-served upload path or an absolute URL from a trusted CDN host.
    Returns None if image_url is empty or from an untrusted/unreadable source."""
    if not image_url:
        return None
    if image_url.startswith('/uploads/'):
        return _compute_dominant_color_for_local_path(image_url)
    return _compute_dominant_color_for_remote_url(image_url)


def color_distance(hex_a, hex_b):
    """Euclidean RGB distance between two '#rrggbb' hex strings"""
    a = tuple(int(hex_a[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(hex_b[i:i + 2], 16) for i in (1, 3, 5))
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))
