// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_CHANGE_PASSWORD = "/api/users/change-password";
const API_USER_INFO = "/api/users/me"; // Endpoint para saber quién soy

// ==========================================
// INICIALIZACIÓN
// ==========================================
function initCambiarClave() {
    console.log("🔒 Módulo Cambiar Clave inicializado");

    const form = document.getElementById("formCambiarClave");
    if (form) {
        form.reset();
        // Removemos listeners anteriores para evitar duplicados si se recarga la vista
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener("submit", procesarCambioClave);
    }
    
    // Validar coincidencia en tiempo real
    const confirmInput = document.getElementById("confirmPassword");
    const newInput = document.getElementById("newPassword");
    
    if(confirmInput && newInput) {
        confirmInput.addEventListener("input", validarCoincidencia);
        newInput.addEventListener("input", validarCoincidencia);
    }
}

// Detectar carga de vista (Patrón SPA)
document.addEventListener("vista-cargada", (e) => {
    // Detecta tanto si la carpeta se llama "configuracion" como "cambiarClave"
    if (e.detail.includes("cambiarClave.html")) {
        initCambiarClave();
    }
});

// ==========================================
// LÓGICA DE NEGOCIO
// ==========================================

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling.querySelector('i');
    
    if (field.type === "password") {
        field.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        field.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

function validarCoincidencia() {
    const p1 = document.getElementById("newPassword").value;
    const p2 = document.getElementById("confirmPassword").value;
    const errorMsg = document.getElementById("passwordMismatch");
    const btn = document.getElementById("btnCambiarClave");

    if (p2 && p1 !== p2) {
        errorMsg.classList.remove("d-none");
        btn.disabled = true;
    } else {
        errorMsg.classList.add("d-none");
        btn.disabled = false;
    }
}

async function procesarCambioClave(e) {
    e.preventDefault();

    const btn = document.getElementById("btnCambiarClave");
    const originalText = btn.innerHTML;

    // 1. Obtener datos del formulario
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // 2. Validaciones Frontend básicas
    if (newPassword !== confirmPassword) {
        alert("❌ Las contraseñas nuevas no coinciden.");
        return;
    }

    if (newPassword.length < 3) { // Ajusta el mínimo según tu preferencia
        alert("⚠️ La nueva contraseña es muy corta.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando usuario...';

    try {
        // 3. OBTENER USUARIO ACTUAL DESDE EL SERVIDOR 
        // En lugar de confiar en variables locales vacías, preguntamos al backend.
        const resUser = await fetch(API_USER_INFO);
        
        if (!resUser.ok) {
            throw new Error("No se pudo identificar la sesión del usuario.");
        }
        
        const userData = await resUser.json();
        const username = userData.username; // Tu endpoint /api/users/me devuelve { username: "..." }

        if (!username) {
            throw new Error("El servidor no devolvió un nombre de usuario válido.");
        }

        // 4. Preparar Payload
        const payload = {
            nombreUsuario: username,
            contrasenaActual: currentPassword,
            nuevaContrasena: newPassword
        };

        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Actualizando...';

        // 5. Enviar Petición de Cambio
        const response = await fetch(API_CHANGE_PASSWORD, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Tu backend devuelve texto plano en éxito ("Contraseña actualizada...")
        // O un JSON/texto en error. Intentamos leer texto primero.
        const msg = await response.text(); 

        if (response.ok) {
            alert("✅ " + msg);
            document.getElementById("formCambiarClave").reset();
            
            // Opcional: Recargar página o cerrar sesión
            // window.location.href = "/index.html"; 
        } else {
            // Error controlado (ej: "La contraseña actual es incorrecta")
            // A veces el backend devuelve JSON de error, a veces texto plano
            let errorText = msg;
            try {
                const jsonError = JSON.parse(msg);
                if(jsonError.message) errorText = jsonError.message;
            } catch(e) {} // Si no es JSON, usamos el texto plano
            
            alert("❌ Error: " + errorText);
        }

    } catch (error) {
        console.error(error);
        if (error.message.includes("identificar la sesión")) {
            alert("⚠️ Su sesión ha expirado. Por favor inicie sesión nuevamente.");
            window.location.href = "/index.html";
        } else {
            alert("❌ Ocurrió un error inesperado: " + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}