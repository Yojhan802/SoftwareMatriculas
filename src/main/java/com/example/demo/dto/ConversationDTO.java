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

    // ✅ Campos adicionales para el frontend
    private Integer destinatarioId; // ID de la persona con quien se conversa
    private String name; // Nombre a mostrar en la UI (el otro usuario)

    // Constructor sin los campos adicionales (para compatibilidad)
    public ConversationDTO(Long id, Integer usuarioId, String usuarioNombre,
            Integer adminId, String adminNombre,
            LocalDateTime fechaCreacion, LocalDateTime fechaUltimoMensaje,
            String estado, Long mensajesNoLeidos) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.adminId = adminId;
        this.adminNombre = adminNombre;
        this.fechaCreacion = fechaCreacion;
        this.fechaUltimoMensaje = fechaUltimoMensaje;
        this.estado = estado;
        this.mensajesNoLeidos = mensajesNoLeidos;
    }
}
