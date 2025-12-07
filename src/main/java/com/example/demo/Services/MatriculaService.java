package com.example.demo.Services;

import java.util.List;

import com.example.demo.dto.MatriculaDTO;
import com.example.demo.entity.Matricula;

public interface MatriculaService {

    MatriculaDTO crearMatricula(Matricula matricula);

    MatriculaDTO ObtenerMatricula(int id);

    List<MatriculaDTO> listarMatricula();

    MatriculaDTO actualizarMatricula(int id, Matricula matricula);

    void eliminarMatricula(int id);
}
