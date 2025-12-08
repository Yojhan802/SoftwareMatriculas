// auth.js - Versión modificada SIN auto-inicialización
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.role = null;
        this._checkingPermission = false;
        this._permissionCache = new Map();
    }

    // Verificar autenticación
    async checkAuth() {
        try {
            console.log('AuthManager: Verificando autenticación...');
            const response = await fetch('/api/auth/user-info', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                console.log('AuthManager: No autenticado, redirigiendo...');
                window.location.href = '/login.html';
                return false;
            }
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.role = this.currentUser.rol;
                console.log('AuthManager: Usuario autenticado:', this.currentUser.nombreCompleto);
                return true;
            }
            
            console.log('AuthManager: Respuesta no OK:', response.status);
            return false;
        } catch (error) {
            console.error('AuthManager: Error al verificar autenticación:', error);
            window.location.href = '/login.html';
            return false;
        }
    }

    // Obtener información del usuario
    async getUserInfo() {
        if (!this.currentUser) {
            console.log('AuthManager: Obteniendo usuario por primera vez...');
            await this.checkAuth();
        }
        return this.currentUser;
    }

    // Verificar permiso para un recurso (con cache básico)
    async checkPermission(resource) {
        // Si ya estamos verificando, devolver resultado anterior o esperar
        if (this._checkingPermission) {
            console.log('AuthManager: Ya verificando permisos, usando cache temporal...');
            return this._permissionCache.get(resource) || false;
        }
        
        try {
            this._checkingPermission = true;
            console.log('AuthManager: Verificando permiso para:', resource);
            
            // Verificar cache primero
            if (this._permissionCache.has(resource)) {
                console.log('AuthManager: Permiso encontrado en cache');
                return this._permissionCache.get(resource);
            }
            
            const response = await fetch(`/api/permisos/verificar?recurso=${resource}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('AuthManager: Resultado permiso:', result.autorizado);
                
                // Cachear por 5 minutos
                this._permissionCache.set(resource, result.autorizado);
                setTimeout(() => {
                    this._permissionCache.delete(resource);
                }, 5 * 60 * 1000);
                
                return result.autorizado;
            }
            
            console.log('AuthManager: Error en respuesta de permiso:', response.status);
            return false;
        } catch (error) {
            console.error('AuthManager: Error al verificar permiso:', error);
            return false;
        } finally {
            this._checkingPermission = false;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            console.log('AuthManager: Cerrando sesión...');
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('AuthManager: Error al cerrar sesión:', error);
        }
    }

    // Obtener rol actual
    getCurrentRole() {
        return this.role;
    }

    // Verificar si es secretaria
    isSecretaria() {
        return this.role && this.role.nombreRol === 'SECRETARIA';
    }

    // Verificar si es director
    isDirector() {
        return this.role && this.role.nombreRol === 'DIRECTOR';
    }
}

// Instancia global - NO auto-inicializar
window.authManager = new AuthManager();

// Exportar función global para cerrar sesión
window.cerrarSesion = function() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        authManager.logout();
    }
};

// NOTA IMPORTANTE: NO hay DOMContentLoaded aquí
// Toda la inicialización se maneja desde el HTML principal