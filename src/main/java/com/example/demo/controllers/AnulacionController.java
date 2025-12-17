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

    @PostMapping("/confirmar/{numeroRecibo}")
    public ResponseEntity<?> confirmarAnulacion(@PathVariable String numeroRecibo) {
        try {
            anulacionService.anularRecibo(numeroRecibo);
            return ResponseEntity.ok().body("{\"message\": \"Recibo anulado correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }
}
