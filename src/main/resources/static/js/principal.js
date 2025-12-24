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

// ========== FUNCIÓN PARA CARGAR SCRIPTS DINÁMICAMENTE ==========
function cargarScript(src) {
  return new Promise((resolve, reject) => {
    // Verificar si el script ya existe
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`✅ Script ${src} ya está cargado`);
      resolve();
      return;
    }
    
    console.log(`📥 Cargando script: ${src}`);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log(`✅ Script cargado: ${src}`);
      resolve();
    };
    script.onerror = () => {
      console.error(`❌ Error cargando script: ${src}`);
      reject(new Error(`Error cargando ${src}`));
    };
    document.head.appendChild(script);
  });
}

// ========== FUNCIÓN PARA CARGAR SCRIPTS DE CHAT ==========
async function cargarScriptsChat() {
  // Verificar si ya están cargados
  if (window.chatEncryption && window.ChatClient) {
    console.log('✅ Scripts de chat ya están cargados');
    return true;
  }
  
  try {
    console.log('📥 Iniciando carga de scripts de chat...');
    
    // Cargar cifradoE2E.js primero (dependencia)
    await cargarScript('js/cifradoE2E.js');
    
    // Luego cargar chat.js
    await cargarScript('js/chat.js');
    
    // Verificar que se cargaron correctamente
    if (window.chatEncryption && window.ChatClient) {
      console.log('✅ Scripts de chat cargados correctamente');
      return true;
    } else {
      throw new Error('Scripts cargados pero objetos no disponibles');
    }
  } catch (error) {
    console.error('❌ Error cargando scripts de chat:', error);
    alert('Error al cargar el módulo de chat. Por favor, recargue la página.');
    return false;
  }
}

// ========== BOTÓN CHAT FLOTANTE ==========
document.addEventListener('DOMContentLoaded', function() {
  const openChatBtn = document.getElementById('open-chat');
  
  if (openChatBtn) {
    openChatBtn.addEventListener('click', async function() {
      console.log('🔘 Click en botón de chat');
      
      try {
        // Mostrar indicador de carga
        const loadingIndicator = document.getElementById("auth-loading");
        if (loadingIndicator) loadingIndicator.style.display = "block";
        
        // 1. Cargar scripts de chat
        const scriptsLoaded = await cargarScriptsChat();
        
        if (!scriptsLoaded) {
          throw new Error('No se pudieron cargar los scripts del chat');
        }
        
        // 2. Cargar vista HTML del chat
        console.log('📄 Cargando vista HTML del chat...');
        await new Promise((resolve, reject) => {
          fetch('Chat/cliente.html')
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.text();
            })
            .then(html => {
              document.getElementById("content-area").innerHTML = html;
              console.log('✅ Vista HTML cargada');
              resolve();
            })
            .catch(reject);
        });
        
        // 3. Cambiar título
        document.getElementById('current-title').textContent = 'Chat de Soporte';
        
        // 4. Dar tiempo para que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 5. Inicializar el chat
        console.log('🚀 Inicializando chat client...');
        if (typeof initializeChatClient === 'function') {
          initializeChatClient();
          console.log('✅ Chat inicializado correctamente');
        } else {
          throw new Error('initializeChatClient no está definido');
        }
        
        // Ocultar indicador de carga
        if (loadingIndicator) loadingIndicator.style.display = "none";
        
      } catch (error) {
        console.error('❌ Error abriendo chat:', error);
        document.getElementById("content-area").innerHTML =
          `<div class='alert alert-danger'>
            <h4>Error al abrir el chat</h4>
            <p>${error.message}</p>
            <button class="btn btn-primary mt-2" onclick="location.reload()">
              Recargar página
            </button>
          </div>`;
        
        const loadingIndicator = document.getElementById("auth-loading");
        if (loadingIndicator) loadingIndicator.style.display = "none";
      }
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      try {
        const resLogout = await fetch("/api/users/logout", {
          method: "POST",
          credentials: "include"
        });
        if (resLogout.ok) {
          localStorage.clear();
          window.location.href = "/index.html";
        } else {
          alert("Error al cerrar sesión.");
        }
      } catch (err) {
        console.error(err);
        localStorage.clear();
        window.location.href = "/index.html";
      }
    });
  }
});

// =====================================================
// ROLES Y PERMISOS
// =====================================================

const permisos = {
  ADMIN: { dashboard: true, gestion: true, pagos: true, reportes: true, configuracion: true, googleauth: false },
  SECRETARIA: { dashboard: true, gestion: true, pagos: true, reportes: false, configuracion: true, googleauth: false },
  CAJA: { dashboard: true, gestion: false, pagos: true, reportes: true, configuracion: true, googleauth: false },
  DIRECTOR: { dashboard: true, gestion: false, pagos: false, reportes: true, configuracion: true, googleauth: true }
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
    else if(nombre.includes("googleauth") || nombre.includes("googleauth")) clave = "googleauth";

    if (clave && secciones[clave] === false) {
      // Ocultamos el título y el UL que le sigue
      title.parentElement.style.display = "none";
    }
  });
const googleAuthLink = document.querySelector('a[href*="googleauth"], a[onclick*="googleauth"]');
  
  if (googleAuthLink) {
    // Encuentra el elemento <li> padre que contiene el enlace
    const liElement = googleAuthLink.closest('li');
    
    if (liElement) {
      if (rolUsuario === 'DIRECTOR' && secciones.googleauth === true) {
        // Mostrar el enlace si es director
        liElement.style.display = 'block';
        console.log('✅ Mostrando GoogleAuth para Director');
      } else {
        // Ocultar el enlace para otros roles
        liElement.style.display = 'none';
        console.log(`❌ Ocultando GoogleAuth para ${rolUsuario}`);
      }
    }
  }
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
    if(spanUser) spanUser.innerHTML = `Hola, ${data.nombreUsuario}!`;

    // Aplicar permisos
    aplicarPermisos(data.rol);

  } catch (err) {
    console.error("Auth Error:", err);
    // Si falla la auth, redirigir al login
    window.location.href = "/index.html";
  }
});