package com.example.demo.Services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserKeysRepository userKeysRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Enviar mensaje cifrado
     */
    @Transactional
    public ChatMessageDTO sendMessage(Usuario remitente, SendMessageRequest request) {
        Usuario destinatario = usuarioRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        // Verificar que el destinatario tenga clave pública registrada
        if (!userKeysRepository.existsByUsuario(destinatario)) {
            throw new RuntimeException("El destinatario no tiene clave pública registrada");
        }

        // Buscar o crear conversación
        Conversation conversation;
        if (request.getConversacionId() != null) {
            conversation = conversationRepository.findById(request.getConversacionId())
                    .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        } else {
            conversation = getOrCreateConversation(remitente, destinatario);
        }

        // Crear mensaje
        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setRemitente(remitente);
        message.setDestinatario(destinatario);
        message.setContenidoCifrado(request.getContenidoCifrado());
        message.setCifrado(request.getCifrado() != null ? request.getCifrado() : true);
        message.setLeido(false);
        message.setFechaEnvio(LocalDateTime.now());

        message = messageRepository.save(message);

        // Actualizar fecha del último mensaje
        conversation.setFechaUltimoMensaje(LocalDateTime.now());
        conversationRepository.save(conversation);

        return convertToDTO(message);
    }

    /**
     * Obtener mensajes de una conversación
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversationMessages(Long conversacionId, Usuario usuario) {
        Conversation conversation = conversationRepository.findById(conversacionId)
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        // Verificar que el usuario sea parte de la conversación
        if (!conversation.getUsuario().getId().equals(usuario.getId())
                && !conversation.getAdmin().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tienes acceso a esta conversación");
        }

        List<ChatMessage> messages = messageRepository.findByConversationOrderByFechaEnvioAsc(conversation);
        return messages.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Obtener todas las conversaciones de un usuario
     */
    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(Usuario usuario) {
        List<Conversation> conversations = conversationRepository
                .findAllByUserOrderByFechaUltimoMensajeDesc(usuario);

        return conversations.stream().map(conv -> {
            ConversationDTO dto = convertConversationToDTO(conv, usuario);
            Long unreadCount = messageRepository.countUnreadMessages(conv, usuario);
            dto.setMensajesNoLeidos(unreadCount);
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Marcar mensajes como leídos
     */
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

    /**
     * Registrar clave pública RSA de un usuario
     */
    @Transactional
    public void registerPublicKey(Usuario usuario, String clavePublica) {
        UserKeys userKeys = userKeysRepository.findByUsuario(usuario)
                .orElse(new UserKeys());

        userKeys.setUsuario(usuario);
        userKeys.setClavePublica(clavePublica);

        userKeysRepository.save(userKeys);
    }

    /**
     * Obtener clave pública por ID de usuario
     */
    @Transactional(readOnly = true)
    public PublicKeyDTO getPublicKey(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        UserKeys userKeys = userKeysRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("Usuario no tiene clave pública registrada"));

        return new PublicKeyDTO(usuario.getId(), userKeys.getClavePublica());
    }

    /**
     * Obtener clave pública por nombre de usuario
     */
    @Transactional(readOnly = true)
    public PublicKeyDTO getPublicKeyByUsername(String username) {
        // ⚠️ IMPORTANTE: Verifica que el método en tu UsuarioRepository sea el correcto
        // Puede ser findByUsername o findByNombreUsuario según tu entidad
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return getPublicKey(usuario.getId());
    }

    /**
     * Crear nueva conversación
     */
    @Transactional
    public ConversationDTO createConversation(Usuario remitente, Integer destinatarioId) {
        Usuario destinatario = usuarioRepository.findById(destinatarioId)
                .orElseThrow(() -> new RuntimeException("Destinatario no encontrado"));

        // Verificar si ya existe una conversación entre estos usuarios
        Conversation existingConversation = conversationRepository
                .findConversationBetweenUsers(remitente, destinatario)
                .orElse(null);

        if (existingConversation != null) {
            // Si ya existe, retornar la conversación existente
            return convertConversationToDTO(existingConversation, remitente);
        }

        // Si no existe, crear nueva conversación
        Conversation newConversation = new Conversation();

        // Determinar quién es admin y quién es usuario regular
        boolean remitenteEsAdmin = remitente.getRol().getNombreRol().equalsIgnoreCase("ADMIN");
        boolean destinatarioEsAdmin = destinatario.getRol().getNombreRol().equalsIgnoreCase("ADMIN");

        if (remitenteEsAdmin) {
            newConversation.setAdmin(remitente);
            newConversation.setUsuario(destinatario);
        } else if (destinatarioEsAdmin) {
            newConversation.setAdmin(destinatario);
            newConversation.setUsuario(remitente);
        } else {
            // Si ninguno es admin, el remitente será considerado como usuario
            newConversation.setUsuario(remitente);
            newConversation.setAdmin(destinatario);
        }

        newConversation.setEstado(Conversation.EstadoConversacion.ACTIVA);
        newConversation.setFechaCreacion(LocalDateTime.now());
        newConversation.setFechaUltimoMensaje(LocalDateTime.now());

        newConversation = conversationRepository.save(newConversation);

        return convertConversationToDTO(newConversation, remitente);
    }

    /**
     * Buscar o crear conversación entre dos usuarios
     */
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
                    newConv.setFechaCreacion(LocalDateTime.now());
                    newConv.setFechaUltimoMensaje(LocalDateTime.now());
                    return conversationRepository.save(newConv);
                });
    }

    /**
     * Convertir ChatMessage a DTO
     */
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
                message.getLeido(),
                message.getCifrado() // ✅ Agregar campo cifrado
        );
    }

    /**
     * Convertir Conversation a DTO
     */
    private ConversationDTO convertConversationToDTO(Conversation conversation, Usuario currentUser) {
        // Determinar el "otro" usuario (con quien se está conversando)
        boolean currentUserIsRegular = conversation.getUsuario().getId().equals(currentUser.getId());

        Usuario otroUsuario = currentUserIsRegular
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
                0L, // Se establece después con mensajesNoLeidos
                otroUsuario.getId(), // ✅ ID del destinatario (con quien se conversa)
                otroUsuario.getNombreCompleto() // ✅ Nombre a mostrar en la UI
        );
    }
}
