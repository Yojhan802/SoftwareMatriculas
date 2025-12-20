// Configuración de los grados por nivel
const opcionesGrados = {
    "Primaria": [
        { val: "Primer Año", text: "Primero de Primaria" },
        { val: "Segundo Año", text: "Segundo de Primaria" },
        { val: "Tercer Año", text: "Tercero de Primaria" },
        { val: "Cuarto Año", text: "Cuarto de Primaria" },
        { val: "Quinto Año", text: "Quinto de Primaria" },
        { val: "Sexto Año", text: "Sexto de Primaria" }
    ],
    "Secundaria": [
        { val: "Primer Año", text: "Primer Año de Secundaria" },
        { val: "Segundo Año", text: "Segundo Año de Secundaria" },
        { val: "Tercer Año", text: "Tercer Año de Secundaria" },
        { val: "Cuarto Año", text: "Cuarto Año de Secundaria" },
        { val: "Quinto Año", text: "Quinto Año de Secundaria" }
    ]
};

function actualizarGrados() {
    const nivelSelect = document.getElementById('reporteNivel');
    const gradoSelect = document.getElementById('reporteGrado');
    const nivelSeleccionado = nivelSelect.value;

    // Limpiar opciones anteriores
    gradoSelect.innerHTML = '<option value="">-- Seleccione Grado --</option>';

    if (nivelSeleccionado && opcionesGrados[nivelSeleccionado]) {
        // Habilitar y llenar
        gradoSelect.disabled = false;
        opcionesGrados[nivelSeleccionado].forEach(grado => {
            const option = document.createElement('option');
            option.value = grado.val;
            option.textContent = grado.text;
            gradoSelect.appendChild(option);
        });
    } else {
        // Deshabilitar si no hay nivel
        gradoSelect.disabled = true;
    }
}

// La función de generar reporte se mantiene similar, pero ahora toma los valores de los selects
async function generarReporteCuotas() {
    const nivel = document.getElementById('reporteNivel').value;
    const grado = document.getElementById('reporteGrado').value;
    const btn = document.querySelector('button[onclick="generarReporteCuotas()"]');

    if (!nivel || !grado) {
        alert("⚠️ Por favor, seleccione ambos campos.");
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Generando...";

        const params = new URLSearchParams({ nivel, grado });
        const response = await fetch(`${API_BASE_URL}/reportes/cuotas-pendientes?${params}`);

        if (!response.ok) throw new Error("Error al obtener el reporte.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

    } catch (error) {
        alert("❌ Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "📥 Generar PDF";
    }
}