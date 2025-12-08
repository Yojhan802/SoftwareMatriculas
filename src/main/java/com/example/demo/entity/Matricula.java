package com.example.demo.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "matricula")
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_Matricula")
    private int id_Matricula;
    @ManyToOne()
    @JoinColumn(name = "id_Alumno")
    private Alumno alumno;

    @Column(name = "Fecha_Matricula")
    private Date Fecha_Matricula;

    @Column(name = "Periodo", nullable = false, length = 100)
    private String Periodo;

    // grado y cuota 
}
