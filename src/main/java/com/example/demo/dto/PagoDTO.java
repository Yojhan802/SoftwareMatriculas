package com.example.demo.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class PagoDTO {

    private Integer idCuota;
    private BigDecimal montoPago;
    private String metodoPago;
}
