package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.entity.Recibo;

public interface ReciboRepository extends JpaRepository<Recibo, Integer> {

    Optional<Recibo> findTopByOrderByIdReciboDesc();

    Optional<Recibo> findByNumeroRecibo(String numeroRecibo);

    @Query(value = """
    SELECT MAX(CAST(SUBSTRING(numero_recibo, 5) AS UNSIGNED))
    FROM recibo
    WHERE serie = :serie
""", nativeQuery = true)
    Integer obtenerUltimoNumero(String serie);

}
