// =========================================================
// CONFIGURACIÓN
// =========================================================
const API_URL_MATRICULA = '/api/matricula';

// =========================================================
// INICIALIZACIÓN
// =========================================================
function initListarMatriculas() {
    console.log("⚡ Vista de Listar Matrículas detectada. Iniciando...");
    listarMatriculas();
}

document.addEventListener("vista-cargada", (e) => {
    if (e.detail.includes("listarMatriculas.html")) {
        initListarMatriculas();
    }
});

if (document.getElementById('cuerpoTablaMatriculas')) {
    initListarMatriculas();
}

// =========================================================
// LÓGICA DE LISTADO (GET)
// =========================================================
async function listarMatriculas() {
    const cuerpoTabla = document.getElementById('cuerpoTablaMatriculas');
    if (!cuerpoTabla) return; 

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

        matriculas.forEach(m => {
            const id = m.idMatricula || m.id_Matricula || m.id;
            let dni = "";
            let nombreCompleto = "---";
            
            if (m.nombreAlumno || m.apellidoAlumno) {
                const nombre = m.nombreAlumno || "";
                const apellido = m.apellidoAlumno || "";
                nombreCompleto = `<span class="fw-bold text-dark">${nombre} ${apellido}</span>`;
                dni = m.dni_alumno || "";
            } else {
                const idAl = m.idAlumno || m.id_alumno || "?";
                nombreCompleto = `<span class="text-muted small">ID: ${idAl}</span>`;
            }
            
            const fechaRaw = m.fechaMatricula || m.fecha_Matricula || m.Fecha_Matricula;
            let fechaTexto = "---";
            if (fechaRaw) {
                fechaTexto = new Date(fechaRaw).toLocaleDateString('es-PE', { timeZone: 'UTC' });
            }

            const periodo = m.periodo || m.Periodo || '';
            const nivel = m.nivel || '';
            const grado = m.grado || '';
            const estado = m.estado || 'ACTIVO';
            const monto = m.montoMatricula || m.monto_Matricula || 0;

            // --- ESTILOS SEGÚN ESTADO ---
            let badgeClass = 'bg-success';
            let estiloFila = '';
            let btnDisabled = '';

            if (estado === 'ANULADO') {
                badgeClass = 'bg-secondary'; // Gris para anulados
                estiloFila = 'opacity: 0.6; background-color: #f8f9fa;'; 
                btnDisabled = 'disabled';
            } else if (estado !== 'ACTIVO') {
                badgeClass = 'bg-danger';
            }

            const fila = `
                <tr style="${estiloFila}">
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
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="editarMatricula(${id})" 
                                title="Editar" ${btnDisabled}>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-1" 
                                onclick="eliminarMatricula(${id})" 
                                title="Eliminar/Anular" ${btnDisabled}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            cuerpoTabla.innerHTML += fila;
        });

    } catch (error) {
        console.error('Error al listar:', error);
        cuerpoTabla.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error de conexión</td></tr>`;
    }
}

// =========================================================
// LÓGICA DE ELIMINACIÓN INTELIGENTE
// =========================================================
window.eliminarMatricula = async function(id) {
    if (!confirm('⚠️ ¿Estás seguro de procesar esta matrícula?\n\n- Si NO tiene pagos: Se ELIMINARÁ permanentemente.\n- Si TIENE pagos: Se ANULARÁ (conservando historial de pagos).\n\n¿Desea continuar?')) {
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
            const mensaje = await response.text();
            alert(`✅ Operación Exitosa:\n${mensaje}`);
            listarMatriculas(); 
        } else {
            const mensajeError = await response.text();
            alert('❌ Error:\n' + mensajeError);
            listarMatriculas(); 
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error de conexión.");
        listarMatriculas();
    }
};

window.editarMatricula = function(id) {
    alert(`Editar ID: ${id} en construcción.`);
};

window.listarMatriculas = listarMatriculas;