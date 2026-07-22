"""
Lightweight image analysis for "search by photo".

No external vision/AI API — this computes a dominant color (average pixel
RGB, downsampled to a small thumbnail for speed) from an image file and
compares products by color-distance. This is deliberately approximate:
it groups visually-similar-colored products together, it does not
recognize objects or categories.
"""

from PIL import Image
import math
import os


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


def compute_dominant_color_for_local_path(image_url):
    """For a locally-served upload path like '/uploads/products/foo.jpg',
    reads the file straight off disk (no network fetch — avoids SSRF risk
    from arbitrary external image_url values) and returns its dominant
    color, or None if the path isn't a local upload or can't be read."""
    if not image_url or not image_url.startswith('/uploads/'):
        return None

    relative_path = image_url.lstrip('/')
    if not os.path.isfile(relative_path):
        return None

    with open(relative_path, 'rb') as f:
        return compute_dominant_color(f)


def color_distance(hex_a, hex_b):
    """Euclidean RGB distance between two '#rrggbb' hex strings"""
    a = tuple(int(hex_a[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(hex_b[i:i + 2], 16) for i in (1, 3, 5))
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))
