// // chat-client.js - Cliente WebSocket y UI

// class ChatClient {
//     constructor() {
//         this.stompClient = null;
//         this.currentUser = null;
//         this.currentConversation = null;
//         this.conversations = [];
//         this.adminUsers = [];
//         this.recipientPublicKey = null;
//     }

//     async initialize() {
//         try {
//             // Cargar o generar llaves
//             const hasKeys = await chatEncryption.loadKeysFromStorage();
            
//             if (!hasKeys) {
//                 console.log("🔑 Generando nuevas llaves RSA...");
//                 await chatEncryption.generateKeyPair();
//                 await chatEncryption.saveKeysToStorage();
                
//                 // Registrar clave pública en el servidor
//                 await this.registerPublicKey();
//             }

//             // Obtener info del usuario actual
//             await this.loadCurrentUser();

//             // Cargar conversaciones
//             await this.loadConversations();

//             // Conectar WebSocket
//             this.connectWebSocket();

//             // Event listeners
//             this.setupEventListeners();

//         } catch (error) {
//             console.error("❌ Error inicializando chat:", error);
//             this.showError("Error al inicializar el chat");
//         }
//     }

//     async registerPublicKey() {
//         try {
//             const publicKey = await chatEncryption.exportPublicKey();

//             const response = await fetch('/api/chat/keys/register', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ clavePublica: publicKey })
//             });

//             if (response.ok) {
//                 console.log("✅ Clave pública registrada en el servidor");
//             }
//         } catch (error) {
//             console.error("❌ Error registrando clave pública:", error);
//         }
//     }

//     async loadCurrentUser() {
//         try {
//             const response = await fetch('/api/users/me');
//             if (response.ok) {
//                 this.currentUser = await response.json();
//                 document.getElementById('currentUser').textContent = this.currentUser.nombreCompleto;
//             }
//         } catch (error) {
//             console.error("❌ Error cargando usuario:", error);
//         }
//     }

//     async loadConversations() {
//         try {
//             const response = await fetch('/api/chat/conversations');
//             if (response.ok) {
//                 this.conversations = await response.json();
//                 this.renderConversations();
//             }
//         } catch (error) {
//             console.error("❌ Error cargando conversaciones:", error);
//         }
//     }

//     renderConversations() {
//         const container = document.getElementById('conversationsList');
        
//         if (this.conversations.length === 0) {
//             container.innerHTML = '<div class="loading">No hay conversaciones</div>';
//             return;
//         }

//         container.innerHTML = this.conversations.map(conv => {
//             const otherUser = conv.usuarioId === this.currentUser.id ? 
//                 conv.adminNombre : conv.usuarioNombre;
            
//             const unreadBadge = conv.mensajesNoLeidos > 0 ? 
//                 `<span class="unread-badge">${conv.mensajesNoLeidos}</span>` : '';

//             return `
//                 <div class="conversation-item" data-id="${conv.id}">
//                     <div class="conversation-name">
//                         ${otherUser} ${unreadBadge}
//                     </div>
//                     <div class="conversation-preview">
//                         ${this.formatDate(conv.fechaUltimoMensaje)}
//                     </div>
//                 </div>
//             `;
//         }).join('');

//         // Event listeners para conversaciones
//         document.querySelectorAll('.conversation-item').forEach(item => {
//             item.addEventListener('click', () => {
//                 const convId = parseInt(item.dataset.id);
//                 this.selectConversation(convId);
//             });
//         });
//     }

//     async selectConversation(conversationId) {
//         try {
//             this.currentConversation = this.conversations.find(c => c.id === conversationId);
            
//             if (!this.currentConversation) return;

//             // Actualizar UI
//             document.querySelectorAll('.conversation-item').forEach(item => {
//                 item.classList.remove('active');
//                 if (parseInt(item.dataset.id) === conversationId) {
//                     item.classList.add('active');
//                 }
//             });

//             const otherUserId = this.currentConversation.usuarioId === this.currentUser.id ?
//                 this.currentConversation.adminId : this.currentConversation.usuarioId;

//             const otherUserName = this.currentConversation.usuarioId === this.currentUser.id ?
//                 this.currentConversation.adminNombre : this.currentConversation.usuarioNombre;

//             document.getElementById('chatTitle').textContent = otherUserName;
//             document.getElementById('encryptionStatus').style.display = 'block';

//             // Cargar clave pública del destinatario
//             await this.loadRecipientPublicKey(otherUserId);

//             // Cargar mensajes
//             await this.loadMessages(conversationId);

//             // Marcar como leídos
//             await this.markAsRead(conversationId);

//             // Habilitar input
//             document.getElementById('messageInput').disabled = false;
//             document.getElementById('sendButton').disabled = false;

