// =========================================================
// CONFIGURACIÓN DE API Y VARIABLES GLOBALES
// =========================================================
// API para buscar alumnos (Ajustada a tu puerto y endpoint)
const API_ALUMNOS_BASE = "/api/alumnos"; 
// API para guardar la matrícula (Ajusta esto si tu backend es distinto)
const API_MATRICULA = "/api/matriculas"; 

let alumnoSeleccionado = null; // Guardará: {id, dni, nombreCompleto}
let matriculaPayload = {};     // Datos temporales para enviar al final

// =========================================================
// INICIALIZACIÓN
// =========================================================

// Función principal de arranque
function initMatriculas() {
    console.log("Inicializando módulo de Matrículas...");
    
    // 1. Resetear variables y UI
    alumnoSeleccionado = null;
    matriculaPayload = {};
    showStep(1); 
    resetUI();

    // 2. Asignar Event Listeners (con verificación para no duplicar)
    asignarEvento('btn-buscar-alumno', 'click', buscarAlumno);
    asignarEvento('btn-siguiente-paso1', 'click', goToStep2);
    
    asignarEvento('btn-atras-paso2', 'click', goToStep1);
    asignarEvento('btn-siguiente-paso2', 'click', goToStep3);
    asignarEvento('grado-select', 'change', validarPaso2);

    asignarEvento('btn-atras-paso3', 'click', goToStep2);
    asignarEvento('btn-confirmar-matricula', 'click', confirmarMatricula);
}

// Helper para asignar eventos de forma segura
function asignarEvento(id, evento, funcion) {
    const el = document.getElementById(id);
    if (el) {
        // Clonar el nodo elimina listeners previos para evitar duplicados si recargas la vista
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener(evento, funcion);
    }
}

function resetUI() {
    document.getElementById('alumno-search-input').value = '';
    document.getElementById('alumno-seleccionado-info').style.display = 'none';
    document.getElementById('btn-siguiente-paso1').disabled = true;
    document.getElementById('grado-select').selectedIndex = 0;
}

// Detectar carga de vista (Si usas un SPA loader)
document.addEventListener("DOMContentLoaded", initMatriculas);
// Opcional: si tu sistema dispara un evento personalizado al cargar HTML
document.addEventListener("vista-cargada", (e) => {
    if (e.detail && e.detail.includes("matriculas")) initMatriculas();
});

// =========================================================
// NAVEGACIÓN ENTRE PASOS
// =========================================================

function showStep(stepNumber) {
    // Ocultar todos
    [1, 2, 3].forEach(num => {
        const el = document.getElementById(`step-${num}`);
        if(el) el.style.display = 'none';
    });
    
    // Mostrar el actual con animación simple
    const current = document.getElementById(`step-${stepNumber}`);
    if (current) {
        current.style.display = 'block';
        current.classList.add('fade-in'); // Asegúrate de tener CSS para animación o quítalo
    }
}

function cancelarMatricula() {
    if (confirm('¿Cancelar proceso? Se perderán los datos.')) {
        // Redirige al dashboard o limpia el formulario
        window.location.href = '#'; // O tu lógica de routing: loadView('dashboard.html')
        resetUI();
        showStep(1);
    }
}

// =========================================================
// PASO 1: BÚSQUEDA (CONSUMO API REST)
// =========================================================

async function buscarAlumno() {
    const inputDni = document.getElementById('alumno-search-input');
    const dni = inputDni.value.trim();
    const btnBuscar = document.getElementById('btn-buscar-alumno');
    const infoDiv = document.getElementById('alumno-seleccionado-info');

    // Validación básica
    if (!dni || dni.length < 8) {
        alert("Por favor ingrese un DNI válido.");
        return;
    }

    // UI: Loading
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Buscando...';
    infoDiv.style.display = 'none';

    // Construcción de la URL: http://localhost:8097/api/alumnos/{dni}
    const url = `${API_ALUMNOS_BASE}/dni/${dni}`;

    try {
        const response = await fetch(url);

        if (response.status === 404) {
            alert("No se encontró ningún alumno con ese DNI.");
            alumnoSeleccionado = null;
            document.getElementById('btn-siguiente-paso1').disabled = true;
        } else if (response.ok) {
            const data = await response.json();
            
            // Mapeo de tu respuesta JSON: { IdAlumno, dniAlumno, Nombre, Apellido ... }
            if (data.IdAlumno) {
                alumnoSeleccionado = {
                    id: data.IdAlumno,
                    dni: data.dniAlumno,
                    nombreCompleto: `${data.Nombre} ${data.Apellido}`
                };

                // Mostrar datos en pantalla
                document.getElementById('nombre-alumno-display').textContent = alumnoSeleccionado.nombreCompleto;
                document.getElementById('dni-alumno-display').textContent = alumnoSeleccionado.dni;
                
                infoDiv.style.display = 'block';
                infoDiv.className = 'alert alert-success mt-3'; // Asegurar estilo verde
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
        // Restaurar botón
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar';
    }
}

function goToStep2() {
    if (!alumnoSeleccionado) return;
    
    // Preparar Paso 2
    document.getElementById('hidden-alumno-id').value = alumnoSeleccionado.id;
    // Poner fecha de hoy
    document.getElementById('fecha-matricula').value = new Date().toLocaleDateString('en-CA');;
    
    validarPaso2(); // Verificar si el botón debe estar activo
    showStep(2);
}

function goToStep1() {
    showStep(1);
}

// =========================================================
// PASO 2: DATOS
// =========================================================

function validarPaso2() {
    const grado = document.getElementById('grado-select').value;
    const btnNext = document.getElementById('btn-siguiente-paso2');
    // Solo habilitar si hay grado seleccionado
    btnNext.disabled = (grado === "" || grado === null);
}

function goToStep3() {
    const grado = document.getElementById('grado-select').value;
    const periodo = document.getElementById('anio-escolar').value;
    const fecha = document.getElementById('fecha-matricula').value;

    if (!grado) {
        alert("Debe seleccionar un grado.");
        return;
    }

    // Guardar en objeto temporal
    matriculaPayload = {
        id_Alumno: alumnoSeleccionado.id, // Tu API espera un ID de alumno
        periodo: periodo,
        fecha: fecha,
        grado: grado
    };

    // Renderizar resumen
    document.getElementById('resumen-nombre-alumno').textContent = alumnoSeleccionado.nombreCompleto;
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

    // Lógica simulada (esto debería venir del backend idealmente)
    const costoMatricula = 150.00;
    const costoPension = 100.00;

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
    
    // UI Loading
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
            // Reiniciar todo o ir al listado
            initMatriculas(); 
            // window.loadView('lista-matriculas.html'); // Si tienes navegación
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