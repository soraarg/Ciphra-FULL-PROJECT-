import urllib.request
import json

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/mindshift/generate",
    data=json.dumps({"topic": "Math", "count": 1, "difficulty": "easy"}).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
