// Escáner de Errores para Sora
window.onerror = function(msg, url, line) {
    console.error(`ERROR: ${msg} en ${url}:${line}`);
    // Solo alertar si es algo crítico que rompe la app
    if(msg.includes('ReferenceError') || msg.includes('TypeError')) {
        alert("Detectado fallo en el sistema: " + msg);
    }
};

// Inicializar Iconos de Lucide
lucide.createIcons();

// Configuración de API
window.API_BASE = window.API_BASE || ''; // Rutas relativas

// Elementos del DOM
const views = {
    setup: document.getElementById('view-setup'),
    exam: document.getElementById('view-exam'),
    results: document.getElementById('view-results')
};

// Botones
const btnGenerate = document.getElementById('btn-generate');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnFinish = document.getElementById('btn-finish');
const btnRestart = document.getElementById('btn-restart');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-upload');

// Controles
const rangeCount = document.getElementById('question-count');
const countDisplay = document.getElementById('count-display');
const examModeToggle = document.getElementById('exam-mode');
const timerDisplay = document.getElementById('exam-timer');
const timerText = document.getElementById('timer-display');

// Estado de la Aplicación
let state = {
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timer: null,
    timeLeft: 0,
    isExamMode: false
};

// Event Listeners Básicos
if (rangeCount) {
    rangeCount.addEventListener('input', (e) => {
        countDisplay.textContent = `${e.target.value} preguntas`;
    });
}

if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
}

// Navegación de vistas
function showView(viewName) {
    Object.values(views).forEach(v => {
        if (v) {
            v.classList.remove('active');
            setTimeout(() => v.classList.add('hidden'), 400);
        }
    });
    
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
        setTimeout(() => views[viewName].classList.add('active'), 10);
    }
}

