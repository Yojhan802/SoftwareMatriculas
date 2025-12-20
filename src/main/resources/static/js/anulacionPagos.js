const API_BASE_URL = '/api';

async function buscarRecibo() {
    const input = document.getElementById('inputBuscarRecibo');
    const numeroRecibo = input.value.trim();
    const card = document.getElementById('resultadoRecibo');

    // VALIDACIÓN: Evitar buscar si el campo está vacío o tiene espacios
    if (!numeroRecibo) {
        alert("Por favor, ingrese un número de recibo válido.");
        card.style.display = 'none'; // Limpieza de UI
        return;
    }

    try {
        // UI: Indicar que se está buscando (opcional: podrías deshabilitar el botón aquí)
        const response = await fetch(`${API_BASE_URL}/anulacion/buscar/${encodeURIComponent(numeroRecibo)}`);

        if (!response.ok) {
            card.style.display = 'none'; // Limpieza si falla la búsqueda
            if (response.status === 404) {
                throw new Error("El número de recibo no existe en el sistema.");
            }
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al buscar el recibo.");
        }

        const data = await response.json();
        
        // Llamamos a la función de dibujo que ya tiene la validación de 'anulado'
        mostrarDetalleRecibo(data);

    } catch (error) {
        alert("⚠️ " + error.message);
        card.style.display = 'none';
    }
}

function mostrarDetalleRecibo(data) {
    const card = document.getElementById('resultadoRecibo');

    // VALIDACIÓN: Verificar si el objeto data es válido
    if (!data || Object.keys(data).length === 0) {
        card.style.display = 'none';
        return;
    }

    // 1. Validación de estado anulado (Boolean de la entidad)
    if (data.anulado) {
        alert("⚠️ Este recibo ya ha sido ANULADO.");
        card.style.display = 'none';
        return;
    }

    // 2. Mapeo de datos (Asegurando nombres de tu DTO)
    document.getElementById('lblRecibo').textContent = data.numeroRecibo || "---";
    document.getElementById('lblAlumno').textContent = data.nombreAlumno || "Alumno no identificado";

    const monto = parseFloat(data.montoPagado);
    // VALIDACIÓN: Verificar que el monto sea un número válido
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

    // VALIDACIONES DE PROMPTS
    const usuarioDirector = prompt("Ingrese su nombre de usuario (Director):");
    if (usuarioDirector === null) return; // Usuario canceló
    if (!usuarioDirector.trim()) return alert("El nombre de usuario es obligatorio.");

    const codigoDirector = prompt("Ingrese el código de Google Authenticator (6 dígitos):");
    if (codigoDirector === null) return;
    
    // VALIDACIÓN: Formato de código (debe ser numérico y de 6 dígitos)
    const codigoRegex = /^\d{6}$/;
    if (!codigoRegex.test(codigoDirector.trim())) {
        return alert("El código debe ser exactamente de 6 números.");
    }

    try {
        // UI: Bloquear botón para evitar doble clic (Race Condition)
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Procesando...";

        const response = await fetch(`${API_BASE_URL}/anulacion/confirmar/${encodeURIComponent(numRecibo)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioDirector: usuarioDirector.trim(),
                codigoDirector: parseInt(codigoDirector.trim())
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ " + (result.message || "Recibo anulado con éxito."));
            location.reload();
        } else {
            throw new Error(result.message || "No se pudo completar la anulación.");
        }

    } catch (error) {
        alert("❌ Error: " + error.message);
        // UI: Reestablecer botón si falla
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "⚠️ Confirmar Anulación";
    }
}