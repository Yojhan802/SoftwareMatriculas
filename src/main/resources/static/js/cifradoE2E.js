// cifradoE2E.js - Manejo de cifrado E2E con RSA (CORREGIDO)

class ChatEncryption {
    constructor() {
        this.keyPair = null;
        this.publicKeysCache = new Map(); // key: base64 limpio
        console.log("🔐 ChatEncryption inicializado");
    }

    /* =======================
       GENERACIÓN DE LLAVES
    ======================= */
    async generateKeyPair() {
        this.keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );
        return this.keyPair;
    }

    /* =======================
       EXPORT / IMPORT
    ======================= */
    async exportPublicKeyBase64() {
        const spki = await crypto.subtle.exportKey(
            "spki",
            this.keyPair.publicKey
        );
        return this.arrayBufferToBase64(spki); // 🔴 SIN PEM
    }

    async importPublicKeyFromBase64(base64) {
        if (this.publicKeysCache.has(base64)) {
            return this.publicKeysCache.get(base64);
        }

        const key = await crypto.subtle.importKey(
            "spki",
            this.base64ToArrayBuffer(base64),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );

        this.publicKeysCache.set(base64, key);
        return key;
    }

    async exportPrivateKeyBase64() {
        const pkcs8 = await crypto.subtle.exportKey(
            "pkcs8",
            this.keyPair.privateKey
        );
        return this.arrayBufferToBase64(pkcs8);
    }

    async importPrivateKeyFromBase64(base64) {
        return crypto.subtle.importKey(
            "pkcs8",
            this.base64ToArrayBuffer(base64),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
    }

    /* =======================
       CIFRAR / DESCIFRAR
    ======================= */
    async encryptMessage(plainText, recipientPublicKeyBase64) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);

        if (data.length > 190) {
            throw new Error("Mensaje demasiado largo para RSA-OAEP");
        }

        const publicKey = await this.importPublicKeyFromBase64(
            recipientPublicKeyBase64
        );

        const encrypted = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            data
        );

        return this.arrayBufferToBase64(encrypted);
    }

    async decryptMessage(encryptedBase64) {
    console.log("🔓 decryptMessage llamado");
    console.log("📦 encryptedBase64:", encryptedBase64);

    if (!this.keyPair) {
        console.error("❌ keyPair es NULL");
        throw new Error("KeyPair no existe");
    }

    if (!this.keyPair.privateKey) {
        console.error("❌ privateKey es NULL");
        throw new Error("Clave privada no disponible");
    }

    try {
        const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);
        console.log("📐 encryptedBuffer length:", encryptedBuffer.byteLength);

        const decrypted = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            this.keyPair.privateKey,
            encryptedBuffer
        );

        const text = new TextDecoder().decode(decrypted);
        console.log("✅ DESCIFRADO OK:", text);

        return text;

    } catch (e) {
        console.error("💥 ERROR EN decryptMessage:", e);
        throw e;
    }
}


    /* =======================
       STORAGE
    ======================= */
    async saveKeys() {
        localStorage.setItem(
            "chat_public_key",
            await this.exportPublicKeyBase64()
        );
        localStorage.setItem(
            "chat_private_key",
            await this.exportPrivateKeyBase64()
        );
    }

    async loadKeys() {
    console.log("🔑 loadKeys() llamado");

    const pub = localStorage.getItem("chat_public_key");
    const priv = localStorage.getItem("chat_private_key");

    console.log("📦 Public key existe:", !!pub);
    console.log("📦 Private key existe:", !!priv);

    if (!pub || !priv) {
        console.warn("⚠️ No hay claves en localStorage");
        return false;
    }

    try {
        this.keyPair = {
            publicKey: await this.importPublicKeyFromBase64(pub),
            privateKey: await this.importPrivateKeyFromBase64(priv)
        };

        console.log("✅ Claves cargadas correctamente");
        return true;

    } catch (e) {
        console.error("💥 Error importando claves:", e);
        return false;
    }
}


    clearKeys() {
        localStorage.clear();
        this.publicKeysCache.clear();
        this.keyPair = null;
    }

    /* =======================
       UTILS
    ======================= */
    arrayBufferToBase64(buffer) {
        return btoa(
            String.fromCharCode(...new Uint8Array(buffer))
        );
    }

    base64ToArrayBuffer(base64) {
        return Uint8Array.from(
            atob(base64),
            c => c.charCodeAt(0)
        ).buffer;
    }

    hasKeys() {
        return !!this.keyPair?.privateKey;
    }
}

window.chatEncryption = new ChatEncryption();
console.log("✅ cifradoE2E.js listo");
