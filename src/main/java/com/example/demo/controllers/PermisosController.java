// package com.example.demo.controllers;

// import java.util.Map;

// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;

// @RestController
// @RequestMapping("/api/permisos")
// public class PermisosController {

//     @GetMapping("/verificar")
//     public ResponseEntity<?> verificarPermiso(@RequestParam String recurso) {
//         Authentication auth = SecurityContextHolder.getContext().getAuthentication();

//         if (auth == null || !auth.isAuthenticated()) {
//             return ResponseEntity.ok(Map.of("autorizado", false));
//         }

//         boolean autorizado = false;

//         switch (recurso.toUpperCase()) {
//             case "ALUMNOS":
//             case "MATRICULA":
//             case "PAGOS":
//                 // Solo SECRETARIA
//                 autorizado = auth.getAuthorities().stream()
//                         .anyMatch(a -> a.getAuthority().equals("ROLE_SECRETARIA"));
//                 break;

//             case "REPORTES":
//                 // Solo DIRECTOR
//                 autorizado = auth.getAuthorities().stream()
//                         .anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTOR"));
//                 break;

//             case "DASHBOARD":
//             case "CONFIGURACION":
//                 // Ambos roles
//                 autorizado = auth.getAuthorities().stream()
//                         .anyMatch(a -> a.getAuthority().equals("ROLE_SECRETARIA")
//                         || a.getAuthority().equals("ROLE_DIRECTOR"));
//                 break;

//             default:
//                 autorizado = false;
//         }

//         return ResponseEntity.ok(Map.of("autorizado", autorizado));
//     }

//     @GetMapping("/rol-actual")
//     public ResponseEntity<?> getRolActual() {
//         Authentication auth = SecurityContextHolder.getContext().getAuthentication();

//         if (auth == null || !auth.isAuthenticated()) {
//             return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
//         }

//         // Buscar el rol en las autoridades
//         String rol = auth.getAuthorities().stream()
//                 .filter(a -> a.getAuthority().startsWith("ROLE_"))
//                 .map(a -> a.getAuthority().replace("ROLE_", ""))
//                 .findFirst()
//                 .orElse("DESCONOCIDO");

//         return ResponseEntity.ok(Map.of(
//                 "rol", rol,
//                 "esSecretaria", "SECRETARIA".equals(rol),
//                 "esDirector", "DIRECTOR".equals(rol)
//         ));
//     }
// }
