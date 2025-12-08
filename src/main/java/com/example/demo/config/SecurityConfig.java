package com.example.demo.config;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demo.entity.EstadoUsuario;
import com.example.demo.entity.Rol;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.RolRepository;
import com.example.demo.repository.UsuarioRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/", "/index.html", "/login.html", "/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers("/api/auth/**", "/api/users/**").permitAll()
                // Rutas API protegidas por rol
                .requestMatchers("/api/alumnos/**", "/api/matricula/**", "/api/pagos/**")
                .hasRole("SECRETARIA")
                .requestMatchers("/api/reportes/**")
                .hasRole("DIRECTOR")
                .requestMatchers("/api/comun/**")
                .hasAnyRole("DIRECTOR", "SECRETARIA")
                .anyRequest().authenticated()
                )
                .formLogin(form -> form
                .loginPage("/login.html")
                .loginProcessingUrl("/api/users/login")
                .defaultSuccessUrl("/principal.html", true)
                .failureUrl("/login.html?error=true")
                .permitAll()
                )
                .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessUrl("/login.html")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
                )
                .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8090"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CommandLineRunner initData(RolRepository rolRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Crear roles si no existen
            if (rolRepository.findByNombreRol("SECRETARIA").isEmpty()) {
                Rol secretaria = new Rol();
                secretaria.setNombreRol("SECRETARIA");
                secretaria.setDescripcion("Secretaria - Gestión de alumnos y pagos");
                rolRepository.save(secretaria);
                System.out.println("✅ Rol SECRETARIA creado");
            }

            if (rolRepository.findByNombreRol("DIRECTOR").isEmpty()) {
                Rol director = new Rol();
                director.setNombreRol("DIRECTOR");
                director.setDescripcion("Director - Visualización de reportes");
                rolRepository.save(director);
                System.out.println("✅ Rol DIRECTOR creado");
            }

            // Crear usuario secretaria
            if (!usuarioRepository.existsByNombreUsuario("secretaria")) {
                Rol rolSecretaria = rolRepository.findByNombreRol("SECRETARIA").orElseThrow();

                Usuario secretaria = new Usuario();
                secretaria.setNombreUsuario("secretaria");
                secretaria.setContrasenaHash(passwordEncoder.encode("secretaria123"));
                secretaria.setNombreCompleto("María Secretaria");
                secretaria.setCorreoElectronico("secretaria@colegio.com");
                secretaria.setRol(rolSecretaria);
                secretaria.setEstado(EstadoUsuario.Activo);

                usuarioRepository.save(secretaria);
                System.out.println("✅ Usuario SECRETARIA creado: secretaria/secretaria123");
            }

            // Crear usuario director
            if (!usuarioRepository.existsByNombreUsuario("director")) {
                Rol rolDirector = rolRepository.findByNombreRol("DIRECTOR").orElseThrow();

                Usuario director = new Usuario();
                director.setNombreUsuario("director");
                director.setContrasenaHash(passwordEncoder.encode("director123"));
                director.setNombreCompleto("Juan Director");
                director.setCorreoElectronico("director@colegio.com");
                director.setRol(rolDirector);
                director.setEstado(EstadoUsuario.Activo);

                usuarioRepository.save(director);
                System.out.println("Usuario DIRECTOR creado: director/director123");
            }
        };
    }
}
