package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ReciboDetalleDTO {
    private String numeroRecibo;
    private LocalDateTime fechaPago;
    private BigDecimal montoPagado;
    private String nombreAlumno;
    private String concepto;
}