//         } catch (error) {
//             console.error("❌ Error seleccionando conversación:", error);
//             this.showError("Error al cargar la conversación");
//         }
//     }

//     async loadRecipientPublicKey(userId) {
//         try {
//             const response = await fetch(`/api/chat/keys/${userId}`);
//             if (response.ok) {
//                 const data = await response.json();
//                 this.recipientPublicKey = data.clavePublica;
//                 console.log("🔑 Clave pública del destinatario cargada");
//             }
//         } catch (error) {
//             console.error("❌ Error cargando clave pública:", error);
//             throw error;
//         }
//     }

//     async loadMessages(conversationId) {
//         try {
//             const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
//             if (response.ok) {
//                 const messages = await response.json();
//                 await this.renderMessages(messages);
//                 this.scrollToBottom();
//             }
//         } catch (error) {
//             console.error("❌ Error cargando mensajes:", error);
//         }
//     }

//     async renderMessages(messages) {
//         const container = document.getElementById('messagesContainer');
        
//         if (messages.length === 0) {
//             container.innerHTML = `
//                 <div class="empty-state">
//                     <div class="empty-state-icon">💬</div>
//                     <p>No hay mensajes. ¡Envía el primero!</p>
//                 </div>
//             `;
//             return;
//         }

//         const messagesHTML = await Promise.all(messages.map(async msg => {
//             const isSent = msg.remitenteId === this.currentUser.id;
            
//             // Descifrar el mensaje
//             let decryptedText;
//             try {
//                 decryptedText = await chatEncryption.decryptMessage(msg.contenidoCifrado);
//             } catch (error) {
//                 decryptedText = "[Mensaje cifrado - no se pudo descifrar]";
//             }

//             return `
//                 <div class="message ${isSent ? 'sent' : 'received'}">
//                     <div class="message-bubble">
//                         <div class="message-sender">${msg.remitenteNombre}</div>
//                         <div class="message-text">${this.escapeHtml(decryptedText)}</div>
//                         <div class="message-time">${this.formatTime(msg.fechaEnvio)}</div>
//                     </div>
//                 </div>
//             `;
//         }));

//         container.innerHTML = messagesHTML.join('');
//     }

//     async sendMessage() {
//         const input = document.getElementById('messageInput');
//         const message = input.value.trim();

//         if (!message || !this.currentConversation || !this.recipientPublicKey) {
//             return;
//         }

//         try {
//             // Cifrar el mensaje con la clave pública del destinatario
//             const encryptedMessage = await chatEncryption.encryptMessage(
//                 message, 
//                 this.recipientPublicKey
//             );

//             const otherUserId = this.currentConversation.usuarioId === this.currentUser.id ?
//                 this.currentConversation.adminId : this.currentConversation.usuarioId;

//             // Enviar a través de WebSocket
//             this.stompClient.send("/app/chat.send", {}, JSON.stringify({
//                 destinatarioId: otherUserId,
//                 contenidoCifrado: encryptedMessage
//             }));

//             input.value = '';
//             input.focus();

//         } catch (error) {
//             console.error("❌ Error enviando mensaje:", error);
//             this.showError("Error al enviar el mensaje");
//         }
//     }

//     async markAsRead(conversationId) {
//         try {
//             await fetch(`/api/chat/conversations/${conversationId}/read`, {
//                 method: 'POST'
//             });
//         } catch (error) {
//             console.error("❌ Error marcando como leído:", error);
//         }
//     }

//     connectWebSocket() {
//         const socket = new SockJS('/ws-chat');
//         this.stompClient = Stomp.over(socket);

//         this.stompClient.connect({}, () => {
//             console.log("✅ WebSocket conectado");

//             // Suscribirse a mensajes privados
//             this.stompClient.subscribe(`/user/${this.currentUser.id}/queue/messages`, 
//                 async (message) => {
//                     const msg = JSON.parse(message.body);
//                     await this.handleNewMessage(msg);
//                 }
//             );

//             // Suscribirse a notificaciones de escritura
//             this.stompClient.subscribe(`/user/${this.currentUser.id}/queue/typing`, 
//                 (message) => {
//                     const notification = JSON.parse(message.body);
//                     this.handleTypingNotification(notification);
//                 }
//             );

//             // Suscribirse a errores
//             this.stompClient.subscribe(`/user/${this.currentUser.id}/queue/errors`, 
//                 (message) => {
//                     this.showError(message.body);
//                 }
//             );

//         }, (error) => {
//             console.error("❌ Error WebSocket:", error);
//             setTimeout(() => this.connectWebSocket(), 5000);
//         });
//     }

//     async handleNewMessage(message) {
//         // Si es la conversación actual, agregar el mensaje
//         if (this.currentConversation && 
//             message.conversacionId === this.currentConversation.id) {
            
//             const isSent = message.remitenteId === this.currentUser.id;
            
