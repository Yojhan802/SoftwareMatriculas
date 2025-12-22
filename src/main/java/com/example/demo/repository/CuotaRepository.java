package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Matricula;

@Repository
public interface CuotaRepository extends JpaRepository<Cuota, Integer> {

    // === CAMBIO CLAVE: USAMOS NATIVE QUERY ===
    // 1. Usamos 'value' para escribir SQL puro (como en MySQL Workbench).
    // 2. Usamos 'nativeQuery = true'.
    // 3. Asumimos que tus tablas se llaman 'matricula' y 'alumno' (o 'alumnos').
    //    Si tu tabla de alumnos se llama 'alumnos', agrega la 's' en el JOIN abajo.
    @Query(value = "SELECT c.* FROM cuota c "
            + "INNER JOIN matricula m ON c.id_matricula = m.id_matricula "
            + "INNER JOIN alumno a ON m.id_alumno = a.id_alumno "
            + "WHERE a.dni_alumno = :dni "
            + "AND m.estado = 'ACTIVO' "
            + "AND c.estado IN ('DEBE', 'PAGADO') " // <--- Esta condición omitirá las cuotas ANULADAS
            + "ORDER BY c.fecha_vencimiento ASC",
            nativeQuery = true)
    List<Cuota> buscarPorAlumno(String dni);

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
