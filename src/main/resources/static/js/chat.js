// chat.js - Cliente WebSocket con cifrado E2E (ENDPOINTS CORREGIDOS)

class ChatClient {
    constructor() {
        this.stompClient = null;
        this.currentConversationId = null;
        this.currentUser = null;
        this.currentUserId = null; // ✅ Agregar ID del usuario
        this.conversations = [];
        this.recipientPublicKey = null;
        this.recipientId = null; // ✅ Agregar ID del destinatario
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log("⚠️ Chat ya está inicializado");
            return;
        }

        console.log("🚀 Inicializando cliente de chat...");
        
        // Verificar que chatEncryption esté disponible
        if (typeof chatEncryption === 'undefined') {
            console.error("❌ chatEncryption no está disponible");
            this.showError("Error: Módulo de cifrado no cargado");
            return;
        }

        // Cargar o generar llaves de cifrado
        const hasKeys = await chatEncryption.loadKeysFromStorage();
        if (!hasKeys) {
            console.log("📝 Generando nuevas llaves RSA...");
            await chatEncryption.generateKeyPair();
            await chatEncryption.saveKeysToStorage();
        }

        // ✅ Obtener usuario actual con ID
        await this.loadCurrentUser();
        
        if (!this.currentUser || !this.currentUserId) {
            this.showError("No se pudo identificar el usuario. Por favor inicie sesión.");
            return;
        }

        const userElement = document.getElementById('currentUser');
        if (userElement) {
            userElement.textContent = this.currentUser;
        }

        // Conectar al WebSocket
        this.connect();

        // Event Listeners
        this.setupEventListeners();

