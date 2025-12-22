package com.example.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* =========================
       RELACIONES
    ========================= */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitente_id", nullable = false)
    private Usuario remitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;

    /* =========================
       CONTENIDO E2E
    ========================= */
    // 🔐 Copia cifrada para el destinatario
    @Column(name = "contenido_cifrado_destinatario", columnDefinition = "TEXT", nullable = false)
    private String contenidoCifradoDestinatario;

    // 🔐 Copia cifrada para el remitente
    @Column(name = "contenido_cifrado_remitente", columnDefinition = "TEXT", nullable = false)
    private String contenidoCifradoRemitente;

    // ⚠️ Legacy (opcional, puedes borrar luego)
    // @Column(name = "contenido_cifrado", columnDefinition = "TEXT")
    // private String contenidoCifrado;

    /* =========================
       METADATA
    ========================= */
    @Column(name = "cifrado", nullable = false)
    private Boolean cifrado = true;

    @Column(name = "fecha_envio", nullable = false)
    private LocalDateTime fechaEnvio;

    @Column(name = "leido", nullable = false)
    private Boolean leido = false;

    @Column(name = "fecha_lectura")
    private LocalDateTime fechaLectura;

    /* =========================
       LIFECYCLE
    ========================= */
    @PrePersist
    protected void onCreate() {
        if (fechaEnvio == null) {
            fechaEnvio = LocalDateTime.now();
        }
        if (cifrado == null) {
            cifrado = true;
        }
        if (leido == null) {
            leido = false;
        }
    }
}
