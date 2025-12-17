package com.example.demo.dto;

import java.math.BigDecimal;
import com.example.demo.entity.EstadoCuota;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CuotaDTO {
    private Integer id;
    private String descripcion;
    private EstadoCuota estado;
    private LocalDate fechaVencimiento;
    private BigDecimal monto;
    private int idMatricula;
    private String anio;
    private String mes;
}
