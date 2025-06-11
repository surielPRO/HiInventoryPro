import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("¡Correo enviado! Revisa tu bandeja de entrada.");
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Recuperar Contraseña</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar enlace</button>
      </form>
      <p>
        <Link to="/login">Volver al login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;