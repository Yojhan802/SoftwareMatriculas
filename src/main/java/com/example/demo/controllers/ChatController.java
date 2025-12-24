package com.example.demo.controllers;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.demo.Services.ChatService;
import com.example.demo.Services.UsuarioService;
import com.example.demo.dto.ChatMessageDTO;
import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.PublicKeyDTO;
import com.example.demo.dto.RegisterPublicKeyRequest;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    // ==================== REST Endpoints ====================
    /**
     * Registrar clave pública RSA del usuario POST /api/chat/keys/register
     */
    @PostMapping("/api/chat/keys/register")
    @ResponseBody
    public ResponseEntity<?> registerPublicKey(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RegisterPublicKeyRequest request) {
        try {
            // Obtener usuario desde UserDetails
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userDetails.getUsername()));

            chatService.registerPublicKey(usuario, request.getClavePublica());
            return ResponseEntity.ok().body("Clave pública registrada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Obtener clave pública de un usuario por ID GET /api/chat/keys/{usuarioId}
     */
    @GetMapping("/api/chat/keys/{usuarioId}")
    @ResponseBody
    public ResponseEntity<?> getPublicKey(@PathVariable Integer usuarioId) {
        try {
            System.out.println("🔍 Buscando clave pública para usuario ID: " + usuarioId);

            // Verificar si el usuario existe primero
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
            if (!usuarioOpt.isPresent()) {
                System.out.println("❌ Usuario no encontrado con ID: " + usuarioId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Usuario no encontrado");
            }

            PublicKeyDTO publicKey = chatService.getPublicKey(usuarioId);

            if (publicKey == null || publicKey.getClavePublica() == null) {
                System.out.println("⚠️ Usuario no tiene clave pública registrada: " + usuarioId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("El usuario no tiene clave pública registrada");
            }

            System.out.println("✅ Clave pública encontrada para usuario ID: " + usuarioId);
            return ResponseEntity.ok(publicKey);

        } catch (Exception e) {
            System.err.println("❌ Error en getPublicKey: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtener clave pública por nombre de usuario (para frontend) GET
     * /api/chat/keys?username=xxx
     */
    @GetMapping("/api/chat/keys")
    @ResponseBody
    public ResponseEntity<?> getPublicKeyByUsername(@RequestParam String username) {
        try {
            PublicKeyDTO publicKey = chatService.getPublicKeyByUsername(username);

            if (publicKey == null || publicKey.getClavePublica() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("El usuario no tiene clave pública registrada");
            }

            return ResponseEntity.ok(publicKey);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtener conversaciones del usuario autenticado GET
     * /api/chat/conversations
     */
    @GetMapping("/api/chat/conversations")
    @ResponseBody
    public ResponseEntity<?> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Obtener usuario desde UserDetails
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userDetails.getUsername()));

            List<ConversationDTO> conversations = chatService.getUserConversations(usuario);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtener mensajes de una conversación GET
     * /api/chat/conversations/{conversacionId}/messages
     */
    @GetMapping("/api/chat/conversations/{conversacionId}/messages")
    @ResponseBody
    public ResponseEntity<?> getMessages(
            @PathVariable Long conversacionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Obtener usuario desde UserDetails
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userDetails.getUsername()));

            List<ChatMessageDTO> messages = chatService.getConversationMessages(conversacionId, usuario);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Marcar mensajes como leídos POST
     * /api/chat/conversations/{conversacionId}/read
     */
    @PostMapping("/api/chat/conversations/{conversacionId}/read")
    @ResponseBody
    public ResponseEntity<?> markAsRead(
            @PathVariable Long conversacionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Obtener usuario desde UserDetails
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + userDetails.getUsername()));

            chatService.markMessagesAsRead(conversacionId, usuario);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Crear nueva conversación POST /api/chat/conversations
     */
    @PostMapping("/api/chat/conversations")
    @ResponseBody
    public ResponseEntity<?> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateConversationRequest request) {
        try {
            System.out.println("==================================================");
            System.out.println("Usuario autenticado: " + userDetails.getUsername());

            // Buscar el usuario real por nombre de usuario
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            System.out.println("Usuario encontrado: " + usuario);

            ConversationDTO conversation = chatService.createConversation(
                    usuario,
                    request.getDestinatarioId()
            );
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== WebSocket Endpoints ====================
    /**
     * Enviar mensaje cifrado /app/chat.send ⚠️ IMPORTANTE: En WebSocket usamos
     * Principal en lugar de @AuthenticationPrincipal
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {

        Usuario remitente = usuarioService.finByUserName(principal.getName());

        Usuario destinatario = usuarioRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        ChatMessageDTO message = chatService.sendMessage(remitente, request);

        messagingTemplate.convertAndSendToUser(
                destinatario.getNombreUsuario(),
                "/queue/messages",
                message
        );

        messagingTemplate.convertAndSendToUser(
                remitente.getNombreUsuario(),
                "/queue/messages",
                message
        );
    }

    /**
     * Registrar clave pública via WebSocket /app/register-key
     */
    @MessageMapping("/register-key")
    public void registerKeyViaWebSocket(
            @Payload RegisterPublicKeyRequest request,
            Principal principal) {
        try {
            if (principal == null) {
                throw new RuntimeException("Usuario no autenticado");
            }

            Usuario usuario = usuarioService.finByUserName(principal.getName());

            if (usuario == null) {
                throw new RuntimeException("Usuario no encontrado");
            }

            chatService.registerPublicKey(usuario, request.getClavePublica());

            // Confirmar al usuario
            messagingTemplate.convertAndSendToUser(
                    usuario.getId().toString(),
                    "/queue/key-registered",
                    "Clave pública registrada"
            );
        } catch (Exception e) {
            System.err.println("❌ Error en registerKeyViaWebSocket: " + e.getMessage());
            if (principal != null) {
                messagingTemplate.convertAndSendToUser(
                        principal.getName(),
                        "/queue/errors",
                        "Error registrando clave: " + e.getMessage()
                );
            }
        }
    }

    /**
     * Notificación de escritura /app/typing
     */
    @MessageMapping("/typing")
    public void userTyping(@Payload TypingNotification notification, Principal principal) {
        try {
            if (principal == null) {
                return;
            }

            Usuario usuario = usuarioService.finByUserName(principal.getName());

            if (usuario == null) {
                return;
            }

            // Notificar al destinatario que el usuario está escribiendo
            messagingTemplate.convertAndSendToUser(
                    notification.getDestinatarioId().toString(),
                    "/queue/typing",
                    new TypingNotification(
                            usuario.getId(),
                            notification.getDestinatarioId(),
                            notification.getTyping()
                    )
            );
        } catch (Exception e) {
            System.err.println("❌ Error en userTyping: " + e.getMessage());
        }
    }

}

// ==================== DTOs Adicionales ====================
class TypingNotification {

    private Integer remitenteId;
    private Integer destinatarioId;
    private Boolean typing;

    public TypingNotification() {
    }

    public TypingNotification(Integer remitenteId, Integer destinatarioId, Boolean typing) {
        this.remitenteId = remitenteId;
        this.destinatarioId = destinatarioId;
        this.typing = typing;
    }

    public Integer getRemitenteId() {
        return remitenteId;
    }

    public void setRemitenteId(Integer remitenteId) {
        this.remitenteId = remitenteId;
    }

    public Integer getDestinatarioId() {
        return destinatarioId;
    }

    public void setDestinatarioId(Integer destinatarioId) {
        this.destinatarioId = destinatarioId;
    }

    public Boolean getTyping() {
        return typing;
    }

    public void setTyping(Boolean typing) {
        this.typing = typing;
    }
}

class CreateConversationRequest {

    private Integer destinatarioId;

    public CreateConversationRequest() {
    }

    public Integer getDestinatarioId() {
        return destinatarioId;
    }

    public void setDestinatarioId(Integer destinatarioId) {
        this.destinatarioId = destinatarioId;
    }
}
