from fastapi import APIRouter, Request, HTTPException
import os
import uuid
import base64, hashlib, json
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
fernet_key = base64.urlsafe_b64encode(hashlib.sha256(api_key.encode()).digest()) if api_key else Fernet.generate_key()
fernet = Fernet(fernet_key)

router = APIRouter()

USERS_FILE = "users.json"
SESSIONS_FILE = "sessions.json"

def encrypt_data(data: dict) -> bytes:
    return fernet.encrypt(json.dumps(data).encode())

def decrypt_data(data: bytes) -> dict:
    try:
        return json.loads(fernet.decrypt(data).decode())
    except Exception:
        # Migración: datos en texto plano, los devolvemos tal cual
        return json.loads(data.decode())

def load_json(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            return decrypt_data(f.read())
    return {}

def save_json(path, data):
    with open(path, "wb") as f:
        f.write(encrypt_data(data))

@router.get("/check")
async def check_auth(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        return {"authenticated": False}
    sessions = load_json(SESSIONS_FILE)
    if token in sessions:
        return {"authenticated": True, "user": sessions[token]}
    return {"authenticated": False}

@router.post("/google-login")
async def google_login(request: Request):
    data = await request.json()
    email = data.get("email")
    name = data.get("name")

    if not email:
        raise HTTPException(400, "Email requerido")

    users = load_json(USERS_FILE)
    sessions = load_json(SESSIONS_FILE)

    if email not in users:
        users[email] = {"email": email, "name": name or "Usuario Google"}

    token = "ciphra_tk_google_" + str(uuid.uuid4()).replace("-", "")[:16]
    sessions[token] = users[email]

    save_json(USERS_FILE, users)
    save_json(SESSIONS_FILE, sessions)

    return {"success": True, "token": token, "user": users[email]}
