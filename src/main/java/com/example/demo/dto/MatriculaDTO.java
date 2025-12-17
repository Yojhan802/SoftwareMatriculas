package com.example.demo.dto;

import java.util.Date;

import lombok.Data;

@Data
public class MatriculaDTO {

    private int id_Matricula;
    private int id_alumno;
    private String dni_alumno;

    private String nombreAlumno;   // Nuevo campo
    private String apellidoAlumno; // Nuevo campo
    // -------------------
    private Date fecha_Matricula;
    private String Periodo;
    private String nivel;
    private String grado;
    private double monto_Matricula;
    private String estado;

}
