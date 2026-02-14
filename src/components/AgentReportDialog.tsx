import {
    Dialog,
    Box,
    Typography,
    Grid,
    IconButton,
    Paper,
    Divider,
    Avatar,
    LinearProgress,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    TrendingUp as ChartIcon,
    Call as CallIcon,
    Timer as TimerIcon,
    ThumbUp as SuccessIcon,
    AssignmentTurnedIn as AchievementIcon
} from '@mui/icons-material';

interface AgentReportProps {
    open: boolean;
    onClose: () => void;
    reportData: {
        agentName: string;
        totalCalls: number;
        contactsReached: number;
        successRate: number;
        totalDuration: string;
        achievements: string[];
        metrics: {
            label: string;
            value: number;
            total: number;
            color: string;
        }[];
    } | null;
}

export default function AgentReportDialog({ open, onClose, reportData }: AgentReportProps) {
    if (!reportData) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f0f0f',
                    backgroundImage: 'none',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header con gradiente */}
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(15, 15, 15, 1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {reportData.agentName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Resumen de Gestión: {reportData.agentName}</Typography>
                        <Typography variant="caption" color="text.secondary">Reporte generado tras completar la sesión de llamadas</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ p: 4 }}>
                {/* Métricas Principales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
                            <CallIcon sx={{ color: 'primary.light', mb: 1 }} />
                            <Typography variant="h4" fontWeight="800">{reportData.totalCalls}</Typography>
                            <Typography variant="caption" color="text.secondary">Llamadas Realizadas</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
                            <SuccessIcon sx={{ color: 'secondary.main', mb: 1 }} />
                            <Typography variant="h4" fontWeight="800" sx={{ color: 'secondary.main' }}>{reportData.successRate}%</Typography>
                            <Typography variant="caption" color="text.secondary">Tasa de Efectividad</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
                            <TimerIcon sx={{ color: 'info.main', mb: 1 }} />
                            <Typography variant="h4" fontWeight="800">{reportData.totalDuration}</Typography>
                            <Typography variant="caption" color="text.secondary">Tiempo Total</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.05)' }} />

                <Grid container spacing={4}>
                    {/* Canal de Conversión */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChartIcon fontSize="small" color="primary" /> Métricas Detalladas
                        </Typography>
                        <Stack spacing={3}>
                            {reportData.metrics.map((metric, index) => (
                                <Box key={index}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight="600">{metric.label}</Typography>
                                        <Typography variant="body2" color="text.secondary">{metric.value} / {metric.total}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(metric.value / metric.total) * 100}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            '& .MuiLinearProgress-bar': { bgcolor: metric.color }
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Logros Principales */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AchievementIcon fontSize="small" color="secondary" /> Logros Principales
                        </Typography>
                        <Stack spacing={1}>
                            {reportData.achievements.map((achievement, index) => (
                                <Paper key={index} sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                                    border: '1px solid rgba(16, 185, 129, 0.1)',
                                    borderRadius: 2
                                }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                    <Typography variant="body2" fontWeight="500">{achievement}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Estos datos han sido procesados automáticamente por el motor de análisis de París IA.
                </Typography>
            </Box>
        </Dialog>
    );
}
