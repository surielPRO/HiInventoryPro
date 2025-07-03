import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Fade,
  Zoom
} from '@mui/material';
import {
  Email,
  Lock,
  Google,
  Visibility,
  VisibilityOff,
  ArrowForward
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import vipTheme from "../themes/vipTheme";
import logo from '../assets/images/hisense-logo.png';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          await handleUserLogin(result.user.uid);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error en Google Redirect:", err);
        setError("Error al autenticar con Google");
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleRedirect();
  }, [navigate]);

  const handleUserLogin = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const accessType = userData.role || "user";
      localStorage.setItem("accessType", accessType);
    } else {
      await setDoc(docRef, { role: "user" });
      localStorage.setItem("accessType", "user");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserLogin(userCredential.user.uid);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.code === 'auth/invalid-credential'
        ? "Usuario o contraseña incorrectos"
        : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    setGoogleLoading(true);
    setError("");
    signInWithRedirect(auth, googleProvider).catch((err) => {
      console.error("Error en Google SignIn:", err);
      setError("Error al iniciar con Google");
      setGoogleLoading(false);
    });
  };

  const handleCloseError = () => setError("");

  return (
    <ThemeProvider theme={vipTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e0e8ff 0%, #f8fafc 100%)',
          p: 3
        }}
      >
        <Zoom in={true}>
          <Paper
            elevation={8}
            sx={{
              maxWidth: 460,
              width: '100%',
              p: 4,
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <img
                src={logo}
                alt="Hisense Logo"
                style={{ height: 55, marginBottom: 12 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Bienvenido de nuevo
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Ingresa para continuar
              </Typography>
            </Box>

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseError}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Correo electrónico"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Contraseña"
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                endIcon={<ArrowForward />}
                disabled={isLoading || googleLoading}
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>o</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={loginWithGoogle}
              disabled={googleLoading || isLoading}
              startIcon={<Google />}
              sx={{ py: 1.5 }}
            >
              {googleLoading ? 'Procesando...' : 'Iniciar con Google'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                ¿No tienes cuenta?{" "}
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate("/register")}
                  sx={{ textTransform: 'none' }}
                >
                  Regístrate
                </Button>
              </Typography>
              <Typography variant="body2">
                <Button
                  size="small"
                  color="secondary"
                  onClick={() => navigate("/forgot-password")}
                  sx={{ textTransform: 'none' }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Zoom>
      </Box>
    </ThemeProvider>
  );
}

export default Login;
