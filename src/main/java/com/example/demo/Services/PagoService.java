package com.example.demo.Services;

import com.example.demo.dto.PagoDTO;
import com.example.demo.dto.ReciboDetalleDTO;

import java.util.List;

public interface PagoService {

    List<ReciboDetalleDTO> procesarPagos(List<PagoDTO> listaPagos);

    ReciboDetalleDTO buscarReciboPorNumero(String numeroRecibo);

    void anularRecibo(String numeroRecibo);
}