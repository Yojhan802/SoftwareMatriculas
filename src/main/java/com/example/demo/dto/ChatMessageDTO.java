package com.example.demo.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {

    private Long id;
    private Long conversacionId;
    private Integer remitenteId;
    private String remitenteNombre;
    private Integer destinatarioId;
    private String destinatarioNombre;
    private String contenidoCifrado;
    private LocalDateTime fechaEnvio;
    private Boolean leido;
    private Boolean cifrado; // ✅ Campo agregado para indicar si está cifrado
}
