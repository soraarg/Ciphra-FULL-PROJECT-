import re

with open("main.py", "r") as f:
    content = f.read()

# Add imports if not present
if "from cryptography.fernet import Fernet" not in content:
    content = content.replace("import hashlib", "import hashlib\nimport base64\nfrom cryptography.fernet import Fernet")

# Add Fernet initialization
if "fernet_key =" not in content:
    fernet_init = """
# --- ENCRYPTION SETUP ---
fernet_key = base64.urlsafe_b64encode(hashlib.sha256(api_key.encode()).digest()) if api_key else Fernet.generate_key()
fernet = Fernet(fernet_key)

def encrypt_data(data: dict) -> bytes:
    return fernet.encrypt(json.dumps(data).encode())

def decrypt_data(data: bytes) -> dict:
    try:
        return json.loads(fernet.decrypt(data).decode())
    except Exception:
        # Migración: si falla desencriptar, asumir que es JSON plano
        return json.loads(data.decode())
"""
    content = content.replace("CHATS_FILE = \"chats.json\"", fernet_init + "\nCHATS_FILE = \"chats.json\"")

# Replace load_chats and save_chats
chat_funcs = """def load_chats():
    if os.path.exists(CHATS_FILE):
        with open(CHATS_FILE, "rb") as f: return decrypt_data(f.read())
    return {}

def save_chats(chats):
    with open(CHATS_FILE, "wb") as f: f.write(encrypt_data(chats))"""

content = re.sub(r'def load_chats\(\):[\s\S]*?json\.dump\(chats, f, indent=4\)', chat_funcs, content)

# Replace load_users and save_users
user_funcs = """def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "rb") as f: return decrypt_data(f.read())
    return {}

def save_users(users):
    with open(USERS_FILE, "wb") as f: f.write(encrypt_data(users))"""

content = re.sub(r'def load_users\(\):[\s\S]*?json\.dump\(users, f, indent=4\)', user_funcs, content)

with open("main.py", "w") as f:
    f.write(content)
print("Patch applied.")
