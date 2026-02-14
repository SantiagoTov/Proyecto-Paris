import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import LeadTable from '../components/LeadTable';
import RadarIcon from '@mui/icons-material/Radar';
import RadarModal from '../components/RadarModal';

export default function CRM() {
    const [radarOpen, setRadarOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleLeadsImported = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0F0F0F 100%)',
            p: 3
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                mb: 1
            }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 1 }}>
                            Gestión de Prospectos
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Sigue el progreso de tus clientes potenciales y cierra más ventas.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<RadarIcon />}
                            onClick={() => setRadarOpen(true)}
                            sx={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                                px: 4,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.6)',
                                }
                            }}
                        >
                            Buscar nuevos clientes
                        </Button>
                    </Box>
                </Box>
            </Box>

            <LeadTable key={refreshKey} />

            <RadarModal
                open={radarOpen}
                onClose={() => setRadarOpen(false)}
                onLeadsImported={handleLeadsImported}
            />
        </Box>
    );
}
