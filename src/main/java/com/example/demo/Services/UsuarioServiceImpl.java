package com.example.demo.Services;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.ActualizarUsuarioDTO;
import com.example.demo.dto.CambiarContraDTO;
import com.example.demo.dto.LoginDTO;
import com.example.demo.dto.RegistroUsuarioDTO;
import com.example.demo.entity.EstadoUsuario;
import com.example.demo.entity.Rol;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.RolRepository;
import com.example.demo.repository.UsuarioRepository;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioServiceImpl(UsuarioRepository usuarioRepository, RolRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public Usuario registrarNuevoUsuario(RegistroUsuarioDTO registroDTO) {

        if (usuarioRepository.findByNombreUsuario(registroDTO.getNombreUsuario()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso.");
        }

        Rol role = roleRepository.findById(registroDTO.getRolId())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado con ID: " + registroDTO.getRolId()));

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(registroDTO.getNombreCompleto());
        usuario.setNombreUsuario(registroDTO.getNombreUsuario());
        usuario.setCorreoElectronico(registroDTO.getCorreoElectronico());
        usuario.setRol(role);
        usuario.setEstado(EstadoUsuario.Activo);

        String hashedPassword = passwordEncoder.encode(registroDTO.getContrasena());
        usuario.setContrasenaHash(hashedPassword);

        return usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public Usuario actualizarUsuario(Integer usuarioId, ActualizarUsuarioDTO actualizarDTO) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + usuarioId));

        usuario.setNombreCompleto(actualizarDTO.getNombreCompleto());
        usuario.setCorreoElectronico(actualizarDTO.getCorreoElectronico());

        return usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void cambiarContrasena(CambiarContraDTO changeDTO) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(changeDTO.getNombreUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (!passwordEncoder.matches(changeDTO.getContrasenaActual(), usuario.getContrasenaHash())) {
            throw new RuntimeException("La contraseña actual es incorrecta.");
        }

        String newHashedPassword = passwordEncoder.encode(changeDTO.getNuevaContrasena());
        usuario.setContrasenaHash(newHashedPassword);

        usuarioRepository.save(usuario);
    }

    @Override
    public Optional<Usuario> login(LoginDTO loginDTO) {

        Optional<Usuario> usuarioOptional = usuarioRepository.findByNombreUsuario(loginDTO.getNombreUsuario());

        if (usuarioOptional.isPresent()) {
            Usuario usuario = usuarioOptional.get();

            if (passwordEncoder.matches(loginDTO.getContrasena(), usuario.getContrasenaHash())) {

                return Optional.of(usuario);
            }
        }

        return Optional.empty();
    }

    @Override
    public Optional<Usuario> findById(Integer usuarioId) {
        return usuarioRepository.findById(usuarioId);
    }

    @Override
    public Usuario finByUserName(String username) {
        return usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
    // En tu UsuarioService.java

    @Override
    public List<Usuario> obtenerUsuariosPorRol(String nombreRol) {

        return usuarioRepository.findAll().stream()
                .filter(u -> u.getRol().getNombreRol().equalsIgnoreCase(nombreRol))
                .collect(Collectors.toList());
    }
}
