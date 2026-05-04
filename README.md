# Ciphra COMMANDER 1.2

Plataforma de estudio avanzada con IA (Mindshift) y asistente técnico (Commander).

## Requisitos
- Python 3.9+
- Una `GEMINI_API_KEY` de Google AI Studio.

## Instalación Local
1. Clonar el repositorio.
2. Crear un entorno virtual: `python -m venv venv`
3. Activar el entorno:
   - Mac/Linux: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Instalar dependencias: `pip install -r requirements.txt`
5. Crear un archivo `.env` con:
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   ```
6. Correr: `python main.py`

## Despliegue en Servidor (Heroku / Render / Railway)
1. Conectar el repositorio de GitHub.
2. Configurar la variable de entorno `GEMINI_API_KEY`.
3. El servidor usará automáticamente el `Procfile` y la variable `PORT`.

## Seguridad
- Todos los datos de usuario (`users.json`), sesiones (`sessions.json`) e historial (`chats.json`) están encriptados en disco usando AES-128 (Fernet). La llave se deriva de la API KEY.
