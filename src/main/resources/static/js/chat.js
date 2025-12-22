// chat.js - Cliente WebSocket con cifrado E2E (ADAPTADO A principal.js)

class ChatClient {

    constructor() {
        this.stompClient = null;
        this.currentConversationId = null;
        this.currentUser = null;
        this.currentUserId = null;

        this.conversations = [];
        this.recipientId = null;
        this.recipientPublicKey = null;

        this.isInitialized = false;
    }

    /* ===============================
       INICIALIZACIÓN
    =============================== */
    async initialize() {
        if (this.isInitialized) return;

        console.log("🚀 Inicializando ChatClient...");

        if (typeof chatEncryption === "undefined") {
            this.showError("Módulo de cifrado no cargado");
            return;
        }

        // 🔐 Cargar / generar llaves
        const hasKeys = await chatEncryption.loadKeys();
        if (!hasKeys) {
            await chatEncryption.generateKeyPair();
            await chatEncryption.saveKeys();
        }

        // 👤 Usuario actual
        await this.loadCurrentUser();
        if (!this.currentUserId) {
            this.showError("Usuario no autenticado");
            return;
        }

        const userEl = document.getElementById("currentUser");
        if (userEl) userEl.textContent = this.currentUser;

        this.setupEventListeners();
        this.connect();

        this.isInitialized = true;
        console.log("✅ Chat inicializado");
    }

    /* ===============================
       EVENTOS UI
    =============================== */
    setupEventListeners() {

        // 🔘 Botón Nuevo Chat
        const newChatBtn = document.getElementById("newChatButton");
        if (newChatBtn) {
            newChatBtn.addEventListener("click", () => {
                this.createSupportChat();
            });
        }

        // 📤 Enviar mensaje
        const sendBtn = document.getElementById("sendButton");
        const input = document.getElementById("messageInput");

        if (sendBtn && input) {
            sendBtn.addEventListener("click", () => this.sendMessage());
            input.addEventListener("keypress", e => {
                if (e.key === "Enter") this.sendMessage();
            });
        }
    }

    /* ===============================
       USUARIO ACTUAL
    =============================== */
    async loadCurrentUser() {
        try {
            const res = await fetch("/api/users/me", { credentials: "include" });
            const data = await res.json();

            this.currentUser = data.nombreUsuario;
            this.currentUserId = data.id;

            console.log(`👤 ${this.currentUser} (${this.currentUserId})`);
        } catch (e) {
            console.error("❌ Error cargando usuario", e);
        }
    }

    /* ===============================
       WEBSOCKET
    =============================== */
    connect() {
        const socket = new SockJS("/ws");
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null;

        this.stompClient.connect({}, async () => {
            console.log("🟢 WebSocket conectado");

            await this.registerPublicKey();

            this.stompClient.subscribe(
                "/user/queue/messages",
                msg => this.onMessageReceived(JSON.parse(msg.body))
            );

            this.stompClient.subscribe(
                "/user/queue/errors",
                msg => this.showError(msg.body)
            );

            this.loadConversations();
        });
    }

    /* ===============================
       CLAVE PÚBLICA
    =============================== */
    async registerPublicKey() {
        const publicKey = await chatEncryption.exportPublicKeyBase64();

        await fetch("/api/chat/keys/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ clavePublica: publicKey })
        });

