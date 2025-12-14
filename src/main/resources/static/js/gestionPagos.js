// ---------------------------------------------------------
// CONSTANTES API
// ---------------------------------------------------------
const API_GESTION_PAGOS = "/api/gestion-pagos";
const API_REALIZAR_PAGO = "/api/pagos/realizar";

// Variable global para almacenar las cuotas cargadas
let cuotasActuales = [];

// ---------------------------------------------------------
// INICIALIZACIÓN (Patrón SPA)
// ---------------------------------------------------------
function initGestionPagos() {
    const sectionA = document.getElementById("section-A");
    const sectionB = document.getElementById("section-B");
    
    // Si no existen las secciones, no hacemos nada (protección)
    if (!sectionA || !sectionB) return;

    limpiarFormularios();

    // LEER EL MODO SELECCIONADO EN EL SIDEBAR
    // La variable 'modoVistaPagos' se define en el index.html del Dashboard
    if (typeof modoVistaPagos !== 'undefined' && modoVistaPagos === 'ANULAR') {
        mostrarSeccionAnulacion();
    } else {
        mostrarSeccionPago(); // Por defecto o si es 'PAGAR'
    }
}

// Detector de eventos para carga dinámica desde el Dashboard
document.addEventListener("vista-cargada", (e) => {
    // Asegúrate de que este string coincida con la ruta que usas en loadView
    if (e.detail.includes("gestionPagos.html")) {
        initGestionPagos();
    }
});

// Detector de carga estándar (por si se abre el HTML directo para pruebas)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGestionPagos);
} else {
    // Si el script carga después del HTML
    initGestionPagos();
}

// ---------------------------------------------------------
// CONTROL DE VISTAS (Lógica del Sidebar)
// ---------------------------------------------------------

function mostrarSeccionPago() {
    const secA = document.getElementById('section-A');
    const secB = document.getElementById('section-B');
    if(!secA || !secB) return;

    secA.classList.remove('hidden'); // Mostrar A
    secB.classList.add('hidden');    // Ocultar B
    
    // Opcional: Actualizar título visualmente
    const titulo = document.querySelector('.payment-title');
    if(titulo) titulo.innerHTML = '💸 Proceso de Pago';
}

function mostrarSeccionAnulacion() {
    const secA = document.getElementById('section-A');
    const secB = document.getElementById('section-B');
    if(!secA || !secB) return;

    secA.classList.add('hidden');    // Ocultar A
    secB.classList.remove('hidden'); // Mostrar B

    // Opcional: Actualizar título visualmente
    const titulo = document.querySelector('.payment-title');
    if(titulo) titulo.innerHTML = '🚫 Anulación de Recibos';
}

function limpiarFormularios() {
    const inputAlumno = document.getElementById("inputBuscarAlumno");
    const inputRecibo = document.getElementById("inputBuscarRecibo");
    
    if(inputAlumno) inputAlumno.value = "";
    if(inputRecibo) inputRecibo.value = "";
    
    const tablaBody = document.getElementById("tablaCuotasBody");
    if(tablaBody) tablaBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Ingrese un alumno para buscar.</td></tr>';
    
    const totalLabel = document.getElementById("totalPagar");
    if(totalLabel) totalLabel.innerText = "Total: S/ 0.00";
    
    const divRecibo = document.getElementById("resultadoRecibo");
    if(divRecibo) divRecibo.style.display = 'none';
}

// ---------------------------------------------------------
// ÁREA A: BUSCAR DEUDAS
// ---------------------------------------------------------
async function buscarDeudas() {
    try {
        const termino = document.getElementById('inputBuscarAlumno').value;
        if(!termino) {
            alert("Por favor, escribe un nombre o apellido.");
            return;
        }

        // AGREGADO: { credentials: 'include' }
        const res = await fetch(`${API_GESTION_PAGOS}/pendientes?termino=${termino}`, {
            method: 'GET',        // Es buena práctica poner el método
            credentials: 'include' // <--- ESTO ES LO QUE TE FALTA
        });

        if(!res.ok) throw new Error("Error en la petición al servidor");

        cuotasActuales = await res.json();
        renderizarTablaCuotas();

    } catch (error) {
        console.error("Error buscando deudas:", error);
        alert("Error al cargar las deudas del alumno. Revise la consola.");
    }
}