//             let decryptedText;
//             try {
//                 decryptedText = await chatEncryption.decryptMessage(message.contenidoCifrado);
//             } catch (error) {
//                 decryptedText = "[Mensaje cifrado]";
//             }

//             const messageHTML = `
//                 <div class="message ${isSent ? 'sent' : 'received'}">
//                     <div class="message-bubble">
//                         <div class="message-sender">${message.remitenteNombre}</div>
//                         <div class="message-text">${this.escapeHtml(decryptedText)}</div>
//                         <div class="message-time">${this.formatTime(message.fechaEnvio)}</div>
//                     </div>
//                 </div>
//             `;

//             const container = document.getElementById('messagesContainer');
//             const emptyState = container.querySelector('.empty-state');
//             if (emptyState) {
//                 container.innerHTML = '';
//             }
//             container.insertAdjacentHTML('beforeend', messageHTML);
//             this.scrollToBottom();

//             // Marcar como leído si no es nuestro mensaje
//             if (!isSent) {
//                 await this.markAsRead(this.currentConversation.id);
//             }
//         }

//         // Actualizar lista de conversaciones
//         await this.loadConversations();
//     }

//     handleTypingNotification(notification) {
//         if (notification.typing) {
//             document.getElementById('typingIndicator').style.display = 'block';
//             setTimeout(() => {
//                 document.getElementById('typingIndicator').style.display = 'none';
//             }, 3000);
//         }
//     }

//     setupEventListeners() {
//         const sendButton = document.getElementById('sendButton');
//         const messageInput = document.getElementById('messageInput');
//         const newChatButton = document.getElementById('newChatButton');

//         sendButton.addEventListener('click', () => this.sendMessage());

//         messageInput.addEventListener('keypress', (e) => {
//             if (e.key === 'Enter') {
//                 this.sendMessage();
//             }
//         });

//         // Notificar que estamos escribiendo
//         let typingTimeout;
//         messageInput.addEventListener('input', () => {
//             if (this.currentConversation && this.stompClient) {
//                 clearTimeout(typingTimeout);

//                 const otherUserId = this.currentConversation.usuarioId === this.currentUser.id ?
//                     this.currentConversation.adminId : this.currentConversation.usuarioId;

//                 this.stompClient.send("/app/chat.typing", {}, JSON.stringify({
//                     destinatarioId: otherUserId,
//                     typing: true
//                 }));

//                 typingTimeout = setTimeout(() => {
//                     this.stompClient.send("/app/chat.typing", {}, JSON.stringify({
//                         destinatarioId: otherUserId,
//                         typing: false
//                     }));
//                 }, 2000);
//             }
//         });

//         newChatButton.addEventListener('click', () => this.startNewChat());
//     }

//     async startNewChat() {
//         // Para iniciar un nuevo chat con admin, necesitamos obtener los admins disponibles
//         try {
//             const response = await fetch('/api/users/admins'); // Debes crear este endpoint
//             if (response.ok) {
//                 const admins = await response.json();
//                 // Aquí puedes mostrar un modal o selector para elegir el admin
//                 // Por simplicidad, seleccionamos el primero
//                 if (admins.length > 0) {
//                     await this.createNewConversation(admins[0].id);
//                 }
//             }
//         } catch (error) {
//             console.error("❌ Error iniciando nuevo chat:", error);
//             this.showError("Error al iniciar el chat");
//         }
//     }

//     async createNewConversation(adminId) {
//         // Enviar un mensaje vacío para crear la conversación
//         // La conversación se creará automáticamente al enviar el primer mensaje
//         await this.loadConversations();
//     }

//     scrollToBottom() {
//         const container = document.getElementById('messagesContainer');
//         container.scrollTop = container.scrollHeight;
//     }

//     showError(message) {
//         const errorDiv = document.getElementById('errorMessage');
//         errorDiv.textContent = message;
//         errorDiv.style.display = 'block';
//         setTimeout(() => {
//             errorDiv.style.display = 'none';
//         }, 5000);
//     }

//     formatDate(dateString) {
//         const date = new Date(dateString);
//         const now = new Date();
//         const diff = now - date;

//         if (diff < 86400000) { // Menos de 24 horas
//             return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
//         } else if (diff < 604800000) { // Menos de 7 días
//             return date.toLocaleDateString('es', { weekday: 'short' });
//         } else {
//             return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
//         }
//     }

//     formatTime(dateString) {
//         const date = new Date(dateString);
//         return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
//     }

//     escapeHtml(text) {
//         const div = document.createElement('div');
//         div.textContent = text;
//         return div.innerHTML;
//     }
// }

// // Inicializar al cargar la página
// let chatClient;
// document.addEventListener('DOMContentLoaded', async () => {
//     chatClient = new ChatClient();
//     await chatClient.initialize();
// });