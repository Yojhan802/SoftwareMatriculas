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

    // 1. CREAR MATRICULA (POST)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<MatriculaDTO> crear(@RequestBody MatriculaDTO matricula) {
        MatriculaDTO nuevaMatricula = service.crearMatricula(matricula);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevaMatricula);
    }

    // 2. ACTUALIZAR MATRICULA (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<MatriculaDTO> actualizar(@PathVariable int id, @RequestBody Matricula matricula) {
        MatriculaDTO matriculaActualizada = service.actualizarMatricula(id, matricula);
        return ResponseEntity.ok(matriculaActualizada);
    }

    // 3. OBTENER MATRICULA POR ID (GET)
    @GetMapping("/{id}")
    public ResponseEntity<MatriculaDTO> obtener(@PathVariable int id) {
        return ResponseEntity.ok(service.ObtenerMatricula(id));
    }

    // 4. LISTAR TODAS LAS MATRICULAS (GET)
    @GetMapping
    public ResponseEntity<List<MatriculaDTO>> listar() {
        return ResponseEntity.ok(service.listarMatricula());
    }

    // 5. ELIMINAR MATRICULA (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        try {
            service.eliminarMatricula(id);
            return ResponseEntity.noContent().build(); // Retorna 204 (Éxito sin contenido)
        } catch (Exception e) {
            // Esto capturará errores, por ejemplo, si hay recibos de pago vinculados
            return ResponseEntity.badRequest().body("No se puede eliminar: " + e.getMessage());
        }
    }
}
