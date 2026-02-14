import { useState, useEffect } from 'react';
import { Button, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import axios from 'axios';

interface PhoneNumber {
    phone_number: string;
    capabilities: { voice: boolean };
}

export default function VoiceConfig() {
    const [numbers, setNumbers] = useState<PhoneNumber[]>([]);

    const fetchNumbers = async () => {
        try {
            const res = await axios.get('http://localhost:8000/telephony/numbers');
            setNumbers(res.data.numeros || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        // Optionally fetch on mount, or wait for user interaction
    }, []);

    const handleBuy = async (phone: string) => {
        if (confirm(`¿Comprar ${phone}? Esto generará un cargo en tu cuenta de Twilio.`)) {
            try {
                await axios.post('http://localhost:8000/telephony/provision', null, { params: { phone_number: phone } });
                alert('¡Número comprado y vinculado a Vapi exitosamente!');
            } catch (err) {
                alert('Error al comprar el número');
            }
        }
    };

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Configuración de Voz (Twilio)</Typography>
            <Button onClick={fetchNumbers} variant="outlined" sx={{ mb: 2 }}>Buscar Números Disponibles (CO)</Button>
            <List>
                {numbers.map((num) => (
                    <ListItem key={num.phone_number}>
                        <ListItemText primary={num.phone_number} secondary={num.capabilities.voice ? 'Voz Habilitada' : 'Sólo SMS'} />
                        <ListItemSecondaryAction>
                            <Button variant="contained" color="secondary" onClick={() => handleBuy(num.phone_number)}>Comprar y Vincular</Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
            {numbers.length === 0 && <Typography variant="body2" color="text.secondary">No hay números cargados. Haz clic en buscar.</Typography>}
        </Paper>
    );
}
