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
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';

const ResetarSenha: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isEmailValid = validateEmail(email);

        if (!isEmailValid) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const auth = getAuth()
            await sendPasswordResetEmail(auth, email)
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
                    Esqueci minha senha
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

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : 'Enviar e-mail'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenSnackbar(false)} severity="success">
                    Nova senha mandada para o e-mail
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ResetarSenha;