function renderizarTablaCuotas() {
    const body = document.getElementById("tablaCuotasBody");
    if (!body) return;

    body.innerHTML = "";

    if(cuotasActuales.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px;">No se encontraron cuotas pendientes para este alumno.</td></tr>';
        return;
    }

    cuotasActuales.forEach((c, index) => {
        let checkboxHTML = '';

        if(c.estado === 'PAGADO') {
            checkboxHTML = '<span style="color:green; font-size:1.2em;">✅</span>';
        } else {
            // Checkbox con data-attributes para cálculos
            checkboxHTML = `<input type="checkbox" class="chk-pago"
                            data-index="${index}"

                            data-id="${c.idCuota}"  data-monto="${c.monto}"
                            onchange="calcularTotalYValidacion()">`;
        }

        const badgeClass = c.estado === 'DEBE' ? 'badge-debe' : 'badge-pagado'; // Asegúrate de tener estas clases CSS o usa status-badge
        const fechaVenc = c.fechaVencimiento ? formatearFechaTabla(c.fechaVencimiento) : '-';

        body.innerHTML += `
            <tr>
                <td style="text-align:center;">${checkboxHTML}</td>
                <td>${c.descripcion ?? ""}</td>
                <td>S/ ${c.monto?.toFixed(2) ?? "0.00"}</td>
                <td>${fechaVenc}</td>
                <td><span class="status-badge ${badgeClass}">${c.estado}</span></td>
            </tr>
        `;
    });

    // Ejecutar validación inicial
    calcularTotalYValidacion();
}

// ---------------------------------------------------------
// ÁREA A: CALCULAR Y VALIDAR (Lógica de Cascada)
// ---------------------------------------------------------
function calcularTotalYValidacion() {
    const checkboxes = document.querySelectorAll('.chk-pago');
    let total = 0;
    
    // Regla: No se puede pagar la cuota siguiente si la anterior (DEBE) no está marcada.
    let permitirSeleccion = true; 

    checkboxes.forEach((chk) => {
        // 1. Si la anterior bloqueó la cadena, deshabilitamos esta
        if (!permitirSeleccion) {
            chk.disabled = true;
            chk.checked = false; 
            chk.parentElement.parentElement.classList.add('row-disabled');
        } else {
            chk.disabled = false;
            chk.parentElement.parentElement.classList.remove('row-disabled');
        }

        // 2. Si esta no está marcada, bloqueamos las siguientes
        if (!chk.checked) {
            permitirSeleccion = false;
        }

        // 3. Sumar al total
        if (chk.checked) {
            const monto = parseFloat(chk.dataset.monto || 0);
            total += monto;
        }
    });

    const lblTotal = document.getElementById('totalPagar');
    if(lblTotal) lblTotal.innerText = `Total: S/ ${total.toFixed(2)}`;
}

// ---------------------------------------------------------
// ÁREA A: PROCESAR PAGO
// ---------------------------------------------------------
async function procesarPagoSeleccionado() {
    // 1. Obtener checkboxes marcados
    const seleccionados = document.querySelectorAll('.chk-pago:checked');

    if(seleccionados.length === 0) {
        alert("Selecciona al menos una cuota.");
        return;
    }

    if(!confirm(`¿Confirmar pago de ${seleccionados.length} cuotas?`)) return;

    // 2. CONSTRUIR EL ARRAY (LISTA) []
    const listaPagos = [];

    seleccionados.forEach(chk => {
        listaPagos.push({
            idCuota: parseInt(chk.dataset.id),
            montoPago: parseFloat(chk.dataset.monto),
            metodoPago: "Efectivo" // O el valor de tu select
        });
    });

    try {
        // 3. ENVIAR LA LISTA COMPLETA (Una sola petición)
        const res = await fetch("/api/pagos/realizar", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(listaPagos) // debe ser array
                          });


        if(!res.ok) {
            // Aquí atrapamos el error del backend ("Debes pagar Marzo antes...")
            const errorTxt = await res.text();
            throw new Error(errorTxt);
        }

        const recibos = await res.json();
        alert("✅ Pagos procesados correctamente. Se generaron " + recibos.length + " recibos.");

        // Recargar la tabla
        if(typeof buscarDeudas === 'function') {
            buscarDeudas();
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error: " + error.message);
    }
}

