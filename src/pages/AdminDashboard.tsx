import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    Button,
    Chip,
    Alert,
    Stack,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import PhoneIcon from '@mui/icons-material/Phone';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-usage-stats');
            if (error) throw error;
            setStats(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error cargando estadísticas");
        } finally {
            setLoading(false);
        }
    };

    const StatusChip = ({ status, message }: { status?: string, message?: string }) => {
        const s = status || 'unknown';
        const isOk = s === 'ok' || s === 'active';
        return (
            <Chip
                icon={isOk ? <CheckCircleIcon /> : <ErrorIcon />}
                label={message || (isOk ? 'Activo' : 'Error')}
                color={isOk ? "success" : "error"}
                size="small"
                sx={{
                    fontWeight: 500,
                    ...(isOk && { bgcolor: 'success.dark', color: 'success.light' }),
                    ...(!isOk && { bgcolor: 'error.dark', color: 'error.light' })
                }}
            />
        );
    };

    const TierChip = ({ tier }: { tier?: string }) => {
        if (!tier) return <Typography variant="caption" color="text.secondary">-</Typography>;

        return (
            <Chip
                label={tier.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, borderColor: 'divider' }}
            />
        );
    };

    // --- TABLA RESUMEN ---
    const renderSummaryTable = () => {
        if (!stats) return null;

        const rows = [
            {
                name: 'ElevenLabs',
                icon: <RecordVoiceOverIcon sx={{ color: '#7C3AED' }} />,
                status: stats.elevenlabs?.status,
                tier: stats.elevenlabs?.data?.tier || 'Free',
                metric: 'Caracteres',
                used: stats.elevenlabs?.data?.character_count?.toLocaleString(),
                limit: stats.elevenlabs?.data?.character_limit?.toLocaleString(),
                note: stats.elevenlabs?.data?.status === 'detected_unusual_activity' ? 'BLOQUEADO' : 'Renueva mensual'
            },
            {
                name: 'Twilio',
                icon: <PhoneIcon sx={{ color: '#f44336' }} />,
                status: stats.twilio?.status,
                tier: stats.twilio?.tier || 'PayAsYouGo',
                metric: 'Saldo',
                used: '-',
                limit: `${stats.twilio?.balance || '-'} ${stats.twilio?.currency || ''}`,
                note: 'Prepago'
            },
            {
                name: 'Vapi',
                icon: <PhoneIcon sx={{ color: '#ff9800' }} />,
                status: stats.vapi?.status,
                tier: stats.vapi?.tier || 'Metered',
                metric: 'Minutos',
                used: '-',
                limit: '-',
                note: 'Ver Dashboard Vapi'
            },
            {
                metric: 'Créditos de Búsqueda',
                used: '-',
                limit: stats.serper?.credits?.toLocaleString(),
                note: 'Reinicio mensual'
            },
            {
                name: 'Extracción (Firecrawl)',
                icon: <StorageIcon sx={{ color: '#ff5722' }} />,
                status: stats.firecrawl?.status,
                tier: stats.firecrawl?.tier || 'Pruebas Beta',
                metric: 'Páginas escaneadas',
                used: '-',
                limit: '-',
                note: 'Versión Beta'
            },
            {
                name: 'Voz Instantánea (Cartesia)',
                icon: <RecordVoiceOverIcon sx={{ color: '#00bcd4' }} />,
                status: stats.cartesia?.status,
                tier: stats.cartesia?.tier || 'Pago por Uso',
                metric: 'Generaciones de voz',
                used: '-',
                limit: '-',
                note: 'Respuesta en milisegundos'
            },
            {
                name: 'Gemini (Google)',
                icon: <SmartToyIcon sx={{ color: '#10B981' }} />,
                status: stats.gemini?.status,
                tier: stats.gemini?.tier,
                metric: 'Tokens',
                used: '-',
                limit: '-',
                note: 'Generativo'
            },
            {
                name: 'Anthropic',
                icon: <SmartToyIcon sx={{ color: '#d6aebd' }} />,
                status: stats.anthropic?.status,
                tier: stats.anthropic?.tier,
                metric: 'Tokens',
                used: '-',
                limit: '-',
                note: 'Generativo'
            },
            {
                name: 'Groq',
                icon: <SmartToyIcon sx={{ color: '#f4511e' }} />,
                status: stats.groq?.status,
                tier: stats.groq?.tier,
                metric: 'Tokens',
                used: '-',
                limit: '-',
                note: 'Inferencia Rápida'
            }
        ];

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Servicio Conectado</TableCell>
                            <TableCell>Plan Actual</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell align="right">Consumo</TableCell>
                            <TableCell align="right">Límite o Saldo</TableCell>
                            <TableCell>Información</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow hover key={row.name}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {row.icon}
                                        <Typography variant="body2" fontWeight={600}>
                                            {row.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <TierChip tier={row.tier} />
                                </TableCell>
                                <TableCell>
                                    <StatusChip status={row.status} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {row.metric}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {row.used || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {row.limit || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {row.note === 'BLOQUEADO' ? (
                                        <Chip
                                            label="⚠️ BLOQUEADO"
                                            size="small"
                                            color="error"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            {row.note}
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // --- CARDS DE DETALLE ---
    const renderDetailCard = (
        title: string,
        icon: React.ReactNode,
        status: string | undefined,
        tier: string | undefined,
        children?: React.ReactNode
    ) => (
        <Card sx={{ flex: 1, minWidth: 250 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    {icon}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <StatusChip status={status} />
                    <TierChip tier={tier} />
                </Box>
                {children}
            </CardContent>
        </Card>
    );

    const renderElevenLabsDetail = () => {
        const data = stats?.elevenlabs || {};
        const sub = data.data || {};
        const hasData = !!data.data;
        const used = sub.character_count || 0;
        const limit = sub.character_limit || 10000;
        const percent = Math.min((used / limit) * 100, 100);

        return renderDetailCard(
            'ElevenLabs',
            <RecordVoiceOverIcon sx={{ color: '#7C3AED' }} />,
            hasData ? 'ok' : 'error',
            sub.tier || 'Free',
            hasData && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Caracteres: {used.toLocaleString()} / {limit.toLocaleString()}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={percent}
                        color={percent > 90 ? "error" : "primary"}
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                    {sub.status === 'detected_unusual_activity' && (
                        <Alert severity="error" sx={{ mt: 2, fontSize: '0.8rem' }}>
                            Cuenta Bloqueada
                        </Alert>
                    )}
                </Box>
            )
        );
    };

    const renderTwilioDetail = () => {
        const data = stats?.twilio || {};
        const status = data.status || 'unknown';

        return renderDetailCard(
            'Twilio',
            <PhoneIcon sx={{ color: '#f44336' }} />,
            status,
            data.tier || 'PayAsYouGo',
            status === 'ok' && (
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {data.balance || '0.00'} {data.currency}
                </Typography>
            )
        );
    };

    return (
        <Box sx={{ py: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Panel de Control
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Estado de servicios y consumo de APIs
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={fetchStats}
                        disabled={loading}
                        sx={{ borderColor: 'divider' }}
                    >
                        Actualizar
                    </Button>
                    <Button
                        variant="text"
                        startIcon={<KeyboardReturnIcon />}
                        onClick={() => navigate('/')}
                    >
                        Volver
                    </Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Stack spacing={4}>
                    {/* Tabla resumen */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Resumen de Servicios
                        </Typography>
                        {renderSummaryTable()}
                    </Box>

                    {/* Detalles de Voz */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Servicios de Voz
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {renderElevenLabsDetail()}
                            {renderTwilioDetail()}
                            {renderDetailCard(
                                'Vapi',
                                <PhoneIcon sx={{ color: '#ff9800' }} />,
                                stats?.vapi?.status,
                                stats?.vapi?.tier || 'Metered'
                            )}
                            {renderDetailCard(
                                'Cartesia',
                                <RecordVoiceOverIcon sx={{ color: '#00bcd4' }} />,
                                stats?.cartesia?.status,
                                stats?.cartesia?.tier || 'PayAsYouGo'
                            )}
                        </Box>
                    </Box>

                    {/* Detalles de IA */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Inteligencia Artificial
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {renderDetailCard(
                                'Gemini',
                                <SmartToyIcon sx={{ color: '#10B981' }} />,
                                stats?.gemini?.status,
                                stats?.gemini?.tier
                            )}
                            {renderDetailCard(
                                'Anthropic',
                                <SmartToyIcon sx={{ color: '#d6aebd' }} />,
                                stats?.anthropic?.status,
                                stats?.anthropic?.tier
                            )}
                            {renderDetailCard(
                                'Groq',
                                <SmartToyIcon sx={{ color: '#f4511e' }} />,
                                stats?.groq?.status,
                                stats?.groq?.tier
                            )}
                        </Box>
                    </Box>

                    {/* Datos */}
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Datos y Búsquedas
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {renderDetailCard(
                                'Serper',
                                <StorageIcon sx={{ color: '#607d8b' }} />,
                                stats?.serper?.status,
                                stats?.serper?.tier || 'Free'
                            )}
                            {renderDetailCard(
                                'Firecrawl',
                                <StorageIcon sx={{ color: '#ff5722' }} />,
                                stats?.firecrawl?.status,
                                stats?.firecrawl?.tier || 'Beta'
                            )}
                        </Box>
                    </Box>
                </Stack>
            )}
        </Box>
    );
}
