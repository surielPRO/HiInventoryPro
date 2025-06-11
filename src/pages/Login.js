import '../App.css';
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc,setDoc} from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Buscar el accessType en Firestore
   const docRef = doc(db, "usuarios", uid);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  const userData = docSnap.data();
  const accessType = userData.accessType || "user";
  localStorage.setItem("accessType", accessType);
} else {
  // Si el documento no existe, lo creamos con accessType por defecto
  await setDoc(docRef, { accessType: "user" });
  localStorage.setItem("accessType", "user");
}
    navigate("/dashboard");
  } catch (err) {
    setError("Usuario o contraseña incorrectos!");
  }
};
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;

    const docRef = doc(db, "users", uid); // <- colección "users", no "usuarios"
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const accessType = userData.role || "user";
      localStorage.setItem("accessType", accessType);
    } else {
      // Si el documento no existe, se crea con role: "user"
      await setDoc(docRef, { role: "user" });
      localStorage.setItem("accessType", "user");
    }

    navigate("/dashboard");
  } catch (err) {
    console.error("Error en loginWithGoogle:", err);
    setError("Error al autenticar con Google");
  }
};


  return (
  <div className="login-container">
    <h2>Login Hisense</h2>
    {error && <p className="error">{error}</p>}
    
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Ingresar</button>
      <button type="button" onClick={loginWithGoogle} className="google-btn">
      <img src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw" alt="Google" width="20"/>
      Continuar con Google
    </button>
    </form>

    

    <p>
      ¿No tienes cuenta? <a href="/register">Regístrarse</a>
    </p>
    <p>
      ¿Olvidaste tu contraseña? <a href="/forgot-password">Restablecer</a>
    </p>
  </div>
);

 
}

export default Login;