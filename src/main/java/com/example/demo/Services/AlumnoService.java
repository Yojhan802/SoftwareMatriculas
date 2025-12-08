package com.example.demo.Services;

import java.util.List;

import com.example.demo.dto.AlumnoDTO;

public interface AlumnoService {

    AlumnoDTO crearAlumnos(AlumnoDTO alumnoDTO);

    AlumnoDTO ObtenerAlumnoPorDni(int dni);

    List<AlumnoDTO> listarAlumnos();

    AlumnoDTO actualizarAlumno(int dni, AlumnoDTO alumnoDTO);

    void eliminarAlumno(int dni);

}
