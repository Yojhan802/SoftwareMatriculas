
const API_BASE_URL = '/api';

async function buscarRecibo() {
    // 1. Obtener el número de recibo del input
    const input = document.getElementById('inputBuscarRecibo');
    const numeroRecibo = input.value.trim();

    if (!numeroRecibo) {
        alert("Por favor, ingrese un número de recibo.");
        return;
    }

    try {
        // 2. Llamada al nuevo endpoint del controlador
        // Usamos encodeURIComponent por si el número tiene guiones o caracteres especiales
        const response = await fetch(`/api/anulacion/buscar/${encodeURIComponent(numeroRecibo)}`);

        // 3. Manejo de errores de respuesta
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("El número de recibo no existe en el sistema.");
            }
            // En caso de que el Service lance la excepción de "Ya está ANULADO"
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al buscar el recibo.");
        }

        const data = await response.json();

        // 4. Pintar los datos en el HTML usando los campos de tu DTO
        // El DTO tiene: numeroRecibo, nombreAlumno, montoPagado, concepto
        document.getElementById('lblRecibo').textContent = data.numeroRecibo;
        document.getElementById('lblAlumno').textContent = data.nombreAlumno;

        // Formatear el monto con 2 decimales
        const monto = parseFloat(data.montoPagado);
        document.getElementById('lblMonto').textContent = `S/. ${monto.toFixed(2)}`;

        // 5. Mostrar la tarjeta de resultados
        const card = document.getElementById('resultadoRecibo');
        card.style.display = 'block';
        card.classList.remove('hidden');

    } catch (error) {
        alert("⚠️ " + error.message);
        // Ocultar la tarjeta si hubo error
        document.getElementById('resultadoRecibo').style.display = 'none';
    }
}

function mostrarDetalleRecibo(data) {
    const card = document.getElementById('resultadoRecibo');

    // 1. Nueva validación: Usamos el boolean 'anulado' de tu entidad Recibo
    if (data.anulado) {
        alert("⚠️ Este recibo ya ha sido ANULADO.");
        card.style.display = 'none';
        return;
    }

    // 2. Mapeo de datos usando los nombres exactos de tu ReciboDetalleDTO
    // Cambiamos 'cuota.id' por 'data.numeroRecibo'
    document.getElementById('lblRecibo').textContent = data.numeroRecibo;

    // Mostramos el nombre del alumno (que ya viene descifrado o procesado del service)
    document.getElementById('lblAlumno').textContent = data.nombreAlumno;

    // Cambiamos 'cuota.monto' por 'data.montoPagado'
    // Usamos parseFloat para asegurar que toFixed(2) funcione correctamente
    const monto = parseFloat(data.montoPagado);
    document.getElementById('lblMonto').textContent = `S/. ${monto.toFixed(2)}`;

    // 3. Hacer visible el contenedor
    card.style.display = 'block';
    card.classList.remove('hidden');
}

async function anularRecibo() {
    const numRecibo = document.getElementById('lblRecibo').textContent;

    if (!numRecibo) return;

    if (!confirm(`¿Está seguro de que desea anular el recibo N° ${numRecibo}?`)) {
        return;
    }

    // Pedimos los datos del director
    const usuarioDirector = prompt("Ingrese su nombre de usuario (Director):");
    if (!usuarioDirector) return alert("Usuario obligatorio.");

    const codigoDirector = prompt("Ingrese el código de Google Authenticator:");
    if (!codigoDirector) return alert("Código obligatorio.");

    try {
        const response = await fetch(`/api/anulacion/confirmar/${encodeURIComponent(numRecibo)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioDirector: usuarioDirector,
                codigoDirector: parseInt(codigoDirector)
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ " + result.message);
            location.reload();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

