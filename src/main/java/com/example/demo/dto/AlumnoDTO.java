package com.example.demo.dto;

import com.example.demo.entity.EstadoAlumno;

import lombok.Data;

@Data
public class AlumnoDTO {

    private int IdAlumno;
    private int dniAlumno;
    private String Nombre;
    private String Apellido;
    private String Direccion;
    private EstadoAlumno EstadoActual;
    private int id_Matricula;
    private int id_Pago;

}
