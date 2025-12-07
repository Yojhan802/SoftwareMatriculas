package com.example.demo.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Services.AlumnoService;
import com.example.demo.dto.AlumnoDTO;

@RestController
@RequestMapping("/api/alumnos")
public class AlumnoController {

    @Autowired
    private AlumnoService service;

    @PostMapping
    public ResponseEntity<AlumnoDTO> crear(@RequestBody AlumnoDTO dto) {
        return ResponseEntity.ok(service.crearAlumnos(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlumnoDTO> obtener(@PathVariable int id) {
        return ResponseEntity.ok(service.ObtenerAlumnoId(id));
    }

    @GetMapping
    public ResponseEntity<List<AlumnoDTO>> listar() {
        return ResponseEntity.ok(service.listarAlumnos());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlumnoDTO> actualizar(@PathVariable int id, @RequestBody AlumnoDTO dto) {
        return ResponseEntity.ok(service.actualizarAlumno(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable int id) {
        service.eliminarAlumno(id);
        return ResponseEntity.noContent().build();
    }
}
