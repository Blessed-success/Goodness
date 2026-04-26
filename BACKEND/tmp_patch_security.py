import os
import re

root = 'BACKEND'
route_files = [
    'routes/auth.py',
    'routes/products.py',
    'routes/cart.py',
    'routes/orders.py',
    'routes/payment.py',
    'routes/import.py',
    'routes/admin.py'
]

error_pattern = re.compile(r"^(?P<indent>\s*)return jsonify\(\{'error': f'(?P<message>[^']+): \{str\(e\)\}'\}\), 500\s*$")

for rel_path in route_files:
    path = os.path.join(root, rel_path)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read().splitlines()

    changed = False
    new_lines = []
    for line in text:
        m = error_pattern.match(line)
        if m:
            indent = m.group('indent')
            message = m.group('message')
            new_lines.append(f"{indent}current_app.logger.exception(e)")
            new_lines.append(f"{indent}return safe_error_response('{message}')")
            changed = True
        else:
            new_lines.append(line)

    if changed:
        import_line = 'from utils.security import safe_error_response'
        if import_line not in text:
            inserted = False
            for i, line in enumerate(new_lines):
                if line.startswith('from flask'):
                    j = i
                    while j + 1 < len(new_lines) and new_lines[j + 1].startswith('from'):
                        j += 1
                    new_lines.insert(j + 1, import_line)
                    inserted = True
                    break
            if not inserted:
                new_lines.insert(0, import_line)
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines) + '\n')
        print('Updated', rel_path)

# Specific auth.py changes: add limiter import and decorators
auth_path = os.path.join(root, 'routes/auth.py')
with open(auth_path, 'r', encoding='utf-8') as f:
    auth_text = f.read().splitlines()

if 'from app import limiter' not in auth_text:
    for i, line in enumerate(auth_text):
        if line.startswith('from flask_jwt_extended'):
            auth_text.insert(i + 1, 'from app import limiter')
            break

for i, line in enumerate(auth_text):
    if line.strip() == "@auth_bp.route('/register', methods=['POST'])":
        if i + 1 < len(auth_text) and auth_text[i + 1].strip() != '@limiter.limit("10 per minute")':
            auth_text.insert(i + 1, '@limiter.limit("10 per minute")')
    if line.strip() == "@auth_bp.route('/login', methods=['POST'])":
        if i + 1 < len(auth_text) and auth_text[i + 1].strip() != '@limiter.limit("10 per minute")':
            auth_text.insert(i + 1, '@limiter.limit("10 per minute")')

with open(auth_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(auth_text) + '\n')
print('Patched auth.py rate limiting')

# Create utils/security.py if missing
utils_dir = os.path.join(root, 'utils')
os.makedirs(utils_dir, exist_ok=True)
sec_path = os.path.join(utils_dir, 'security.py')
if not os.path.exists(sec_path):
    with open(sec_path, 'w', encoding='utf-8') as f:
        f.write('from flask import jsonify, current_app\n\n')
        f.write("def safe_error_response(message='An internal server error occurred'):\n")
        f.write('    current_app.logger.exception(message)\n')
        f.write("    return jsonify({'error': message}), 500\n")
    print('Created utils/security.py')
