package com.example.demo.dto;

import lombok.Data;

@Data
public class CambiarContraDTO {

    private String nombreUsuario;
    private String contrasenaActual;
    private String nuevaContrasena;
}
