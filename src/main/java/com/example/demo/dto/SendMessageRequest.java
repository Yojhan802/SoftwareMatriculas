package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    private Long conversacionId; // ✅ Puede ser null si es el primer mensaje
    private Integer destinatarioId;
    private String contenidoCifrado;
    private Boolean cifrado;
}
