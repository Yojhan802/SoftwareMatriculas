package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    // 🧵 Conversación
    private Long conversacionId;

    // 👤 Destinatario
    private Integer destinatarioId;

    // 🔐 CIFRADO E2E (DOBLE COPIA)
    private String contenidoCifradoDestinatario;
    private String contenidoCifradoRemitente;

    // ⚠️ Legacy / fallback (opcional)
    private String contenidoCifrado;

    // 🔐 Flag
    private Boolean cifrado;
}