// ---------------------------------------------------------
// ÁREA B: BUSCAR RECIBO
// ---------------------------------------------------------
async function buscarRecibo() {
    try {
        const nro = document.getElementById('inputBuscarRecibo').value.trim();
        if(!nro) {
            alert("Ingresa el número de recibo (Ej: 001-0000001)");
            return;
        }

        const res = await fetch(`${API_GESTION_PAGOS}/recibo/${nro}`, {
                    credentials: 'include' // <--- AGREGAR AQUÍ
                });

        if (!res.ok) {
            alert("Recibo no encontrado o error en servidor.");
            const divRes = document.getElementById('resultadoRecibo');
            if(divRes) divRes.style.display = 'none';
            return;
        }

        const data = await res.json();

        // Mostrar resultados
        const divRes = document.getElementById('resultadoRecibo');
        if(divRes) divRes.style.display = 'block';

        document.getElementById('lblRecibo').innerText = data.numeroRecibo;
        document.getElementById('lblAlumno').innerText = data.nombreAlumno;
        document.getElementById('lblMonto').innerText = "S/ " + (data.montoPagado?.toFixed(2) ?? "0.00");

        // Guardar el Nro en el botón de anular
        const btnAnular = document.querySelector('#resultadoRecibo button.btn-danger-custom');
        // Nota: Asegúrate que tu HTML tenga la clase btn-danger-custom o ajusta el selector aquí
        if(btnAnular) btnAnular.setAttribute('data-nro', data.numeroRecibo);

    } catch (error) {
        console.error("Error buscando recibo:", error);
        alert("Error de conexión al buscar el recibo.");
    }
}

// ---------------------------------------------------------
// ÁREA B: ANULAR RECIBO
// ---------------------------------------------------------
async function anularRecibo() {
    // Buscamos el botón dentro de la tarjeta de resultado
    const btnAnular = document.querySelector('#resultadoRecibo button');
    const nro = btnAnular ? btnAnular.getAttribute('data-nro') : null;

    if(!nro) {
        alert("No se ha seleccionado ningún recibo.");
        return;
    }

    if(!confirm(`⚠️ ATENCIÓN: ¿Estás SEGURO de anular el recibo ${nro}?\n\nLa cuota volverá a estado 'DEBE' y el dinero se considerará devuelto.`)) return;

    try {
            const res = await fetch(`${API_GESTION_PAGOS}/anular/${nro}`, {
                method: 'POST',
                credentials: 'include' // <--- AGREGAR AQUÍ
            });

        if (res.ok) {
            alert("✅ Recibo anulado correctamente.");
            
            // Limpiar vista B
            const divRes = document.getElementById('resultadoRecibo');
            if(divRes) divRes.style.display = 'none';
            document.getElementById('inputBuscarRecibo').value = '';
            
            // Si el usuario vuelve a la pestaña A, sería ideal refrescar, 
            // pero como los campos están separados, limpiamos A por seguridad
            // o si el input de alumno tiene algo, refrescamos:
            const inputAlu = document.getElementById('inputBuscarAlumno');
            if(inputAlu && inputAlu.value) {
                buscarDeudas(); 
            }
        } else {
            const txt = await res.text();
            alert("Error del servidor: " + txt);
        }

    } catch (error) {
        console.error("Error anulando recibo:", error);
        alert("Error de conexión al anular.");
    }
}

// ---------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------
function formatearFechaTabla(fechaIso) {
    if (!fechaIso) return "";
    return fechaIso; // Si quisieras formato DD/MM/YYYY, haz un split aquí
}

// ---------------------------------------------------------
// EXPORTAR FUNCIONES AL ÁMBITO GLOBAL
// ---------------------------------------------------------
// Esto es vital para que los onclick="..." del HTML funcionen
window.buscarDeudas = buscarDeudas;
window.calcularTotalYValidacion = calcularTotalYValidacion;
window.procesarPagoSeleccionado = procesarPagoSeleccionado;
window.buscarRecibo = buscarRecibo;
window.anularRecibo = anularRecibo;