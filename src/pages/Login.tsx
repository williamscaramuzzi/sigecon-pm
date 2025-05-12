// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import policiaLogo from '../assets/logopmms.svg'; // Crie este ativo ou substitua com o logo correto

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Mensagens de erro amigáveis baseadas nos códigos do Firebase
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas de login. Tente novamente mais tarde.');
      } else {
        setError('Falha no login. Por favor, tente novamente.');
      }
      console.error('Erro de login:', err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box 
            component="img"
            src={policiaLogo}
            alt="Polícia Militar"
            sx={{ height: 80, mb: 2 }}
          />
          <Typography component="h1" variant="h5" gutterBottom>
            SIGECON-PM
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
            Sistema de Gerenciamento de Contratações da Polícia Militar
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: '#1a237e' }}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
      <Box mt={4}>
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} SIGECON-PM. Todos os direitos reservados.
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;