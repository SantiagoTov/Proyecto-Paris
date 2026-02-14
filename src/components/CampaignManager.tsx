import { useState } from 'react';
import { TextField, Button, Typography, Paper, Box } from '@mui/material';
import axios from 'axios';

export default function CampaignManager() {
    const [keyword, setKeyword] = useState('');
    const [lat, setLat] = useState('4.7110'); // Bogota default
    const [lng, setLng] = useState('-74.0721');
    const [radius, setRadius] = useState('5');

    const handleProspect = async () => {
        try {
            const response = await axios.post('http://localhost:8000/prospect/start', {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                radius_km: parseFloat(radius),
                keyword: keyword
            });
            alert(`Prospección iniciada: ${response.data.message}`);
        } catch (error) {
            console.error(error);
            alert('Error al iniciar la prospección');
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Lanzar Campaña</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', md: '30%' }, flexGrow: 1 }}>
                    <TextField
                        fullWidth label="Tipo de negocio a buscar (ej. Ferreterías)"
                        value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    />
                </Box>
                <Box sx={{ width: { xs: '45%', md: '15%' } }}>
                    <TextField fullWidth label="Latitud" value={lat} onChange={(e) => setLat(e.target.value)} />
                </Box>
                <Box sx={{ width: { xs: '45%', md: '15%' } }}>
                    <TextField fullWidth label="Longitud" value={lng} onChange={(e) => setLng(e.target.value)} />
                </Box>
                <Box sx={{ width: { xs: '45%', md: '15%' } }}>
                    <TextField fullWidth label="Radio (km)" value={radius} onChange={(e) => setRadius(e.target.value)} />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '15%' } }}>
                    <Button variant="contained" fullWidth size="large" onClick={handleProspect} sx={{ height: '100%' }}>
                        Iniciar
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}
