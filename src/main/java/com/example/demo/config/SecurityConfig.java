package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.example.demo.Services.CustomUserDetailsService;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    // Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // DaoAuthenticationProvider
    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // AuthenticationManager para login manual
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // SecurityFilterChain
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                // Endpoints públicos
                .requestMatchers(
                        "/index.html",
                        "/login.html",
                        "/api/users/login",
                        "/api/users/register",
                        "/api/users/me"
                ).permitAll()
                // Ejemplo de acceso por roles (ajusta a tus necesidades)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/alumnos/**", "/api/matricula/**", "/api/gestion-pagos/**", "/api/pagos/realizar").hasAnyRole("SECRETARIA", "ADMIN")
                .requestMatchers("/api/director/**").hasAnyRole("DIRECTOR", "ADMIN")
                .requestMatchers("/api/anulacion/**").permitAll()
                // Cualquier otra request necesita estar logueado
                .anyRequest().authenticated()
                )
                // FormLogin para manejar sesión
                .formLogin(form -> form
                .loginPage("/index.html")
                .loginProcessingUrl("/api/users/login")
                .defaultSuccessUrl("/principal.html", true)
                .permitAll()
                )
                .logout(logout -> logout
                .logoutUrl("/api/users/logout")
                .logoutSuccessUrl("/index.html")
                .permitAll()
                );

        return http.build();
    }
}
