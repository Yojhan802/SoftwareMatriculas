package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.Cuota;

public interface CuotaRepository extends JpaRepository<Cuota, Integer> {

    @Query("SELECT c FROM Cuota c "
            + "JOIN c.matricula m "
            + "JOIN m.alumno a "
            + "WHERE (LOWER(a.Nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR "
            + "       LOWER(a.Apellido) LIKE LOWER(CONCAT('%', :termino, '%'))) "
            + "ORDER BY c.fechaVencimiento ASC")
    List<Cuota> buscarPorAlumno(@Param("termino") String termino);
}