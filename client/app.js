// Variables globales
let socket = null;
let clientId = null;
let messagesSent = 0;
let messagesReceived = 0;
let isConnected = false;

// Elementos DOM
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesList = document.getElementById('messages-list');
const messagesContainer = document.getElementById('messages-container');
const serverUrlInput = document.getElementById('server-url');
const messagesSentSpan = document.getElementById('messages-sent');
const messagesReceivedSpan = document.getElementById('messages-received');
const activeClientsSpan = document.getElementById('active-clients');
const clientIdSpan = document.getElementById('client-id');

// Función para conectar al servidor
function connectToServer() {
    const serverUrl = serverUrlInput.value.trim();
    
    if (!serverUrl) {
        addSystemMessage('Por favor ingresa una URL válida', 'error');
        return;
    }

    try {
        // Configuración CORRECTA para Socket.io en OpenShift
        socket = io(serverUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            secure: true,
            rejectUnauthorized: false
        });

        setupSocketListeners();
        
        updateConnectionStatus('connecting');
        connectBtn.disabled = true;
        
    } catch (error) {
        addSystemMessage(`Error al conectar: ${error.message}`, 'error');
        connectBtn.disabled = false;
    }
}

// Configurar listeners de Socket.io
function setupSocketListeners() {
    socket.on('connect', () => {
        clientId = socket.id;
        isConnected = true;
        
        updateConnectionStatus('connected');
        updateUIState(true);
        
        clientIdSpan.textContent = clientId ? clientId.substring(0, 8) + '...' : '-';
        
        addSystemMessage('✅ Conectado al servidor', 'success');
        console.log('Conectado al servidor, ID:', clientId);
    });

    socket.on('message', (data) => {
        messagesReceived++;
        messagesReceivedSpan.textContent = messagesReceived;
        addMessage(data);
    });

    socket.on('stats', (stats) => {
        activeClientsSpan.textContent = stats.activeConnections || 0;
    });

    socket.on('disconnect', (reason) => {
        isConnected = false;
        updateConnectionStatus('disconnected');
        updateUIState(false);
        addSystemMessage(`Desconectado: ${reason}`, 'system');
        console.log('Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
        addSystemMessage(`Error de conexión: ${error.message}`, 'error');
        updateConnectionStatus('error');
        connectBtn.disabled = false;
        console.error('Connect error:', error);
    });

    socket.on('error', (error) => {
        addSystemMessage(`Error: ${error.message || error}`, 'error');
    });
}

// Desconectar del servidor
function disconnectFromServer() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    isConnected = false;
    updateConnectionStatus('disconnected');
    updateUIState(false);
    clientIdSpan.textContent = '-';
}

// Enviar mensaje
function sendMessage() {
    if (!socket || !isConnected) {
        addSystemMessage('No estás conectado al servidor', 'error');
        return;
    }

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    socket.emit('message', { content: messageText });
    
    messagesSent++;
    messagesSentSpan.textContent = messagesSent;
    addLocalMessage(messageText);
    
    messageInput.value = '';
    messageInput.focus();
}

// Manejar tecla Enter
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Actualizar estado de conexión UI
function updateConnectionStatus(status) {
    const statusMap = {
        'connected': { text: 'Conectado', color: 'bg-green-500' },
        'connecting': { text: 'Conectando...', color: 'bg-yellow-500' },
        'disconnected': { text: 'Desconectado', color: 'bg-red-500' },
        'error': { text: 'Error', color: 'bg-red-600' }
    };

    const state = statusMap[status] || statusMap['disconnected'];
    statusText.textContent = state.text;
    statusDot.className = `w-3 h-3 ${state.color} rounded-full`;
}

// Actualizar UI según estado de conexión
function updateUIState(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    messageInput.disabled = !connected;
    sendBtn.disabled = !connected;
    if (connected) messageInput.focus();
}

// Añadir mensaje del sistema
function addSystemMessage(text, type = 'system') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-enter';
    const colors = {
        'system': 'bg-gray-100 text-gray-700',
        'error': 'bg-red-100 text-red-700',
        'success': 'bg-green-100 text-green-700'
    };
    messageDiv.innerHTML = `<div class="text-center py-2"><span class="inline-block px-4 py-1 ${colors[type] || colors.system} rounded-full text-sm">${text}</span></div>`;
    messagesList.appendChild(messageDiv);
    scrollToBottom();
}

// Añadir mensaje recibido
function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-enter';
    const isOwnMessage = data.clientId === clientId;
    const messageClass = isOwnMessage ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-100 text-gray-800';
    const time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    const content = data.content || data.mensaje || JSON.stringify(data);
    
    messageDiv.innerHTML = `<div class="flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}"><div class="max-w-md ${messageClass} rounded-lg px-4 py-2"><div class="text-sm">${escapeHtml(content)}</div><div class="text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1 text-right">${time}</div></div></div>`;
    messagesList.appendChild(messageDiv);
    scrollToBottom();
}

// Añadir mensaje local
function addLocalMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-enter';
    const time = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `<div class="flex flex-col items-end"><div class="max-w-md bg-blue-500 text-white rounded-lg px-4 py-2"><div class="text-sm">${escapeHtml(text)}</div><div class="text-xs text-blue-100 mt-1 text-right">${time}</div></div></div>`;
    messagesList.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cliente WebSocket cargado - OpenShift Demo');
});