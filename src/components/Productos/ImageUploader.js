import React, { useState } from "react";
import imageCompression from "browser-image-compression";

const CLOUD_NAME = "duvks4mad";
const UPLOAD_PRESET = "react_unsigned_upload"; // cambia al nombre de tu preset unsigned

export default function ImageUploader({ onImageUpload }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const compressionOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validaciones básicas
    if (!file.type.match("image/(jpeg|png|jpg|webp)")) {
      setError("Formato no soportado. Use JPEG, PNG o WEBP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen excede el tamaño máximo de 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Comprimir imagen para optimizar subida
      const compressedFile = await imageCompression(file, compressionOptions);

      // Vista previa local
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // Preparar form data para Cloudinary
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      // Subir a Cloudinary
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      if (data.secure_url) {
        onImageUpload(data.secure_url); // pasamos la url pública al padre
      } else {
        setError("Error al subir imagen a Cloudinary");
      }
    } catch (err) {
      console.error(err);
      setError("Error procesando la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <label htmlFor="file-input" className="upload-label">
        {uploading ? (
          <p>Subiendo imagen...</p>
        ) : preview ? (
          <img
            src={preview}
            alt="Vista previa"
            style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain" }}
          />
        ) : (
          <p>Selecciona una imagen</p>
        )}
      </label>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
