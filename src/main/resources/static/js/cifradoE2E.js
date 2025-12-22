// chat-encryption.js - Manejo de cifrado E2E con RSA

class ChatEncryption {
    constructor() {
        this.keyPair = null;
        this.publicKeysCache = new Map();
    }

    // Generar par de llaves RSA (público/privado)
    async generateKeyPair() {
        try {
            this.keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ["encrypt", "decrypt"]
            );

            console.log("✅ Par de llaves RSA generado exitosamente");
            return this.keyPair;
        } catch (error) {
            console.error("❌ Error generando llaves RSA:", error);
            throw error;
        }
    }

    // Exportar clave pública a formato PEM
    async exportPublicKey() {
        try {
            const exported = await window.crypto.subtle.exportKey(
                "spki",
                this.keyPair.publicKey
            );

            const exportedAsBase64 = this.arrayBufferToBase64(exported);
            const pem = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;

            return pem;
        } catch (error) {
            console.error("❌ Error exportando clave pública:", error);
            throw error;
        }
    }

    // Importar clave pública desde formato PEM
    async importPublicKey(pemKey) {
        try {
            // Remover encabezados y saltos de línea
            const pemContents = pemKey
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replace(/\s/g, "");

            const binaryDer = this.base64ToArrayBuffer(pemContents);

            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                binaryDer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                true,
                ["encrypt"]
            );

            return publicKey;
        } catch (error) {
            console.error("❌ Error importando clave pública:", error);
            throw error;
        }
    }

    // Cifrar mensaje con la clave pública del destinatario
    async encryptMessage(message, recipientPublicKeyPem) {
        try {
            // Verificar si ya tenemos la clave en caché
            let publicKey = this.publicKeysCache.get(recipientPublicKeyPem);
            
            if (!publicKey) {
                publicKey = await this.importPublicKey(recipientPublicKeyPem);
                this.publicKeysCache.set(recipientPublicKeyPem, publicKey);
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                publicKey,
                data
            );

            return this.arrayBufferToBase64(encrypted);
        } catch (error) {
            console.error("❌ Error cifrando mensaje:", error);
            throw error;
        }
    }

    // Descifrar mensaje con nuestra clave privada
    async decryptMessage(encryptedBase64) {
        try {
            if (!this.keyPair || !this.keyPair.privateKey) {
                throw new Error("No hay clave privada disponible");
            }

            const encrypted = this.base64ToArrayBuffer(encryptedBase64);

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                this.keyPair.privateKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error("❌ Error descifrando mensaje:", error);
            return "[Error: No se pudo descifrar el mensaje]";
        }
    }

    // Guardar claves en localStorage (SOLO para desarrollo - en producción usar IndexedDB)
    async saveKeysToStorage() {
        try {
            const publicKey = await this.exportPublicKey();
            const privateKey = await this.exportPrivateKey();

            localStorage.setItem('chat_public_key', publicKey);
            localStorage.setItem('chat_private_key', privateKey);

            console.log("🔑 Llaves guardadas en localStorage");
        } catch (error) {
            console.error("❌ Error guardando llaves:", error);
        }
    }

    // Cargar claves desde localStorage
    async loadKeysFromStorage() {
        try {
            const publicKeyPem = localStorage.getItem('chat_public_key');
            const privateKeyPem = localStorage.getItem('chat_private_key');

            if (!publicKeyPem || !privateKeyPem) {
                return false;
            }

            const publicKey = await this.importPublicKey(publicKeyPem);
            const privateKey = await this.importPrivateKey(privateKeyPem);

            this.keyPair = { publicKey, privateKey };

            console.log("🔑 Llaves cargadas desde localStorage");
            return true;
        } catch (error) {
            console.error("❌ Error cargando llaves:", error);
            return false;
        }
    }

    // Exportar clave privada (NUNCA enviar al servidor)
    async exportPrivateKey() {
        try {
            const exported = await window.crypto.subtle.exportKey(
                "pkcs8",
                this.keyPair.privateKey
            );

            const exportedAsBase64 = this.arrayBufferToBase64(exported);
            const pem = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;

            return pem;
        } catch (error) {
            console.error("❌ Error exportando clave privada:", error);
            throw error;
        }
    }

    // Importar clave privada
    async importPrivateKey(pemKey) {
        try {
            const pemContents = pemKey
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace(/\s/g, "");

            const binaryDer = this.base64ToArrayBuffer(pemContents);

            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                binaryDer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                true,
                ["decrypt"]
            );

            return privateKey;
        } catch (error) {
            console.error("❌ Error importando clave privada:", error);
            throw error;
        }
    }

    // Utilidades para conversión
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// Instancia global
const chatEncryption = new ChatEncryption();