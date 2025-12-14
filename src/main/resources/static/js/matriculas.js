// =========================================================
// CONFIGURACIÓN DE API Y VARIABLES GLOBALES
// =========================================================
const API_ALUMNOS_BASE = "/api/alumnos"; 
const API_MATRICULA = "/api/matricula"; 

let alumnoSeleccionado = null; 
let matriculaPayload = {};     

// Listas de Grados constantes
const GRADOS_PRIMARIA = [
    "Primer Grado", "Segundo Grado", "Tercer Grado", 
    "Cuarto Grado", "Quinto Grado", "Sexto Grado"
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
    
    // NUEVO: Listener para el Nivel
    asignarEvento('nivel-select', 'change', actualizarGradosPorNivel);
    // Listener para validar cuando cambie el grado
    asignarEvento('grado-select', 'change', validarPaso2);

    asignarEvento('btn-atras-paso3', 'click', goToStep2);
    asignarEvento('btn-confirmar-matricula', 'click', confirmarMatricula);

    // --- NUEVO: VALIDACIÓN DE INPUT DNI EN TIEMPO REAL ---
    const dniInput = document.getElementById('alumno-search-input');
    if (dniInput) {
        dniInput.addEventListener('input', function() {
            // 1. Reemplazar cualquier caracter que NO sea número (0-9) por vacío
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // 2. Si la longitud es mayor a 8, cortar el string
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
    document.getElementById('alumno-seleccionado-info').style.display = 'none';
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
// NAVEGACIÓN ENTRE PASOS
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
// PASO 1: BÚSQUEDA
// =========================================================

async function buscarAlumno() {
    const inputDni = document.getElementById('alumno-search-input');
    const dni = inputDni.value.trim();
    const btnBuscar = document.getElementById('btn-buscar-alumno');
    const infoDiv = document.getElementById('alumno-seleccionado-info');

    if (!dni || dni.length < 8) {
        alert("Por favor ingrese un DNI válido.");
        return;
    }

    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Buscando...';
    infoDiv.style.display = 'none';

    const url = `${API_ALUMNOS_BASE}/dni/${dni}`;

    try {
        const response = await fetch(url);

        if (response.status === 404) {
            alert("No se encontró ningún alumno con ese DNI.");
            alumnoSeleccionado = null;
            document.getElementById('btn-siguiente-paso1').disabled = true;
        } else if (response.ok) {
            const data = await response.json();
            
            if (data.IdAlumno) {
                alumnoSeleccionado = {
                    id: data.IdAlumno,
                    dni: data.dniAlumno,
                    nombreCompleto: `${data.Nombre} ${data.Apellido}`
                };

                document.getElementById('nombre-alumno-display').textContent = alumnoSeleccionado.nombreCompleto;
                document.getElementById('dni-alumno-display').textContent = alumnoSeleccionado.dni;
                
                infoDiv.style.display = 'block';
                infoDiv.className = 'alert alert-success mt-3';
                document.getElementById('btn-siguiente-paso1').disabled = false;
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
// PASO 2: DATOS (NUEVA LÓGICA)
// =========================================================

// Función que se ejecuta al cambiar el Nivel
function actualizarGradosPorNivel() {
    const nivelSelect = document.getElementById('nivel-select');
    const gradoSelect = document.getElementById('grado-select');
    const nivel = nivelSelect.value;

    // Limpiar opciones previas
    gradoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Grado</option>';
    
    let opciones = [];
    if (nivel === 'Primaria') {
        opciones = GRADOS_PRIMARIA;
    } else if (nivel === 'Secundaria') {
        opciones = GRADOS_SECUNDARIA;
    }

    // Llenar el select
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

    // Validar el botón siguiente (se desactivará porque el grado se reseteó)
    validarPaso2();
}

function validarPaso2() {
    const nivel = document.getElementById('nivel-select').value;
    const grado = document.getElementById('grado-select').value;
    const btnNext = document.getElementById('btn-siguiente-paso2');
    
    // Solo habilitar si Nivel Y Grado tienen valor
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

    // Guardar payload
    matriculaPayload = {
        id_alumno: alumnoSeleccionado.id,
        Periodo: periodo,
        fecha_Matricula: fecha,
        nivel: nivel, // Agregado al payload
        grado: grado
    };

    // Renderizar resumen
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
        { c: 'Matrícula', m: costoMatricula, f: `${periodo}-02-28` },
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