import os

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

for rel in route_files:
    path = os.path.join(root, rel)
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changed = False
    new_lines = []
    for line in lines:
        if 'current_app.logger.exception(e)' in line:
            changed = True
            continue
        new_lines.append(line)

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print('Cleaned', rel)
