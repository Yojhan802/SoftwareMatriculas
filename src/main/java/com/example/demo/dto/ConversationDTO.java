package com.example.demo.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private Long id;
    private Integer usuarioId;
    private String usuarioNombre;
    private Integer adminId;
    private String adminNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaUltimoMensaje;
    private String estado;
    private Long mensajesNoLeidos;
}