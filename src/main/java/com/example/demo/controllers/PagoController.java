package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Services.PagoService;
import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Cuota;
import com.example.demo.repository.CuotaRepository;

@RestController
@CrossOrigin(origins = "*")
public class PagoController {

    private final CuotaRepository cuotaRepo;
    private final PagoService pagoService;

    public PagoController(CuotaRepository cuotaRepo, PagoService pagoService) {
        this.cuotaRepo = cuotaRepo;
        this.pagoService = pagoService;
    }

    // ==========================================
    // RUTAS DE GESTIÓN (Búsqueda y Anulación)    // Prefijo: /api/gestion-pagos    // ==========================================
    @GetMapping("/api/gestion-pagos/pendientes")
    public ResponseEntity<List<Cuota>> buscarDeudas(@RequestParam String termino) {
        List<Cuota> cuotas = cuotaRepo.buscarPorAlumno(termino);
        return ResponseEntity.ok(cuotas);
    }

    @GetMapping("/api/gestion-pagos/recibo/{nroRecibo}")
    public ResponseEntity<ReciboDetalleDTO> buscarRecibo(@PathVariable String nroRecibo) {
        try {
            ReciboDetalleDTO dto = pagoService.buscarReciboPorNumero(nroRecibo);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/gestion-pagos/anular/{nroRecibo}")
    public ResponseEntity<?> anularPago(@PathVariable String nroRecibo) {
        try {
            pagoService.anularRecibo(nroRecibo);
            return ResponseEntity.ok("Pago anulado correctamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    // RUTA DE PROCESO DE PAGO (La que faltaba)    // Prefijo: /api/pagos    // ==========================================
    @PostMapping("/api/pagos/realizar")
    public ResponseEntity<ReciboDetalleDTO> realizarPago(@RequestBody PagoDTO pagoDTO) {
        try {
            ReciboDetalleDTO recibo = pagoService.procesarPago(pagoDTO);
            return new ResponseEntity<>(recibo, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            // Devolvemos error 400 con el mensaje de la excepción (ej: "Cuota ya pagada")
            return ResponseEntity.badRequest().build();
        }
    }
}