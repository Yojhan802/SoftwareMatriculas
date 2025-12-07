package com.example.demo.Services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.MatriculaDTO;
import com.example.demo.entity.Alumno;
import com.example.demo.entity.Matricula;
import com.example.demo.repository.AlumnoRepository;
import com.example.demo.repository.MatriculaRepository;

@Service
public class MatriculaServiceImpl implements MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final AlumnoRepository alumnoRepo;

    public MatriculaServiceImpl(MatriculaRepository matriculaRepository, AlumnoRepository alumnoRepo) {
        this.matriculaRepository = matriculaRepository;
        this.alumnoRepo = alumnoRepo;
    }

    private MatriculaDTO mapToDTO(Matricula matricula) {
        MatriculaDTO m = new MatriculaDTO();
        m.setId_Matricula(matricula.getId_Matricula());
        m.setId_alumno(matricula.getAlumno().getId_Alumno());
        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo());

        return m;
    }

    public Matricula mapToEntity(MatriculaDTO matriculaDTO) {
        Matricula matricula = new Matricula();
        matricula.setId_Matricula(matriculaDTO.getId_Matricula());
        matricula.setFecha_Matricula(matriculaDTO.getFecha_Matricula());
        matricula.setPeriodo(matriculaDTO.getPeriodo());

        return matricula;
    }

    @Override
    public MatriculaDTO crearMatricula(Matricula matricula) {
        Alumno alu = alumnoRepo.findById(matricula.getAlumno().getId_Alumno())
                .orElseThrow(() -> new RuntimeException("Almuno no encontrado"));
        matricula.setAlumno(alu);

        Matricula m = matriculaRepository.save(matricula);

        return mapToDTO(m);
    }

    @Override
    public MatriculaDTO ObtenerMatricula(int id) {

        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matricula no encontrada"));

        return mapToDTO(m);
    }

    @Override
    public List<MatriculaDTO> listarMatricula() {
        return matriculaRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public MatriculaDTO actualizarMatricula(int id, Matricula matricula) {
        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matricula no enxontrada"));

        Alumno alu = alumnoRepo.findById(matricula.getAlumno().getId_Alumno())
                .orElseThrow(() -> new RuntimeException("Almuno no encontrado"));

        m.setAlumno(alu);
        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo());

        Matricula nuevo = matriculaRepository.save(m);
        return mapToDTO(nuevo);

    }

    @Override
    public void eliminarMatricula(int id) {
        matriculaRepository.deleteById(id);
    }

}
