import re

with open("auth_api.py", "r") as f:
    content = f.read()

# Replace load_json and save_json to use main's functions
replacement = """from main import encrypt_data, decrypt_data

def load_json(path):
    import os
    if os.path.exists(path):
        with open(path, "rb") as f:
            return decrypt_data(f.read())
    return {}

def save_json(path, data):
    with open(path, "wb") as f:
        f.write(encrypt_data(data))
"""

content = re.sub(r'def load_json\(path\):[\s\S]*?json\.dump\(data, f, indent=4\)', replacement, content)

with open("auth_api.py", "w") as f:
    f.write(content)

print("auth_api.py patched.")
