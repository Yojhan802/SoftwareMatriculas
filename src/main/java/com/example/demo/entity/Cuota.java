package com.example.demo.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "cuota")
public class Cuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_Cuota;

    @ManyToOne
    @JoinColumn(name = "id_matricula", nullable = false)
    @JsonIgnoreProperties({"alumno", "cuotas", "matricula"})
    private Matricula matricula;

    @Column(name = "descripcion", length = 100, nullable = true)
    private String descripcion;

    @Column(name = "monto", nullable = false)
    private BigDecimal monto;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoCuota estado = EstadoCuota.DEBE;

    @Column(name = "mes", nullable = false, length = 20)
    private String mes;

    @Column(name = "anio", nullable = false, length = 10)
    private String anio;

}
