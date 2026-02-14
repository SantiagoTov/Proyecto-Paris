import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Container } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    // Pantalla de confirmación de envío
    if (sent) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0F0F0F 100%)',
                    p: 2
                }}
            >
                <Container component="main" maxWidth="sm">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Paper elevation={3} sx={{ p: 5, width: '100%', textAlign: 'center' }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />

                            <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                ¡Correo Enviado!
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Hemos enviado un enlace para restablecer tu contraseña a:
                            </Typography>

                            <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                                {email}
                            </Typography>

                            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                                <Typography variant="body2">
                                    Haz clic en el enlace del correo para crear una nueva contraseña. El enlace expira en 1 hora.
                                </Typography>
                            </Alert>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                ¿No ves el correo? Revisa tu carpeta de spam.
                            </Typography>

                            <Button
                                component={Link}
                                to="/login"
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                Volver a Iniciar Sesión
                            </Button>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0F0F0F 100%)',
                p: 2
            }}
        >
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <LockResetIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>

                        <Typography component="h1" variant="h5" align="center" gutterBottom>
                            Recuperar Contraseña
                        </Typography>

                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Correo Electrónico"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar Enlace'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link to="/login" style={{ textDecoration: 'none' }}>
                                    <Typography variant="body2" color="primary">
                                        Volver a Iniciar Sesión
                                    </Typography>
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
}
