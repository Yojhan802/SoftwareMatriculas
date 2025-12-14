package com.example.demo.Services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Recibo;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.ReciboRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // Esto inyecta los repositorios automáticamente
public class PagoServiceImpl implements PagoService {

    private final CuotaRepository cuotaRepo;
    private final ReciboRepository reciboRepo;

    @Override
    @Transactional(rollbackFor = Exception.class) // SI FALLA UNO, SE CANCELAN TODOS
    public List<ReciboDetalleDTO> procesarPagos(List<PagoDTO> listaPagos) {

        List<ReciboDetalleDTO> recibosGenerados = new ArrayList<>();

        // 1. Ordenamos la lista entrante por ID de cuota.
        // Esto asegura que procesemos Marzo antes que Abril dentro del bucle.
        listaPagos.sort(Comparator.comparing(PagoDTO::getIdCuota));

        for (PagoDTO pagoDto : listaPagos) {

            // A. Buscar Cuota
            Cuota cuota = cuotaRepo.findById(pagoDto.getIdCuota())
                    .orElseThrow(() -> new RuntimeException("Cuota no encontrada ID: " + pagoDto.getIdCuota()));

            // B. Validar si ya pagó
            if (cuota.getEstado() == EstadoCuota.PAGADO) {
                throw new RuntimeException("La cuota del mes " + cuota.getMes() + " ya figura como PAGADA.");
            }

            // C. VALIDACIÓN CRÍTICA: ¿Tiene deudas anteriores?
            // Esta función busca si existe alguna cuota de esta misma matrícula,
            // que esté en estado DEBE y cuya fecha sea ANTERIOR a la actual.
            boolean deudaPendiente = cuotaRepo.existsByMatriculaAndEstadoAndFechaVencimientoBefore(
                    cuota.getMatricula(),
                    EstadoCuota.DEBE,
                    cuota.getFechaVencimiento()
            );

            if (deudaPendiente) {
                throw new RuntimeException("BLOQUEO: El alumno debe cuotas anteriores a " + cuota.getMes()
                        + ". Debe regularizar su deuda en orden cronológico.");
            }

            // D. Validar monto exacto (Opcional, según tu regla de negocio)
            // Usamos compareTo para BigDecimals
            if (pagoDto.getMontoPago().compareTo(cuota.getMonto()) != 0) {
                throw new RuntimeException("Error en " + cuota.getMes() + ": El monto enviado no coincide con la deuda.");
            }

            // E. Generar el Recibo
            Recibo recibo = new Recibo();
            recibo.setCuota(cuota);
            recibo.setAlumno(cuota.getMatricula().getAlumno());
            recibo.setNumeroRecibo(generarNumeroUnico()); // Método privado auxiliar
            recibo.setFechaPago(LocalDateTime.now());
            recibo.setMontoTotal(cuota.getMonto());
            recibo.setMetodoPago(pagoDto.getMetodoPago());
            recibo.setAnulado(false);

            // F. Actualizar estado Cuota
            cuota.setEstado(EstadoCuota.PAGADO);

            // G. Guardar en BD
            cuotaRepo.save(cuota);   // Actualiza a PAGADO inmediatamente
            Recibo guardado = reciboRepo.save(recibo);

            // H. Agregar a la lista de respuesta
            recibosGenerados.add(mapToDTO(guardado));
        }

        return recibosGenerados;
    }

    @Override
    public ReciboDetalleDTO buscarReciboPorNumero(String numeroRecibo) {
        Recibo r = reciboRepo.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));
        return mapToDTO(r);
    }

    @Override
    @Transactional
    public void anularRecibo(String numeroRecibo) {
        Recibo recibo = reciboRepo.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        if (recibo.isAnulado()) {
            throw new RuntimeException("El recibo ya está anulado.");
        }

        // Para anular, también debemos verificar que no se anule Marzo si Abril está pagado
        // (La lógica inversa: no dejar huecos).
        // Verificar si existe una cuota POSTERIOR pagada.
        boolean pagosPosteriores = cuotaRepo.existsByMatriculaAndEstadoAndFechaVencimientoAfter(
                recibo.getCuota().getMatricula(),
                EstadoCuota.PAGADO,
                recibo.getCuota().getFechaVencimiento()
        );

        if (pagosPosteriores) {
            throw new RuntimeException("No se puede anular este recibo porque existen cuotas posteriores ya pagadas. Anule esas primero.");
        }

        recibo.setAnulado(true);
        recibo.getCuota().setEstado(EstadoCuota.DEBE); // La cuota vuelve a deberse

        reciboRepo.save(recibo);
        cuotaRepo.save(recibo.getCuota());
    }

    // --- MÉTODOS PRIVADOS ---
    private String generarNumeroUnico() {
        // Aquí tu lógica de correlativo. Ejemplo simple:
        return "REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private ReciboDetalleDTO mapToDTO(Recibo r) {
        ReciboDetalleDTO dto = new ReciboDetalleDTO();
        dto.setNumeroRecibo(r.getNumeroRecibo());
        dto.setFechaPago(r.getFechaPago());
        dto.setMontoPagado(r.getMontoTotal());
        dto.setNombreAlumno(r.getAlumno().getNombre() + " " + r.getAlumno().getApellido());
        dto.setConcepto("Cuota " + r.getCuota().getMes());
        return dto;
    }
}
