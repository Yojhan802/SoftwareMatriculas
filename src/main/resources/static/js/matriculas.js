// =========================================================
// CONSTANTES Y CONFIGURACIÓN
// =========================================================
const API_MATRICULA = "/api/matricula"; 
const TABLE_BODY_ID = "alumnos-list-body"; // ID del <tbody> donde listamos las matrículas
const INPUT_ALUMNO_ID = "input-alumno-id"; 
const SELECT_PERIODO_ID = "select-periodo";
const INPUT_FECHA_MATRICULA_ID = "input-fecha-matricula"; 

// =========================================================
// INICIALIZACIÓN
// =========================================================
function initMatriculas() {
    const tableBody = document.getElementById(TABLE_BODY_ID);
    if (!tableBody) return;

    // Llenar la lista inicial al cargar
    cargarMatriculas();
}

document.addEventListener("DOMContentLoaded", initMatriculas);


// =========================================================
// UTILIDADES
// =========================================================

// Función para parsear la fecha que viene del backend a formato DD/MM/YYYY
function formatearFechaTabla(fechaIso) {
    if (!fechaIso) return "";
    try {
        const datePart = fechaIso.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return fechaIso;
    }
}

// Obtiene los datos del formulario Matrícula para el POST/PUT
function obtenerDatosFormularioMatricula(idMatricula = null) {
    // Es crucial que el campo de alumnoID esté lleno previamente (por una búsqueda)
    const alumnoId = document.getElementById(INPUT_ALUMNO_ID)?.value; 
    const periodo = document.getElementById(SELECT_PERIODO_ID)?.value;
    // Obtiene la fecha del input o la fecha actual si no hay valor
    const fechaMatricula = document.getElementById(INPUT_FECHA_MATRICULA_ID)?.value || new Date().toISOString().split('T')[0];

    if (!alumnoId || !periodo) {
        throw new Error("Por favor, seleccione un alumno y un periodo válidos.");
    }
    
    const matriculaData = {
        ...(idMatricula && { id_Matricula: idMatricula }), 
        
        // Estructura de la Entidad esperada por tu API de Spring
        alumno: {
            id_Alumno: parseInt(alumnoId) 
        },
        Fecha_Matricula: fechaMatricula, // Nombre de propiedad de la Entidad
        Periodo: periodo                  // Nombre de propiedad de la Entidad
    };
    return matriculaData;
}


