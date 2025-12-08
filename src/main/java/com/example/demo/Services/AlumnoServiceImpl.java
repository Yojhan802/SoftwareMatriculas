package com.example.demo.Services;

import java.nio.charset.Charset;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
import java.util.List;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;

import org.springframework.stereotype.Service;

import com.example.demo.dto.AlumnoDTO;
import com.example.demo.entity.Alumno;
import com.example.demo.repository.AlumnoRepository;

@Service
public class AlumnoServiceImpl implements AlumnoService {

    private final AlumnoRepository alumnoRepository;

    public AlumnoServiceImpl(AlumnoRepository alumnoRepository) {
        this.alumnoRepository = alumnoRepository;
    }

    private AlumnoDTO maptoDTO(Alumno alumno) {
        AlumnoDTO dto = new AlumnoDTO();
        dto.setDniAlumno(alumno.getDniAlumno());
        dto.setIdAlumno(alumno.getId_Alumno());
        dto.setApellido(alumno.getApellido());
        dto.setDireccion(alumno.getDireccion());
        dto.setEstadoActual(alumno.getEstadoActual());
        return dto;

    }

    public Alumno mapToEntity(AlumnoDTO alumnoDTO) {
        Alumno alumno = new Alumno();
        alumno.setDniAlumno(alumnoDTO.getDniAlumno());
        alumno.setId_Alumno(alumnoDTO.getIdAlumno());
        alumno.setNombre(cifrar(alumnoDTO.getNombre(), ""));
        alumno.setApellido(cifrar(alumnoDTO.getApellido(), ""));
        alumno.setDireccion(alumnoDTO.getDireccion());
        alumno.setEstadoActual(alumnoDTO.getEstadoActual());

        return alumno;

    }

    @Override
    public AlumnoDTO crearAlumnos(AlumnoDTO alumnoDTO) {

        Alumno alumno = mapToEntity(alumnoDTO);

        return maptoDTO(alumnoRepository.save(alumno));

    }

    @Override
    public AlumnoDTO ObtenerAlumnoPorDni(int dni) {
        Alumno alumno = alumnoRepository.findByDniAlumno(dni)
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));

        return maptoDTO(alumno);
    }

    @Override
    public List<AlumnoDTO> listarAlumnos() {
        return alumnoRepository.findAll()
                .stream()
                .map(this::maptoDTO)
                .toList();
    }

    @Override
    public AlumnoDTO actualizarAlumno(int dni, AlumnoDTO alumnoDTO) {
        Alumno alumno = alumnoRepository.findByDniAlumno(dni)
                .orElseThrow(() -> new RuntimeException("Alumno no encontrado"));

        alumno.setNombre(cifrar(alumnoDTO.getNombre(), ""));
        alumno.setApellido(cifrar(alumnoDTO.getApellido(), ""));
        alumno.setDireccion(alumnoDTO.getDireccion());
        alumno.setEstadoActual(alumnoDTO.getEstadoActual());

        Alumno actualizado = alumnoRepository.save(alumno);

        return maptoDTO(actualizado);
    }

    @Override
    public void eliminarAlumno(int dni) {
        if (!alumnoRepository.existsById(dni)) {
            throw new RuntimeException("Alumno no encontrado");
        }

        alumnoRepository.deleteById(dni);
    }

    public static String cifrar(String encryptText, String key) {

        if (encryptText == null || key == null) {
            throw new IllegalArgumentException("No se puede cifrar valores nulos");
        }

        try {
            DESKeySpec desKeySpec = new DESKeySpec(key.getBytes());
            SecretKeyFactory secretKeyFactory = SecretKeyFactory.getInstance("DES");
            SecretKey secretKey = secretKeyFactory.generateSecret(desKeySpec);

            Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] bytes = cipher.doFinal(encryptText.getBytes(Charset.forName("UTF-8")));
            return Base64.getEncoder().encodeToString(bytes);

        } catch (NoSuchAlgorithmException | InvalidKeyException | InvalidKeySpecException | NoSuchPaddingException
                | BadPaddingException | IllegalBlockSizeException e) {
            throw new RuntimeException("El cifrado fallo", e);
        }
    }

    public static String decifrar(String decryptText, String key) {

        if (decryptText == null || key == null) {
            throw new IllegalArgumentException("No se puede cifrar valores nulos");
        }

        try {
            DESKeySpec desKeySpec = new DESKeySpec(key.getBytes());
            SecretKeyFactory secretKeyFactory = SecretKeyFactory.getInstance("DES");
            SecretKey secretKey = secretKeyFactory.generateSecret(desKeySpec);

            Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] bytes = cipher.doFinal(Base64.getDecoder().decode(decryptText));
            return new String(bytes, Charset.forName("UTF-8"));

        } catch (NoSuchAlgorithmException | InvalidKeyException | InvalidKeySpecException | NoSuchPaddingException
                | BadPaddingException | IllegalBlockSizeException e) {
            throw new RuntimeException("El cifrado fallo", e);
        }
    }
}
