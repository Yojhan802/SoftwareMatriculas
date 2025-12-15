// ===============================
// ANULACIÓN DE RECIBOS
// ===============================

const API_GESTION_PAGOS = "/api/gestion-pagos";

async function buscarRecibo() {
  const nro = document.getElementById('inputBuscarRecibo').value;
  if (!nro) return alert("Ingrese recibo");

  try {
    const res = await fetch(`${API_GESTION_PAGOS}/recibo/${nro}`, {
      credentials: 'include'
    });

    if (!res.ok) throw new Error();

    const d = await res.json();
    document.getElementById('resultadoRecibo').style.display = 'block';
    document.getElementById('lblRecibo').innerText = d.numeroRecibo;
    document.getElementById('lblAlumno').innerText = d.nombreAlumno;
    document.getElementById('lblMonto').innerText = `S/ ${d.montoPagado}`;

    document
      .querySelector('.btn-danger-custom')
      .dataset.nro = d.numeroRecibo;

  } catch {
    alert("Recibo no encontrado");
  }
}

async function anularRecibo() {
  const nro = document.querySelector('.btn-danger-custom').dataset.nro;
  if (!confirm(`¿Anular recibo ${nro}?`)) return;

  const res = await fetch(`${API_GESTION_PAGOS}/anular/${nro}`, {
    method: 'POST',
    credentials: 'include'
  });

  if (res.ok) {
    alert("✅ Recibo anulado");
    document.getElementById('resultadoRecibo').style.display = 'none';
  } else {
    alert(await res.text());
  }
}

// EXPORT
window.buscarRecibo = buscarRecibo;
window.anularRecibo = anularRecibo;
