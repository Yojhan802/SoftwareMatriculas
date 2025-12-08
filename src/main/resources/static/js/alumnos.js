const API_ALUMNOS = "/api/alumnos";

let modalAlumno = null;
let paginaActual = 1;
let alumnosPorPagina = 10;
let todosLosAlumnos = [];

function initAlumnos() {
  const body = document.getElementById("body-alumnos");
  if (!body) return;

  const modalElement = document.getElementById("modalAlumno");
  modalAlumno = modalElement ? new bootstrap.Modal(modalElement) : null;

  cargarAlumnos();
}

document.addEventListener("vista-cargada", (e) => {
  if (e.detail.includes("alumnos.html")) {
    initAlumnos();
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAlumnos);
} else {
  initAlumnos();
}

// ---------------------------------------------------------
// LISTAR TODOS LOS ALUMNOS
// ---------------------------------------------------------
async function cargarAlumnos() {
  try {
    const res = await fetch(API_ALUMNOS);
    const data = await res.json();

    todosLosAlumnos = data;
    paginaActual = 1;
    renderizarTablaConPaginacion();

  } catch (error) {
    console.error("Error cargando alumnos:", error);
    mostrarAlerta("Error al cargar los alumnos", "danger");
  }
}

// ---------------------------------------------------------
// RENDERIZAR TABLA CON PAGINACIÓN
// ---------------------------------------------------------
function renderizarTablaConPaginacion() {
  const body = document.getElementById("body-alumnos");
  if (!body) return;

  body.innerHTML = "";

  if (todosLosAlumnos.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No hay alumnos registrados</td>
      </tr>
    `;
    document.getElementById("paginationContainer").innerHTML = "";
    actualizarInfoPaginacion();
    return;
  }

  // Calcular índices de paginación
  const inicio = (paginaActual - 1) * alumnosPorPagina;
  const fin = inicio + alumnosPorPagina;
  const alumnosPagina = todosLosAlumnos.slice(inicio, fin);

  // Renderizar alumnos de la página actual
  alumnosPagina.forEach((alumno) => {
    const estadoClass = alumno.estadoActual === 'Activo' ? 'badge bg-success' : 
                       alumno.estadoActual === 'Inactivo' ? 'badge bg-warning' : 
                       'badge bg-danger';

    body.innerHTML += `
      <tr>
        <td>${alumno.idAlumno}</td>
        <td>${alumno.dniAlumno}</td>
        <td>${alumno.nombre ?? ""}</td>
        <td>${alumno.apellido ?? ""}</td>
        <td>${alumno.direccion ?? ""}</td>
        <td><span class="${estadoClass}">${alumno.estadoActual}</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarAlumno(${alumno.dniAlumno})">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAlumno(${alumno.dniAlumno})">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </td>
      </tr>
    `;
  });

  renderizarPaginacion();
  actualizarInfoPaginacion();
}

// ---------------------------------------------------------
// RENDERIZAR CONTROLES DE PAGINACIÓN
// ---------------------------------------------------------
function renderizarPaginacion() {
  const totalPaginas = Math.ceil(todosLosAlumnos.length / alumnosPorPagina);
  const paginationContainer = document.getElementById("paginationContainer");
  
  if (!paginationContainer || totalPaginas <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = '<ul class="pagination justify-content-center mb-0">';

  // Botón Anterior
  paginationHTML += `
    <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">
        <i class="bi bi-chevron-left"></i> Anterior
      </a>
    </li>
  `;

  // Números de página
  const rango = 2;
  let inicio = Math.max(1, paginaActual - rango);
  let fin = Math.min(totalPaginas, paginaActual + rango);

  if (inicio > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="cambiarPagina(1); return false;">1</a>
      </li>
    `;
    if (inicio > 2) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  for (let i = inicio; i <= fin; i++) {
    paginationHTML += `
      <li class="page-item ${i === paginaActual ? 'active' : ''}">
        <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (fin < totalPaginas) {
    if (fin < totalPaginas - 1) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="cambiarPagina(${totalPaginas}); return false;">${totalPaginas}</a>
      </li>
    `;
  }

  // Botón Siguiente
  paginationHTML += `
    <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">
        Siguiente <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  paginationHTML += '</ul>';
  paginationContainer.innerHTML = paginationHTML;
}

// ---------------------------------------------------------
// CAMBIAR PÁGINA
// ---------------------------------------------------------
function cambiarPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(todosLosAlumnos.length / alumnosPorPagina);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActual = nuevaPagina;
  renderizarTablaConPaginacion();
}

// ---------------------------------------------------------
// ACTUALIZAR INFORMACIÓN DE PAGINACIÓN
// ---------------------------------------------------------
function actualizarInfoPaginacion() {
  const infoElement = document.getElementById("paginationInfo");
  if (!infoElement) return;

  const inicio = (paginaActual - 1) * alumnosPorPagina + 1;
  const fin = Math.min(paginaActual * alumnosPorPagina, todosLosAlumnos.length);
  const total = todosLosAlumnos.length;

  if (total === 0) {
    infoElement.textContent = "No hay registros";
  } else {
    infoElement.textContent = `Mostrando ${inicio} - ${fin} de ${total} alumnos`;
  }
}

// ---------------------------------------------------------
// CAMBIAR CANTIDAD DE ELEMENTOS POR PÁGINA
// ---------------------------------------------------------
function cambiarElementosPorPagina() {
  const select = document.getElementById("elementosPorPagina");
  if (select) {
    alumnosPorPagina = parseInt(select.value);
    paginaActual = 1;
    renderizarTablaConPaginacion();
  }
}

// ---------------------------------------------------------
// BUSCAR ALUMNO POR DNI
// ---------------------------------------------------------
async function buscarAlumnoPorDni() {
  const dni = document.getElementById("searchDni").value;
  
  if (!dni) {
    mostrarAlerta("Por favor ingrese un DNI", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_ALUMNOS}/dni/${dni}`);
    
    if (!res.ok) {
      mostrarAlerta("Alumno no encontrado", "danger");
      cargarAlumnos(); // Recargar todos
      return;
    }

    const alumno = await res.json();
    
    const body = document.getElementById("body-alumnos");
    if (!body) return;

    const estadoClass = alumno.estadoActual === 'Activo' ? 'badge bg-success' : 
                       alumno.estadoActual === 'Inactivo' ? 'badge bg-warning' : 
                       'badge bg-danger';

    body.innerHTML = `
      <tr>
        <td>${alumno.idAlumno}</td>
        <td>${alumno.dniAlumno}</td>
        <td>${alumno.nombre ?? ""}</td>
        <td>${alumno.apellido ?? ""}</td>
        <td>${alumno.direccion ?? ""}</td>
        <td><span class="${estadoClass}">${alumno.estadoActual}</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarAlumno(${alumno.dniAlumno})">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAlumno(${alumno.dniAlumno})">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </td>
      </tr>
    `;

    document.getElementById("searchDni").value = "";
    mostrarAlerta("Alumno encontrado", "success");

  } catch (error) {
    console.error("Error buscando alumno:", error);
    mostrarAlerta("Error al buscar alumno", "danger");
  }
}

