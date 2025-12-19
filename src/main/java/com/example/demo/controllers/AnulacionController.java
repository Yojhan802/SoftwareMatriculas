package com.example.demo.controllers;

import com.example.demo.Services.AnulacionService;
import com.example.demo.dto.ReciboDetalleDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/anulacion")
public class AnulacionController {

    @Autowired
    private AnulacionService anulacionService;

    @GetMapping("/buscar/{numeroRecibo}")
    public ResponseEntity<ReciboDetalleDTO> buscar(@PathVariable String numeroRecibo) {
        return ResponseEntity.ok(anulacionService.buscarPorNumeroRecibo(numeroRecibo));
    }

    // Ahora recibimos JSON con usuarioDirector y codigoDirector
    @PostMapping("/confirmar/{numeroRecibo}")
    public ResponseEntity<?> confirmarAnulacion(
            @PathVariable String numeroRecibo,
            @RequestBody AnulacionRequest request) {

        try {
            anulacionService.anularRecibo(numeroRecibo, request.getUsuarioDirector(), request.getCodigoDirector());
            return ResponseEntity.ok().body("{\"message\": \"Recibo anulado correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

    // Clase interna para mapear el JSON del request
    public static class AnulacionRequest {

        private String usuarioDirector;
        private int codigoDirector;

        public String getUsuarioDirector() {
            return usuarioDirector;
        }

        public void setUsuarioDirector(String usuarioDirector) {
            this.usuarioDirector = usuarioDirector;
        }

        public int getCodigoDirector() {
            return codigoDirector;
        }

        public void setCodigoDirector(int codigoDirector) {
            this.codigoDirector = codigoDirector;
        }
    }
}
