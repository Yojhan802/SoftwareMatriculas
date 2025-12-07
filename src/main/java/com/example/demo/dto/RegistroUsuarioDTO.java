package com.example.demo.dto;

import lombok.Data;

@Data
public class RegistroUsuarioDTO {

    private String nombreCompleto;
    private String nombreUsuario;
    private String contrasena;
    private String correoElectronico;
    private Integer rolId;
}