// ---------------------------------------------------------
// LIMPIAR BÚSQUEDA Y LISTAR TODOS
// ---------------------------------------------------------
function limpiarBusqueda() {
  document.getElementById("searchDni").value = "";
  cargarAlumnos();
}

// ---------------------------------------------------------
// MODAL NUEVO ALUMNO
// ---------------------------------------------------------
function abrirModalAlumno() {
  if (!modalAlumno) {
    const modalElement = document.getElementById("modalAlumno");
    if (modalElement) modalAlumno = new bootstrap.Modal(modalElement);
  }

  document.getElementById("formAlumno").reset();
  document.getElementById("alumnoId").value = "";
  document.getElementById("dniAlumno").disabled = false;
  document.getElementById("modalTituloAlumno").innerText = "Nuevo Alumno";

  modalAlumno.show();
}

// ---------------------------------------------------------
// EDITAR ALUMNO
// ---------------------------------------------------------
async function editarAlumno(dni) {
  try {
    const res = await fetch(`${API_ALUMNOS}/dni/${dni}`);
    const alumno = await res.json();

    if (!modalAlumno) {
      const modalElement = document.getElementById("modalAlumno");
      if (modalElement) modalAlumno = new bootstrap.Modal(modalElement);
    }

    document.getElementById("modalTituloAlumno").innerText = "Editar Alumno";

    document.getElementById("alumnoId").value = alumno.idAlumno;
    document.getElementById("dniAlumno").value = alumno.dniAlumno;
    document.getElementById("nombre").value = alumno.nombre ?? "";
    document.getElementById("apellido").value = alumno.apellido ?? "";
    document.getElementById("direccion").value = alumno.direccion ?? "";
    document.getElementById("estadoActual").value = alumno.estadoActual ?? "Activo";

    document.getElementById("dniAlumno").disabled = true;

    modalAlumno.show();

  } catch (error) {
    console.error("Error cargando alumno para editar:", error);
    mostrarAlerta("Error al cargar datos del alumno", "danger");
  }
}

