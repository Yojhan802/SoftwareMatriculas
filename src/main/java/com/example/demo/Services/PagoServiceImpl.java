package com.example.demo.Services;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Recibo;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.ReciboRepository;

@Service
public class PagoServiceImpl implements PagoService {

    private final CuotaRepository cuotaRepository;
    private final ReciboRepository reciboRepository;

    private static final String SERIE_RECIBO = "001";

    public PagoServiceImpl(CuotaRepository cuotaRepository, ReciboRepository reciboRepository) {
        this.cuotaRepository = cuotaRepository;
        this.reciboRepository = reciboRepository;
    }

    @Override
    @Transactional
    public ReciboDetalleDTO procesarPago(PagoDTO pagoDTO) {

        Cuota cuota = cuotaRepository.findById(pagoDTO.getIdCuota())
                .orElseThrow(() -> new RuntimeException("Cuota no encontrada"));

        if (cuota.getEstado() == EstadoCuota.PAGADO) {
            throw new RuntimeException("Esta cuota ya ha sido pagada previamente.");
        }

        if (cuota.getMonto().compareTo(pagoDTO.getMontoPago()) != 0) {
            throw new RuntimeException("El monto del pago no coincide con el monto de la cuota.");
        }

        cuota.setEstado(EstadoCuota.PAGADO);
        cuotaRepository.save(cuota);

        String nuevoNumeroRecibo = generarProximoNumeroRecibo();

        Recibo recibo = new Recibo();
        recibo.setCuota(cuota);
        recibo.setAlumno(cuota.getMatricula().getAlumno()); // Obtenemos alumno desde la matrícula
        recibo.setNumeroRecibo(nuevoNumeroRecibo);
        recibo.setFechaPago(LocalDateTime.now());
        recibo.setMontoTotal(pagoDTO.getMontoPago());
        recibo.setMetodoPago(pagoDTO.getMetodoPago());

        Recibo reciboGuardado = reciboRepository.save(recibo);

        return mapToDTO(reciboGuardado);
    }

    private String generarProximoNumeroRecibo() {
        Optional<Recibo> ultimoRecibo = reciboRepository.findTopByOrderByIdReciboDesc();

        if (ultimoRecibo.isPresent()) {
            String ultimoNumero = ultimoRecibo.get().getNumeroRecibo();
            String[] partes = ultimoNumero.split("-");
            long correlativoActual = Long.parseLong(partes[1]);
            long nuevoCorrelativo = correlativoActual + 1;

            // Formateamos a 7 dígitos con ceros a la izquierda
            return String.format("%s-%07d", SERIE_RECIBO, nuevoCorrelativo);
        } else {
            return SERIE_RECIBO + "-0000001";
        }
    }

    private ReciboDetalleDTO mapToDTO(Recibo recibo) {
        ReciboDetalleDTO dto = new ReciboDetalleDTO();
        dto.setNumeroRecibo(recibo.getNumeroRecibo());
        dto.setFechaPago(recibo.getFechaPago());
        dto.setMontoPagado(recibo.getMontoTotal());

        dto.setNombreAlumno(recibo.getAlumno().getNombre() + " " + recibo.getAlumno().getApellido());

        dto.setConcepto(recibo.getCuota().getDescripcion());
        return dto;
    }
}