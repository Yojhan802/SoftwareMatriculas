// ========== VARIABLES GLOBALES ==========
// Define la variable para que gestionPagos.js la pueda leer
window.modoVistaPagos = "PAGAR"; 

// ========== FUNCIÓN ORIGINAL loadView ==========
function loadViewOriginal(view) {
  console.log("Cargando vista:", view);

  const loadingIndicator = document.getElementById("auth-loading");
  if (loadingIndicator) loadingIndicator.style.display = "block";

  fetch(view)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      document.getElementById("content-area").innerHTML = html;

      // Actualizar Título
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const titleElement = tempDiv.querySelector("h1, h2, h3");
      if (titleElement) {
        document.getElementById("current-title").textContent = titleElement.textContent;
      }

      // Reiniciar Tooltips de Bootstrap
      var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));

      // DISPARAR EVENTO PARA QUE LOS SCRIPTS (como gestionPagos.js) SE INICIEN
      document.dispatchEvent(
        new CustomEvent("vista-cargada", { detail: view })
      );

      if (loadingIndicator) loadingIndicator.style.display = "none";
    })
    .catch((error) => {
      console.error("Error al cargar vista:", error);
      document.getElementById("content-area").innerHTML =
        `<div class='alert alert-danger'>
          <h4>Error al cargar la vista</h4>
          <p>No se pudo cargar: ${view}</p>
          <p><small>${error.message}</small></p>
        </div>`;
      if (loadingIndicator) loadingIndicator.style.display = "none";
    });
}

// ========== NUEVA FUNCIÓN PUENTE PARA PAGOS ==========
// Esta es la función que te faltaba para que funcionen los botones del menú
function cargarVistaPagos(modo) {
    // 1. Guardamos el modo en la variable global (PAGAR o ANULAR)
    window.modoVistaPagos = modo;
    
    // 2. Cargamos el HTML. 
    // IMPORTANTE: Asegúrate de que esta ruta sea la correcta en tu carpeta.
    // He asumido que está en la carpeta 'Pagos', igual que 'Alumnos/alumnos.html'
    loadViewOriginal('Pagos/gestionPagos.html'); 
}
// Hacemos la función accesible globalmente para el HTML
window.cargarVistaPagos = cargarVistaPagos;


// =====================================================
// ROLES Y PERMISOS
// =====================================================

const permisos = {
  ADMIN: { dashboard: true, gestion: true, pagos: true, reportes: true, configuracion: true },
  SECRETARIA: { dashboard: true, gestion: true, pagos: true, reportes: false, configuracion: true },
  CAJA: { dashboard: true, gestion: false, pagos: true, reportes: true, configuracion: true },
  DIRECTOR: { dashboard: true, gestion: false, pagos: false, reportes: true, configuracion: true }
};

function aplicarPermisos(rolUsuario) {
  const secciones = permisos[rolUsuario];
  if (!secciones) return;

  document.querySelectorAll(".sidebar .section-title").forEach((title) => {
    const nombre = title.textContent.trim().toLowerCase();
    
    // Normalizamos nombres para evitar errores de tildes o mayúsculas
    let clave = "";
    if(nombre.includes("dashboard")) clave = "dashboard";
    else if(nombre.includes("gestión") || nombre.includes("gestion")) clave = "gestion";
    else if(nombre.includes("pagos")) clave = "pagos";
    else if(nombre.includes("reportes")) clave = "reportes";
    else if(nombre.includes("configuración") || nombre.includes("configuracion")) clave = "configuracion";

    if (clave && secciones[clave] === false) {
      // Ocultamos el título y el UL que le sigue
      title.parentElement.style.display = "none";
    }
  });
}

// ================== AUTH LOGIC (DOMContentLoaded) ==================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/users/me", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("No autenticado");

    const data = await res.json();

    // Mostrar nombre en topbar
    const spanUser = document.querySelector(".topbar span");
    if(spanUser) spanUser.innerHTML = `Hola, ${data.username}!`;

    // Aplicar permisos
    aplicarPermisos(data.rol);

    // Configurar botón Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          const resLogout = await fetch("/api/users/logout", {
            method: "POST",
            credentials: "include"
          });
          if (resLogout.ok) window.location.href = "/index.html";
          else alert("Error al cerrar sesión.");
        } catch (err) {
          console.error(err);
          window.location.href = "/index.html";
        }
      });
    }

  } catch (err) {
    console.error("Auth Error:", err);
    // Si falla la auth, redirigir al login
    window.location.href = "/index.html";
  }
});