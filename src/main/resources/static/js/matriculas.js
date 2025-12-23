// =========================================================
// CONFIGURACIÓN DE API Y VARIABLES GLOBALES
// =========================================================
const API_ALUMNOS_BASE = "/api/alumnos"; 
const API_MATRICULA = "/api/matricula"; 

let alumnoSeleccionado = null; 
let matriculaPayload = {};     

// Listas de Grados constantes
const GRADOS_PRIMARIA = [
    "Primer Año", "Segundo Año", "Tercer Año", 
    "Cuarto Año", "Quinto Año", "Sexto Año"
];
const GRADOS_SECUNDARIA = [
    "Primer Año", "Segundo Año", "Tercer Año", 
    "Cuarto Año", "Quinto Año"
];

// =========================================================
// INICIALIZACIÓN
// =========================================================

function initMatriculas() {
    console.log("Inicializando módulo de Matrículas...");
    
    // 1. Resetear variables y UI
    alumnoSeleccionado = null;
    matriculaPayload = {};
    showStep(1); 
    resetUI();

    // 2. Asignar Event Listeners
    asignarEvento('btn-buscar-alumno', 'click', buscarAlumno);
    asignarEvento('btn-siguiente-paso1', 'click', goToStep2);
    
    asignarEvento('btn-atras-paso2', 'click', goToStep1);
    asignarEvento('btn-siguiente-paso2', 'click', goToStep3);
    
    asignarEvento('nivel-select', 'change', actualizarGradosPorNivel);
    asignarEvento('grado-select', 'change', validarPaso2);

    asignarEvento('btn-atras-paso3', 'click', goToStep2);
    asignarEvento('btn-confirmar-matricula', 'click', confirmarMatricula);

    // Validación input DNI (solo números, max 8)
    const dniInput = document.getElementById('alumno-search-input');
    if (dniInput) {
        dniInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }
        });
    }
}

function asignarEvento(id, evento, funcion) {
    const el = document.getElementById(id);
    if (el) {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener(evento, funcion);
    }
}

function resetUI() {
    document.getElementById('alumno-search-input').value = '';
    
    // Ocultar ambas alertas
    document.getElementById('alumno-seleccionado-info').style.display = 'none';
    const alertaYaMatriculado = document.getElementById('alerta-ya-matriculado');
    if(alertaYaMatriculado) alertaYaMatriculado.style.display = 'none';

    document.getElementById('btn-siguiente-paso1').disabled = true;
    
    // Resetear selects del paso 2
    document.getElementById('nivel-select').selectedIndex = 0;
    const gradoSelect = document.getElementById('grado-select');
    gradoSelect.innerHTML = '<option value="" disabled selected>Seleccione Nivel primero</option>';
    gradoSelect.disabled = true;
}

document.addEventListener("DOMContentLoaded", initMatriculas);
document.addEventListener("vista-cargada", (e) => {
    if (e.detail && e.detail.includes("matriculas")) initMatriculas();
});

// =========================================================
// NAVEGACIÓN
// =========================================================

function showStep(stepNumber) {
    [1, 2, 3].forEach(num => {
        const el = document.getElementById(`step-${num}`);
        if(el) el.style.display = 'none';
    });
    
    const current = document.getElementById(`step-${stepNumber}`);
    if (current) {
        current.style.display = 'block';
        current.classList.add('fade-in'); 
    }
}

function cancelarMatricula() {
    if (confirm('¿Cancelar proceso? Se perderán los datos.')) {
        window.location.href = '#'; 
        resetUI();
        showStep(1);
    }
}

// =========================================================
// PASO 1: BÚSQUEDA Y VERIFICACIÓN (LÓGICA NUEVA)
// =========================================================

