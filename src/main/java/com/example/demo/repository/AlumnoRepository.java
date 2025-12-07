package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Alumno;

public interface AlumnoRepository extends JpaRepository<Alumno, Integer> {

}
