// auth.js - Manejo de autenticación y roles
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.role = null;
    }

    // Verificar autenticación
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/user-info', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login.html';
                return false;
            }
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.role = this.currentUser.rol;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            window.location.href = '/login.html';
            return false;
        }
    }

    // Obtener información del usuario
    async getUserInfo() {
        if (!this.currentUser) {
            await this.checkAuth();
        }
        return this.currentUser;
    }

    // Verificar permiso para un recurso
    async checkPermission(resource) {
        try {
            const response = await fetch(`/api/permisos/verificar?recurso=${resource}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.autorizado;
            }
            return false;
        } catch (error) {
            console.error('Error al verificar permiso:', error);
            return false;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    // Obtener rol actual
    getCurrentRole() {
        return this.role;
    }

    // Verificar si es secretaria
    isSecretaria() {
        return this.role === 'SECRETARIA';
    }

    // Verificar si es director
    isDirector() {
        return this.role === 'DIRECTOR';
    }
}

// Instancia global
const authManager = new AuthManager();

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await authManager.checkAuth();
    
    if (isAuthenticated) {
        // Actualizar UI con información del usuario
        updateUIWithUserInfo();
        
        // Configurar sidebar según rol
        setupSidebarByRole();
    }
});

// Actualizar UI con información del usuario
async function updateUIWithUserInfo() {
    const user = await authManager.getUserInfo();
    
    // Actualizar saludo
    const greetingElements = document.querySelectorAll('#user-greeting, .user-greeting');
    greetingElements.forEach(el => {
        if (el) el.textContent = `Hola, ${user.nombreCompleto}!`;
    });
    
    // Actualizar título con rol
    const roleBadge = document.getElementById('role-badge');
    if (roleBadge) {
        roleBadge.textContent = user.rol;
        roleBadge.className = `role-badge ${user.rol.toLowerCase()}-badge`;
    }
}

// Configurar sidebar según rol
function setupSidebarByRole() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Ocultar/mostrar secciones según rol
    if (authManager.isSecretaria()) {
        // Mostrar todo excepto reportes
        showElement('.section-title:contains("Gestión")', true);
        showElement('.section-title:contains("Pagos")', true);
        showElement('.section-title:contains("Reportes")', false);
    } else if (authManager.isDirector()) {
        // Mostrar solo dashboard y reportes
        showElement('.section-title:contains("Gestión")', false);
        showElement('.section-title:contains("Pagos")', false);
        showElement('.section-title:contains("Reportes")', true);
    }
}

// Función helper para mostrar/ocultar elementos
function showElement(selector, show) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        const parentSection = el.closest('div');
        if (parentSection) {
            parentSection.style.display = show ? 'block' : 'none';
        }
    });
}

// Función global para cerrar sesión
window.cerrarSesion = function() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        authManager.logout();
    }
};

// Función para verificar permisos antes de cargar una vista
async function loadViewWithPermission(view, resource) {
    const hasPermission = await authManager.checkPermission(resource);
    
    if (!hasPermission) {
        alert('No tiene permisos para acceder a esta sección');
        return false;
    }
    
    loadView(view);
    return true;
}

// Sobrescribir tu función loadView original
const originalLoadView = window.loadView;
window.loadView = async function(view) {
    // Mapear vista a recurso
    const viewToResource = {
        'Alumnos/alumnos.html': 'ALUMNOS',
        'matricula/nuevaMatricula.html': 'MATRICULA',
        'reportes/reportes.html': 'REPORTES',
        // Agrega más mapeos según necesites
    };
    
    const resource = viewToResource[view];
    
    if (resource) {
        return await loadViewWithPermission(view, resource);
    }
    
    // Si no necesita permiso especial, cargar normalmente
    return originalLoadView(view);
};