// ---------------------------------------------------------
// GUARDAR ALUMNO (CREAR O ACTUALIZAR)
// ---------------------------------------------------------
async function guardarAlumno() {
  const id = document.getElementById("alumnoId").value;
  const dni = parseInt(document.getElementById("dniAlumno").value);

  const alumno = {
    idAlumno: id ? parseInt(id) : 0,
    dniAlumno: dni,
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    direccion: document.getElementById("direccion").value,
    estadoActual: document.getElementById("estadoActual").value
  };

  try {
    let res;
    if (id) {
      // ACTUALIZAR
      res = await fetch(`${API_ALUMNOS}/${dni}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
      });
      mostrarAlerta("Alumno actualizado exitosamente", "success");
    } else {
      // CREAR
      res = await fetch(API_ALUMNOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
      });
      mostrarAlerta("Alumno creado exitosamente", "success");
    }

    if (!res.ok) {
      const error = await res.text();
      mostrarAlerta(`Error: ${error}`, "danger");
      return;
    }

    modalAlumno?.hide();
    cargarAlumnos();

  } catch (error) {
    console.error("Error guardando alumno:", error);
    mostrarAlerta("Error al guardar alumno", "danger");
  }
}

// ---------------------------------------------------------
// ELIMINAR ALUMNO
// ---------------------------------------------------------
async function eliminarAlumno(dni) {
  if (!confirm("¿Está seguro de eliminar este alumno?")) {
    return;
  }

  try {
    const res = await fetch(`${API_ALUMNOS}/${dni}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const error = await res.text();
      mostrarAlerta(`Error: ${error}`, "danger");
      return;
    }

    mostrarAlerta("Alumno eliminado exitosamente", "success");
    cargarAlumnos();

  } catch (error) {
    console.error("Error eliminando alumno:", error);
    mostrarAlerta("Error al eliminar alumno", "danger");
  }
}

// ---------------------------------------------------------
// MOSTRAR ALERTAS
// ---------------------------------------------------------
function mostrarAlerta(mensaje, tipo = 'success') {
  // Si tienes un div de alertas en tu HTML
  const alertDiv = document.getElementById('alertContainer');
  if (alertDiv) {
    alertDiv.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    setTimeout(() => {
      alertDiv.innerHTML = '';
    }, 3000);
  } else {
    // Fallback: usar console o alert
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
  }
}

// ---------------------------------------------------------
// EXPONER FUNCIONES AL SCOPE GLOBAL
// ---------------------------------------------------------
window.abrirModalAlumno = abrirModalAlumno;
window.editarAlumno = editarAlumno;
window.guardarAlumno = guardarAlumno;
window.eliminarAlumno = eliminarAlumno;
window.buscarAlumnoPorDni = buscarAlumnoPorDni;
window.limpiarBusqueda = limpiarBusqueda;
window.cambiarPagina = cambiarPagina;
window.cambiarElementosPorPagina = cambiarElementosPorPagina;