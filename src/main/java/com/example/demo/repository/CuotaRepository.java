package com.example.demo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entity.Cuota;

public interface CuotaRepository extends JpaRepository<Cuota, Integer> {

    // había un error de nombres con "id_Matricula", por eso se usa:
    @Query("SELECT c FROM Cuota c WHERE c.matricula.id_Matricula = :id")
    List<Cuota> findByMatriculaId(@Param("id") int idMatricula);
}