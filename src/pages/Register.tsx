import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, Container, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleGoogleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Error with Google:', error.message);
            setError(error.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setRegistered(true);
        }
        setLoading(false);
    };

    // Pantalla de confirmación de registro
    if (registered) {
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
                    <Paper sx={{ p: 5, textAlign: 'center' }}>
                        <MarkEmailReadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />

                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                            ¡Revisa tu correo!
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Hemos enviado un enlace de confirmación a:
                        </Typography>

                        <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 500 }}>
                            {email}
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                            <Typography variant="body2">
                                <strong>Importante:</strong> Debes hacer clic en el enlace del correo para activar tu cuenta antes de poder iniciar sesión.
                            </Typography>
                        </Alert>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            ¿No ves el correo? Revisa tu carpeta de spam o correo no deseado.
                        </Typography>

                        <Button
                            component={Link}
                            to="/login"
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{ py: 1.5 }}
                        >
                            Ir a Iniciar Sesión
                        </Button>
                    </Paper>
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
                <Paper sx={{ p: 5 }}>
                    {/* Logo */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                                P
                            </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Crear Cuenta
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Regístrate para comenzar
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleRegister}>
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
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            helperText="Mínimo 6 caracteres"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ py: 1.5, mb: 3 }}
                        >
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </Button>

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                O
                            </Typography>
                        </Divider>

                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            startIcon={<GoogleIcon />}
                            onClick={handleGoogleRegister}
                            disabled={loading}
                            sx={{ py: 1.5, mb: 3, textTransform: 'none' }}
                        >
                            Continuar con Google
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                                ¿Ya tienes cuenta?{' '}
                            </Typography>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary" component="span" sx={{ fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                                    Inicia Sesión
                                </Typography>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
