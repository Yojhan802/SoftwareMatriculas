// =========================================================
// CONFIGURACIÓN
// =========================================================
const API_URL_MATRICULA = '/api/matricula';

// =========================================================
// INICIALIZACIÓN
// =========================================================

// Función principal de arranque
function initListarMatriculas() {
    console.log("⚡ Vista de Listar Matrículas detectada. Iniciando...");
    listarMatriculas();
}

// 1. Escuchar evento de navegación desde principal.js
document.addEventListener("vista-cargada", (e) => {
    if (e.detail.includes("listarMatriculas.html")) {
        initListarMatriculas();
    }
});

// 2. Ejecutar si el script se carga después del HTML (por seguridad)
if (document.getElementById('cuerpoTablaMatriculas')) {
    initListarMatriculas();
}

// =========================================================
// LÓGICA DE LISTADO (GET)
// =========================================================
async function listarMatriculas() {
    const cuerpoTabla = document.getElementById('cuerpoTablaMatriculas');
    if (!cuerpoTabla) return; 

    // Mostrar spinner de carga
    cuerpoTabla.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando datos del servidor...</p>
            </td>
        </tr>`;

    try {
        const response = await fetch(API_URL_MATRICULA);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const matriculas = await response.json();
        console.log("Datos recibidos:", matriculas); // Revisa aquí si llegan nombreAlumno y apellidoAlumno

        cuerpoTabla.innerHTML = '';

        if (matriculas.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No hay matrículas registradas
                    </td>
                </tr>`;
            return;
        }

        // Renderizado de filas
        matriculas.forEach(m => {
            // ID DE MATRICULA
            const id = m.idMatricula || m.id_Matricula || m.id;
            let dni="";
            // --- NUEVO: OBTENER NOMBRE DEL ALUMNO ---
            // Leemos los campos que agregaste al DTO en Java
            let nombreCompleto = "---";
            
            if (m.nombreAlumno || m.apellidoAlumno) {
                // Si el backend envía los nombres, los juntamos
                const nombre = m.nombreAlumno || "";
                const apellido = m.apellidoAlumno || "";
                nombreCompleto = `<span class="fw-bold text-dark">${nombre} ${apellido}</span>`;
                dni = m.dni_alumno || "";
            } else {
                // Si no llegan (ej. caché antigua o error), mostramos el ID como respaldo
                const idAl = m.idAlumno || m.id_alumno || "?";
                nombreCompleto = `<span class="text-muted small">ID: ${idAl}</span>`;
            }
            
            // FECHAS
            const fechaRaw = m.fechaMatricula || m.fecha_Matricula || m.Fecha_Matricula;
            let fechaTexto = "---";
            if (fechaRaw) {
                // Usamos UTC para evitar problemas de zona horaria
                fechaTexto = new Date(fechaRaw).toLocaleDateString('es-PE', { timeZone: 'UTC' });
            }

            // DATOS GENERALES
            const periodo = m.periodo || m.Periodo || '';
            const nivel = m.nivel || '';
            const grado = m.grado || '';
            const estado = m.estado || 'ACTIVO';
            const monto = m.montoMatricula || m.monto_Matricula || 0;

            // UI
            const badgeClass = estado === 'ACTIVO' ? 'bg-success' : 'bg-danger';

            const fila = `
                <tr>
                    <td>${id}</td>
                    
                    <td>${nombreCompleto}</td>
                    <td>${dni}</td>
                    
                    <td>${fechaTexto}</td>
                    <td>${periodo}</td>
                    <td>${nivel}</td>
                    <td>${grado}</td> 
                    <td>S/ ${parseFloat(monto).toFixed(2)}</td>
                    <td><span class="badge ${badgeClass}">${estado}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarMatricula(${id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="eliminarMatricula(${id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            cuerpoTabla.innerHTML += fila;
        });

    } catch (error) {
        console.error('Error al listar matrículas:', error);
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                    Error de conexión: ${error.message} <br> 
                    <small>Verifique que el Backend esté corriendo.</small>
                </td>
            </tr>`;
    }
}

// =========================================================
// LÓGICA DE ELIMINACIÓN (DELETE)
// =========================================================

window.eliminarMatricula = async function(id) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta matrícula?\n\nSe eliminarán AUTOMÁTICAMENTE todas las cuotas pendientes asociadas.\n(Si existen pagos realizados, la operación será bloqueada).')) {
        return;
    }
    
    const btn = document.querySelector(`button[onclick="eliminarMatricula(${id})"]`);
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        const response = await fetch(`${API_URL_MATRICULA}/${id}`, { 
            method: 'DELETE' 
        });

        if (response.ok) {
            alert('✅ Matrícula eliminada correctamente.');
            listarMatriculas(); 
        } else {
            const mensajeError = await response.text();
            alert('❌ No se pudo eliminar:\n' + mensajeError);
            listarMatriculas(); 
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error crítico de conexión al intentar eliminar.");
        listarMatriculas();
    }
};

// =========================================================
// EXTRAS
// =========================================================

window.editarMatricula = function(id) {
    alert(`Funcionalidad de editar para ID: ${id} en construcción.`);
};

// Asegurar que la función de listado también sea global
window.listarMatriculas = listarMatriculas;