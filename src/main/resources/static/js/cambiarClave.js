// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_CHANGE_PASSWORD = "/api/users/change-password";
const API_USER_INFO = "/api/users/me"; 

let currentUserData = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
function initCambiarClave() {
    console.log("🔒 Módulo Cambiar Clave inicializado");

    const form = document.getElementById("formCambiarClave");
    if (form) {
        form.reset();
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener("submit", procesarCambioClave);
    }
    
    const confirmInput = document.getElementById("confirmPassword");
    const newInput = document.getElementById("newPassword");
    
    if(confirmInput && newInput) {
        confirmInput.addEventListener("input", validarCoincidencia);
        newInput.addEventListener("input", validarCoincidencia);
    }

    cargarUsuarioParaCambio();
}

// ✅ FUNCIONALIDAD DEL OJITO (NUEVA FUNCIÓN)
// Permite alternar entre ver la contraseña y ocultarla
window.togglePassword = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector("i"); // Buscamos el ícono dentro del botón
    
    if (input.type === "password") {
        input.type = "text"; // Mostrar texto
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); // Cambiar icono a "ojo tachado"
    } else {
        input.type = "password"; // Ocultar texto
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); // Cambiar icono a "ojo normal"
    }
};

// Detectar carga de vista
document.addEventListener("vista-cargada", (e) => {
    if (e.detail.includes("cambiarClave.html")) {
        initCambiarClave();
    }
});

if (document.getElementById("formCambiarClave")) {
    initCambiarClave();
}

// ==========================================
// LÓGICA DE NEGOCIO (SIN CAMBIOS ESTRUCTURALES)
// ==========================================

async function cargarUsuarioParaCambio() {
    try {
        const response = await fetch(API_USER_INFO);
        
        if (!response.ok) {
            throw new Error("No se pudo obtener la sesión.");
        }

        const data = await response.json();
        
        if (data && data.nombreUsuario) {
            currentUserData = data;
            console.log("✅ Usuario identificado:", currentUserData.nombreUsuario);
        } else {
            throw new Error("El servidor no devolvió un nombre de usuario válido.");
        }

    } catch (error) {
        console.error(error);
        alert("⚠️ Error de sesión: " + error.message);
    }
}

function validarCoincidencia() {
    const nueva = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("passwordMismatch");
    const btn = document.getElementById("btnCambiarClave");

    if (confirm && nueva !== confirm) {
        errorDiv.classList.remove("d-none");
        btn.disabled = true;
    } else {
        errorDiv.classList.add("d-none");
        btn.disabled = false;
    }
}

async function procesarCambioClave(e) {
    e.preventDefault();

    if (!currentUserData || !currentUserData.nombreUsuario) {
        alert("❌ Error: No se ha identificado al usuario. Recargue la página.");
        return;
    }

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // ✅ VALIDACIÓN SOLICITADA: Máximo 30 caracteres (doble seguridad aparte del HTML)
    if (currentPassword.length > 30 || newPassword.length > 30 || confirmPassword.length > 30) {
        alert("❌ Error: Las contraseñas no pueden tener más de 30 caracteres.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("❌ Las nuevas contraseñas no coinciden.");
        return;
    }

    const payload = {
        nombreUsuario: currentUserData.nombreUsuario,
        contrasenaActual: currentPassword,
        nuevaContrasena: newPassword
    };

    const btn = document.getElementById("btnCambiarClave");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const response = await fetch(API_CHANGE_PASSWORD, {
            method: 'PATCH', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const msg = await response.text(); 

        if (response.ok) {
            alert("✅ " + msg);
            document.getElementById("formCambiarClave").reset();
            
            // Reiniciar los íconos de los ojos a su estado original
            document.querySelectorAll('.fa-eye-slash').forEach(i => {
                i.classList.remove('fa-eye-slash');
                i.classList.add('fa-eye');
            });
            // Asegurar que los inputs vuelvan a ser password
            document.querySelectorAll('input[type="text"]').forEach(input => input.type = "password");

        } else {
            let errorText = msg;
            try {
                const jsonError = JSON.parse(msg);
                if(jsonError.message) errorText = jsonError.message;
            } catch(e) {} 
            
            alert("❌ Error: " + errorText);
        }

    } catch (error) {
        console.error(error);
        alert("❌ Ocurrió un error inesperado de conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

window.initCambiarClave = initCambiarClave;