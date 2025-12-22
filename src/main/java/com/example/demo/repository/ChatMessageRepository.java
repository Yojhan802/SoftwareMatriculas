package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.Usuario;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationOrderByFechaEnvioAsc(Conversation conversation);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation = :conversation " +
           "AND m.destinatario = :usuario AND m.leido = false")
    Long countUnreadMessages(@Param("conversation") Conversation conversation, 
                            @Param("usuario") Usuario usuario);
}