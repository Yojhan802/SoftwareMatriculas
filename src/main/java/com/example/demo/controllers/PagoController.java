package com.example.demo.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.Services.PagoService;
import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping("/realizar")
    public ResponseEntity<ReciboDetalleDTO> realizarPago(@RequestBody PagoDTO pagoDTO) {
        try {
            ReciboDetalleDTO recibo = pagoService.procesarPago(pagoDTO);
            return new ResponseEntity<>(recibo, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}