// ========================================
// reportes.js - Sistema de Reportes
// ========================================

// ✅ Usar ruta relativa como en alumnos.js
const API_REPORTES = "/api/reportes";

// Grados por nivel
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

// ============= FUNCIONES GLOBALES =============

function actualizarGrados() {
    const nivelSelect = document.getElementById('reporteNivel');
    const gradoSelect = document.getElementById('reporteGrado');
    
    if (!nivelSelect || !gradoSelect) return;
    
    const nivel = nivelSelect.value;

    gradoSelect.innerHTML = '<option value="">-- Seleccione Grado --</option>';

    if (nivel && opcionesGrados[nivel]) {
        gradoSelect.disabled = false;
        opcionesGrados[nivel].forEach(grado => {
            const option = document.createElement('option');
            option.value = grado.val;
            option.textContent = grado.text;
            gradoSelect.appendChild(option);
        });
    } else {
        gradoSelect.disabled = true;
    }
}

function deshabilitarBotones(estado) {
    const botones = document.querySelectorAll('.btn-custom');
    botones.forEach(btn => btn.disabled = estado);
}

// ============= REPORTE DE MATRICULADOS =============

function generarReporteMatriculados(formato) {
    console.log("🔵 Generando reporte de matriculados...", formato);
    
    const periodoInput = document.getElementById('periodoMatriculados');
    if (!periodoInput) {
        console.error("No se encontró el campo periodoMatriculados");
        return;
    }
    
    const periodo = periodoInput.value.trim();

    if (!periodo) {
        alert("⚠️ Por favor, ingrese un periodo.");
        return;
    }

    deshabilitarBotones(true);

    const endpoint = formato === 'EXCEL' ? '/matriculados-excel' : '/matriculados';
    const extension = formato === 'EXCEL' ? '.xlsx' : '.pdf';
    
    const params = new URLSearchParams({ periodo });
    
    fetch(`${API_REPORTES}${endpoint}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo generar el reporte`);
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Matriculados_${periodo}${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            mostrarAlertaReportes("✅ Reporte generado exitosamente", "success");
        })
        .catch(error => {
            console.error("Error:", error);
            mostrarAlertaReportes("❌ Error al generar reporte: " + error.message, "danger");
        })
        .finally(() => {
            deshabilitarBotones(false);
        });
}

// ============= REPORTE DE CUOTAS PENDIENTES =============

function generarReporteCuotas(formato) {
    console.log("🔵 Generando reporte de cuotas...", formato);
    
    const nivelInput = document.getElementById('reporteNivel');
    const gradoInput = document.getElementById('reporteGrado');
    
    if (!nivelInput || !gradoInput) {
        console.error("No se encontraron los campos de nivel/grado");
        return;
    }
    
    const nivel = nivelInput.value;
    const grado = gradoInput.value;

    if (!nivel || !grado) {
        alert("⚠️ Por favor, seleccione nivel y grado.");
        return;
    }

    deshabilitarBotones(true);

    const endpoint = formato === 'EXCEL' ? '/cuotas-pendientes-excel' : '/cuotas-pendientes';
    const extension = formato === 'EXCEL' ? '.xlsx' : '.pdf';

    const params = new URLSearchParams({ nivel, grado });
    
    fetch(`${API_REPORTES}${endpoint}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo generar el reporte`);
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Cuotas_${nivel}_${grado}${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            mostrarAlertaReportes("✅ Reporte generado exitosamente", "success");
        })
        .catch(error => {
            console.error("Error:", error);
            mostrarAlertaReportes("❌ Error al generar reporte: " + error.message, "danger");
        })
        .finally(() => {
            deshabilitarBotones(false);
        });
}

// ============= MOSTRAR ALERTAS =============

function mostrarAlertaReportes(mensaje, tipo = "success") {
    let alertDiv = document.getElementById("alertContainerReportes");
    
    if (!alertDiv) {
        // Si no existe, crear el contenedor
        const contentArea = document.getElementById("content-area");
        if (contentArea) {
            alertDiv = document.createElement("div");
            alertDiv.id = "alertContainerReportes";
            contentArea.insertBefore(alertDiv, contentArea.firstChild);
        }
    }

    if (alertDiv) {
        alertDiv.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                <i class="bi ${tipo === 'success' ? 'bi-check-circle' : tipo === 'danger' ? 'bi-x-circle' : 'bi-info-circle'}"></i>
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        setTimeout(() => {
            alertDiv.innerHTML = "";
        }, 3000);
    } else {
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    }
}

// ============= EXPONER FUNCIONES AL SCOPE GLOBAL =============

window.generarReporteMatriculados = generarReporteMatriculados;
window.generarReporteCuotas = generarReporteCuotas;
window.actualizarGrados = actualizarGrados;

console.log("✅ Módulo de reportes cargado");