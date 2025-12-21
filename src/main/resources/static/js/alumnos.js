const API_ALUMNOS = "/api/alumnos";

let modalAlumno = null;
let paginaActual = 1;
let alumnosPorPagina = 10;
let todosLosAlumnos = [];
let alumnosFiltrados = [];

function initAlumnos() {
  const body = document.getElementById("body-alumnos");
  if (!body) return;

  const modalElement = document.getElementById("modalAlumno");
  modalAlumno = modalElement ? new bootstrap.Modal(modalElement) : null;

  cargarAlumnos();

  const searchInput = document.getElementById("searchDni");
  if (searchInput) {
    searchInput.addEventListener("input", aplicarFiltros);
  }

  // Agregar validación de solo números en DNI
  const dniInput = document.getElementById("dniAlumno");
  if (dniInput) {
    dniInput.addEventListener("input", function (e) {
      this.value = this.value.replace(/[^0-9]/g, "").substring(0, 8);
      this.classList.remove("is-invalid");
    });

    dniInput.addEventListener("blur", function (e) {
      if (this.value && this.value.length !== 8) {
        this.classList.add("is-invalid");
      } else {
        this.classList.remove("is-invalid");
      }
    });
  }
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

    console.log("Alumnos cargados:", data);

    todosLosAlumnos = data;
    paginaActual = 1;
    aplicarFiltros(); // Aplicar filtros automáticamente
  } catch (error) {
    console.error("Error cargando alumnos:", error);
    mostrarAlerta("Error al cargar los alumnos", "danger");
  }
}

// ---------------------------------------------------------
// APLICAR FILTROS (BÚSQUEDA + ESTADO)
// ---------------------------------------------------------
function aplicarFiltros() {
  const searchValue = document
    .getElementById("searchDni")
    .value.toLowerCase()
    .trim();
  const filtroEstado = document.getElementById("filtroEstado").value;

  // Primero filtrar por estado
  let alumnosFiltradosPorEstado = todosLosAlumnos;

  if (filtroEstado === "activos") {
    alumnosFiltradosPorEstado = todosLosAlumnos.filter((alumno) => {
      const estado = alumno.EstadoActual || alumno.estadoActual;
      return estado === "Activo" || estado === 1;
    });
  } else if (filtroEstado === "inactivos") {
    alumnosFiltradosPorEstado = todosLosAlumnos.filter((alumno) => {
      const estado = alumno.EstadoActual || alumno.estadoActual;
      return estado !== "Activo" && estado !== 1;
    });
  }

  // Luego filtrar por búsqueda
  if (!searchValue) {
    alumnosFiltrados = alumnosFiltradosPorEstado;
  } else {
    alumnosFiltrados = alumnosFiltradosPorEstado.filter((alumno) => {
      const dni = alumno.dniAlumno.toString().toLowerCase();
      const nombre = (alumno.Nombre || "").toLowerCase();
      const apellido = (alumno.Apellido || "").toLowerCase();

      return (
        dni.includes(searchValue) ||
        nombre.includes(searchValue) ||
        apellido.includes(searchValue)
      );
    });
  }

  paginaActual = 1;
  renderizarTablaConPaginacion();
}

// ---------------------------------------------------------
// APLICAR FILTRO DE ESTADO (llamada desde el select)
// ---------------------------------------------------------
function aplicarFiltroEstado() {
  aplicarFiltros();
}

// ---------------------------------------------------------
// OBTENER ESTADO COMO TEXTO
// ---------------------------------------------------------
function obtenerEstadoTexto(estado) {
  // Manejar tanto string como número
  if (estado === "Activo" || estado === 1) {
    return "Activo";
  } else if (estado === "Inactivo" || estado === 0) {
    return "Inactivo";
  } else if (estado === "Retirado") {
    return "Retirado";
  }
  return "Inactivo"; // Por defecto
}

function obtenerEstadoClass(estado) {
  const estadoTexto = obtenerEstadoTexto(estado);

  if (estadoTexto === "Activo") {
    return "badge bg-success";
  } else if (estadoTexto === "Inactivo") {
    return "badge bg-danger";
  } else if (estadoTexto === "Retirado") {
    return "badge bg-warning";
  }
  return "badge bg-secondary";
}

