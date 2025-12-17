package com.example.demo.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Services.MatriculaService;
import com.example.demo.dto.MatriculaDTO;
import com.example.demo.entity.Matricula;

@RestController
@RequestMapping("/api/matricula")
public class MatriculaController {

    @Autowired
    private MatriculaService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<MatriculaDTO> crear(@RequestBody MatriculaDTO matricula) {
        MatriculaDTO nuevaMatricula = service.crearMatricula(matricula);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevaMatricula);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MatriculaDTO> actualizar(@PathVariable int id, @RequestBody Matricula matricula) {
        MatriculaDTO matriculaActualizada = service.actualizarMatricula(id, matricula);
        return ResponseEntity.ok(matriculaActualizada);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatriculaDTO> obtener(@PathVariable int id) {
        return ResponseEntity.ok(service.ObtenerMatricula(id));
    }

    @GetMapping
    public ResponseEntity<List<MatriculaDTO>> listar() {
        return ResponseEntity.ok(service.listarMatricula());
    }

    // ==========================================
    // MÉTODO DE ELIMINACIÓN HÍBRIDA
    // ==========================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        try {
            // Ejecutamos la lógica en el servicio
            service.eliminarMatricula(id);

            // Verificamos si la matrícula sigue existiendo
            try {
                service.ObtenerMatricula(id);
                // Si la encuentra, es que solo se ANULÓ (Caso con pagos)
                return ResponseEntity.ok("La matrícula tenía pagos registrados. Se cambió a estado ANULADO y se cancelaron las deudas pendientes.");
            } catch (Exception e) {
                // Si lanza error al buscar, es que se ELIMINÓ FÍSICAMENTE (Caso sin pagos)
                return ResponseEntity.ok("La matrícula no tenía pagos. Se ha ELIMINADO definitivamente del sistema.");
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al procesar: " + e.getMessage());
        }
    }
}