// =========================================================
// CRUD: LISTAR (GET /api/matricula)
// =========================================================
async function cargarMatriculas() {
    try {
        const res = await fetch(API_MATRICULA);
        
        if (!res.ok) throw new Error(`Error al cargar matrículas: ${res.status}`);
        
        const data = await res.json(); 
        const body = document.getElementById(TABLE_BODY_ID);
        if (!body) return;

        body.innerHTML = ""; 

        data.forEach((m) => {
            body.innerHTML += `
                <tr>
                    <td>${m.id_Matricula}</td> 
                    <td>${m.id_alumno}</td> 
                    <td>${m.periodo ?? ""}</td>
                    <td>${formatearFechaTabla(m.fecha_Matricula)}</td>
                    <td>
                        <button class="button btn-secondary" title="Editar Matrícula" onclick="editarMatricula(${m.id_Matricula})">📝</button>
                        <button class="button btn-danger" title="Eliminar Matrícula" onclick="eliminarMatricula(${m.id_Matricula})">🗑️</button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error cargando matrículas:", error);
        alert(`Error al listar matrículas: ${error.message}`);
    }
}


// =========================================================
// CRUD: OBTENER/EDITAR (GET /api/matricula/{id})
// =========================================================
async function obtenerMatricula(id) {
    try {
        const res = await fetch(`${API_MATRICULA}/${id}`);
        
        if (!res.ok) throw new Error(`Matrícula ID ${id} no encontrada.`);
        
        const m = await res.json(); // MatriculaDTO
        
        // Llenar los campos del formulario con los datos para editar
        document.getElementById("matriculaIdHidden").value = m.id_Matricula; 
        document.getElementById("modalTituloMatricula").innerText = `Editar Matrícula ID: ${m.id_Matricula}`;

        // Llenar datos de la Matrícula
        document.getElementById(INPUT_ALUMNO_ID).value = m.id_alumno;
        document.getElementById(SELECT_PERIODO_ID).value = m.periodo;
        document.getElementById(INPUT_FECHA_MATRICULA_ID).value = m.fecha_Matricula.split('T')[0]; // YYYY-MM-DD
        
        // Simular info del alumno seleccionado (solo con el ID, idealmente buscarías el nombre)
        document.getElementById("alumno-seleccionado-info").innerText = `Alumno Seleccionado: ID ${m.id_alumno}`;

        // Mover al paso 2 para iniciar la edición
        goToStep(2); 

    } catch (error) {
        console.error("Error obteniendo matrícula:", error);
        alert(`Error al cargar datos para edición: ${error.message}`);
    }
}

function editarMatricula(id) {
    // Limpiar formulario antes de cargar nuevos datos
    limpiarFormularioMatricula(); 
    obtenerMatricula(id);
}


// =========================================================
// CRUD: CREAR / ACTUALIZAR (POST /api/matricula o PUT /api/matricula/{id})
// =========================================================
async function guardarMatricula() {
    const id = document.getElementById("matriculaIdHidden")?.value || ""; 
    const isUpdating = id !== "";
    
    try {
        const matricula = obtenerDatosFormularioMatricula(isUpdating ? parseInt(id) : null);
        
        const url = isUpdating ? `${API_MATRICULA}/${id}` : API_MATRICULA;
        const method = isUpdating ? "PUT" : "POST";
        const successMessage = isUpdating ? "Matrícula actualizada con éxito." : "Matrícula creada y cuotas generadas con éxito.";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matricula),
        });

        if (!res.ok) {
             const errorData = await res.json().catch(() => ({ message: res.statusText }));
             throw new Error(`Error al guardar. Código: ${res.status}. Detalle: ${errorData.message || res.statusText}`);
        }

        const matriculaGuardada = await res.json(); 
        
        alert(successMessage + ` ID: ${matriculaGuardada.id_Matricula}`);
        
        limpiarFormularioMatricula(); 
        goToStep(1); 
        cargarMatriculas(); 

    } catch (error) {
        console.error("Error guardando matrícula:", error);
        alert(`Fallo en el guardado: ${error.message}`);
    }
}


// =========================================================
// CRUD: ELIMINAR (DELETE /api/matricula/{id})
// =========================================================
async function eliminarMatricula(id) {
    if (!confirm(`¿Está seguro de eliminar la matrícula ID ${id}?`)) {
        return;
    }

    try {
        const res = await fetch(`${API_MATRICULA}/${id}`, {
            method: "DELETE"
        });

        if (res.status === 204) { 
            alert(`Matrícula ID ${id} eliminada con éxito.`);
            cargarMatriculas(); 
        } else {
            const errorText = await res.text();
            throw new Error(`Error al eliminar. Código: ${res.status}. Detalle: ${errorText}`);
        }

    } catch (error) {
        console.error("Error eliminando matrícula:", error);
        alert(`Error de eliminación: ${error.message}`);
    }
}


// =========================================================
// LIMPIEZA
// =========================================================
function limpiarFormularioMatricula() {
    // Limpiar campos de IDs y títulos
    document.getElementById("matriculaIdHidden").value = ""; 
    document.getElementById("modalTituloMatricula").innerText = "📝 Proceso de Nueva Matrícula";
    
    // Limpiar campos de formulario
    document.getElementById(INPUT_ALUMNO_ID).value = ""; 
    document.getElementById(SELECT_PERIODO_ID).value = new Date().getFullYear(); 
    document.getElementById(INPUT_FECHA_MATRICULA_ID).value = new Date().toISOString().split('T')[0];
    
    // Limpiar datos de alumno y previsualización
    document.getElementById("alumno-seleccionado-info").innerText = "Alumno Seleccionado: **Ninguno**";
    document.getElementById("cuotas-preview-body").innerHTML = ""; 
}

// Exposición global para los eventos onclick en el HTML
window.cargarMatriculas = cargarMatriculas;
window.obtenerMatricula = obtenerMatricula;
window.editarMatricula = editarMatricula;
window.eliminarMatricula = eliminarMatricula;
window.guardarMatricula = guardarMatricula; 
window.limpiarFormularioMatricula = limpiarFormularioMatricula;