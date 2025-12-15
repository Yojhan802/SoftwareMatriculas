// ===============================
// GESTIÓN DE PAGOS
// ===============================

const API_GESTION_PAGOS = "/api/gestion-pagos";
const API_REALIZAR_PAGO = "/api/pagos/realizar";

let cuotasActuales = [];

// ---------------- BUSCAR DEUDAS ----------------
async function buscarDeudas() {
  const termino = document.getElementById('inputBuscarAlumno').value;
  if (!termino) return alert("Escribe un nombre o apellido");

  try {
    const res = await fetch(
      `${API_GESTION_PAGOS}/pendientes/${termino}`
     
    );

    if (!res.ok) throw new Error();

    cuotasActuales = await res.json();
    renderizarTablaCuotas();
  } catch {
    alert("Error cargando deudas");
  }
}

// ---------------- TABLA ----------------
function renderizarTablaCuotas() {
  const body = document.getElementById("tablaCuotasBody");
  body.innerHTML = "";

  if (!cuotasActuales.length) {
    body.innerHTML = `<tr><td colspan="5">No hay cuotas pendientes</td></tr>`;
    return;
  }

  cuotasActuales.forEach((c, i) => {
    const checkbox = c.estado === 'PAGADO'
      ? '✅'
      : `<input type="checkbox" class="chk-pago"
           data-id_cuota="${c.idCuota}"
           data-monto="${c.monto}"
           onchange="calcularTotalYValidacion()">`;

    body.innerHTML += `
      <tr>
        <td style="text-align:center">${checkbox}</td>
        <td>${c.descripcion}</td>
        <td>S/ ${c.monto.toFixed(2)}</td>
        <td>${c.fechaVencimiento ?? '-'}</td>
        <td>${c.estado}</td>
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
