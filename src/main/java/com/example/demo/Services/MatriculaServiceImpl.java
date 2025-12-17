package com.example.demo.Services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AlumnoDTO;
import com.example.demo.dto.MatriculaDTO;
import com.example.demo.entity.Alumno;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Matricula;
import com.example.demo.repository.AlumnoRepository;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.MatriculaRepository;

@Service
public class MatriculaServiceImpl implements MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final AlumnoRepository alumnoRepo;
    private final CuotaRepository repoCuota;
    private final AlumnoServiceImpl a;

    public MatriculaServiceImpl(AlumnoServiceImpl a, AlumnoRepository alumnoRepo, MatriculaRepository matriculaRepository, CuotaRepository repoCuota) {
        this.a = a;
        this.alumnoRepo = alumnoRepo;
        this.matriculaRepository = matriculaRepository;
        this.repoCuota = repoCuota;
    }

    // =========================================================================
    // MAPEO EXACTO A TUS VARIABLES DTO
    // =========================================================================
    private MatriculaDTO mapToDTO(Matricula matricula) {
        MatriculaDTO m = new MatriculaDTO();

        m.setId_Matricula(matricula.getId_Matricula());
        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo());
        m.setEstado(matricula.getEstado());
        m.setNivel(matricula.getNivel());
        m.setGrado(matricula.getGrado());

        if (matricula.getMonto_Matricula() != null) {
            m.setMonto_Matricula(matricula.getMonto_Matricula());
        }

        if (matricula.getAlumno() != null) {
            m.setId_alumno(matricula.getAlumno().getId_Alumno());
            if (matricula.getAlumno().getDniAlumno() != null) {
                m.setDni_alumno(matricula.getAlumno().getDniAlumno().toString());
            }

            try {
                String nombrePlano = AlumnoServiceImpl.decifrar(matricula.getAlumno().getNombre(), "ClaveSecreta");
                String apellidoPlano = AlumnoServiceImpl.decifrar(matricula.getAlumno().getApellido(), "ClaveSecreta");
                m.setNombreAlumno(nombrePlano);
                m.setApellidoAlumno(apellidoPlano);
            } catch (Exception e) {
                m.setNombreAlumno(matricula.getAlumno().getNombre());
                m.setApellidoAlumno(matricula.getAlumno().getApellido());
            }
        }
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
    @Transactional
    public MatriculaDTO crearMatricula(MatriculaDTO matricula) {
        Alumno alu = alumnoRepo.findById(matricula.getId_alumno())
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));

        Matricula ma = new Matricula();
        ma.setAlumno(alu);
        ma.setPeriodo(matricula.getPeriodo());
        ma.setFecha_Matricula(matricula.getFecha_Matricula());
        ma.setGrado(matricula.getGrado());
        ma.setNivel(matricula.getNivel());

        if (matricula.getMonto_Matricula() == 0) {
            ma.setMonto_Matricula(150.00);
        } else {
            ma.setMonto_Matricula(matricula.getMonto_Matricula());
        }

        if (ma.getEstado() == null) {
            ma.setEstado("ACTIVO");
        }

        Matricula m = matriculaRepository.save(ma);

        // --- Generar Cuotas ---
        LocalDate hoy = LocalDate.now();
        int yearInicio;
        try {
            yearInicio = Integer.parseInt(matricula.getPeriodo());
        } catch (NumberFormatException e) {
            yearInicio = hoy.getYear();
        }
        
        YearMonth marzo = YearMonth.of(yearInicio, 3);
        int cont = 1;

        // Cuota Matricula
        Cuota cm = new Cuota();
        cm.setMatricula(m);
        cm.setDescripcion("Cuota de Matricula");
        cm.setAnio(matricula.getPeriodo());
        cm.setMes("3");
        cm.setFechaVencimiento(marzo.atEndOfMonth());
        cm.setMonto((BigDecimal.valueOf(150.00)));
        cm.setEstado(EstadoCuota.DEBE); 
        repoCuota.save(cm);

        // Cuotas Mensuales
        AlumnoDTO alum = a.ObtenerAlumnoPorDni(alu.getDniAlumno());
        for (int i = 3; i <= 12; i++) {
            Cuota c = new Cuota();
            c.setMatricula(m);
            c.setDescripcion("Cuota N° " + cont + " de " + alum.getApellido());
            c.setAnio(matricula.getPeriodo());
            c.setMes(String.valueOf(i));
            YearMonth ym = YearMonth.of(yearInicio, i);
            c.setFechaVencimiento(ym.atEndOfMonth());
            c.setMonto((BigDecimal.valueOf(350.00)));
            c.setEstado(EstadoCuota.DEBE);
            repoCuota.save(c);
            cont++;
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
        return matriculaRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public MatriculaDTO actualizarMatricula(int id, Matricula matricula) {
        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matricula no encontrada"));

        if(matricula.getAlumno() != null) {
             Alumno alu = alumnoRepo.findById(matricula.getAlumno().getId_Alumno())
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));
             m.setAlumno(alu);
        }
       
        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo());

        Matricula nuevo = matriculaRepository.save(m);
        return mapToDTO(nuevo);
    }

    // =========================================================================
    // LÓGICA HÍBRIDA: ELIMINAR vs ANULAR
    // =========================================================================
    @Override
    @Transactional
    public void eliminarMatricula(int id) {
        // 1. Buscamos la matrícula
        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matricula no encontrada"));

        // 2. Verificamos si tiene AL MENOS UN PAGO
        boolean tienePagos = false;
        if (m.getCuotas() != null) {
            tienePagos = m.getCuotas().stream()
                    .anyMatch(c -> c.getEstado() == EstadoCuota.PAGADO);
        }

        if (!tienePagos) {
            // CASO A: NO HA PAGADO NADA -> ELIMINACIÓN TOTAL (BD)
            matriculaRepository.delete(m); 
        } else {
            // CASO B: SÍ TIENE PAGOS -> ANULACIÓN LÓGICA
            // La matrícula pasa a ANULADO
            m.setEstado("ANULADO");

            // Solo anulamos las cuotas que aun DEBE
            if (m.getCuotas() != null) {
                for (Cuota c : m.getCuotas()) {
                    if (c.getEstado() == EstadoCuota.DEBE) {
                        c.setEstado(EstadoCuota.ANULADO);
                    }
                    // Las PAGADO se quedan PAGADO (Historial)
                }
            }
            matriculaRepository.save(m);
        }
    }
}