// Generación de Preguntas con IA Real (Backend Gemini)
async function generateAITest(count, topic, difficulty) {
    const response = await fetch(`${API_BASE}/api/mindshift/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, topic, difficulty })
    });
    
    if (!response.ok) {
        throw new Error('Error de conexión con el backend IA');
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data.questions;
}

// Iniciar Generación
window.runGenerateAI = async function() {
    console.log("runGenerateAI triggered!");
    
    const btnGen = document.getElementById('btn-generate');
    if(btnGen) {
        btnGen.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Creando Test...`;
        btnGen.disabled = true;
    }
    
    try {
        const topicInput = document.getElementById('topic-input');
        const topic = topicInput ? topicInput.value : "Ingeniería general";
        
        const count = rangeCount ? parseInt(rangeCount.value) : 5;
        
        const difficultyElem = document.querySelector('input[name="difficulty"]:checked');
        const difficulty = difficultyElem ? difficultyElem.value : "medium";
        
        state.isExamMode = examModeToggle ? examModeToggle.checked : false;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();

        state.questions = await generateAITest(count, topic, difficulty);
        
        state.currentQuestionIndex = 0;
        state.answers = {};
        
        setupExamEngine();
        showView('exam');
        
    } catch(err) {
        console.error("ERROR:", err);
        // Mostrar error elegante en vez de alert si se puede, sino alert
        alert("Fallo de conexión o parseo: " + err.message);
    } finally {
        if(btnGen) {
            btnGen.innerHTML = `<i data-lucide="zap"></i> Generar Test Mágico`;
            btnGen.disabled = false;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

if (btnGenerate) {
    btnGenerate.addEventListener('click', window.runGenerateAI);
}

// Motor de Examen
function setupExamEngine() {
    if (state.isExamMode) {
        timerDisplay.classList.remove('hidden');
        startTimer(state.questions.length * 60); // 1 min por pregunta
    } else {
        timerDisplay.classList.add('hidden');
    }
    renderQuestion();
}

function renderQuestion() {
    const container = document.getElementById('question-container');
    const q = state.questions[state.currentQuestionIndex];
    
    // Actualizar Progreso
    document.getElementById('question-progress').textContent = `Pregunta ${state.currentQuestionIndex + 1} de ${state.questions.length}`;
    const percent = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${percent}%`;

    // Render HTML de pregunta
    let html = `<h3 class="question-text">${q.text}</h3>`;
    
    if (q.type === 'multiple') {
        html += `<div class="options-grid">
            ${q.options.map((opt, idx) => {
                const isSelected = state.answers[q.id] === idx ? 'selected' : '';
                return `<button class="option-btn ${isSelected}" onclick="selectOption(${q.id}, ${idx})">${opt}</button>`;
            }).join('')}
        </div>`;
    }

    container.innerHTML = html;

    // Actualizar botones
    btnPrev.disabled = state.currentQuestionIndex === 0;
    
    if (state.currentQuestionIndex === state.questions.length - 1) {
        btnNext.classList.add('hidden');
        btnFinish.classList.remove('hidden');
    } else {
        btnNext.classList.remove('hidden');
        btnFinish.classList.add('hidden');
    }
}

window.selectOption = function(questionId, optionIdx) {
    state.answers[questionId] = optionIdx;
    renderQuestion(); // Re-render to show selection
}

if (btnNext) {
    btnNext.addEventListener('click', () => {
        if(state.currentQuestionIndex < state.questions.length - 1) {
            state.currentQuestionIndex++;
            renderQuestion();
        }
    });
}

if (btnPrev) {
    btnPrev.addEventListener('click', () => {
        if(state.currentQuestionIndex > 0) {
            state.currentQuestionIndex--;
            renderQuestion();
        }
    });
}


// Timer Logic
function startTimer(seconds) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    
    const updateTimerUI = () => {
        const mins = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
        const secs = (state.timeLeft % 60).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            finishExam();
        }
        state.timeLeft--;
    };
    
    updateTimerUI();
    state.timer = setInterval(updateTimerUI, 1000);
}

// Finalizar y calcular
if (btnFinish) {
    btnFinish.addEventListener('click', finishExam);
}

function finishExam() {
    clearInterval(state.timer);
    
    // Calcular puntaje
    let correctCount = 0;
    const reviewHTML = [];
    
    state.questions.forEach((q, idx) => {
        const userAns = state.answers[q.id];
        const isCorrect = userAns === q.correctIndex;
        
        if (isCorrect) correctCount++;
        
        reviewHTML.push(`
            <div class="answer-item ${isCorrect ? 'correct' : 'incorrect'}">
                <p><strong>P${idx+1}:</strong> ${q.text}</p>
                <div class="user-ans">Tu respuesta: ${userAns !== undefined ? q.options[userAns] : 'No respondida'}</div>
                ${!isCorrect ? `<div class="correct-ans">Correcta: ${q.options[q.correctIndex]}</div>` : ''}
            </div>
        `);
    });

    const scorePercent = Math.round((correctCount / state.questions.length) * 100);
    
    // Actualizar UI Resultados
    const circle = document.getElementById('score-circle-path');
    const scoreText = document.getElementById('score-text');
    const msg = document.getElementById('score-message');
    
    if (circle && scoreText && msg) {
        circle.setAttribute('stroke-dasharray', `${scorePercent}, 100`);
        scoreText.textContent = `${scorePercent}%`;
        
        circle.classList.remove('score-high', 'score-med', 'score-low');
        if (scorePercent >= 80) {
            circle.classList.add('score-high');
            msg.textContent = "¡Excelente trabajo! Has dominado este tema.";
        } else if (scorePercent >= 60) {
            circle.classList.add('score-med');
            msg.textContent = "Buen intento, pero hay cosas que repasar.";
        } else {
            circle.classList.add('score-low');
            msg.textContent = "Necesitas estudiar más este tema. ¡No te rindas!";
        }
    }

    const reviewList = document.getElementById('answers-review-list');
    if (reviewList) reviewList.innerHTML = reviewHTML.join('');
    
    // Recomendaciones Mock
    const recs = [
        `<li><i data-lucide="book-open"></i> Repasar concepto central de la Pregunta 1</li>`,
        `<li><i data-lucide="alert-circle"></i> Hay confusiones en la terminología (Pregunta 3)</li>`
    ];
    const recList = document.getElementById('recommendations-list');
    if (recList) recList.innerHTML = recs.join('');
    lucide.createIcons();

    showView('results');
}

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        const topicInput = document.getElementById('topic-input');
        if(topicInput) topicInput.value = '';
        showView('setup');
    });
}

// COMMANDER Logic - Managed by index.html for Landing Page
// (Removed redundant code to avoid conflicts)
