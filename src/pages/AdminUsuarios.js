import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    const usuariosList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsuarios(usuariosList);
    setLoading(false);
  };

  const cambiarPermiso = async (id, nuevoPermiso) => {
    const userRef = doc(db, "usuarios", id);
    await updateDoc(userRef, { accessType: nuevoPermiso });
    fetchUsuarios(); // recargar lista
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Administración de Usuarios
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Permiso Actual</TableCell>
              <TableCell>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.accessType}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color={usuario.accessType === "admin" ? "warning" : "primary"}
                    onClick={() =>
                      cambiarPermiso(
                        usuario.id,
                        usuario.accessType === "admin" ? "user" : "admin"
                      )
                    }
                  >
                    Cambiar a {usuario.accessType === "admin" ? "user" : "admin"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminUsuarios;