// Función que descarga la lista de matrículas y busca si el alumno ya existe
async function verificarEstadoMatricula(idAlumno) {
    // URL: GET /api/matricula (Ya existe en tu controlador)
    const url = API_MATRICULA; 
    const anioActual = '2026'; 

    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const listaMatriculas = await response.json();
            
            // Debug para ver cómo llegan los datos del backend
            console.log("Matriculas cargadas:", listaMatriculas);
            console.log("Buscando ID:", idAlumno);

            // Buscamos coincidencia.
            // NOTA: Probamos varias formas de escribir el ID por si acaso el DTO cambia
            const existe = listaMatriculas.some(m => {
                // Obtenemos el ID del alumno de la fila actual
                const idEnLista = m.idAlumno || m.id_alumno || m.IdAlumno || (m.alumno && m.alumno.id);
                // Obtenemos el periodo
                const periodoEnLista = m.Periodo || m.periodo || m.anio;

                // Comparamos como Strings para evitar errores de tipo (numero vs texto)
                return (idEnLista && idEnLista.toString() === idAlumno.toString()) && 
                       (periodoEnLista && periodoEnLista.toString() === anioActual);
            });

            return existe;
        } 
        return false; 
    } catch (error) {
        console.error("Error verificando:", error);
        return false;
    }
}

async function buscarAlumno() {
    const inputDni = document.getElementById('alumno-search-input');
    const dni = inputDni.value.trim();
    const btnBuscar = document.getElementById('btn-buscar-alumno');
    
    // Elementos UI
    const infoDiv = document.getElementById('alumno-seleccionado-info');
    const alertaError = document.getElementById('alerta-ya-matriculado');
    const btnSiguiente = document.getElementById('btn-siguiente-paso1');

    if (!dni || dni.length < 8) {
        alert("Por favor ingrese un DNI válido.");
        return;
    }

    // UI Loading
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Buscando...';
    
    infoDiv.style.display = 'none';
    if(alertaError) alertaError.style.display = 'none';
    btnSiguiente.disabled = true;
    alumnoSeleccionado = null;

    const url = `${API_ALUMNOS_BASE}/dni/${dni}`;

    try {
        const response = await fetch(url);

        if (response.status === 404) {
            alert("No se encontró ningún alumno con ese DNI.");
        } else if (response.ok) {
            const data = await response.json();
            
            if (data.IdAlumno) {
                const tempAlumno = {
                    id: data.IdAlumno,
                    dni: data.dniAlumno,
                    nombreCompleto: `${data.Nombre} ${data.Apellido}`
                };

                // === AQUÍ VERIFICAMOS SI YA ESTÁ EN LA LISTA ===
                const yaMatriculado = await verificarEstadoMatricula(tempAlumno.id);

                if (yaMatriculado) {
                    // SI YA EXISTE: MOSTRAR ALERTA AMARILLA
                    if(alertaError) {
                        document.getElementById('nombre-alumno-error').textContent = tempAlumno.nombreCompleto;
                        alertaError.style.display = 'block';
                    } else {
                        alert(`El alumno ${tempAlumno.nombreCompleto} YA está matriculado.`);
                    }
                    // NO habilitamos el botón siguiente
                } else {
                    // SI NO EXISTE: FLUJO NORMAL
                    alumnoSeleccionado = tempAlumno;
                    document.getElementById('nombre-alumno-display').textContent = alumnoSeleccionado.nombreCompleto;
                    document.getElementById('dni-alumno-display').textContent = alumnoSeleccionado.dni;
                    
                    infoDiv.style.display = 'block';
                    btnSiguiente.disabled = false;
                }

            } else {
                alert("La respuesta del servidor no contiene un ID válido.");
            }
        } else {
            throw new Error("Error en el servidor: " + response.status);
        }

    } catch (error) {
        console.error("Error Fetch:", error);
        alert("Error de conexión con el servicio de alumnos.");
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar';
    }
}

function goToStep2() {
    if (!alumnoSeleccionado) return;
    
    document.getElementById('hidden-alumno-id').value = alumnoSeleccionado.id;
    // Fecha actual formato YYYY-MM-DD
    document.getElementById('fecha-matricula').value = new Date().toISOString().split('T')[0];
    
    validarPaso2(); 
    showStep(2);
}

