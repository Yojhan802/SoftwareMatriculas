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
    // RUTAS DE GESTIÓN
    // ==========================================
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
    // RUTA DE PROCESO DE PAGO (ACTUALIZADA)
    // ==========================================
    @PostMapping("/api/pagos/realizar")
    // 1. Cambiamos el parámetro a List<PagoDTO>
    // 2. El retorno ahora es una lista de recibos List<ReciboDetalleDTO>
    public ResponseEntity<?> realizarPago(@RequestBody List<PagoDTO> listaPagos) {
        try {
            // Llamamos al método nuevo del servicio que procesa la lista
            List<ReciboDetalleDTO> recibos = pagoService.procesarPagos(listaPagos);

            return new ResponseEntity<>(recibos, HttpStatus.CREATED);

        } catch (RuntimeException e) {
            // IMPORTANTE: Devolver el mensaje de error (e.getMessage())
            // para que el Frontend pueda mostrar "Debes pagar Marzo antes que Abril"
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}