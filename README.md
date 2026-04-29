Welcome to **Ciphra**, and thank you for using our project.

We are a group of teen programmers building something bigger than just a school tool: **Ciphra is our first serious step into what we want to do in the future.**

So… what is Ciphra?

Ciphra is our vision for the future of education, adapted to today’s standards: interactive learning, AI-assisted studying, faster understanding of concepts, and a more modern way to prepare for school and exams.

At the center of this ecosystem is our AI:

## 🧠 Ciphra COMMANDER

**Ciphra COMMANDER** is our main assistant and the core of the platform.  
It is designed to help students understand topics clearly, step by step, without explanations feeling like robotic textbook paragraphs.

COMMANDER can explain concepts, solve doubts, and guide the user through difficult topics in a natural way.

Since not everyone learns the same way, COMMANDER is built to adapt to each user depending on their learning style (selected during registration).

---

# How Ciphra Works (Ecosystem Overview)

Ciphra is not just one website or one AI chat.  
It is an ecosystem of tools that work together to improve learning, studying, and practice.

At the center of everything is the **Ciphra Server (backend)**.  
This is the main engine that runs the system: it handles AI responses, chat history, user sessions, and all the internal logic.

Inside the ecosystem, there are different modules, each focused on a specific part of studying.

---

## 🧠 Ciphra COMMANDER
COMMANDER is the main assistance module.  
It focuses on explanations, guidance, and interaction, with a tone that adapts to the user.

---

## ⚛️ Quantum Module
Quantum is the problem-solving and reasoning module.

Its purpose is to solve academic and technical problems using a strict and logical structure.  
It focuses on clarity, formulas, and verification, so it can be used as a real study tool and not just for “getting the answer”.

---

## 📝 Mindshift Module
Mindshift is Ciphra’s practice and exam-training module.

It generates quizzes and study tests from any topic the user provides (text, notes, or uploaded files).  
It is designed to simulate real exam preparation, allowing the user to choose:

- question types  
- difficulty  
- number of questions  

📌 **COMMANDER helps you learn, Quantum helps you solve, and Mindshift helps you practice.**

---

# Requirements

To run Ciphra locally you need:

- Python 3.10+ (recommended)
- A working virtual environment (`venv`)
- Internet connection (for AI API requests)

Optional but recommended:

- A modern browser (Chrome / Edge / Firefox)

---

# Project Structure (Basic)

The Ciphra ecosystem is structured around the backend server and its modules.

Example structure:

```txt
ciphra/
│
├── main.py                # Backend entry point (server launcher)
├── venv/                  # Python virtual environment
│
├── static/                # Frontend files (HTML/CSS/JS)
│   ├── index.html
│   ├── commander.html
│   ├── quantum.html
│   ├── mindshift.html
│   ├── *.css
│   └── *.js
│
├── data/                  # Stored user profiles, chats, etc.
│
└── modules/               # Internal logic (Commander, Quantum, Mindshift)

(The exact structure may vary depending on the development version.)
```

**Starting the Ciphra Server (Local Setup)**

For now, Ciphra runs locally on localhost.

To launch the system, you must start the backend server, which powers all modules (Commander, Quantum, Mindshift, etc.).

When the server starts correctly, you should see this banner in the terminal:

----------------------------------------------------------
- G O O D   E N G I N E   S T A R T -
----------------------------------------------------------

**macOS / Linux**

Example (your folder path may be different):
```bash
cd /path/to/ciphra
./venv/bin/python3 main.py
```

**Windows (CMD)**

Example:

 ```
cd C:\path\to\ciphra
venv\Scripts\python.exe main.py
```

**Windows (PowerShell)**
Example:
```
cd C:\path\to\ciphra
venv\Scripts\python.exe main.py
```
Once running, the server should stay active and listen for requests.
From there, you can open the Ciphra interface in your browser and start using the modules.

**How to Access Ciphra**

After starting the server, open your browser and go to:
```
http://localhost:8000
```
From there you can navigate through the ecosystem:

COMMANDER interface
Quantum module
Mindshift module
Future Plans

Ciphra is currently optimized for local development, but this is not the final goal.

Soon we will simplify the installation process (less manual commands) and deploy Ciphra online, so it can be accessed directly from the internet.

🚀 This is only the beginning.

Credits
Benjamin Soracco — CEO and Lead Programmer
Ciro Castillo — CFO and Client Reception
Juan Cerutti — QA
Antigravity
**Special Thanks**

Special thanks to the **Goethe Schule Computer Science Department** for reviewing Ciphra and supporting the project’s first rollout phase.
