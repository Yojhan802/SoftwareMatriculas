package com.example.demo.Services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.AlumnoDTO;
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
    private final AlumnoServiceImpl a;

    public MatriculaServiceImpl(AlumnoServiceImpl a, AlumnoRepository alumnoRepo, MatriculaRepository matriculaRepository, CuotaRepository repoCuota) {
        this.a = a;
        this.alumnoRepo = alumnoRepo;
        this.matriculaRepository = matriculaRepository;
        this.repoCuota = repoCuota;
    }

    // =========================================================================
    // MÉTODO MODIFICADO PARA DECIFRAR NOMBRES
    // =========================================================================
    private MatriculaDTO mapToDTO(Matricula matricula) {
        MatriculaDTO m = new MatriculaDTO();

        m.setId_Matricula(matricula.getId_Matricula());
        m.setFecha_Matricula(matricula.getFecha_Matricula());
        m.setPeriodo(matricula.getPeriodo());
        m.setEstado(matricula.getEstado());
        m.setNivel(matricula.getNivel());
        m.setGrado(matricula.getGrado());
        m.setMonto_Matricula(matricula.getMonto_Matricula());

        if (matricula.getAlumno() != null) {
            m.setId_alumno(matricula.getAlumno().getId_Alumno());
            
            // --- AQUÍ ESTÁ EL CAMBIO ---
            try {
                // Obtenemos el texto cifrado de la BD
                String nombreCifrado = matricula.getAlumno().getNombre();
                String apellidoCifrado = matricula.getAlumno().getApellido();

                // Usamos el método estático de AlumnoServiceImpl para decifrarlo
                // La clave debe ser EXACTAMENTE la misma que usaste al guardar: "ClaveSecreta"
                String nombrePlano = AlumnoServiceImpl.decifrar(nombreCifrado, "ClaveSecreta");
                String apellidoPlano = AlumnoServiceImpl.decifrar(apellidoCifrado, "ClaveSecreta");

                m.setNombreAlumno(nombrePlano);
                m.setApellidoAlumno(apellidoPlano);
            } catch (Exception e) {
                // Si falla el descifrado (ej. datos antiguos no cifrados), mostramos el original o error
                System.err.println("Error al decifrar alumno ID " + matricula.getAlumno().getId_Alumno() + ": " + e.getMessage());
                m.setNombreAlumno(matricula.getAlumno().getNombre()); 
                m.setApellidoAlumno(matricula.getAlumno().getApellido());
            }
            // ---------------------------
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
    public MatriculaDTO crearMatricula(MatriculaDTO matricula) {
        Alumno alu = alumnoRepo.findById(matricula.getId_alumno())
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));

        Matricula ma = new Matricula();
        ma.setAlumno(alu);
        ma.setPeriodo(matricula.getPeriodo());
        ma.setFecha_Matricula(matricula.getFecha_Matricula());
        ma.setGrado(matricula.getGrado());
        ma.setNivel(matricula.getNivel());
        
        // Asignamos monto por defecto si viene 0 (opcional, buena práctica)
        if(matricula.getMonto_Matricula() == 0) ma.setMonto_Matricula(150.00);
        else ma.setMonto_Matricula(matricula.getMonto_Matricula());
        
        // Establecer estado por defecto
        if(ma.getEstado() == null) ma.setEstado("ACTIVO");

        Matricula m = matriculaRepository.save(ma);
        
        // --- LOGICA DE CUOTAS (Se mantiene igual) ---
        LocalDate hoy = LocalDate.now();
        int yearInicio = hoy.getMonthValue() <= 3 ? hoy.getYear() : hoy.getYear() + 1;
        YearMonth marzo = YearMonth.of(yearInicio, 3);
        int cont = 1;

        // Cuota Matricula
        Cuota cm = new Cuota();
        cm.setMatricula(m);
        cm.setDescripcion("Cuota de Matricula");
        cm.setAnio(matricula.getPeriodo());
        cm.setMes("-");
        cm.setFechaVencimiento(marzo.atEndOfMonth());
        cm.setMonto((BigDecimal.valueOf(150.00)));
        repoCuota.save(cm);

        // Cuotas Mensuales
        AlumnoDTO alum = a.ObtenerAlumnoPorDni(alu.getDniAlumno()); // Esto ya devuelve el nombre decifrado
        for (int i = 3; i <= 12; i++) {
            Cuota c = new Cuota();
            c.setMatricula(m);
            // Aquí 'alum' ya viene decifrado porque usas a.ObtenerAlumnoPorDni
            c.setDescripcion("Cuota N° " + cont + " de " + alum.getApellido());
            c.setAnio(matricula.getPeriodo());
            c.setMes(String.valueOf(i));
            YearMonth ym = YearMonth.of(yearInicio, i);
            c.setFechaVencimiento(ym.atEndOfMonth());
            c.setMonto((BigDecimal.valueOf(350.00)));
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

        Alumno alu = alumnoRepo.findById(matricula.getAlumno().getId_Alumno())
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));

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