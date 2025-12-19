package com.example.demo.Services;

import com.example.demo.dto.ReciboDetalleDTO;
import org.springframework.stereotype.Service;

public interface AnulacionService {

    ReciboDetalleDTO buscarPorNumeroRecibo(String numeroRecibo);

    void anularRecibo(String numeroRecibo, String usuarioDirector, int codigoDirector);
}
