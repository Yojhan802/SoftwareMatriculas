package com.example.demo.Services;

import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Recibo;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.ReciboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnulacionServiceImpl implements AnulacionService{
    @Autowired
    private ReciboRepository reciboRepository;

    @Autowired
    private CuotaRepository cuotaRepository;

    @Override
    public ReciboDetalleDTO buscarPorNumeroRecibo(String numeroRecibo) {
        // 1. Buscar el recibo por el número único
        Recibo recibo = reciboRepository.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("El recibo N° " + numeroRecibo + " no existe."));

        // 2. Mapear los datos al DTO
        ReciboDetalleDTO dto = new ReciboDetalleDTO();
        dto.setNumeroRecibo(recibo.getNumeroRecibo());
        dto.setFechaPago(recibo.getFechaPago());
        dto.setMontoPagado(recibo.getMontoTotal()); // Usamos montoTotal de la entidad

        // 3. Obtener el nombre del alumno directamente
        // USANDO TUS MÉTODOS DE CIFRADO
        if (recibo.getAlumno() != null) {
            String nombreClaro = AlumnoServiceImpl.decifrar(recibo.getAlumno().getNombre(), "ClaveSecreta");
            String apellidoClaro = AlumnoServiceImpl.decifrar(recibo.getAlumno().getApellido(), "ClaveSecreta");

            dto.setNombreAlumno(nombreClaro + " " + apellidoClaro);
        }

        // 4. El concepto lo sacamos de la Cuota asociada
        if (recibo.getCuota() != null) {
            dto.setConcepto(recibo.getCuota().getDescripcion());
        }

        // 5. Validación de anulación para el frontend
        if (recibo.isAnulado()) {
            // Puedes manejar esto lanzando una excepción o añadiendo un campo 'estado' al DTO
            throw new RuntimeException("Este recibo ya se encuentra ANULADO.");
        }

        return dto;
    }

    @Override
    @Transactional // Importante para asegurar que el cambio se guarde en la BD
    public void anularRecibo(String numeroRecibo) {
        // 1. Buscar el recibo por su número único
        Recibo recibo = reciboRepository.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        // 2. Validar si ya está anulado
        if (recibo.isAnulado()) {
            throw new RuntimeException("El recibo ya se encuentra anulado");
        }

        // 3. ANULACIÓN DEL RECIBO
        // Cambiamos el boolean a true (se guarda como 1 en BD)
        recibo.setAnulado(true);
        reciboRepository.save(recibo);

        // 4. ACTUALIZACIÓN DE LA CUOTA RELACIONADA
        // Accedemos a la cuota mediante la relación OneToOne de la entidad
        if (recibo.getCuota() != null) {
            Cuota cuotaAsociada = recibo.getCuota();

            // Cambiamos el estado a "ANULADO" (o el valor que use tu Enum EstadoCuota)
            // Según tus imágenes, tienes un Enum llamado EstadoCuota
            cuotaAsociada.setEstado(EstadoCuota.ANULADO);

            cuotaRepository.save(cuotaAsociada);
        }
    }


}
