import React, { useState, useRef, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import ImageUploader from "./ImageUploader";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  MenuItem
} from "@mui/material";

export default function AddProduct({ onCancel }) {
  const [producto, setProducto] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    imagenUrl: "",
    area: ""
  });
  const [errors, setErrors] = useState({});
  const [codigoExistente, setCodigoExistente] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const qrRef = useRef(null);

  useEffect(() => {
    const verificarCodigo = async () => {
      const cod = producto.codigo.trim().toUpperCase();
      if (!cod) {
        setCodigoExistente(false);
        return;
      }
      try {
        const q = query(
          collection(db, "productos"),
          where("codigo", "==", cod)
        );
        const snap = await getDocs(q);
        setCodigoExistente(!snap.empty);
      } catch (err) {
        console.error("Error validando código:", err);
      }
    };

    verificarCodigo();
  }, [producto.codigo]);

  const dataURLtoFile = (dataUrl, filename) => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new File([array], filename, { type: mime });
  };

  const uploadQRToCloudinary = async () => {
    const canvas = qrRef.current.querySelector("canvas");
    const dataUrl = canvas.toDataURL("image/png");
    const form = new FormData();
    form.append("file", dataURLtoFile(dataUrl, `${producto.codigo}-qr.png`));
    form.append("upload_preset", "react_unsigned_upload");
    form.append("folder", "productos_qr");
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/duvks4mad/image/upload",
      { method: "POST", body: form }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const cod = producto.codigo.trim().toUpperCase();
    if (!cod) errs.codigo = "Obligatorio";
    if (codigoExistente) errs.codigo = "El código ya existe";
    if (!producto.nombre.trim()) errs.nombre = "Obligatorio";
    if (!producto.descripcion.trim()) errs.descripcion = "Obligatorio";
    if (!producto.area) errs.area = "Obligatorio";
    if (!producto.imagenUrl) errs.imagenUrl = "Obligatoria";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setIsSubmitting(true);
    try {
      const qrUrl = await uploadQRToCloudinary();
      await addDoc(collection(db, "productos"), {
        codigo: cod,
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        imagen: producto.imagenUrl,
        qrImagen: qrUrl,
        area: producto.area,
        fechaCreacion: new Date()
      });
      setSuccess(true);
      setProducto({ codigo: "", nombre: "", descripcion: "", imagenUrl: "", area: "" });
      setTimeout(() => {
        setSuccess(false);
        onCancel?.();
      }, 1500);
    } catch (err) {
      console.error("Error al registrar producto:", err);
      setErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", my: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Registrar Nuevo Producto
      </Typography>
      {errors.general && <Alert severity="error">{errors.general}</Alert>}
      {success && <Alert severity="success">¡Producto registrado!</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Código *"
              fullWidth
              value={producto.codigo}
              onChange={(e) =>
                setProducto({ ...producto, codigo: e.target.value.toUpperCase() })
              }
              error={!!errors.codigo}
              helperText={errors.codigo}
              sx={{
                "& .MuiOutlinedInput-root fieldset": {
                  borderColor:
                    producto.codigo && !errors.codigo && !codigoExistente
                      ? "green"
                      : undefined
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Nombre *"
              fullWidth
              value={producto.nombre}
              onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción *"
              fullWidth
              multiline
              rows={4}
              value={producto.descripcion}
              onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Área *"
              fullWidth
              value={producto.area}
              onChange={(e) => setProducto({ ...producto, area: e.target.value })}
              error={!!errors.area}
              helperText={errors.area}
            >
              <MenuItem value="">Seleccione</MenuItem>
              <MenuItem value="almacen">Almacén</MenuItem>
              <MenuItem value="quimicos">Químicos</MenuItem>
              <MenuItem value="mro">MRO</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              gutterBottom
              color={errors.imagenUrl ? "error" : "inherit"}
            >
              Imagen *{" "}
            </Typography>
            <ImageUploader onImageUpload={(url) =>
              setProducto({ ...producto, imagenUrl: url })
            } />
            {errors.imagenUrl && (
              <Typography color="error" variant="body2">
                {errors.imagenUrl}
              </Typography>
            )}
          </Grid>
          {producto.codigo && (
            <Box ref={qrRef} display="none">
              <QRCodeCanvas value={`BIN-${producto.codigo}`} size={200} />
            </Box>
          )}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
