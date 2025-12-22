package com.example.demo.Services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.ChatMessageDTO;
import com.example.demo.dto.ConversationDTO;
import com.example.demo.dto.PublicKeyDTO;
import com.example.demo.dto.SendMessageRequest;
import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.UserKeys;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.UserKeysRepository;
import com.example.demo.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserKeysRepository userKeysRepository;
    private final UsuarioRepository usuarioRepository;

    /* =====================================================
       ENVIAR MENSAJE (E2E DOBLE CIFRADO)
    ===================================================== */
    @Transactional
    public ChatMessageDTO sendMessage(Usuario remitente, SendMessageRequest request) {

        log.info("📨 Enviando mensaje E2E");
        log.info("➡️ Remitente ID={}", remitente.getId());
        log.info("➡️ Destinatario ID={}", request.getDestinatarioId());
        log.info("➡️ Conversación ID={}", request.getConversacionId());
        log.info("➡️ Cifrado={}", request.getCifrado());

        Usuario destinatario = usuarioRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        if (!userKeysRepository.existsByUsuario(destinatario)) {
            throw new RuntimeException("El destinatario no tiene clave pública registrada");
        }

        Conversation conversation = (request.getConversacionId() != null)
                ? conversationRepository.findById(request.getConversacionId())
                        .orElseThrow(() -> new RuntimeException("Conversación no encontrada"))
                : getOrCreateConversation(remitente, destinatario);

        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setRemitente(remitente);
        message.setDestinatario(destinatario);

        // 🔐 CIFRADO REAL
        if (Boolean.TRUE.equals(request.getCifrado())) {

            if (request.getContenidoCifradoDestinatario() == null
                    || request.getContenidoCifradoRemitente() == null) {
                throw new RuntimeException("Mensaje cifrado incompleto (faltan copias)");
            }

            message.setContenidoCifradoDestinatario(
                    request.getContenidoCifradoDestinatario()
            );
            message.setContenidoCifradoRemitente(
                    request.getContenidoCifradoRemitente()
            );
            message.setCifrado(true);

            log.debug("🔐 Copia destinatario y remitente guardadas");

        } else {
            // ⚠️ Legacy / fallback
            // message.setContenidoCifrado(request.getContenidoCifrado());
            // message.setCifrado(false);
        }

        message.setLeido(false);
        message.setFechaEnvio(LocalDateTime.now());

        message = messageRepository.save(message);

        conversation.setFechaUltimoMensaje(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("✅ Mensaje guardado ID={}", message.getId());

        return convertToDTO(message, remitente);
    }

    /* =====================================================
       MENSAJES DE CONVERSACIÓN
    ===================================================== */
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversationMessages(Long conversacionId, Usuario usuario) {

        Conversation conversation = conversationRepository.findById(conversacionId)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        if (!conversation.getUsuario().getId().equals(usuario.getId())
                && !conversation.getAdmin().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes acceso a esta conversación");
        }

        List<ChatMessage> messages
                = messageRepository.findByConversationOrderByFechaEnvioAsc(conversation);

        return messages.stream()
                .map(m -> convertToDTO(m, usuario))
                .collect(Collectors.toList());
    }

    /* =====================================================
       CONVERSACIONES DEL USUARIO
    ===================================================== */
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Usuario usuario) {

        return conversationRepository
                .findAllByUserOrderByFechaUltimoMensajeDesc(usuario)
                .stream()
                .map(conv -> {
                    ConversationDTO dto = convertConversationToDTO(conv, usuario);
                    dto.setMensajesNoLeidos(
                            messageRepository.countUnreadMessages(conv, usuario)
                    );
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /* =====================================================
       MARCAR COMO LEÍDOS
    ===================================================== */
    @Transactional
    public void markMessagesAsRead(Long conversacionId, Usuario usuario) {

        Conversation conversation = conversationRepository.findById(conversacionId)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        LocalDateTime now = LocalDateTime.now();

        List<ChatMessage> messages
                = messageRepository.findByConversationOrderByFechaEnvioAsc(conversation);

        messages.stream()
                .filter(m -> m.getDestinatario().getId().equals(usuario.getId()))
                .filter(m -> !m.getLeido())
                .forEach(m -> {
                    m.setLeido(true);
                    m.setFechaLectura(now);
                });

        messageRepository.saveAll(messages);
    }

    /* =====================================================
       CLAVES PÚBLICAS
    ===================================================== */
    @Transactional
    public void registerPublicKey(Usuario usuario, String clavePublica) {

        if (clavePublica == null || clavePublica.isBlank()) {
            throw new RuntimeException("Clave pública vacía");
        }

        clavePublica = clavePublica
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");

        try {
            java.util.Base64.getDecoder().decode(clavePublica);
        } catch (Exception e) {
            throw new RuntimeException("Clave pública inválida (Base64)");
        }

        UserKeys keys = userKeysRepository.findByUsuario(usuario)
                .orElse(new UserKeys());

        keys.setUsuario(usuario);
        keys.setClavePublica(clavePublica);

        userKeysRepository.save(keys);

        log.info("🔑 Clave pública registrada usuario ID={}", usuario.getId());
    }

    @Transactional(readOnly = true)
    public PublicKeyDTO getPublicKey(Integer usuarioId) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        UserKeys keys = userKeysRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("Usuario sin clave pública"));

        return new PublicKeyDTO(usuario.getId(), keys.getClavePublica());
    }

    @Transactional(readOnly = true)
    public PublicKeyDTO getPublicKeyByUsername(String username) {

        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return getPublicKey(usuario.getId());
    }

    /* =====================================================
       CONVERSACIONES
    ===================================================== */
    @Transactional
    public ConversationDTO createConversation(Usuario remitente, Integer destinatarioId) {

        Usuario destinatario = usuarioRepository.findById(destinatarioId)
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        return conversationRepository
                .findConversationBetweenUsers(remitente, destinatario)
                .map(c -> convertConversationToDTO(c, remitente))
                .orElseGet(() -> {

                    Conversation c = new Conversation();

                    boolean remitenteAdmin
                            = remitente.getRol().getNombreRol().equalsIgnoreCase("ADMIN");

                    c.setAdmin(remitenteAdmin ? remitente : destinatario);
                    c.setUsuario(remitenteAdmin ? destinatario : remitente);

                    c.setEstado(Conversation.EstadoConversacion.ACTIVA);
                    c.setFechaCreacion(LocalDateTime.now());
                    c.setFechaUltimoMensaje(LocalDateTime.now());

                    conversationRepository.save(c);

                    return convertConversationToDTO(c, remitente);
                });
    }

    private Conversation getOrCreateConversation(Usuario u1, Usuario u2) {

        Usuario admin = u1.getRol().getNombreRol().equalsIgnoreCase("ADMIN") ? u1 : u2;
        Usuario user = admin == u1 ? u2 : u1;

        return conversationRepository.findConversationBetweenUsers(user, admin)
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setAdmin(admin);
                    c.setUsuario(user);
                    c.setEstado(Conversation.EstadoConversacion.ACTIVA);
                    c.setFechaCreacion(LocalDateTime.now());
                    c.setFechaUltimoMensaje(LocalDateTime.now());
                    return conversationRepository.save(c);
                });
    }

    /* =====================================================
       MAPPERS
    ===================================================== */
    private ChatMessageDTO convertToDTO(ChatMessage message, Usuario currentUser) {

        return new ChatMessageDTO(
                message.getCifrado(), // Boolean cifrado
                message.getContenidoCifradoDestinatario(), // String contenidoCifradoDestinatario
                message.getContenidoCifradoRemitente(), // String contenidoCifradoRemitente
                message.getConversation().getId(), // Long conversacionId
                message.getDestinatario().getId(), // Integer destinatarioId
                message.getDestinatario().getNombreCompleto(), // String destinatarioNombre
                message.getFechaEnvio(), // LocalDateTime fechaEnvio
                message.getId(), // Long id
                message.getLeido(), // Boolean leido
                message.getRemitente().getId(), // Integer remitenteId
                message.getRemitente().getNombreCompleto() // String remitenteNombre
        );
    }

    private ConversationDTO convertConversationToDTO(
            Conversation conversation,
            Usuario currentUser) {

        Usuario otro = conversation.getUsuario().getId().equals(currentUser.getId())
                ? conversation.getAdmin()
                : conversation.getUsuario();

        return new ConversationDTO(
                conversation.getId(),
                conversation.getUsuario().getId(),
                conversation.getUsuario().getNombreCompleto(),
                conversation.getAdmin().getId(),
                conversation.getAdmin().getNombreCompleto(),
                conversation.getFechaCreacion(),
                conversation.getFechaUltimoMensaje(),
                conversation.getEstado().name(),
                0L,
                otro.getId(),
                otro.getNombreCompleto()
        );
    }
}
