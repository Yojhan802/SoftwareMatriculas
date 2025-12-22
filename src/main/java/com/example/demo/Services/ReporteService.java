package com.example.demo.Services;

// IMPORTS BÁSICOS
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
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

    // Inyectar la imagen como Resource
    @Value("classpath:static/Imagen/Tesla.jpg")
    private Resource logoResource;

    // ======================= CUOTAS =======================
    public byte[] generarReportePago(String nivel, String grado, String formato) throws Exception {
        try (Connection conexion = dataSource.getConnection()) {

            InputStream jrxml = new ClassPathResource("static/reportes/RptPago.jrxml").getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxml);

            Map<String, Object> parametros = new HashMap<>();
            parametros.put("p_nivel", nivel);
            parametros.put("p_grado", grado);

            // Agregar la imagen como parámetro
            if (logoResource.exists()) {
                parametros.put("LOGO", logoResource.getInputStream());
            } else {
                // Si no encuentra la imagen, prueba rutas alternativas
                parametros.put("LOGO", cargarImagenAlternativa());
            }

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, conexion);
            return exportar(jasperPrint, formato);
        }
    }

    // Método para cargar imagen desde rutas alternativas
    private InputStream cargarImagenAlternativa() throws Exception {
        // Prueba diferentes rutas
        String[] rutas = {
            "static/Imagen/Tesla.jpg",
            "Imagen/Tesla.jpg",
            "Tesla.jpg",
            "/static/Imagen/Tesla.jpg",
            "/Imagen/Tesla.jpg"
        };

        for (String ruta : rutas) {
            try {
                InputStream stream = getClass().getClassLoader().getResourceAsStream(ruta);
                if (stream != null) {
                    System.out.println("Imagen encontrada en: " + ruta);
                    return stream;
                }
            } catch (Exception e) {
                // Continuar con la siguiente ruta
            }
        }

        throw new Exception("No se pudo encontrar la imagen Tesla.jpg en ninguna ruta del classpath");
    }

    // ======================= MATRICULADOS =======================
    public byte[] generarReporteMatricula(String periodo, String formato) throws Exception {
        try (Connection conexion = dataSource.getConnection()) {

            InputStream jrxml = new ClassPathResource("static/reportes/RptMatricula.jrxml").getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(jrxml);

            Map<String, Object> parametros = new HashMap<>();
            parametros.put("periodo", periodo);

            // También agregar imagen para este reporte si es necesario
            if (logoResource.exists()) {
                parametros.put("LOGO", logoResource.getInputStream());
            }

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametros, conexion);
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

        SimpleXlsxExporterConfiguration config
                = new SimpleXlsxExporterConfiguration();

        // ⚠️ SIN setters que no existen en tu versión
        exporter.setConfiguration(config);
        exporter.exportReport();

        return out.toByteArray();
    }
}
