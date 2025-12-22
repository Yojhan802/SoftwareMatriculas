package com.example.demo.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entity.Conversation;
import com.example.demo.entity.Usuario;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.usuario = :user1 AND c.admin = :user2) OR " +
           "(c.usuario = :user2 AND c.admin = :user1)")
    Optional<Conversation> findConversationBetweenUsers(@Param("user1") Usuario user1, 
                                                        @Param("user2") Usuario user2);

    List<Conversation> findByUsuarioOrderByFechaUltimoMensajeDesc(Usuario usuario);

    List<Conversation> findByAdminOrderByFechaUltimoMensajeDesc(Usuario admin);

    @Query("SELECT c FROM Conversation c WHERE c.usuario = :usuario OR c.admin = :usuario " +
           "ORDER BY c.fechaUltimoMensaje DESC")
    List<Conversation> findAllByUserOrderByFechaUltimoMensajeDesc(@Param("usuario") Usuario usuario);
}