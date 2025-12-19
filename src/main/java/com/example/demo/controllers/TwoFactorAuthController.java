package com.example.demo.controllers;

import com.example.demo.Services.TwoFactorAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/2fa")
public class TwoFactorAuthController {

    @Autowired
    private TwoFactorAuthService twoFactorAuthService;

    /**
     * Genera la clave secreta y retorna el QR como URL (para Google
     * Authenticator)
     */
    @PostMapping("/generar-qr/{nombreUsuario}")
    public ResponseEntity<?> generarQr(@PathVariable String nombreUsuario) {
        try {
            // 1. Generar clave secreta para el usuario
            String claveSecreta = twoFactorAuthService.generarClaveSecretaParaUsuario(nombreUsuario);

            // 2. Generar la URL QR
            String qrUrl = twoFactorAuthService.generarUrlQr(nombreUsuario);

            // 3. Retornar QR y clave secreta
            return ResponseEntity.ok().body(new QrResponse(qrUrl, claveSecreta));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

    public static class QrResponse {

        private String qrUrl;
        private String claveSecreta;

        public QrResponse(String qrUrl, String claveSecreta) {
            this.qrUrl = qrUrl;
            this.claveSecreta = claveSecreta;
        }

        public String getQrUrl() {
            return qrUrl;
        }

        public String getClaveSecreta() {
            return claveSecreta;
        }
    }
}
