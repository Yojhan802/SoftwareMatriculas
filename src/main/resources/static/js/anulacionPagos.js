const API_BASE_URL = '/api';

// Reglas de validación: Solo letras, espacios, tildes y eñes
const REGEX_SOLO_TEXTO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;

async function buscarRecibo() {
    const input = document.getElementById('inputBuscarRecibo');
    const numeroRecibo = input.value.trim();
    const card = document.getElementById('resultadoRecibo');

    if (!numeroRecibo) {
        alert("⚠️ Por favor, ingrese un número de recibo válido.");
        card.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/anulacion/buscar/${encodeURIComponent(numeroRecibo)}`);

        if (!response.ok) {
            card.style.display = 'none';
            if (response.status === 404) {
                throw new Error("El número de recibo no existe en el sistema.");
            }
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al buscar el recibo.");
        }

        const data = await response.json();
        mostrarDetalleRecibo(data);

    } catch (error) {
        alert("⚠️ " + error.message);
        card.style.display = 'none';
    }
}

function mostrarDetalleRecibo(data) {
    const card = document.getElementById('resultadoRecibo');

    if (!data || Object.keys(data).length === 0) {
        card.style.display = 'none';
        return;
    }

    if (data.anulado) {
        alert("⚠️ Este recibo ya ha sido ANULADO.");
        card.style.display = 'none';
        return;
    }

    document.getElementById('lblRecibo').textContent = data.numeroRecibo || "---";
    document.getElementById('lblAlumno').textContent = data.nombreAlumno || "Alumno no identificado";

    const monto = parseFloat(data.montoPagado);
    document.getElementById('lblMonto').textContent = !isNaN(monto) ? `S/. ${monto.toFixed(2)}` : "S/. 0.00";

    card.style.display = 'block';
    card.classList.remove('hidden');
}

async function anularRecibo() {
    const numRecibo = document.getElementById('lblRecibo').textContent;
    const btnConfirmar = document.querySelector('.btn-danger-custom');

    if (!numRecibo || numRecibo === "---") return;

    if (!confirm(`¿Está seguro de que desea anular el recibo N° ${numRecibo}? Esta acción es irreversible.`)) {
        return;
    }

    // 1. VALIDACIÓN: Usuario Director (Solo texto)
    const usuarioDirector = prompt("Ingrese su nombre de usuario (Director):");
    if (usuarioDirector === null) return;

    const userTrimmed = usuarioDirector.trim();
    if (!userTrimmed) return alert("⚠️ El nombre de usuario es obligatorio.");

    // Bloquear si contiene símbolos o números
    if (!REGEX_SOLO_TEXTO.test(userTrimmed)) {
        return alert("❌ Error: El nombre de usuario solo puede contener letras y espacios.");
    }

    // 2. VALIDACIÓN: Código TOTP (Solo 6 números)
    const codigoDirector = prompt("Ingrese el código de Google Authenticator (6 dígitos):");
    if (codigoDirector === null) return;

    const codeTrimmed = codigoDirector.trim();
    const codigoRegex = /^\d{6}$/;

    if (!codigoRegex.test(codeTrimmed)) {
        return alert("❌ Error: El código debe ser exactamente de 6 números (sin símbolos ni letras).");
    }

    try {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Procesando...";

        const response = await fetch(`${API_BASE_URL}/anulacion/confirmar/${encodeURIComponent(numRecibo)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioDirector: userTrimmed,
                codigoDirector: parseInt(codeTrimmed)
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ El recibo y su cuota han sido invalidados permanentemente.");
            location.reload();
        } else {
            throw new Error(result.message || "No se pudo completar la anulación.");
        }

    } catch (error) {
        alert("❌ Error: " + error.message);
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "⚠️ Confirmar Anulación";
    }
}