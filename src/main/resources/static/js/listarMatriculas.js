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
        console.log("Datos recibidos:", matriculas); // Para depuración

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
            // --- MAPEO DE DATOS ROBUSTO ---
            // Intenta leer el nombre nuevo (camelCase), si falla usa el antiguo
            const id = m.idMatricula || m.id_Matricula;
            
            // Obtener ID alumno (soporta objeto anidado o ID directo)
            let idAlumno = 'N/A';
            if (m.alumno && m.alumno.idAlumno) idAlumno = m.alumno.idAlumno; // Objeto completo corregido
            else if (m.alumno && m.alumno.Id_Alumno) idAlumno = m.alumno.Id_Alumno; // Objeto antiguo
            else if (m.idAlumno) idAlumno = m.idAlumno; // ID directo
            else if (m.id_alumno) idAlumno = m.id_alumno; // ID directo antiguo
            
            // Fechas
            const fechaRaw = m.fechaMatricula || m.fecha_Matricula || m.Fecha_Matricula;
            let fechaTexto = "---";
            if (fechaRaw) {
                // toLocaleDateString suele usar la zona horaria local, lo que puede restar un día
                // Usamos UTC para asegurar consistencia
                fechaTexto = new Date(fechaRaw).toLocaleDateString('es-PE', { timeZone: 'UTC' });
            }

            // Datos generales
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
                    <td>${idAlumno}</td>
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

// Hacemos la función global para que el HTML onclick pueda verla
window.eliminarMatricula = async function(id) {
    // 1. Confirmación de seguridad
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta matrícula?\n\nSe eliminarán AUTOMÁTICAMENTE todas las cuotas pendientes asociadas.\n(Si existen pagos realizados, la operación será bloqueada).')) {
        return;
    }
    
    // 2. Feedback visual (Desactivar botones para evitar doble clic)
    const btn = document.querySelector(`button[onclick="eliminarMatricula(${id})"]`);
    if(btn) {
        const contenidoOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        // 3. Petición al Backend
        const response = await fetch(`${API_URL_MATRICULA}/${id}`, { 
            method: 'DELETE' 
        });

        if (response.ok) {
            // Éxito (Status 200 o 204)
            alert('✅ Matrícula eliminada correctamente.');
            listarMatriculas(); // Recargar la tabla
        } else {
            // Error controlado (ej: tiene pagos asociados)
            const mensajeError = await response.text();
            alert('❌ No se pudo eliminar:\n' + mensajeError);
            listarMatriculas(); // Recargar para restaurar botones
        }

    } catch (error) {
        // Error de red
        console.error(error);
        alert("❌ Error crítico de conexión al intentar eliminar.");
        listarMatriculas();
    }
};

// =========================================================
// EXTRAS
// =========================================================

window.editarMatricula = function(id) {
    // Aquí puedes redirigir a tu formulario de edición o abrir un modal
    alert(`Funcionalidad de editar para ID: ${id} en construcción.`);
};

// Asegurar que la función de listado también sea global por si acaso
window.listarMatriculas = listarMatriculas;