// ---------------------------------------------------------
// RENDERIZAR TABLA CON PAGINACIÓN
// ---------------------------------------------------------
function renderizarTablaConPaginacion() {
  const body = document.getElementById("body-alumnos");
  if (!body) return;

  body.innerHTML = "";

  if (alumnosFiltrados.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          <div class="py-4">
            <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc"></i>
            <p class="text-muted">No hay alumnos que coincidan con el filtro</p>
          </div>
        </td>
      </tr>
    `;
    const paginationContainer = document.getElementById("paginationContainer");
    if (paginationContainer) paginationContainer.innerHTML = "";
    actualizarInfoPaginacion();
    return;
  }

  const inicio = (paginaActual - 1) * alumnosPorPagina;
  const fin = inicio + alumnosPorPagina;
  const alumnosPagina = alumnosFiltrados.slice(inicio, fin);

  alumnosPagina.forEach((alumno) => {
    const estado = alumno.EstadoActual || alumno.estadoActual;
    const estadoTexto = obtenerEstadoTexto(estado);
    const estadoClass = obtenerEstadoClass(estado);
    const esActivo = estadoTexto === "Activo";

    body.innerHTML += `
      <tr>
        <td>${alumno.IdAlumno || alumno.idAlumno || ""}</td>
        <td>${alumno.dniAlumno || ""}</td>
        <td>${alumno.Nombre || ""}</td>
        <td>${alumno.Apellido || ""}</td>
        <td>${alumno.Direccion || ""}</td>
        <td><span class="${estadoClass}">${estadoTexto}</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarAlumno(${
            alumno.dniAlumno
          })">
            <i class="bi bi-pencil"></i> Editar
          </button>
          ${
            esActivo
              ? `<button class="btn btn-danger btn-sm" onclick="eliminarAlumno(${alumno.dniAlumno})">
                 <i class="bi bi-trash"></i> Eliminar
               </button>`
              : `<button class="btn btn-success btn-sm" onclick="activarAlumno(${alumno.dniAlumno})">
                 <i class="bi bi-check-circle"></i> Activar
               </button>`
          }
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
  const totalPaginas = Math.ceil(alumnosFiltrados.length / alumnosPorPagina);
  const paginationContainer = document.getElementById("paginationContainer");

  if (!paginationContainer || totalPaginas <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = '<ul class="pagination justify-content-end mb-0">';

  paginationHTML += `
    <li class="page-item ${paginaActual === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="cambiarPagina(${
        paginaActual - 1
      }); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

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
      paginationHTML +=
        '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  for (let i = inicio; i <= fin; i++) {
    paginationHTML += `
      <li class="page-item ${i === paginaActual ? "active" : ""}">
        <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (fin < totalPaginas) {
    if (fin < totalPaginas - 1) {
      paginationHTML +=
        '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="cambiarPagina(${totalPaginas}); return false;">${totalPaginas}</a>
      </li>
    `;
  }

  paginationHTML += `
    <li class="page-item ${paginaActual === totalPaginas ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="cambiarPagina(${
        paginaActual + 1
      }); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  paginationHTML += "</ul>";
  paginationContainer.innerHTML = paginationHTML;
}

// ---------------------------------------------------------
// CAMBIAR PÁGINA
// ---------------------------------------------------------
function cambiarPagina(nuevaPagina) {
  const totalPaginas = Math.ceil(alumnosFiltrados.length / alumnosPorPagina);

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
  const fin = Math.min(
    paginaActual * alumnosPorPagina,
    alumnosFiltrados.length
  );
  const total = alumnosFiltrados.length;

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
// BUSCAR ALUMNO POR DNI (compatibilidad)
// ---------------------------------------------------------
async function buscarAlumnoPorDni() {
  aplicarFiltros();
}

// ---------------------------------------------------------
// LIMPIAR BÚSQUEDA Y LISTAR TODOS
// ---------------------------------------------------------
function limpiarBusqueda() {
  const searchInput = document.getElementById("searchDni");
  if (searchInput) searchInput.value = "";

  const filtroEstado = document.getElementById("filtroEstado");
  if (filtroEstado) filtroEstado.value = "activos"; // Volver a mostrar solo activos

  aplicarFiltros();
}

// ---------------------------------------------------------
// MODAL NUEVO ALUMNO
// ---------------------------------------------------------
function abrirModalAlumno() {
  if (!modalAlumno) {
    const modalElement = document.getElementById("modalAlumno");
    if (modalElement) modalAlumno = new bootstrap.Modal(modalElement);
  }

  const form = document.getElementById("formAlumno");
  if (form) form.reset();

  document.getElementById("alumnoId").value = "";
  document.getElementById("dniAlumno").disabled = false;
  document.getElementById("dniAlumno").classList.remove("is-invalid");
  document.getElementById("modalTituloAlumno").innerText = "Nuevo Alumno";

  // Limpiar alertas del modal si existen
  const alertContainerModal = document.getElementById("alertContainerModal");
  if (alertContainerModal) {
    alertContainerModal.innerHTML = "";
  }

  modalAlumno.show();
}

// ---------------------------------------------------------
// EDITAR ALUMNO
// ---------------------------------------------------------
async function editarAlumno(dni) {
  try {
    console.log("Editando alumno con DNI:", dni);

    const res = await fetch(`${API_ALUMNOS}/dni/${dni}`);

    if (!res.ok) {
      console.error("Error en la respuesta:", res.status);
      mostrarAlerta("Error al cargar el alumno", "danger");
      return;
    }

    const alumno = await res.json();
    console.log("Datos del alumno recibidos:", alumno);

    if (!modalAlumno) {
      const modalElement = document.getElementById("modalAlumno");
      if (modalElement) modalAlumno = new bootstrap.Modal(modalElement);
    }

    document.getElementById("modalTituloAlumno").innerText = "Editar Alumno";

    document.getElementById("alumnoId").value =
      alumno.IdAlumno || alumno.idAlumno || "";
    document.getElementById("dniAlumno").value = alumno.dniAlumno || "";
    document.getElementById("nombre").value = alumno.Nombre || "";
    document.getElementById("apellido").value = alumno.Apellido || "";
    document.getElementById("direccion").value = alumno.Direccion || "";

    const estado = alumno.EstadoActual || alumno.estadoActual || "Activo";
    document.getElementById("estadoActual").value = estado;

    document.getElementById("dniAlumno").disabled = true;
    document.getElementById("dniAlumno").classList.remove("is-invalid");

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

  // Limpiar clases de validación previas
  document.getElementById("dniAlumno").classList.remove("is-invalid");

  const dniValue = document.getElementById("dniAlumno").value.trim();
  // Validar que el DNI no esté vacío
  if (!dniValue) {
    mostrarAlerta("Por favor ingrese un DNI", "warning");
    document.getElementById("dniAlumno").focus();
    return;
  }

  // Validar que tenga exactamente 8 dígitos PRIMERO
  if (dniValue.length !== 8) {
    mostrarAlerta("El DNI debe tener exactamente 8 dígitos", "warning");
    document.getElementById("dniAlumno").classList.add("is-invalid");
    document.getElementById("dniAlumno").focus();
    return;
  }

  // Validar que sea un número válido
  const dni = parseInt(dniValue);
  if (isNaN(dni) || !/^\d{8}$/.test(dniValue)) {
    mostrarAlerta("El DNI debe contener solo números", "warning");
    document.getElementById("dniAlumno").classList.add("is-invalid");
    document.getElementById("dniAlumno").focus();
    return;
  }

  // ⭐ Validar DNI no puede ser todo ceros
  if (dniValue === "00000000") {
    mostrarAlerta("El DNI no puede ser 00000000", "danger");
    document.getElementById("dniAlumno").classList.add("is-invalid");
    document.getElementById("dniAlumno").focus();
    return;
  }

  // ⭐ Validar DNI no puede empezar con 0
  if (dniValue.startsWith("0")) {
    mostrarAlerta(
      "El DNI no puede comenzar con 0. Ingrese un DNI válido",
      "danger"
    );
    document.getElementById("dniAlumno").classList.add("is-invalid");
    document.getElementById("dniAlumno").focus();
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const direccion = document.getElementById("direccion").value.trim();

  if (!nombre || !apellido || !direccion) {
    mostrarAlerta(
      "Por favor complete todos los campos obligatorios",
      "warning"
    );
    return;
  }

  // ⭐ VALIDACIÓN DE DNI DUPLICADO ⭐
  if (!id) {
    // Solo validar duplicados al crear nuevo alumno
    console.log("Verificando DNI duplicado:", dni);
    console.log("Alumnos existentes:", todosLosAlumnos);

    const alumnoExistente = todosLosAlumnos.find(
      (a) => parseInt(a.dniAlumno) === parseInt(dni)
    );

    if (alumnoExistente) {
      console.log("DNI duplicado encontrado:", alumnoExistente);
      mostrarAlerta(
        `Ya existe un alumno registrado con el DNI ${dniValue}`,
        "danger"
      );

      document.getElementById("dniAlumno").focus();

      return;
    }
    console.log("DNI válido, no hay duplicados");
  }
  // ⭐ FIN DE LA VALIDACIÓN ⭐

  const alumno = {
    IdAlumno: id ? parseInt(id) : 0,
    dniAlumno: dni,
    Nombre: nombre,
    Apellido: apellido,
    Direccion: direccion,
    EstadoActual: document.getElementById("estadoActual").value || "Activo",
  };

  console.log("Guardando alumno:", alumno);

  try {
    let res;
    if (id) {
      res = await fetch(`${API_ALUMNOS}/${dni}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
      });
    } else {
      res = await fetch(API_ALUMNOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
      });
    }

    if (!res.ok) {
      const error = await res.text();
      console.error("Error del servidor:", error);
      mostrarAlerta(`Error: ${error}`, "danger");
      return;
    }

    const mensaje = id
      ? "✓ Alumno actualizado exitosamente"
      : `✓ Alumno creado exitosamente (DNI: ${dniValue})`;
    mostrarAlerta(mensaje, "success");

    modalAlumno?.hide();

    setTimeout(() => {
      mostrarAlerta(mensaje, "success");
    }, 300);

    await cargarAlumnos();
  } catch (error) {
    console.error("Error guardando alumno:", error);
    mostrarAlerta("Error al guardar alumno", "danger");
  }
}

// ---------------------------------------------------------
// ELIMINAR ALUMNO (CAMBIAR A INACTIVO)
// ---------------------------------------------------------
async function eliminarAlumno(dni) {
  if (
    !confirm(
      "¿Está seguro de marcar este alumno como inactivo? Podrá reactivarlo después si lo necesita."
    )
  ) {
    return;
  }

  try {
    // Buscar el alumno primero
    const resGet = await fetch(`${API_ALUMNOS}/dni/${dni}`);
    if (!resGet.ok) {
      mostrarAlerta("Error al obtener datos del alumno", "danger");
      return;
    }

    const alumno = await resGet.json();

    // Actualizar el estado a Inactivo
    alumno.EstadoActual = "Inactivo";

    const res = await fetch(`${API_ALUMNOS}/${dni}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alumno),
    });

    if (!res.ok) {
      const error = await res.text();
      mostrarAlerta(`Error: ${error}`, "danger");
      return;
    }

    mostrarAlerta("✓ Alumno marcado como inactivo exitosamente", "success");
    await cargarAlumnos();
  } catch (error) {
    console.error("Error al inactivar alumno:", error);
    mostrarAlerta("Error al marcar alumno como inactivo", "danger");
  }
}

// ---------------------------------------------------------
// ACTIVAR ALUMNO
// ---------------------------------------------------------
async function activarAlumno(dni) {
  if (!confirm("¿Está seguro de activar este alumno?")) {
    return;
  }

  try {
    // Buscar el alumno primero
    const resGet = await fetch(`${API_ALUMNOS}/dni/${dni}`);
    if (!resGet.ok) {
      mostrarAlerta("Error al obtener datos del alumno", "danger");
      return;
    }

    const alumno = await resGet.json();

    // Actualizar el estado a Activo
    alumno.EstadoActual = "Activo";

    const res = await fetch(`${API_ALUMNOS}/${dni}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alumno),
    });

    if (!res.ok) {
      const error = await res.text();
      mostrarAlerta(`Error: ${error}`, "danger");
      return;
    }

    mostrarAlerta("✓ Alumno activado exitosamente", "success");
    await cargarAlumnos();
  } catch (error) {
    console.error("Error al activar alumno:", error);
    mostrarAlerta("Error al activar alumno", "danger");
  }
}

// ---------------------------------------------------------
// MOSTRAR ALERTAS
// ---------------------------------------------------------
function mostrarAlerta(mensaje, tipo = "success") {
  // Si el modal está abierto, mostrar alerta dentro del modal
  const modalElement = document.getElementById("modalAlumno");
  const modalIsOpen = modalElement && modalElement.classList.contains("show");

  let alertDiv;

  if (modalIsOpen) {
    // Buscar o crear contenedor de alertas dentro del modal
    alertDiv = document.getElementById("alertContainerModal");
    if (!alertDiv) {
      const modalBody = document.querySelector("#modalAlumno .modal-body");
      if (modalBody) {
        alertDiv = document.createElement("div");
        alertDiv.id = "alertContainerModal";
        alertDiv.style.marginBottom = "1rem";
        modalBody.insertBefore(alertDiv, modalBody.firstChild);
      }
    }
  } else {
    // Usar contenedor de alertas principal
    alertDiv = document.getElementById("alertContainer");
  }

  if (alertDiv) {
    alertDiv.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        <i class="bi ${
          tipo === "success"
            ? "bi-check-circle"
            : tipo === "danger"
            ? "bi-x-circle"
            : "bi-info-circle"
        }"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    setTimeout(() => {
      alertDiv.innerHTML = "";
    }, 2000);
  } else {
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
window.activarAlumno = activarAlumno;
window.buscarAlumnoPorDni = buscarAlumnoPorDni;
window.limpiarBusqueda = limpiarBusqueda;
window.cambiarPagina = cambiarPagina;
window.cambiarElementosPorPagina = cambiarElementosPorPagina;
window.aplicarFiltroEstado = aplicarFiltroEstado;
window.aplicarFiltros = aplicarFiltros;
