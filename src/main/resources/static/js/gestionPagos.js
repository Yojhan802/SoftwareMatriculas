// ===============================
// GESTIÓN DE PAGOS
// ===============================

const API_GESTION_PAGOS = "/api/gestion-pagos";
const API_REALIZAR_PAGO = "/api/pagos/realizar";
const REGEX_BUSQUEDA = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]+$/;

let cuotasActuales = [];

// ---------------- BUSCAR DEUDAS ----------------
async function buscarDeudas() {
  const input = document.getElementById('inputBuscarAlumno');
  const termino = input.value.trim();
  const mensajeEstado = document.getElementById('mensajeEstado');

  if(mensajeEstado) mensajeEstado.innerHTML = "";

  if (!termino) {
      alert("⚠️ Ingrese un DNI, nombre o apellido para buscar.");
      return;
  }

  // Ahora permite letras y números, pero sigue bloqueando símbolos como !@#$%
  if (!REGEX_BUSQUEDA.test(termino)) {
      alert("❌ El campo de búsqueda solo permite letras y números.");
      return;
  }

  try {
    const res = await fetch(`${API_GESTION_PAGOS}/pendientes/${encodeURIComponent(termino)}`);
    if (!res.ok) throw new Error("No se pudo conectar con el servidor.");

    cuotasActuales = await res.json();
    renderizarTablaCuotas();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ---------------- TABLA ----------------
// ... (resto del código igual)

function renderizarTablaCuotas() {
  const body = document.getElementById("tablaCuotasBody");
  const mensajeEstado = document.getElementById('mensajeEstado');
  body.innerHTML = "";

  if (!cuotasActuales || cuotasActuales.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #dc3545; padding: 30px; font-weight: bold;">
          🚫 NO TIENE CUOTAS PENDIENTES
        </td>
      </tr>`;
    if(mensajeEstado) mensajeEstado.innerHTML = "<div class='alert alert-info'>El alumno no presenta deudas activas o la matrícula fue anulada.</div>";
    return;
  }

  cuotasActuales.forEach((c) => {
    const esPagado = c.estado === 'PAGADO';

    // 1. Checkbox o Badge de Pagado
    const controlAccion = esPagado
      ? '<span class="status-badge badge-pagado">PAGADO</span>'
      : `<input type="checkbox" class="chk-pago"
           data-id_cuota="${c.idCuota}"
           data-monto="${c.monto}"
           onchange="calcularTotalYValidacion()">`;

    // 2. Texto del Recibo (Solo si existe y está pagado)
    const reciboHTML = esPagado && c.numeroRecibo
      ? `<span class="text-recibo">#${c.numeroRecibo}</span>`
      : '<span style="color: #ccc">—</span>';

    body.innerHTML += `
      <tr>
        <td style="text-align:center">${controlAccion}</td>
        <td>${c.descripcion}</td>
        <td>S/ ${c.monto.toFixed(2)}</td>
        <td>${c.fechaVencimiento ?? '-'}</td>
        <td>
            <span class="status-badge ${esPagado ? 'badge-pagado' : 'badge-debe'}">
                ${c.estado}
            </span>
        </td>
        <td style="font-weight: bold; color: #0d6efd;">${reciboHTML}</td>
      </tr>
    `;
  });

  calcularTotalYValidacion();
}

// ---------------- TOTAL ----------------
function calcularTotalYValidacion() {
  let total = 0;
  let permitir = true;

  document.querySelectorAll('.chk-pago').forEach(chk => {
    chk.disabled = !permitir;

    if (!chk.checked) permitir = false;
    if (chk.checked) total += parseFloat(chk.dataset.monto);
  });

  document.getElementById('totalPagar').innerText =
    `Total: S/ ${total.toFixed(2)}`;
}

// ---------------- PAGAR ----------------
async function procesarPagoSeleccionado() {
  const checks = document.querySelectorAll('.chk-pago:checked');
  if (!checks.length) return alert("Selecciona cuotas");

  if (!confirm(`¿Pagar ${checks.length} cuotas?`)) return;

  const pagos = [...checks].map(c => ({
    idCuota: +c.dataset.id_cuota,
    montoPago: +c.dataset.monto,
    metodoPago: "Efectivo"
  }));

  try {
    const res = await fetch(API_REALIZAR_PAGO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagos)
    });

    if (!res.ok) throw new Error(await res.text());

    alert("✅ Pago realizado");
    buscarDeudas();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

// EXPORT
window.buscarDeudas = buscarDeudas;
window.calcularTotalYValidacion = calcularTotalYValidacion;
window.procesarPagoSeleccionado = procesarPagoSeleccionado;