function goToStep1() {
    showStep(1);
}

// =========================================================
// PASO 2: DATOS 
// =========================================================

function actualizarGradosPorNivel() {
    const nivelSelect = document.getElementById('nivel-select');
    const gradoSelect = document.getElementById('grado-select');
    const nivel = nivelSelect.value;

    gradoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Grado</option>';
    
    let opciones = [];
    if (nivel === 'Primaria') {
        opciones = GRADOS_PRIMARIA;
    } else if (nivel === 'Secundaria') {
        opciones = GRADOS_SECUNDARIA;
    }

    if (opciones.length > 0) {
        gradoSelect.disabled = false;
        opciones.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado;
            option.textContent = grado;
            gradoSelect.appendChild(option);
        });
    } else {
        gradoSelect.disabled = true;
    }

    validarPaso2();
}

function validarPaso2() {
    const nivel = document.getElementById('nivel-select').value;
    const grado = document.getElementById('grado-select').value;
    const btnNext = document.getElementById('btn-siguiente-paso2');
    
    const esValido = (nivel !== "" && nivel !== null) && (grado !== "" && grado !== null);
    
    btnNext.disabled = !esValido;
}

function goToStep3() {
    const nivel = document.getElementById('nivel-select').value;
    const grado = document.getElementById('grado-select').value;
    const periodo = document.getElementById('anio-escolar').value;
    const fecha = document.getElementById('fecha-matricula').value;

    if (!grado || !nivel) {
        alert("Debe seleccionar Nivel y Grado.");
        return;
    }

    // Payload para enviar al backend
    matriculaPayload = {
        id_alumno: alumnoSeleccionado.id, // Asegúrate que tu DTO espera "id_alumno" o "idAlumno"
        Periodo: periodo,
        fecha_Matricula: fecha,
        nivel: nivel,
        grado: grado
    };

    document.getElementById('resumen-nombre-alumno').textContent = alumnoSeleccionado.nombreCompleto;
    document.getElementById('resumen-nivel').textContent = nivel;
    document.getElementById('resumen-grado').textContent = grado;
    
    generarCuotasSimuladas(grado, periodo);
    showStep(3);
}

// =========================================================
// PASO 3: CONFIRMACIÓN Y CUOTAS
// =========================================================

function generarCuotasSimuladas(grado, periodo) {
    const tbody = document.getElementById('cuotas-preview-body');
    tbody.innerHTML = '';

    const costoMatricula = 150.00;
    const costoPension = 350.00;

    const cuotas = [
        { c: 'Matrícula', m: costoMatricula, f: `${periodo}-03-31` },
        { c: 'Pensión Marzo', m: costoPension, f: `${periodo}-03-31` },
        { c: 'Pensión Abril', m: costoPension, f: `${periodo}-04-30` },
        { c: 'Pensión Mayo', m: costoPension, f: `${periodo}-05-31` }
    ];

    cuotas.forEach(item => {
        const row = `<tr>
            <td>${item.c}</td>
            <td>S/ ${item.m.toFixed(2)}</td>
            <td>${item.f}</td>
            <td><span class="badge bg-warning text-dark">Pendiente</span></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

async function confirmarMatricula() {
    const btnConfirmar = document.getElementById('btn-confirmar-matricula');
    
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
        const response = await fetch(API_MATRICULA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matriculaPayload)
        });

        if (response.ok) {
            alert(`✅ Matrícula guardada exitosamente para ${alumnoSeleccionado.nombreCompleto}`);
            initMatriculas(); 
        } else {
            // Intenta leer error si es texto o JSON
            const errorTxt = await response.text();
            alert("Error al guardar matrícula: " + errorTxt);
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al guardar.");
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i> Confirmar Matrícula';
    }
}