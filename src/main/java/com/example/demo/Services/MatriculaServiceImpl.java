package com.example.demo.Services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.MatriculaDTO;
import com.example.demo.entity.Alumno;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.Matricula;
import com.example.demo.repository.AlumnoRepository;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.MatriculaRepository;

@Service
public class MatriculaServiceImpl implements MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final AlumnoRepository alumnoRepo;
    private final CuotaRepository repoCuota;

    public MatriculaServiceImpl(AlumnoRepository alumnoRepo, MatriculaRepository matriculaRepository, CuotaRepository repoCuota) {
        this.alumnoRepo = alumnoRepo;
        this.matriculaRepository = matriculaRepository;
        this.repoCuota = repoCuota;
    }

    private MatriculaDTO mapToDTO(Matricula matricula) {
        MatriculaDTO m = new MatriculaDTO();
        
        // ID y Relaciones
        m.setId_Matricula(matricula.getId_Matricula());
        
        // Validación segura por si el alumno viene nulo (aunque no debería)
        if (matricula.getAlumno() != null) {
            m.setId_alumno(matricula.getAlumno().getId_Alumno());
        }

        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo()); // Asegúrate de que este dato exista en BD
        m.setEstado(matricula.getEstado());

        // --- CORRECCIONES ---
        m.setNivel(matricula.getNivel());      // Faltaba mapear el Nivel
        m.setGrado(matricula.getGrado());      // Corregido: antes usabas getEstado()
        m.setMonto_Matricula(matricula.getMonto_Matricula()); // Faltaba mapear el Monto

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
    public MatriculaDTO crearMatricula(MatriculaDTO matricula) {
        Alumno alu = alumnoRepo.findById(matricula.getId_alumno())
                .orElseThrow(() -> new RuntimeException("Almuno no encontrado"));

        Matricula ma = new Matricula();
        ma.setAlumno(alu);
        ma.setPeriodo(matricula.getPeriodo());
        ma.setFecha_Matricula(matricula.getFecha_Matricula());
        ma.setGrado(matricula.getGrado());
        ma.setNivel(matricula.getNivel());
        Matricula m = matriculaRepository.save(ma);
        LocalDate fecha = LocalDate.now();
        for (int i = 3; i <= 10; i++) {
            Cuota c = new Cuota();
            c.setMatricula(m);
            c.setAnio(matricula.getPeriodo());
            c.setMes(String.valueOf(i));

            LocalDate fechaMas30 = fecha.plusDays(30);
            fecha = fecha.plusDays(30);
            c.setFechaVencimiento(fechaMas30);
            c.setMonto((BigDecimal.valueOf(350.00)));
            repoCuota.save(c);
        }

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
