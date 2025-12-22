package com.example.demo.Services;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserKeysRepository userKeysRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ChatMessageDTO sendMessage(Usuario remitente, SendMessageRequest request) {
        Usuario destinatario = usuarioRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        // Verificar que el destinatario tenga clave pública registrada
        if (!userKeysRepository.existsByUsuario(destinatario)) {
            throw new RuntimeException("El destinatario no tiene clave pública registrada");
        }

        // Buscar o crear conversación
        Conversation conversation = getOrCreateConversation(remitente, destinatario);

        // Crear mensaje
        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setRemitente(remitente);
        message.setDestinatario(destinatario);
        message.setContenidoCifrado(request.getContenidoCifrado());
        message.setLeido(false);

        message = messageRepository.save(message);

        // Actualizar fecha del último mensaje
        conversation.setFechaUltimoMensaje(LocalDateTime.now());
        conversationRepository.save(conversation);

        return convertToDTO(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversationMessages(Long conversacionId, Usuario usuario) {
        Conversation conversation = conversationRepository.findById(conversacionId)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        // Verificar que el usuario sea parte de la conversación
        if (!conversation.getUsuario().getId().equals(usuario.getId()) &&
            !conversation.getAdmin().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes acceso a esta conversación");
        }

        List<ChatMessage> messages = messageRepository.findByConversationOrderByFechaEnvioAsc(conversation);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Usuario usuario) {
        List<Conversation> conversations = conversationRepository
                .findAllByUserOrderByFechaUltimoMensajeDesc(usuario);

        return conversations.stream().map(conv -> {
            ConversationDTO dto = convertConversationToDTO(conv);
            Long unreadCount = messageRepository.countUnreadMessages(conv, usuario);
            dto.setMensajesNoLeidos(unreadCount);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Long conversacionId, Usuario usuario) {
        Conversation conversation = conversationRepository.findById(conversacionId)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        List<ChatMessage> messages = messageRepository.findByConversationOrderByFechaEnvioAsc(conversation);
        LocalDateTime now = LocalDateTime.now();

        messages.stream()
                .filter(m -> m.getDestinatario().getId().equals(usuario.getId()) && !m.getLeido())
                .forEach(m -> {
                    m.setLeido(true);
                    m.setFechaLectura(now);
                });

        messageRepository.saveAll(messages);
    }

    @Transactional
    public void registerPublicKey(Usuario usuario, String clavePublica) {
        UserKeys userKeys = userKeysRepository.findByUsuario(usuario)
                .orElse(new UserKeys());

        userKeys.setUsuario(usuario);
        userKeys.setClavePublica(clavePublica);

        userKeysRepository.save(userKeys);
    }

    @Transactional(readOnly = true)
    public PublicKeyDTO getPublicKey(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        UserKeys userKeys = userKeysRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("Usuario no tiene clave pública registrada"));

        return new PublicKeyDTO(usuario.getId(), userKeys.getClavePublica());
    }

    private Conversation getOrCreateConversation(Usuario user1, Usuario user2) {
        // Determinar quién es admin y quién es usuario regular
        Usuario admin = user2.getRol().getNombreRol().equalsIgnoreCase("ADMIN") ? user2 : user1;
        Usuario regularUser = user2.getRol().getNombreRol().equalsIgnoreCase("ADMIN") ? user1 : user2;

        return conversationRepository.findConversationBetweenUsers(regularUser, admin)
                .orElseGet(() -> {
                    Conversation newConv = new Conversation();
                    newConv.setUsuario(regularUser);
                    newConv.setAdmin(admin);
                    newConv.setEstado(Conversation.EstadoConversacion.ACTIVA);
                    return conversationRepository.save(newConv);
                });
    }

    private ChatMessageDTO convertToDTO(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getConversation().getId(),
                message.getRemitente().getId(),
                message.getRemitente().getNombreCompleto(),
                message.getDestinatario().getId(),
                message.getDestinatario().getNombreCompleto(),
                message.getContenidoCifrado(),
                message.getFechaEnvio(),
                message.getLeido()
        );
    }

    private ConversationDTO convertConversationToDTO(Conversation conversation) {
        return new ConversationDTO(
                conversation.getId(),
                conversation.getUsuario().getId(),
                conversation.getUsuario().getNombreCompleto(),
                conversation.getAdmin().getId(),
                conversation.getAdmin().getNombreCompleto(),
                conversation.getFechaCreacion(),
                conversation.getFechaUltimoMensaje(),
                conversation.getEstado().name(),
                0L // Se establece después
        );
    }
}
