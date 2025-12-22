package com.example.demo.controllers;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Services.UsuarioService;
import com.example.demo.dto.ActualizarUsuarioDTO;
import com.example.demo.dto.CambiarContraDTO;
import com.example.demo.dto.RegistroUsuarioDTO;
import com.example.demo.entity.Usuario;

@RestController
@RequestMapping("/api/users")
public class UsuarioController {

    private final UsuarioService userService;

    public UsuarioController(UsuarioService userService) {
        this.userService = userService;
    }

    // ---------------------------- REGISTER ----------------------------
    @PostMapping("/register")
    public ResponseEntity<Usuario> registerUser(@RequestBody RegistroUsuarioDTO registroDTO) {
        try {
            Usuario newUser = userService.registrarNuevoUsuario(registroDTO);
            return new ResponseEntity<>(newUser, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // ---------------------------- UPDATE ----------------------------
    @PutMapping("/{userId}")
    public ResponseEntity<Usuario> updateUser(@PathVariable Integer userId, @RequestBody ActualizarUsuarioDTO updateDTO) {
        try {
            Usuario updatedUser = userService.actualizarUsuario(userId, updateDTO);
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ---------------------------- CHANGE PASSWORD ----------------------------
    @PatchMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody CambiarContraDTO changeDTO) {
        try {
            userService.cambiarContrasena(changeDTO);
            return new ResponseEntity<>("Contraseña actualizada con éxito.", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ---------------------------- GET AUTHENTICATED USER ----------------------------
    @GetMapping("/me")
    public ResponseEntity<?> getUsuarioLogueado(@AuthenticationPrincipal Usuario usuario, Authentication auth) {
        // Usar @AuthenticationPrincipal si está disponible, sino usar el método antiguo
        if (usuario == null && auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        }

        // Preferir @AuthenticationPrincipal si está disponible
        Usuario user;
        if (usuario != null) {
            user = usuario;
        } else {
            user = userService.finByUserName(auth.getName());
        }

        // Usar UserDTO para una respuesta más completa
        UserDTO userDTO = new UserDTO(
                user.getId(),
                user.getNombreCompleto(),
                user.getUsername(),
                user.getCorreoElectronico(),
                user.getRol().getNombreRol()
        );

        return ResponseEntity.ok(userDTO);
    }

    // ---------------------------- GET ADMINS ----------------------------
    @GetMapping("/admins")
    public ResponseEntity<List<UserDTO>> getAdmins() {
        List<Usuario> admins = userService.obtenerUsuariosPorRol("ADMIN");

        List<UserDTO> adminDTOs = admins.stream()
                .map(admin -> new UserDTO(
                admin.getId(),
                admin.getNombreCompleto(),
                admin.getUsername(),
                admin.getCorreoElectronico(),
                admin.getRol().getNombreRol()
        ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(adminDTOs);
    }

    // DTO interno para respuestas de usuario
    public static class UserDTO {

        private Integer id;
        private String nombreCompleto;
        private String nombreUsuario;
        private String correoElectronico;
        private String rol;

        public UserDTO() {
        }

        public UserDTO(Integer id, String nombreCompleto, String nombreUsuario,
                String correoElectronico, String rol) {
            this.id = id;
            this.nombreCompleto = nombreCompleto;
            this.nombreUsuario = nombreUsuario;
            this.correoElectronico = correoElectronico;
            this.rol = rol;
        }

        // Getters y Setters
        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getNombreCompleto() {
            return nombreCompleto;
        }

        public void setNombreCompleto(String nombreCompleto) {
            this.nombreCompleto = nombreCompleto;
        }

        public String getNombreUsuario() {
            return nombreUsuario;
        }

        public void setNombreUsuario(String nombreUsuario) {
            this.nombreUsuario = nombreUsuario;
        }

        public String getCorreoElectronico() {
            return correoElectronico;
        }

        public void setCorreoElectronico(String correoElectronico) {
            this.correoElectronico = correoElectronico;
        }

        public String getRol() {
            return rol;
        }

        public void setRol(String rol) {
            this.rol = rol;
        }
    }
}
