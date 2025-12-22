package com.example.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Services.ReporteService;

@RestController
@RequestMapping("/api/reportes")
@CrossOrigin(origins = "*")
public class ReporteController {

@Autowired
private ReporteService reporteService;
///
///// ================== CUOTAS PENDIENTES PDF ==================
///
///@GetMapping("/cuotas-pendientes")
///public ResponseEntity<byte[]> generarCuotasPdf(
///        @RequestParam String nivel,
///        @RequestParam String grado,
///        @RequestParam String periodo) {
///
///    try {
///        byte[] pdf = reporteService.generarReportePago(
///                nivel, grado, periodo, "PDF");  // ← Agregar periodo
///
///        HttpHeaders headers = new HttpHeaders();
///        headers.setContentType(MediaType.APPLICATION_PDF);
///        headers.setContentDispositionFormData(
///                "attachment",
///                "Reporte_Cuotas_" + periodo + ".pdf"
///        );
///
///        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
///
///    } catch (Exception e) {
///        e.printStackTrace();
///        return ResponseEntity.internalServerError().build();
///    }
///}
///
///@GetMapping("/cuotas-pendientes-excel")
///public ResponseEntity<byte[]> generarCuotasExcel(
///        @RequestParam String nivel,
///        @RequestParam String grado,
///        @RequestParam String periodo) {
///
///    try {
///        byte[] excel = reporteService.generarReportePago(
///                nivel, grado, periodo, "EXCEL");  // ← Agregar periodo
///
///        HttpHeaders headers = new HttpHeaders();
///        headers.setContentType(
///                MediaType.parseMediaType(
///                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
///                )
///        );
///        headers.setContentDispositionFormData(
///                "attachment",
///                "Reporte_Cuotas_" + periodo + ".xlsx"
///        );
///
///        return new ResponseEntity<>(excel, headers, HttpStatus.OK);
///
///    } catch (Exception e) {
///        e.printStackTrace();
///        return ResponseEntity.internalServerError().build();
///    }
///}
    // ================== MATRICULADOS ==================

    @GetMapping("/matriculados")
    public ResponseEntity<byte[]> generarMatriculadosPdf(
            @RequestParam String periodo) {

        try {
            byte[] pdf = reporteService.generarReporteMatricula(periodo, "PDF");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData(
                    "attachment",
                    "Reporte_Matriculados_" + periodo + ".pdf"
            );

            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/matriculados-excel")
    public ResponseEntity<byte[]> generarMatriculadosExcel(
            @RequestParam String periodo) {

        try {
            byte[] excel = reporteService.generarReporteMatricula(periodo, "EXCEL");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
            );
            headers.setContentDispositionFormData(
                    "attachment",
                    "Reporte_Matriculados_" + periodo + ".xlsx"
            );

            return new ResponseEntity<>(excel, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}