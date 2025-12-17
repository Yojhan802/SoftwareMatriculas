package com.example.demo.Services;

import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Recibo;
import com.example.demo.repository.ReciboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnulacionServiceImpl implements AnulacionService{
    @Autowired
    private ReciboRepository reciboRepository;

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
        // 1. Buscamos el recibo
        Recibo recibo = reciboRepository.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("No se puede anular: Recibo no encontrado"));

        // 2. Verificamos si ya está anulado para evitar redundancia
        if (recibo.isAnulado()) {
            throw new RuntimeException("El recibo ya se encuentra anulado.");
        }

        // 3. Cambiamos el estado a true (en la BD se guardará como 1)
        recibo.setAnulado(true);

        // 4. Guardamos los cambios
        reciboRepository.save(recibo);
    }


}
