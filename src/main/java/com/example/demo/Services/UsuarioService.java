package com.example.demo.Services;

import java.util.List;
import java.util.Optional;

import com.example.demo.dto.ActualizarUsuarioDTO;
import com.example.demo.dto.CambiarContraDTO;
import com.example.demo.dto.LoginDTO;
import com.example.demo.dto.RegistroUsuarioDTO;
import com.example.demo.entity.Usuario;

public interface UsuarioService {

    Usuario registrarNuevoUsuario(RegistroUsuarioDTO registroDTO);

    Usuario actualizarUsuario(Integer usuarioId, ActualizarUsuarioDTO actualizarDTO);

    void cambiarContrasena(CambiarContraDTO changeDTO);

    Optional<Usuario> login(LoginDTO loginDTO);

    Optional<Usuario> findById(Integer usuarioId);

    Usuario finByUserName(String username);

    List<Usuario> obtenerUsuariosPorRol(String nombreRol);

}