        console.log("🔑 Clave pública registrada");
    }

    /* ===============================
       CONVERSACIONES
    =============================== */
    async loadConversations() {
        try {
            const res = await fetch("/api/chat/conversations", {
                credentials: "include"
            });
            this.conversations = await res.json();
            this.renderConversations();
        } catch (e) {
            console.error("❌ Error cargando conversaciones", e);
        }
    }

    renderConversations() {
        const container = document.getElementById("conversationsList");
        if (!container) return;

        if (this.conversations.length === 0) {
            container.innerHTML = `<div class="loading">No hay conversaciones</div>`;
            return;
        }

        container.innerHTML = this.conversations.map(c => `
            <div class="conversation-item"
                 data-id="${c.id}"
                 data-recipient="${c.destinatarioId}">
                <div class="conversation-name">${c.name}</div>
                <div class="conversation-preview">${c.preview || ""}</div>
            </div>
        `).join("");

        container.querySelectorAll(".conversation-item").forEach(el => {
            el.addEventListener("click", () => {
                this.selectConversation(
                    el.dataset.id,
                    el.dataset.recipient
                );
            });
        });
    }

    /* ===============================
       CREAR CHAT SOPORTE
    =============================== */
    async createSupportChat() {
        
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

    /* ===============================
       MENSAJES
    =============================== */
    async selectConversation(conversationId, recipientId) {
        this.currentConversationId = conversationId;
        this.recipientId = recipientId;

        document.querySelectorAll(".conversation-item")
            .forEach(i => i.classList.remove("active"));

        document.querySelector(`[data-id="${conversationId}"]`)
            ?.classList.add("active");

        await this.loadMessages(conversationId);
        await this.fetchRecipientPublicKey(recipientId);

        document.getElementById("messageInput").disabled = false;
        document.getElementById("sendButton").disabled = false;
    }

    async loadMessages(conversationId) {
        const res = await fetch(
            `/api/chat/conversations/${conversationId}/messages`,
            { credentials: "include" }
        );
        const messages = await res.json();
        await this.renderMessages(messages);
    }

    async renderMessages(messages) {
    const container = document.getElementById("messagesContainer");
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay mensajes</div>`;
        return;
    }

    const html = await Promise.all(messages.map(async msg => {

        const isSent = msg.remitenteId === this.currentUserId;
        const isReceived = msg.destinatarioId === this.currentUserId;

        console.log("🧩 MENSAJE:");
        console.log("  id:", msg.id);
        console.log("  cifrado:", msg.cifrado);
        console.log("  remitenteId:", msg.remitenteId);
        console.log("  destinatarioId:", msg.destinatarioId);
        console.log("  destinatarioId:", msg.contenidoCifradoRemitente);
        console.log("  destinatarioId:", msg.contenidoCifradoDestinatario);
        console.log("  currentUserId:", this.currentUserId);
        console.log("  isSent:", isSent);
        console.log("  isReceived:", isReceived);

        let encryptedText;
        let text = "[Mensaje vacío]";

        // 🔐 Selección correcta de copia
        if (isSent) {
            encryptedText = msg.contenidoCifradoRemitente;
        } else if (isReceived) {
            encryptedText = msg.contenidoCifradoDestinatario;
        }

        // 🔓 Descifrado solo si corresponde
        if (msg.cifrado && encryptedText) {
            console.log("🔐 Intentando descifrar mensaje", msg.id);
            try {
                text = await chatEncryption.decryptMessage(encryptedText);
            } catch (e) {
                console.error("❌ Falló descifrado del mensaje", msg.id, e);
                text = "[No se pudo descifrar]";
            }
        } else {
            console.log("⏭️ Mensaje no cifrado o sin contenido");
            text = encryptedText || "[Mensaje sin contenido]";
        }

        return `
            <div class="message ${isSent ? "sent" : "received"}">
                <div class="message-bubble">
                    ${!isSent ? `<div class="message-sender">${msg.remitenteNombre}</div>` : ""}
                    <div class="message-text">${text}</div>
                    <div class="message-time">${this.formatTime(msg.fechaEnvio)}</div>
                </div>
            </div>
        `;
    }));

    container.innerHTML = html.join("");
    container.scrollTop = container.scrollHeight;
}



    async sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text || !this.recipientPublicKey) return;

    try {
        console.log("✉️ Enviando mensaje:", text);

        // 🔐 Cifrado para el destinatario
        const encryptedForRecipient = await chatEncryption.encryptMessage(
            text,
            this.recipientPublicKey
        );

        // 🔐 Cifrado para mí (remitente)
        const myPublicKey = await chatEncryption.exportPublicKeyBase64();
        const encryptedForSender = await chatEncryption.encryptMessage(
            text,
            myPublicKey
        );

        console.log("🔐 encryptedForRecipient:", encryptedForRecipient);
        console.log("🔐 encryptedForSender:", encryptedForSender);

        // 📦 Payload con doble cifrado
        this.stompClient.send("/app/chat.send", {}, JSON.stringify({
            conversacionId: Number(this.currentConversationId),
            destinatarioId: Number(this.recipientId),

            contenidoCifradoDestinatario: encryptedForRecipient,
            contenidoCifradoRemitente: encryptedForSender,

            cifrado: true
        }));

        // 🖥️ UI inmediata (texto plano SOLO en memoria)
        this.addMessageToUI(this.currentUser, text, true);
        input.value = "";

    } catch (e) {
        console.error("❌ Error enviando mensaje:", e);
        this.showError("No se pudo enviar el mensaje");
    }
}


    addMessageToUI(sender, text, isSent) {
        const container = document.getElementById("messagesContainer");
        if (!container) return;

        const div = document.createElement("div");
        div.className = `message ${isSent ? "sent" : "received"}`;
        div.innerHTML = `
            <div class="message-bubble">
                ${!isSent ? `<div class="message-sender">${sender}</div>` : ""}
                <div class="message-text">${text}</div>
                <div class="message-time">${this.formatTime(new Date())}</div>
            </div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    async fetchRecipientPublicKey(userId) {
    const res = await fetch(`/api/chat/keys/${userId}`, {
        credentials: "include"
    });
    const data = await res.json();

    console.log("🔑 Clave pública recibida para", userId, data.clavePublica);

    this.recipientPublicKey = data.clavePublica;
}


    formatTime(date) {
        date = new Date(date);
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }

    showError(msg) {
        const el = document.getElementById("errorMessage");
        if (!el) return;
        el.textContent = msg;
        el.style.display = "block";
        setTimeout(() => el.style.display = "none", 4000);
    }

    destroy() {
        this.stompClient?.disconnect();
        this.isInitialized = false;
    }
}

/* ===============================
   BOOTSTRAP
=============================== */
window.ChatClient = ChatClient;
let chatClient = null;

window.initializeChatClient = () => {
    if (chatClient) chatClient.destroy();
    chatClient = new ChatClient();
    window.chatClient = chatClient;
    chatClient.initialize();
};
