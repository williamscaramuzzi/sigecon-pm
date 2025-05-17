import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';

const NovoUsuario: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('E-mail é obrigatório');
            return false;
        } else if (!re.test(email)) {
            setEmailError('E-mail inválido');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    const validatePassword = (password: string) => {
        if (!password) {
            setPasswordError('Senha é obrigatória');
            return false;
        } else if (password.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres');
            return false;
        } else {
            setPasswordError('');
            return true;
        }
    };

    const validateConfirmPassword = (confirmPassword: string) => {
        if (!confirmPassword) {
            setConfirmPasswordError('Confirmação de senha é obrigatória');
            return false;
        } else if (confirmPassword !== password) {
            setConfirmPasswordError('Senhas não conferem');
            return false;
        } else {
            setConfirmPasswordError('');
            return true;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

        if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const ref_do_novo_usuario = doc(db, "tabela_usuarios", userCredential.user.uid)
            await setDoc(ref_do_novo_usuario, { email: userCredential.user.email, perfil: "usuario" })
            setOpenSnackbar(true);

            // Redirecionamento após sucesso
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            let errorMessage = 'Ocorreu um erro ao cadastrar o usuário';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está em uso';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Cadastro de Usuário
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

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
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={(e) => validateEmail(e.target.value)}
                        error={!!emailError}
                        helperText={emailError}
                        disabled={loading}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Senha"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) validatePassword(e.target.value);
                            if (confirmPassword) validateConfirmPassword(confirmPassword);
                        }}
                        onBlur={(e) => validatePassword(e.target.value)}
                        error={!!passwordError}
                        helperText={passwordError}
                        disabled={loading}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirmar Senha"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (confirmPasswordError) validateConfirmPassword(e.target.value);
                        }}
                        onBlur={(e) => validateConfirmPassword(e.target.value)}
                        error={!!confirmPasswordError}
                        helperText={confirmPasswordError}
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenSnackbar(false)} severity="success">
                    Usuário cadastrado com sucesso! Redirecionando...
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default NovoUsuario;