import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Zoom
} from "@mui/material";
import { Email, ArrowBack, Send } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import vipTheme from "../themes/vipTheme";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("¡Correo enviado! Revisa tu bandeja de entrada.");
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <ThemeProvider theme={vipTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e0e8ff 0%, #f8fafc 100%)",
          p: 3
        }}
      >
        <Zoom in={true}>
          <Paper
            elevation={8}
            sx={{
              maxWidth: 460,
              width: "100%",
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.1)"
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              align="center"
              sx={{ fontWeight: 700, color: "primary.main", mb: 2 }}
            >
              Recuperar Contraseña
            </Typography>

            <Typography
              variant="body1"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Ingresa tu correo para enviarte el enlace de recuperación
            </Typography>

            {message && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleReset}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <Email sx={{ color: "action.active", mr: 1 }} />
                  )
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                endIcon={<Send />}
                sx={{ mt: 3 }}
              >
                Enviar Enlace
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                startIcon={<ArrowBack />}
                sx={{ mt: 2 }}
                onClick={() => navigate("/login")}
              >
                Volver al Login
              </Button>
            </Box>
          </Paper>
        </Zoom>
      </Box>
    </ThemeProvider>
  );
}

export default ForgotPassword;
