package com.example.demo.Services;

import com.example.demo.entity.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class TwoFactorAuthService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    @Autowired
    private UsuarioRepository usuarioRepository; // Repositorio de Usuario

    /**
     * Genera una clave secreta para un usuario y la guarda en la BD.
     */
    public String generarClaveSecretaParaUsuario(String nombreUsuario) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        String claveSecreta = key.getKey();

        usuario.setClave2FA(claveSecreta);
        usuarioRepository.save(usuario);

        return claveSecreta; // Retorna la clave para mostrar en QR o configurarla en Authenticator
    }

    /**
     * Verifica el código TOTP ingresado por un usuario
     */
    public boolean verificarCodigo(String nombreUsuario, int codigo) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.getClave2FA() == null) {
            throw new RuntimeException("Este usuario no tiene 2FA configurado");
        }

        return gAuth.authorize(usuario.getClave2FA(), codigo);
    }

    public String generarUrlQr(String nombreUsuario) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.getClave2FA() == null) {
            throw new RuntimeException("El usuario no tiene clave 2FA generada");
        }

        // URL para Google Authenticator
        String qrCodeUrl = "otpauth://totp/" + URLEncoder.encode("MiSistema:" + usuario.getNombreUsuario(), StandardCharsets.UTF_8)
                + "?secret=" + usuario.getClave2FA()
                + "&issuer=" + URLEncoder.encode("MiSistema", StandardCharsets.UTF_8);

        return qrCodeUrl;
    }
}
