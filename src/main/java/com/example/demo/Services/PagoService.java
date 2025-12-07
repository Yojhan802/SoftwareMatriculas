package com.example.demo.Services;

import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;

public interface PagoService {
    ReciboDetalleDTO procesarPago(PagoDTO pagoDTO);
}