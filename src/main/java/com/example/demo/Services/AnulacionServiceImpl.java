package com.example.demo.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.ReciboDetalleDTO;
import com.example.demo.entity.Cuota;
import com.example.demo.entity.EstadoCuota;
import com.example.demo.entity.Recibo;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.CuotaRepository;
import com.example.demo.repository.ReciboRepository;
import com.example.demo.repository.UsuarioRepository;

@Service
public class AnulacionServiceImpl implements AnulacionService {

    @Autowired
    private ReciboRepository reciboRepository;

    @Autowired
    private CuotaRepository cuotaRepository;

    @Autowired
    private TwoFactorAuthService twoFactorAuthService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public ReciboDetalleDTO buscarPorNumeroRecibo(String numeroRecibo) {
        Recibo recibo = reciboRepository.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("El recibo N° " + numeroRecibo + " no existe."));

        ReciboDetalleDTO dto = new ReciboDetalleDTO();
        dto.setNumeroRecibo(recibo.getNumeroRecibo());
        dto.setFechaPago(recibo.getFechaPago());
        dto.setMontoPagado(recibo.getMontoTotal());

        if (recibo.getAlumno() != null) {
            String nombreClaro = AlumnoServiceImpl.decifrar(recibo.getAlumno().getNombre(), "ClaveSecreta");
            String apellidoClaro = AlumnoServiceImpl.decifrar(recibo.getAlumno().getApellido(), "ClaveSecreta");
            dto.setNombreAlumno(nombreClaro + " " + apellidoClaro);
        }

        if (recibo.getCuota() != null) {
            dto.setConcepto(recibo.getCuota().getDescripcion());
        }

        if (recibo.isAnulado()) {
            throw new RuntimeException("Este recibo ya se encuentra ANULADO.");
        }

        return dto;
    }

    @Override
    @Transactional
    public void anularRecibo(String numeroRecibo, String usuarioDirector, int codigoDirector) {
        // 1. Validaciones de Seguridad (Director y TOTP)
        Usuario director = usuarioRepository.findByNombreUsuario(usuarioDirector)
                .orElseThrow(() -> new RuntimeException("Usuario director no encontrado"));

        if (!director.getRol().getNombreRol().equalsIgnoreCase("DIRECTOR")) {
            throw new RuntimeException("Solo un director puede aprobar la anulación.");
        }

        if (!twoFactorAuthService.verificarCodigo(usuarioDirector, codigoDirector)) {
            throw new RuntimeException("Código incorrecto. Anulación cancelada.");
        }

        // 2. Buscar el recibo original
        Recibo reciboOriginal = reciboRepository.findByNumeroRecibo(numeroRecibo)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        if (reciboOriginal.isAnulado()) {
            throw new RuntimeException("Este recibo ya fue anulado previamente.");
        }

        // 3. ANULACIÓN PERMANENTE DEL RECIBO
        reciboOriginal.setAnulado(true);
        reciboRepository.save(reciboOriginal);

        // 4. CORRECCIÓN: ANULAR TAMBIÉN LA CUOTA
        if (reciboOriginal.getCuota() != null) {
            Cuota cuota = reciboOriginal.getCuota();

            // IMPORTANTE: Cambiamos a ANULADO.
            // Ya NO usamos 'DEBE' porque no queremos que se vuelva a pagar.
            cuota.setEstado(EstadoCuota.ANULADO);

            cuotaRepository.save(cuota);
        }
    }
}
