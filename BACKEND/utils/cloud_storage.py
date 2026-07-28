"""
Persistent file storage for uploaded images.

Render's filesystem is ephemeral - anything written to local disk (the old
`uploads/<type>/` behavior) is wiped on every deploy or restart, which is why
product photos kept disappearing. When CLOUDINARY_URL is configured we upload
there instead, which is not the app's own case, but if it is not configured
(e.g. local dev) we fall back to writing under BACKEND/uploads/ as before.
"""

import os

_cloudinary_configured = bool(os.getenv('CLOUDINARY_URL'))

if _cloudinary_configured:
    import cloudinary
    import cloudinary.uploader


def is_cloud_storage_enabled():
    return _cloudinary_configured


def upload_file(file_storage, folder, filename):
    """
    Save an uploaded file (a werkzeug FileStorage) and return a public URL.

    `folder` is a logical bucket (e.g. 'products', 'categories').
    `filename` is the already-sanitized, timestamped filename to use.
    """
    if _cloudinary_configured:
        public_id = os.path.splitext(filename)[0]
        result = cloudinary.uploader.upload(
            file_storage,
            folder=f'nexus/{folder}',
            public_id=public_id,
            resource_type='auto',
            overwrite=False
        )
        return result['secure_url']

    # Local disk fallback (dev only - not persistent on Render)
    local_folder = os.path.join('uploads', folder)
    os.makedirs(local_folder, exist_ok=True)
    filepath = os.path.join(local_folder, filename)
    file_storage.save(filepath)
    return f'/uploads/{folder}/{filename}'
