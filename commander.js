let currentChatId = null;

// Helper: obtiene el token del storage
function getToken() {
    return localStorage.getItem('ciphra_token') || sessionStorage.getItem('ciphra_token') || '';
}

function authHeaders() {
    const token = getToken();
    return token ? { 'Authorization': token } : {};
}

// Cargar chats al iniciar
async function loadChats() {
    const res = await fetch('/api/chats', { headers: authHeaders() });
    const chats = await res.json();
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    chats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(chat => {
        const item = document.createElement('div');
        item.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.onclick = () => openChat(chat.id);
        item.innerHTML = `
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="message-square" style="width: 14px;"></i>
                ${chat.title}
            </span>
            <i data-lucide="trash-2" class="delete-chat" onclick="event.stopPropagation(); deleteChat('${chat.id}')" style="width: 14px;"></i>
        `;
        chatList.appendChild(item);
    });
    lucide.createIcons();

    if (!currentChatId && chats.length > 0) {
        openChat(chats[0].id);
    } else if (chats.length === 0) {
        createChat();
    }
}

async function createChat() {
    const res = await fetch('/api/chats/create', { method: 'POST', headers: authHeaders() });
    const data = await res.json();
    currentChatId = data.chat_id;
    await loadChats();
    openChat(data.chat_id);
}

async function openChat(id) {
    currentChatId = id;
    const res = await fetch(`/api/chats/${id}`, { headers: authHeaders() });
    const chat = await res.json();
    
    document.getElementById('activeChatTitle').innerText = chat.title;
    const container = document.getElementById('chatContainer');
    container.innerHTML = '';
    
    if (chat.messages.length === 0) {
        document.querySelector('.main-chat').classList.add('is-empty');
        container.innerHTML = `
            <div class="empty-state-logo">
                <i data-lucide="cpu" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--accent-yellow);"></i>
                <h2 style="font-family: 'League Spartan'; letter-spacing: 2px;">COMMANDER 1.2</h2>
                <p style="opacity: 0.7; font-size: 0.9rem;">Inicia una nueva secuencia de consulta técnica.</p>
            </div>
        `;
        lucide.createIcons();
    } else {
        document.querySelector('.main-chat').classList.remove('is-empty');
        chat.messages.forEach(msg => {
            appendMessage(msg.role, msg.content);
        });
    }
    
    loadChats();
}

const thinkingPhrases = [
    "Chequeando parámetros...", "Analizando el problema...", "Compilando respuesta...",
    "Validando lógica...", "Ajustando detalles...", "Revisando el sistema...",
    "Calculando...", "Debug en curso...", "Optimizando solución...",
    "Verificando resultados...", "Procesando datos...", "Armando la solución paso a paso...",
    "Probando alternativas...", "Ordenando la respuesta...", "Corriendo diagnóstico rápido..."
];

let thinkingInterval = null;

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message || !currentChatId) return;
    
    const container = document.getElementById('chatContainer');
    const mainChat = document.querySelector('.main-chat');
    if (mainChat && mainChat.classList.contains('is-empty')) {
        mainChat.classList.remove('is-empty');
        container.innerHTML = '';
    } else if (container.querySelector('.empty-state-logo') || container.querySelector('h2')) {
        container.innerHTML = '';
    }

    input.value = '';
    appendMessage('user', message);
    
    const thinkingId = 'thinking-' + Date.now();
    appendMessage('assistant', thinkingPhrases[0], thinkingId);
    const thinkingElem = document.getElementById(thinkingId);
    thinkingElem.classList.add('thinking');
    
    thinkingInterval = setInterval(() => {
        const randomPhrase = thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];
        thinkingElem.innerText = randomPhrase;
    }, 3000);

    try {
        const res = await fetch(`/api/chats/${currentChatId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        
        clearInterval(thinkingInterval);
        const wrapper = thinkingElem.closest('.message-wrapper');
        if (wrapper) wrapper.remove();
        
        appendMessage('assistant', data.reply);
        
        if (data.title) {
            document.getElementById('activeChatTitle').innerText = data.title;
            loadChats();
        }
    } catch (err) {
        clearInterval(thinkingInterval);
        appendMessage('assistant', '⚠️ Error Crítico en el enlace neural.');
    }
}

async function deleteChat(id) {
    if (!confirm('¿Seguro que deseas eliminar este chat?')) return;
    await fetch(`/api/chats/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (currentChatId === id) {
        currentChatId = null;
        document.getElementById('chatContainer').innerHTML = '';
        document.getElementById('activeChatTitle').innerText = 'Selecciona un chat';
    }
    loadChats();
}

function appendMessage(role, content, id = null) {
    const container = document.getElementById('chatContainer');
    const msgWrapper = document.createElement('div');
    msgWrapper.className = `message-wrapper ${role}-wrapper`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'user' ? '<i data-lucide="user"></i>' : '<i data-lucide="cpu"></i>';
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'assistant-msg'}`;
    if (id) msgDiv.id = id;
    
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(msgDiv);
    container.appendChild(msgWrapper);
    lucide.createIcons();

    if (role === 'assistant' && !id) {
        msgDiv.innerHTML = marked.parse(content);
        if (window.MathJax) MathJax.typesetPromise([msgDiv]);
    } else {
        msgDiv.innerText = content;
    }
    
    container.scrollTop = container.scrollHeight;
}

function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

window.onload = loadChats;
