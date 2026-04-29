from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
import base64
import hashlib
from cryptography.fernet import Fernet

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# --- INICIALIZACIÓN ROBUSTA DEL MOTOR ---
model = None
model_candidates = [
    'models/gemini-3.1-flash-lite-preview',
    'models/gemini-2.0-flash', 
    'models/gemini-flash-latest'
]

if api_key:
    try:
        genai.configure(api_key=api_key, transport='rest')
        for m_name in model_candidates:
            try:
                print(f"🔍 Sincronizando motor: {m_name}...")
                temp_model = genai.GenerativeModel(m_name)
                temp_model.generate_content("ping", generation_config={"max_output_tokens": 1})
                model = temp_model
                print(f"🚀 ENGINE START: {m_name}")
                break
            except: continue
    except Exception as e:
        print(f"⚠️ Error de inicio: {e}")

app = FastAPI(title="Ciphra COMMANDER 1.2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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

CHATS_FILE = "chats.json"

def load_chats():
    if os.path.exists(CHATS_FILE):
        with open(CHATS_FILE, "rb") as f: return decrypt_data(f.read())
    return {}

def save_chats(chats):
    with open(CHATS_FILE, "wb") as f: f.write(encrypt_data(chats))

def get_user_from_token(request: Request) -> str:
    """Resuelve el email del usuario a partir del token de sesión."""
    token = request.headers.get("Authorization", "")
    if not token:
        return None
    # Tokens viejos (retrocompatibilidad): no hay email asociado
    if token.startswith("token_"):
        import hashlib as _hl
        return token  # usamos el token como identificador único
    # Tokens nuevos: buscar en sessions.json
    if os.path.exists(SESSIONS_FILE if 'SESSIONS_FILE' in dir() else 'sessions.json'):
        path = SESSIONS_FILE if 'SESSIONS_FILE' in dir() else 'sessions.json'
        sessions = load_users_raw(path) if 'load_users_raw' in dir() else {}
        entry = sessions.get(token)
        if entry:
            return entry.get("email") or entry if isinstance(entry, str) else token
    return token

# --- API CHATS ---

@app.get("/api/chats")
async def list_chats(request: Request):
    owner = request.headers.get("Authorization", "anonymous")
    chats = load_chats()
    user_chats = [
        {"id": cid, "title": data["title"], "created_at": data["created_at"]}
        for cid, data in chats.items()
        if data.get("owner") == owner
    ]
    return user_chats

@app.post("/api/chats/create")
async def create_chat(request: Request):
    owner = request.headers.get("Authorization", "anonymous")
    chats = load_chats()
    chat_id = str(uuid.uuid4())
    chats[chat_id] = {
        "title": "Nuevo chat",
        "created_at": datetime.now().isoformat(),
        "messages": [],
        "owner": owner
    }
    save_chats(chats)
    return {"chat_id": chat_id}

@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    chats = load_chats()
    if chat_id not in chats: raise HTTPException(404, "Chat no encontrado")
    return chats[chat_id]

@app.post("/api/chats/{chat_id}/message")
async def post_message(chat_id: str, request: Request):
    if not model: return JSONResponse({"error": "Motor fuera de línea"}, status_code=503)
    data = await request.json()
    user_msg = data.get("message")
    chats = load_chats()
    if chat_id not in chats: raise HTTPException(404, "Chat no encontrado")
    
    chats[chat_id]["messages"].append({"role": "user", "content": user_msg})

    # Construir contexto con el historial
    history_context = ""
    for m in chats[chat_id]["messages"][-10:]: # Últimos 10 mensajes
        role_label = "Operador" if m["role"] == "user" else "COMMANDER"
        history_context += f"{role_label}: {m['content']}\n"
    
    system_prompt = """Eres Ciphra COMMANDER 1.2, una IA de ingeniería avanzada.
    Tu objetivo es ser extremedamente OBJETIVO y VERAZ. NUNCA inventes estados del servidor, métricas falsas ni alucines funciones que no existen. Si no sabes algo, dilo directamente.
    Sin embargo, mantén una personalidad DIVERTIDA, proactiva, brillante y cercana. 
    Usa jerga de ingeniería y de la Fórmula 1 para darle color a tus respuestas (ej: "pit stop", "caja de cambios", "telemetría", "zona roja"), pero asegurando que la respuesta técnica subyacente sea 100% real y útil.
    Ve al grano, sé preciso como un bisturí, pero con el carisma de un director de escudería.
    """
    
    try:
        if chats[chat_id]["title"] == "Nuevo chat":
            chats[chat_id]["title"] = user_msg[:35] + ("..." if len(user_msg) > 35 else "")

        full_prompt = f"{system_prompt}\n\nHistorial de la misión:\n{history_context}\nCOMMANDER:"
        response = model.generate_content(full_prompt)
        reply = response.text
        
        chats[chat_id]["messages"].append({"role": "assistant", "content": reply})
        save_chats(chats)
        return {"reply": reply, "title": chats[chat_id]["title"]}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str):
    chats = load_chats()
    if chat_id in chats:
        del chats[chat_id]
        save_chats(chats)
        return {"status": "deleted"}
    return JSONResponse({"error": "No encontrado"}, status_code=404)

