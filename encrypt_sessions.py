import json, os
from main import encrypt_data

if os.path.exists("sessions.json"):
    with open("sessions.json", "rb") as f:
        try:
            data = json.loads(f.read().decode())
            with open("sessions.json", "wb") as fw:
                fw.write(encrypt_data(data))
            print("sessions.json encrypted.")
        except Exception as e:
            print("Already encrypted or error:", e)
