package com.example.demo.Services;

import java.util.List;

import com.example.demo.dto.AlumnoDTO;

public interface AlumnoService {

    AlumnoDTO crearAlumnos(AlumnoDTO alumnoDTO);

    AlumnoDTO ObtenerAlumnoId(int id);

    List<AlumnoDTO> listarAlumnos();

    AlumnoDTO actualizarAlumno(int id, AlumnoDTO alumnoDTO);

    void eliminarAlumno(int id);

}
