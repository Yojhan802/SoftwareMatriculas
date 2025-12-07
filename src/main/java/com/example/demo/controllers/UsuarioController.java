package com.example.demo.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import com.example.demo.dto.LoginDTO;
import com.example.demo.dto.RegistroUsuarioDTO;
import com.example.demo.entity.Usuario;

@RestController
@RequestMapping("/api/users")
public class UsuarioController {

    private final UsuarioService userService;

    public UsuarioController(UsuarioService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<Usuario> registerUser(@RequestBody RegistroUsuarioDTO registroDTO) {
        try {
            Usuario newUser = userService.registrarNuevoUsuario(registroDTO);
            return new ResponseEntity<>(newUser, HttpStatus.CREATED);
        } catch (RuntimeException e) {

            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Usuario> updateUser(@PathVariable Integer userId, @RequestBody ActualizarUsuarioDTO updateDTO) {
        try {
            Usuario updatedUser = userService.actualizarUsuario(userId, updateDTO);
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody CambiarContraDTO changeDTO) {
        try {
            userService.cambiarContrasena(changeDTO);
            return new ResponseEntity<>("Contraseña actualizada con éxito.", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        return userService.login(loginDTO)
                .map(user -> ResponseEntity.ok().body("Inicio de sesión exitoso. Usuario ID: " + user.getId()))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas."));
    }
}
