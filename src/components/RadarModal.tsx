import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Chip,
    Alert,
    Snackbar,
    InputAdornment,
    Slider,
    IconButton,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    keyframes
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import RadarIcon from '@mui/icons-material/Radar';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabaseClient';
import ImportNormalizationDialog from './ImportNormalizationDialog';

// Animations for the "Premium Experience"
const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(0.95); opacity: 0.5; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const scanAnimation = keyframes`
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
`;

// Map components
function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (map) {
            map.flyTo(center, 13);
            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        }
    }, [center, map]);
    return null;
}

interface RadarModalProps {
    open: boolean;
    onClose: () => void;
    onLeadsImported?: () => void;
}

export default function RadarModal({ open, onClose, onLeadsImported }: RadarModalProps) {
    const { user } = useAuth();
    // Search Config State
    const [keywords, setKeywords] = useState<string[]>([]);
    const [inputKeyword, setInputKeyword] = useState('');
    const [radius, setRadius] = useState(5);
    const [locationForm, setLocationForm] = useState({
        country: 'Colombia',
        city: 'Bogotá',
        address: ''
    });
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>({ lat: 4.6097, lng: -74.0817 });
    const [mapCenter, setMapCenter] = useState<[number, number]>([4.6097, -74.0817]);

    // Results State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [normalizationOpen, setNormalizationOpen] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<any[]>([]);

    const [scanMessage, setScanMessage] = useState('Escaneando...');
    const scanSteps = [
        'Iniciando protocolos de búsqueda de París IA...',
        'Emitiendo pulsos de búsqueda en redes locales...',
        'Interceptando señales satelitales y comerciales...',
        'Filtrando por radio de cobertura y relevancia...',
        'Analizando presencia web y reputación...',
        'Triangulando prospectos de alta conversión...',
        'Generando perfiles psicológicos comerciales...',
        'Finalizando reporte de inteligencia...'
    ];

    const handleAutoLocation = () => {
        if (!navigator.geolocation) {
            setError('Tu navegador no soporta geolocalización.');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setPosition(newPos);
                setMapCenter([latitude, longitude]);

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data.address) {
                        setLocationForm({
                            country: data.address.country || '',
                            city: data.address.city || data.address.town || data.address.village || '',
                            address: data.display_name.split(',')[0] || ''
                        });
                    }
                } catch (e) { console.error('Reverse geocoding error:', e); }

                setLoading(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('No pudimos obtener tu ubicación automáticamente.');
                setLoading(false);
            }
        );
    };

    const handleSearchLocation = async () => {
        const { country, city, address } = locationForm;
        const queryParts = [address, city, country].filter(Boolean);
        if (queryParts.length === 0) return;

        setLoading(true);
        const params = new URLSearchParams({
            format: 'json',
            limit: '1',
            q: queryParts.join(', ')
        });

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setPosition(newPos);
                setMapCenter([newPos.lat, newPos.lng]);
            } else {
                setError('No encontramos esa dirección. Prueba con algo más general.');
            }
        } catch (err) {
            console.error('Error geocoding:', err);
            setError('Error al buscar la ubicación.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (keywords.length === 0 || !position) {
            setError('Ingresa al menos una palabra clave y selecciona una zona.');
            return;
        }

        setLoading(true);
        setError(null);

        let stepIdx = 0;
        const interval = setInterval(() => {
            if (stepIdx < scanSteps.length) {
                setScanMessage(scanSteps[stepIdx]);
                stepIdx++;
            }
        }, 2000);

        try {
            const { data, error: funcError } = await supabase.functions.invoke('radar-engine', {
                body: {
                    keyword: keywords.join(', '),
                    lat: position.lat,
                    lng: position.lng,
                    radius: radius
                }
            });

            clearInterval(interval);

            if (funcError) throw funcError;

            if (data && data.leads) {
                if (data.leads.length > 0) {
                    setPendingImportData(data.leads);
                    setNormalizationOpen(true);
                } else {
                    setError('No se encontraron negocios con esos criterios en esta zona.');
                }
            }

        } catch (err: any) {
            clearInterval(interval);
            setError(err.message || 'Error al conectar con el Radar');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async (mappedData: any[]) => {
        setLoading(true);
        setNormalizationOpen(false);
        try {
            const leadsToInsert = mappedData.map(l => ({
                ...l,
                user_id: user?.id,
                status: 'new',
                created_at: new Date().toISOString()
            }));

            const { error: upsertError } = await supabase
                .from('leads')
                .upsert(leadsToInsert, { onConflict: 'user_id, title, address' });

            if (upsertError) throw upsertError;

            setSuccessMsg(`${mappedData.length} prospectos importados y organizados correctamente.`);
            if (onLeadsImported) onLeadsImported();

            // Close the modal after success auto-close
            setTimeout(() => {
                onClose();
            }, 3000);

        } catch (err: any) {
            setError('Error al importar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const PremiumLoading = () => (
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            bgcolor: 'rgba(15, 15, 15, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Box sx={{ position: 'relative', width: 240, height: 240, mb: 4 }}>
                {/* Radar Circle */}
                <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid rgba(124, 58, 237, 0.3)',
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '90%',
                        height: '90%',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                    },
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '70%',
                        height: '70%',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                    }
                }} />

                {/* Rotating Sweeper */}
                <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(124, 58, 237, 0.5) 0deg, transparent 90deg)',
                    animation: `${rotate} 3s linear infinite`,
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: 2,
                        height: '50%',
                        bgcolor: 'primary.main',
                        boxShadow: '0 0 15px #7c3aed'
                    }
                }} />

                {/* Scanning Bar */}
                <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: 2,
                    bgcolor: 'primary.main',
                    boxShadow: '0 0 20px #7c3aed',
                    animation: `${scanAnimation} 4s ease-in-out infinite`,
                    opacity: 0.5
                }} />

                {/* Center Point */}
                <Avatar sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    boxShadow: '0 0 30px #7c3aed',
                    animation: `${pulse} 2s infinite`
                }}>
                    <RadarIcon fontSize="large" />
                </Avatar>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center', px: 4, letterSpacing: 1 }}>
                INTELIGENCIA PARÍS TRABAJANDO
            </Typography>
            <Typography variant="body1" sx={{ color: 'primary.light', mb: 4, fontStyle: 'italic', height: 24 }}>
                {scanMessage}
            </Typography>

            <Stack direction="row" spacing={1}>
                {[0, 1, 2].map((i) => (
                    <Box key={i} sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: `${pulse} 1s infinite ${i * 0.2}s`
                    }} />
                ))}
            </Stack>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    bgcolor: '#0F0F0F',
                    backgroundImage: 'none',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    position: 'relative'
                }
            }}
        >
            {loading && <PremiumLoading />}

            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <RadarIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">Radar de Inteligencia Comercial</Typography>
                        <Typography variant="body2" color="text.secondary">Encuentra nuevos clientes ideales con París IA</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} disabled={loading} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', p: 0 }}>
                <Grid container sx={{ height: 600 }}>
                    {/* Config Side */}
                    <Grid size={{ xs: 12, md: 5 }} sx={{ borderRight: '1px solid rgba(255,255,255,0.05)', p: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoFixHighIcon color="primary" fontSize="small" /> Configura tu Búsqueda
                        </Typography>

                        <Stack spacing={3}>
                            <TextField
                                label="¿Qué buscas? (ej: Consultorios, Talleres...)"
                                fullWidth
                                placeholder="Escribe y presiona Enter"
                                value={inputKeyword}
                                onChange={(e) => setInputKeyword(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const trimmed = inputKeyword.trim();
                                        if (trimmed && !keywords.includes(trimmed)) {
                                            setKeywords([...keywords, trimmed]);
                                            setInputKeyword('');
                                        }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mr: 1, my: 0.5 }}>
                                            {keywords.map((k) => (
                                                <Chip
                                                    key={k}
                                                    label={k}
                                                    size="small"
                                                    color="primary"
                                                    onDelete={() => setKeywords(keywords.filter(t => t !== k))}
                                                />
                                            ))}
                                        </Box>
                                    ),
                                    sx: { borderRadius: 3 }
                                }}
                            />

                            <Box>
                                <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>ZONA DE BÚSQUEDA</Typography>
                                <Grid container spacing={1}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            label="Ciudad"
                                            size="small"
                                            fullWidth
                                            value={locationForm.city}
                                            onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField
                                            label="País"
                                            size="small"
                                            fullWidth
                                            value={locationForm.country}
                                            onChange={e => setLocationForm({ ...locationForm, country: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            label="Barrio o Dirección específica"
                                            fullWidth
                                            size="small"
                                            value={locationForm.address}
                                            onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={handleAutoLocation} size="small" color="secondary"><MyLocationIcon fontSize="small" /></IconButton>
                                                        <IconButton onClick={handleSearchLocation} size="small" color="primary"><SearchIcon fontSize="small" /></IconButton>
                                                    </InputAdornment>
                                                ),
                                                sx: { borderRadius: 2 }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ px: 1 }}>
                                <Typography gutterBottom variant="caption" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'text.secondary' }}>
                                    RADIO SELECTIVO <span>{radius} KM</span>
                                </Typography>
                                <Slider
                                    value={radius}
                                    onChange={(_, v) => setRadius(v as number)}
                                    min={1}
                                    max={20}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <Box sx={{ pt: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleSearch}
                                    disabled={loading || keywords.length === 0}
                                    sx={{
                                        height: 56,
                                        borderRadius: 3,
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.4)',
                                        '&:hover': { boxShadow: '0 12px 20px rgba(124, 58, 237, 0.5)' }
                                    }}
                                >
                                    Lanzar Radar de IA
                                </Button>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Map Side */}
                    <Grid size={{ xs: 12, md: 7 }} sx={{ position: 'relative' }}>
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            <MapUpdater center={mapCenter} />
                            <LocationMarker position={position} setPosition={setPosition} />
                            {position && (
                                <Circle
                                    center={[position.lat, position.lng]}
                                    radius={radius * 1000}
                                    pathOptions={{ fillColor: '#7c3aed', fillOpacity: 0.15, color: '#7c3aed', weight: 1 }}
                                />
                            )}
                        </MapContainer>
                        <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 1000, bgcolor: 'rgba(0,0,0,0.8)', px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, border: '1px solid rgba(124, 58, 237, 0.3)', backdropFilter: 'blur(4px)' }}>
                            <SettingsInputAntennaIcon color="primary" fontSize="small" sx={{ animation: `${pulse} 1.5s infinite` }} />
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>SISTEMA ACTIVO</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            {error && (
                <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>{error}</Alert>
            )}

            <DialogActions sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, px: 2 }}>
                    París IA analiza miles de fuentes en tiempo real para encontrarte los mejores prospectos locales.
                </Typography>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancelar</Button>
            </DialogActions>

            <Snackbar
                open={!!successMsg}
                autoHideDuration={4000}
                onClose={() => setSuccessMsg(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>{successMsg}</Alert>
            </Snackbar>

            <ImportNormalizationDialog
                open={normalizationOpen}
                onClose={() => setNormalizationOpen(false)}
                rawData={pendingImportData}
                onConfirm={handleConfirmImport}
            />
        </Dialog>
    );
}
