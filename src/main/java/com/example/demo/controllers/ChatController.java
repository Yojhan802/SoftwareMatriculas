package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.demo.Services.ChatService;
import com.example.demo.dto.ChatMessageDTO;
import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.PublicKeyDTO;
import com.example.demo.dto.RegisterPublicKeyRequest;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.entity.Usuario;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // REST Endpoints

    @PostMapping("/api/chat/keys/register")
    @ResponseBody
    public ResponseEntity<?> registerPublicKey(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody RegisterPublicKeyRequest request) {
        try {
            chatService.registerPublicKey(usuario, request.getClavePublica());
            return ResponseEntity.ok().body("Clave pública registrada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/chat/keys/{usuarioId}")
    @ResponseBody
    public ResponseEntity<PublicKeyDTO> getPublicKey(@PathVariable Integer usuarioId) {
        try {
            PublicKeyDTO publicKey = chatService.getPublicKey(usuarioId);
            return ResponseEntity.ok(publicKey);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/api/chat/conversations")
    @ResponseBody
    public ResponseEntity<List<ConversationDTO>> getConversations(
            @AuthenticationPrincipal Usuario usuario) {
        List<ConversationDTO> conversations = chatService.getUserConversations(usuario);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/api/chat/conversations/{conversacionId}/messages")
    @ResponseBody
    public ResponseEntity<List<ChatMessageDTO>> getMessages(
            @PathVariable Long conversacionId,
            @AuthenticationPrincipal Usuario usuario) {
        try {
            List<ChatMessageDTO> messages = chatService.getConversationMessages(conversacionId, usuario);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/api/chat/conversations/{conversacionId}/read")
    @ResponseBody
    public ResponseEntity<?> markAsRead(
            @PathVariable Long conversacionId,
            @AuthenticationPrincipal Usuario usuario) {
        try {
            chatService.markMessagesAsRead(conversacionId, usuario);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // WebSocket Endpoints

    @MessageMapping("/chat.send")
    public void sendMessage(
            @Payload SendMessageRequest request,
            @AuthenticationPrincipal Usuario usuario) {
        try {
            ChatMessageDTO message = chatService.sendMessage(usuario, request);

            // Enviar al destinatario específico
            messagingTemplate.convertAndSendToUser(
                    request.getDestinatarioId().toString(),
                    "/queue/messages",
                    message
            );

            // También enviar al remitente para confirmación
            messagingTemplate.convertAndSendToUser(
                    usuario.getId().toString(),
                    "/queue/messages",
                    message
            );
        } catch (Exception e) {
            // Enviar error al remitente
            messagingTemplate.convertAndSendToUser(
                    usuario.getId().toString(),
                    "/queue/errors",
                    e.getMessage()
            );
        }
    }

    @MessageMapping("/chat.typing")
    public void userTyping(
            @Payload TypingNotification notification,
            @AuthenticationPrincipal Usuario usuario) {
        // Notificar al destinatario que el usuario está escribiendo
        messagingTemplate.convertAndSendToUser(
                notification.getDestinatarioId().toString(),
                "/queue/typing",
                new TypingNotification(usuario.getId(), notification.getDestinatarioId(), true)
        );
    }
}

// DTO adicional para notificación de escritura
class TypingNotification {
    private Integer remitenteId;
    private Integer destinatarioId;
    private Boolean typing;

    public TypingNotification() {}

    public TypingNotification(Integer remitenteId, Integer destinatarioId, Boolean typing) {
        this.remitenteId = remitenteId;
        this.destinatarioId = destinatarioId;
        this.typing = typing;
    }

    public Integer getRemitenteId() { return remitenteId; }
    public void setRemitenteId(Integer remitenteId) { this.remitenteId = remitenteId; }
    public Integer getDestinatarioId() { return destinatarioId; }
    public void setDestinatarioId(Integer destinatarioId) { this.destinatarioId = destinatarioId; }
    public Boolean getTyping() { return typing; }
    public void setTyping(Boolean typing) { this.typing = typing; }
}