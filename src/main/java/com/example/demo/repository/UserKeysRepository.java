package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Usuario;


public interface UserKeysRepository extends JpaRepository<UserKeys, Long> {

    Optional<UserKeys> findByUsuario(Usuario usuario);

    boolean existsByUsuario(Usuario usuario);
}
