package com.example.demo.entity;

import java.util.Date;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
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

    //Relacion con Cuota
    @OneToMany(mappedBy = "matricula", cascade = CascadeType.ALL)
    private List<Cuota> cuotas;

    @Column(name = "Fecha_Matricula")
    private Date Fecha_Matricula;

    @Column(name = "Periodo", nullable = false, length = 100)
    private String Periodo;

    //CAMPOS AGREGADOS
    @Column(name = "nivel", nullable = false, length = 50)
    private String nivel;

    @Column(name = "grado", nullable = false, length = 50)
    private String grado;

    @Column(name = "monto_matricula")
    private Double monto_Matricula;

    @Column(name = "estado", length = 20)
    private String estado;

    @PrePersist
    public void prePersist() {
        if (estado == null) {
            estado = "ACTIVO";
        }
        if (monto_Matricula == null) {
            monto_Matricula = 150.00;
        }
    }

}
