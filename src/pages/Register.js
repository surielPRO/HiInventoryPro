import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  useTheme 
} from '@mui/material';
import { Lock, Email, HowToReg } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import vipTheme from "../themes/vipTheme";
// Importa el mismo tema VIP

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ThemeProvider theme={vipTheme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e8ff 100%)',
          p: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: 4,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 86, 179, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 12px 40px rgba(0, 86, 179, 0.15)'
            }
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img 
              src="https://www.hisense.com/images/logo-hisense.svg" 
              alt="Hisense" 
              style={{ height: 50, marginBottom: 16 }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: '-0.5px'
              }}
            >
              Registro VIP
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1, color: 'text.secondary' }}>
              Crea tu cuenta de acceso privilegiado
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <Email sx={{ color: 'action.active', mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              helperText="Mínimo 6 caracteres"
              InputProps={{
                startAdornment: (
                  <Lock sx={{ color: 'action.active', mr: 1 }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              startIcon={<HowToReg />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0056b3 0%, #003d82 100%)',
                boxShadow: '0 4px 6px rgba(0, 86, 179, 0.2)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 8px rgba(0, 86, 179, 0.3)'
                }
              }}
            >
              Crear Cuenta Premium
            </Button>

            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
              ¿Ya tienes una cuenta?{' '}
              <Button 
                component="a" 
                href="/login" 
                color="primary"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Inicia sesión aquí
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default Register;