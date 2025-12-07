package com.example.demo.entity;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "alumno")

public class Alumno {

    //ID DEL ALUMNO 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_Alumno")
    private int Id_Alumno;

    //NOMBRE DEL ALUMNO
    @Column(name = "nombre", nullable = false, length = 80)
    private String Nombre;

    //APELLIDO DEL ALUMNO
    @Column(name = "apellido", nullable = false, length = 80)
    private String Apellido;

    //DIRECCION DEL ALUMNO
    @Column(name = "direccion", nullable = false, length = 150)
    private String Direccion;

    //ESTADO DEL ALUMNO
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_actual", nullable = false)
    private EstadoAlumno estadoActual = EstadoAlumno.Activo;

    @OneToMany(mappedBy = "matricula")
    private List<Matricula> Matricula;


    /*@OneToMany(mappedBy="pago")
    private List<Pago> Pago; */
}
