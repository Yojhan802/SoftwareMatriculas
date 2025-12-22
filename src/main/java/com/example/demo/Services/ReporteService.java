package com.example.demo.Services;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;
import net.sf.jasperreports.export.SimpleXlsxExporterConfiguration;

@Service
public class ReporteService {

    @Autowired
    private DataSource dataSource;

    // ======================= CUOTAS =======================

   /*  public byte[] generarReportePago(String nivel, String grado, String periodo, String formato) throws Exception {
    try (Connection conexion = dataSource.getConnection()) {

        InputStream jrxml =
                new ClassPathResource("static/reportes/RptPago.jrxml").getInputStream();

        JasperReport jasperReport =
                JasperCompileManager.compileReport(jrxml);

        Map<String, Object> parametros = new HashMap<>();
        parametros.put("p_nivel", nivel);
        parametros.put("p_grado", grado);
        parametros.put("p_periodo", periodo);  // ← AGREGAR ESTO

        JasperPrint jasperPrint =
                JasperFillManager.fillReport(jasperReport, parametros, conexion);

        return exportar(jasperPrint, formato);
    }
}*/
    
    // ======================= MATRICULADOS =======================

    public byte[] generarReporteMatricula(String periodo, String formato) throws Exception {
        try (Connection conexion = dataSource.getConnection()) {

            InputStream jrxml =
                    new ClassPathResource("static/reportes/RptMatricula.jrxml").getInputStream();

            JasperReport jasperReport =
                    JasperCompileManager.compileReport(jrxml);

            Map<String, Object> parametros = new HashMap<>();
            parametros.put("periodo", periodo);

            JasperPrint jasperPrint =
                    JasperFillManager.fillReport(jasperReport, parametros, conexion);

            return exportar(jasperPrint, formato);
        }
    }

    // ======================= EXPORTADOR COMÚN =======================

    private byte[] exportar(JasperPrint jasperPrint, String formato) throws Exception {
        if ("PDF".equalsIgnoreCase(formato)) {
            return exportarPDF(jasperPrint);
        }
        if ("EXCEL".equalsIgnoreCase(formato)) {
            return exportarExcel(jasperPrint);
        }
        throw new IllegalArgumentException("Formato no válido: " + formato);
    }

    // ======================= PDF =======================

    private byte[] exportarPDF(JasperPrint jasperPrint) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        JRPdfExporter exporter = new JRPdfExporter();
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(out));
        exporter.setConfiguration(new SimplePdfExporterConfiguration());

        exporter.exportReport();
        return out.toByteArray();
    }

    // ======================= EXCEL =======================

    private byte[] exportarExcel(JasperPrint jasperPrint) throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream();

    JRXlsxExporter exporter = new JRXlsxExporter();
    exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
    exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(out));

    SimpleXlsxExporterConfiguration config =
            new SimpleXlsxExporterConfiguration();

    // ⚠️ SIN setters que no existen en tu versión
    exporter.setConfiguration(config);
    exporter.exportReport();

    return out.toByteArray();
}
}