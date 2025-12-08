package com.example.demo.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Usuario;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
        }

        if (authentication.getPrincipal() instanceof Usuario) {
            Usuario usuario = (Usuario) authentication.getPrincipal();

            Map<String, Object> response = new HashMap<>();
            response.put("id", usuario.getId());
            response.put("nombreUsuario", usuario.getNombreUsuario());
            response.put("nombreCompleto", usuario.getNombreCompleto());
            response.put("correo", usuario.getCorreoElectronico());
            response.put("rol", usuario.getRol().getNombreRol());
            response.put("autoridades", usuario.getAuthorities());

            // Permisos específicos
            response.put("esSecretaria", "SECRETARIA".equals(usuario.getRol().getNombreRol()));
            response.put("esDirector", "DIRECTOR".equals(usuario.getRol().getNombreRol()));
            response.put("puedeGestionarAlumnos", "SECRETARIA".equals(usuario.getRol().getNombreRol()));
            response.put("puedeVerReportes", "DIRECTOR".equals(usuario.getRol().getNombreRol()));

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.ok(authentication.getPrincipal());
    }
}
