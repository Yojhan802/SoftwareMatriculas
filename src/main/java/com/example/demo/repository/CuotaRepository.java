package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;

import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Cuota;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, Integer> {

    // === CAMBIO CLAVE: USAMOS NATIVE QUERY ===
    // 1. Usamos 'value' para escribir SQL puro (como en MySQL Workbench).
    // 2. Usamos 'nativeQuery = true'.
    // 3. Asumimos que tus tablas se llaman 'matricula' y 'alumno' (o 'alumnos').
    //    Si tu tabla de alumnos se llama 'alumnos', agrega la 's' en el JOIN abajo.

    @Query(value = "SELECT c.* FROM cuota c " +
            "INNER JOIN matricula m ON c.id_matricula = m.id_matricula " +
            "INNER JOIN alumno a ON m.id_alumno = a.id_alumno " +
            "WHERE LOWER(a.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) " +
            "OR LOWER(a.apellido) LIKE LOWER(CONCAT('%', :termino, '%')) " +
            "ORDER BY c.fecha_vencimiento ASC",
            nativeQuery = true)
    List<Cuota> buscarPorAlumno(@Param("termino") String termino);

    // Estos métodos de JPA funcionan bien si las relaciones @ManyToOne están bien hechas.
    // Si te dan error, avísame para pasarlos a Query también.
    boolean existsByMatriculaAndEstadoAndFechaVencimientoBefore(
            Matricula matricula,
            EstadoCuota estado,
            LocalDate fechaVencimiento
    );

    boolean existsByMatriculaAndEstadoAndFechaVencimientoAfter(
            Matricula matricula,
            EstadoCuota estado,
            LocalDate fechaVencimiento
    );
}