        this.isInitialized = true;
        console.log("✅ Chat inicializado correctamente");
    }

    // ✅ Obtener datos completos del usuario autenticado
    async loadCurrentUser() {
        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('No autenticado');
            }

            const userData = await response.json();
            this.currentUser = userData.nombreUsuario;
            this.currentUserId = userData.id;

            console.log(`✅ Usuario cargado: ${this.currentUser} (ID: ${this.currentUserId})`);
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            this.currentUser = localStorage.getItem('username') || 'Usuario';
            this.currentUserId = localStorage.getItem('userId') || null;
        }
    }

    connect() {
        console.log("🔌 Conectando al servidor WebSocket...");
        
        // ✅ Endpoint correcto: /ws
        const socket = new SockJS('/ws');
        this.stompClient = Stomp.over(socket);

        // Configurar para reducir logs
        this.stompClient.debug = null;

        this.stompClient.connect({}, 
            (frame) => this.onConnected(frame),
            (error) => this.onError(error)
        );
    }

    async onConnected(frame) {
        console.log("✅ Conectado al servidor WebSocket");

        // Enviar clave pública al servidor
        await this.registerPublicKey();

        // ✅ Suscribirse usando el ID del usuario
        this.stompClient.subscribe(`/user/${this.currentUserId}/queue/messages`, (message) => {
            this.onMessageReceived(message);
        });

        this.stompClient.subscribe(`/user/${this.currentUserId}/queue/typing`, (message) => {
            this.onTypingReceived(message);
        });

        this.stompClient.subscribe(`/user/${this.currentUserId}/queue/errors`, (message) => {
            this.showError(message.body);
        });

        // Cargar conversaciones
        this.loadConversations();
    }

    onError(error) {
        console.error("❌ Error de conexión WebSocket:", error);
        this.showError("Error de conexión. Intentando reconectar...");
        
        setTimeout(() => {
            console.log("🔄 Intentando reconectar...");
            this.connect();
        }, 5000);
    }

    async registerPublicKey() {
        try {
            const publicKey = await chatEncryption.exportPublicKey();
            
            // ✅ Usar endpoint correcto via WebSocket
            this.stompClient.send("/app/register-key", {}, JSON.stringify({
                clavePublica: publicKey
            }));

            console.log("🔑 Clave pública registrada en el servidor");
        } catch (error) {
            console.error("❌ Error registrando clave pública:", error);
        }
    }

    setupEventListeners() {
        const newChatBtn = document.getElementById('newChatButton');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.createNewConversation();
            });
        }

        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            let typingTimeout;
            messageInput.addEventListener('input', () => {
                clearTimeout(typingTimeout);
                this.sendTypingNotification(true);
                
                typingTimeout = setTimeout(() => {
                    this.sendTypingNotification(false);
                }, 1000);
            });
        }

        const sendBtn = document.getElementById('sendButton');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    loadConversations() {
        // ✅ Endpoint correcto
        fetch('/api/chat/conversations', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                this.conversations = data;
                this.renderConversations();
            })
            .catch(error => {
                console.error("Error cargando conversaciones:", error);
                // Mostrar conversación por defecto con soporte
                this.conversations = [{
                    id: 1,
                    name: "Soporte Técnico",
                    destinatarioId: 1, // ✅ ID del usuario de soporte
                    preview: "Inicia una conversación",
                    unread: 0
                }];
                this.renderConversations();
            });
    }

    renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;
        
        if (this.conversations.length === 0) {
            container.innerHTML = '<div class="loading">No hay conversaciones</div>';
            return;
        }

        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item" data-id="${conv.id}" data-recipient-id="${conv.destinatarioId || ''}">
                <div class="conversation-name">
                    ${conv.name}
                    ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                </div>
                <div class="conversation-preview">${conv.preview}</div>
            </div>
        `).join('');

        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const convId = item.dataset.id;
                const recipientId = item.dataset.recipientId;
                this.selectConversation(convId, recipientId);
            });
        });
    }

    async selectConversation(conversationId, recipientId) {
        this.currentConversationId = conversationId;
        this.recipientId = recipientId;
        
        // Actualizar UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-id="${conversationId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        const conversation = this.conversations.find(c => c.id == conversationId);
        if (conversation) {
            const chatTitle = document.getElementById('chatTitle');
            if (chatTitle) {
                chatTitle.textContent = conversation.name;
            }
            const encStatus = document.getElementById('encryptionStatus');
            if (encStatus) {
                encStatus.style.display = 'flex';
            }
        }

        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        if (messageInput) messageInput.disabled = false;
        if (sendButton) sendButton.disabled = false;

        // Cargar mensajes
        await this.loadMessages(conversationId);

        // Obtener clave pública del destinatario
        if (this.recipientId) {
            await this.fetchRecipientPublicKey(this.recipientId);
        }
    }

    async fetchRecipientPublicKey(recipientId) {
        try {
            // ✅ Endpoint correcto: /api/chat/keys/{usuarioId}
            const response = await fetch(`/api/chat/keys/${recipientId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.clavePublica) {
                this.recipientPublicKey = data.clavePublica;
                console.log("🔑 Clave pública del destinatario obtenida");
            }
        } catch (error) {
            console.error("❌ Error obteniendo clave pública:", error);
        }
    }

    async loadMessages(conversationId) {
        try {
            // ✅ Endpoint correcto: /api/chat/conversations/{conversacionId}/messages
            const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                credentials: 'include'
            });
            const messages = await response.json();
            
            await this.renderMessages(messages);
        } catch (error) {
            console.error("Error cargando mensajes:", error);
            this.renderMessages([]);
        }
    }

    async renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <p>No hay mensajes. ¡Envía el primero!</p>
                </div>
            `;
            return;
        }

        const messagesHtml = await Promise.all(messages.map(async msg => {
            const isSent = msg.remitenteId === this.currentUserId;
            
            let messageText = msg.contenidoCifrado;
            if (msg.cifrado && !isSent) {
                try {
                    messageText = await chatEncryption.decryptMessage(msg.contenidoCifrado);
                } catch (error) {
                    messageText = "[Mensaje cifrado - error al descifrar]";
                }
            } else if (!msg.cifrado) {
                messageText = msg.contenidoCifrado;
            }

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-bubble">
                        ${!isSent ? `<div class="message-sender">${msg.remitenteNombre || 'Usuario'}</div>` : ''}
                        <div class="message-text">${messageText}</div>
                        <div class="message-time">${this.formatTime(msg.fechaEnvio)}</div>
                    </div>
                </div>
            `;
        }));

        container.innerHTML = messagesHtml.join('');
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;

        const message = input.value.trim();

        if (!message || !this.currentConversationId || !this.recipientPublicKey || !this.recipientId) {
            if (!message) console.log("⚠️ Mensaje vacío");
            if (!this.currentConversationId) console.log("⚠️ No hay conversación seleccionada");
            if (!this.recipientPublicKey) console.log("⚠️ No hay clave pública del destinatario");
            if (!this.recipientId) console.log("⚠️ No hay ID del destinatario");
            return;
        }

        try {
            const encryptedMessage = await chatEncryption.encryptMessage(
                message, 
                this.recipientPublicKey
            );

            // ✅ Estructura correcta según SendMessageRequest del backend
            this.stompClient.send("/app/chat.send", {}, JSON.stringify({
                conversacionId: parseInt(this.currentConversationId),
                destinatarioId: parseInt(this.recipientId),
                contenidoCifrado: encryptedMessage,
                cifrado: true
            }));

            // Agregar mensaje a la UI (texto plano para el remitente)
            this.addMessageToUI(this.currentUser, message, true);

            input.value = '';
            
        } catch (error) {
            console.error("❌ Error enviando mensaje:", error);
            this.showError("Error al enviar el mensaje");
        }
    }

    async onMessageReceived(payload) {
        const message = JSON.parse(payload.body);
        
        let messageText = message.contenidoCifrado;
        if (message.cifrado && message.remitenteId !== this.currentUserId) {
            try {
                messageText = await chatEncryption.decryptMessage(message.contenidoCifrado);
            } catch (error) {
                messageText = "[Error al descifrar mensaje]";
            }
        }

        if (message.conversacionId == this.currentConversationId) {
            this.addMessageToUI(message.remitenteNombre || 'Usuario', messageText, false);
        }

        this.updateConversationPreview(message.conversacionId, messageText);
    }

    addMessageToUI(sender, text, isSent) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${!isSent ? `<div class="message-sender">${sender}</div>` : ''}
                <div class="message-text">${text}</div>
                <div class="message-time">${this.formatTime(new Date())}</div>
            </div>
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    sendTypingNotification(isTyping) {
        if (!this.stompClient || !this.recipientId) return;

        this.stompClient.send("/app/typing", {}, JSON.stringify({
            destinatarioId: parseInt(this.recipientId),
            typing: isTyping
        }));
    }

    onTypingReceived(payload) {
        const data = JSON.parse(payload.body);
        const indicator = document.getElementById('typingIndicator');
        if (!indicator) return;

        if (data.typing && data.remitenteId == this.recipientId) {
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    updateConversationPreview(conversationId, preview) {
        const conv = this.conversations.find(c => c.id == conversationId);
        if (conv) {
            conv.preview = preview.substring(0, 30) + '...';
            this.renderConversations();
        }
    }

    async createNewConversation() {
        // Obtener lista de admins para seleccionar destinatario
        try {
            const response = await fetch('/api/users/admins', {
                credentials: 'include'
            });
            const admins = await response.json();

            if (admins.length === 0) {
                alert('No hay usuarios de soporte disponibles');
                return;
            }

            // Mostrar opciones
            const options = admins.map((admin, index) => 
                `${index + 1}. ${admin.nombreCompleto} (${admin.nombreUsuario})`
            ).join('\n');

            const selection = prompt(`Seleccione un usuario de soporte:\n${options}\n\nIngrese el número:`);
            
            if (!selection) return;

            const index = parseInt(selection) - 1;
            if (index < 0 || index >= admins.length) {
                alert('Selección inválida');
                return;
            }

            const selectedAdmin = admins[index];
            alert(selectedAdmin.id)

            // ✅ Crear conversación con endpoint correcto
            const createResponse = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    destinatarioId: selectedAdmin.id
                })
            });
            alert(createResponse.des)

            const data = await createResponse.json();
            this.conversations.push(data);
            this.renderConversations();
            this.selectConversation(data.id, data.destinatarioId);

        } catch (error) {
            console.error("Error creando conversación:", error);
            this.showError("Error al crear la conversación");
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) return;

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    destroy() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect();
        }
        this.isInitialized = false;
        console.log("🛑 Chat destruido");
    }
}

window.ChatClient = ChatClient;
let chatClient = null;

function initializeChatClient() {
    console.log("📞 initializeChatClient() llamado");
    
    if (chatClient) {
        console.log("⚠️ Destruyendo instancia anterior");
        chatClient.destroy();
    }

    chatClient = new ChatClient();
    window.chatClient = chatClient;
    
    chatClient.initialize();
}

window.initializeChatClient = initializeChatClient;