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

    // 🧵 Conversación
    private Long conversacionId;

    // 👤 Remitente
    private Integer remitenteId;
    private String remitenteNombre;

    // 👤 Destinatario
    private Integer destinatarioId;
    private String destinatarioNombre;

    // 🔐 CONTENIDO (YA SELECCIONADO POR BACKEND)
    // private String contenidoCifrado;
    // 🕒 Metadata
    private LocalDateTime fechaEnvio;
    private Boolean leido;
    private Boolean cifrado;
    private String contenidoCifradoDestinatario;
    private String contenidoCifradoRemitente;

    public ChatMessageDTO(Boolean cifrado, String contenidoCifradoDestinatario, String contenidoCifradoRemitente, Long conversacionId, Integer destinatarioId, String destinatarioNombre, LocalDateTime fechaEnvio, Long id, Boolean leido, Integer remitenteId, String remitenteNombre) {
        this.cifrado = cifrado;
        this.contenidoCifradoDestinatario = contenidoCifradoDestinatario;
        this.contenidoCifradoRemitente = contenidoCifradoRemitente;
        this.conversacionId = conversacionId;
        this.destinatarioId = destinatarioId;
        this.destinatarioNombre = destinatarioNombre;
        this.fechaEnvio = fechaEnvio;
        this.id = id;
        this.leido = leido;
        this.remitenteId = remitenteId;
        this.remitenteNombre = remitenteNombre;
    }

}
