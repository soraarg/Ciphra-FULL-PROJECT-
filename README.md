Welcome to Ciphra! Thank you for using this app. As a group of teen programmers with aspirations to more, it’s a great milestone to start our future career.
You’re probably wondering what Ciphra is for.
Ciphra is our vision for the future of education, adapted to today’s standards and trends: the use of technology for learning, AI for understanding concepts, interactive studying, and more.
That vision is powered by our AI: Ciphra COMMANDER, the AI that represents our future of education.
COMMANDER is specially programmed to be one of the best AIs for learning. It is designed to help you with any problem, doubt, or confusion at the moment you are studying.
Obviously, not everyone learns the same way or at the same speed, so COMMANDER is programmed to adapt to you depending on how you want to be treated while learning (this is selected during registration).
Enough talk. Let’s explain how the Ciphra Ecosystem works.

How Ciphra Works (Ecosystem Overview)
Ciphra is not just one single page or one AI chat. It’s an ecosystem of tools that work together to improve learning, studying, and practicing.
At the center of everything is the Ciphra Server (the backend). This is the core engine that runs the system: it handles the AI responses, chat history, user sessions, and all the internal logic that makes the platform work.
Inside this ecosystem, we have different modules, each one focused on a specific part of studying.
🧠 Ciphra COMMANDER
COMMANDER is our main AI assistant. It is designed to help students understand topics clearly, step by step, and in a way that adapts to their learning style.
It can explain concepts, solve problems, and guide the user through difficult topics without turning everything into robotic textbook answers.
⚛️ Quantum Module
Quantum is the problem-solving and reasoning module. Its purpose is to solve academic and technical problems using a strict and logical structure.
It focuses on clarity, formulas, and verification, so it can be used for real studying and not just “getting an answer”.
📝 Mindshift Module
Mindshift is Ciphra’s test and practice module.
It is made for generating quizzes and study tests from any topic the user provides (text, notes, or uploaded files). It helps students train like they are preparing for an exam, adjusting difficulty, question types, and the amount of questions.
Requirements
To run Ciphra locally, you need:
	•	Python 3.10+ (recommended)
	•	A working virtual environment (venv)
	•	Internet connection (for AI API requests)
Optional but recommended:
	•	A modern browser (Chrome / Edge / Firefox)

Project Structure (Basic)
The Ciphra ecosystem is structured around the backend server and its modules.
Example structure:

ciphra/
│
├── main.py                # Backend entry point (server launcher)
├── venv/                  # Python virtual environment
│
├── static/                # Frontend assets (HTML/CSS/JS)
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

(Exact structure may change depending on the development version.)
Starting the Ciphra Server (Local Setup)
Right now, Ciphra runs locally (localhost). The system is launched by running the backend server, which powers all modules (Commander, Quantum, Mindshift, etc).
When the server starts correctly, you should see the official startup banner in the terminal:
----------------------------------------------------------
- G O O D   E N G I N E   S T A R T -
----------------------------------------------------------

macOS / Linux
Example (your folder path may be different):
cd /path/to/ciphra
./venv/bin/python3 main.py

Windows (CMD)
Example:

cd C:\path\to\ciphra
venv\Scripts\python.exe main.py

Once running, the server should launch successfully and stay listening for requests. From there, you can open the Ciphra interface in your browser and start using the modules.

Future Plans
Ciphra is currently optimized for local development, but this is not the final goal.
Soon we will make the setup process much easier (less manual commands) and deploy Ciphra online, so it can be accessed directly from the internet.
This is only the beginning.
Credits
Benjamin Soracco - CEO and Lead Programmer
Ciro Castillo - CFO and Client Reception
Juan Cerutti - QA
Antigravity
