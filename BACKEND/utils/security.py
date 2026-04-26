from flask import jsonify, current_app

def safe_error_response(message='An internal server error occurred'):
    current_app.logger.exception(message)
    return jsonify({'error': message}), 500