import hashlib
import base64
from cryptography.fernet import Fernet

USERS_FILE = "users.json"
SESSIONS_FILE = "sessions.json"

def load_users_raw(path):
    if os.path.exists(path):
        with open(path, "rb") as f: return decrypt_data(f.read())
    return {}

def load_users():
    return load_users_raw(USERS_FILE)

def save_users(users):
    with open(USERS_FILE, "wb") as f: f.write(encrypt_data(users))

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/auth/login")
async def auth_login(request: Request):
    data = await request.json()
    email = data.get("email", "")
    password = data.get("password", "")
    
    users = load_users()
    if email not in users or users[email]["password"] != hash_password(password):
        return JSONResponse({"success": False, "message": "Credenciales inválidas"}, status_code=401)
        
    token = f"token_{hashlib.md5(email.encode()).hexdigest()}"
    return {"success": True, "token": token, "user": {"email": email}}

@app.post("/api/auth/register")
async def auth_register(request: Request):
    data = await request.json()
    email = data.get("email", "")
    password = data.get("password", "")
    
    if not email or not password:
        return JSONResponse({"success": False, "message": "Faltan datos"}, status_code=400)
        
    users = load_users()
    if email in users:
        return JSONResponse({"success": False, "message": "Usuario ya registrado"}, status_code=400)
        
    users[email] = {
        "password": hash_password(password),
        "created_at": datetime.now().isoformat()
    }
    save_users(users)
    
    token = f"token_{hashlib.md5(email.encode()).hexdigest()}"
    return {"success": True, "token": token, "user": {"email": email}}

@app.post("/api/auth/google-login")
async def auth_google(request: Request):
    data = await request.json()
    email = data.get("email", "admin@ciphra.ai")
    token = f"token_{hashlib.md5(email.encode()).hexdigest()}"
    return {"success": True, "token": token, "user": {"email": email}}

@app.post("/api/user/save-profile")
async def save_profile(request: Request):
    data = await request.json()
    # Aceptamos todo en la demo para no bloquear el onboarding
    return {"success": True, "message": "Perfil guardado correctamente"}

@app.get("/api/auth/check")
async def auth_check(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        return JSONResponse({"authenticated": False}, status_code=401)
    
    # Compatibilidad hacia atrás con tokens del sistema viejo
    if token.startswith("token_"):
        return {"authenticated": True}
    
    # Tokens nuevos: verificar en sessions.json encriptado
    sessions = load_users_raw(SESSIONS_FILE)
    if token in sessions:
        return {"authenticated": True, "user": sessions[token]}
    
    return JSONResponse({"authenticated": False}, status_code=401)

@app.post("/api/quantum/solve")
async def quantum_solve(request: Request):
    if not model: return {"solution": "⚠️ Motor de IA desconectado."}
    data = await request.json()
    problem = data.get("problem")
    
    quantum_system_prompt = """⚛️ CIPHRA QUANTUM — COMMANDER INSTRUCTION LAYER
    You are Ciphra COMMANDER running in QUANTUM MODE.
    Solve academic problems with maximum correctness and clear step-by-step reasoning using LaTeX.
    
    REQUIRED FORMAT:
    📌 Problema
    🧾 Datos
    🧠 Estrategia
    🧮 Resolución paso a paso
    ✅ Resultado final
    """
    try:
        response = model.generate_content(f"{quantum_system_prompt}\n\nProblema: {problem}")
        return {"solution": response.text}
    except Exception as e:
        return {"solution": f"Error analítico: {str(e)}"}

@app.post("/api/mindshift/generate")
async def mindshift_generate(request: Request):
    if not model: return JSONResponse({"error": "Motor offline"}, status_code=503)
    data = await request.json()
    topic = data.get("topic", "Ingeniería general")
    count = data.get("count", 3)
    difficulty = data.get("difficulty", "medium")
    
    prompt = f"""Genera un examen de opción múltiple sobre {topic}. Dificultad: {difficulty}. Cantidad de preguntas: {count}.
    Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin bloques de código ni markdown:
    {{
        "questions": [
            {{
                "id": 1,
                "text": "Pregunta...",
                "options": ["Opcion 1", "Opcion 2", "Opcion 3", "Opcion 4"],
                "correctIndex": 0
            }}
        ]
    }}
    """
    
    dummy_questions = [
        {"id": 1, "text": f"¿Cuál de las siguientes opciones describe mejor el concepto clave de {topic}?", "options": ["Concepto A", "Concepto B", "Concepto C", "Concepto D"], "correctIndex": 0},
        {"id": 2, "text": "¿Qué fórmula o principio fundamental se asocia típicamente con esto?", "options": ["Principio 1", "Fórmula 2", "Teorema 3", "Ley 4"], "correctIndex": 1}
    ]
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        questions = result.get("questions", [])
        if not questions or len(questions) == 0:
            return {"questions": dummy_questions}
        return {"questions": questions}
    except Exception as e:
        print(f"Mindshift Parse Error: {e}")
        return {"questions": dummy_questions}

# Estáticos
app.mount("/", StaticFiles(directory="./", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
