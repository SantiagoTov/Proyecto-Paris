import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    InputAdornment,
    Slider,
    Divider,
    IconButton,
    Avatar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import RadarIcon from '@mui/icons-material/Radar';
import BusinessIcon from '@mui/icons-material/Business';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';
import ImportNormalizationDialog from '../components/ImportNormalizationDialog';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Map components from AgentWizard
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

export default function Radar() {
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
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [normalizationOpen, setNormalizationOpen] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<any[]>([]);

    const [scanMessage, setScanMessage] = useState('Escaneando...');
    const scanSteps = [
        'Emitiendo pulsos de búsqueda...',
        'Interceptando señales locales...',
        'Filtrando por radio de cobertura...',
        'Triangulando prospectos...',
        'Finalizando reporte...'
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

                // Intenta obtener la dirección textual (Reverso)
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

        // Use a more generic query if it's just one field, or structured help
        const queryParts = [address, city, country].filter(Boolean);
        if (queryParts.length === 0) return;

        setLoading(true);
        const params = new URLSearchParams({
            format: 'json',
            limit: '1',
            q: queryParts.join(', ') // Full string is often more reliable than split params
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
        setResults([]);

        let stepIdx = 0;
        const interval = setInterval(() => {
            if (stepIdx < scanSteps.length) {
                setScanMessage(scanSteps[stepIdx]);
                stepIdx++;
            }
        }, 1500);

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
                setResults(data.leads);

                if (data.leads.length > 0) {
                    setPendingImportData(data.leads);
                    setNormalizationOpen(true); // Open the normalization dialog
                } else {
                    setError('No se encontraron negocios con esos criterios en esta zona.');
                }
            } else {
                setResults([]);
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

            setSuccessMsg(`${mappedData.length} leads importados y normalizados correctamente.`);
            // Update local synced status for UI
            setResults(prev => prev.map(r => ({ ...r, synced: true })));
        } catch (err: any) {
            setError('Error al importar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (lead: any, leadId: string) => {
        setSyncingId(leadId);
        try {
            const { error: syncError } = await supabase.functions.invoke('sync-crm', {
                body: { lead }
            });

            if (syncError) throw syncError;

            setSuccessMsg(`Lead "${lead.title}" sincronizado correctamente.`);
            setResults(prev => prev.map(l =>
                (l.title + l.address === leadId) ? { ...l, synced: true } : l
            ));
        } catch (err: any) {
            setError('No se pudo sincronizar. ¿Configuraste tu API en Integraciones?');
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <Box sx={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0F0F0F 100%)',
            p: 3
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <RadarIcon fontSize="large" />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Radar de Prospectos</Typography>
                    <Typography variant="body2" color="text.secondary">Visualiza y captura oportunidades en tiempo real</Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Panel de Configuración */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SearchIcon color="primary" /> Configuración de Búsqueda
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Keywords */}
                                <TextField
                                    label="Palabras clave (Presiona Enter)"
                                    placeholder="ej. Restaurantes, Dentistas..."
                                    fullWidth
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
                                        )
                                    }}
                                />

                                {/* Ubicación Estructurada */}
                                <Box>
                                    <Grid container spacing={2}>
                                        <Grid size={6}>
                                            <TextField
                                                label="País"
                                                size="small"
                                                fullWidth
                                                value={locationForm.country}
                                                onChange={e => setLocationForm({ ...locationForm, country: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid size={6}>
                                            <TextField
                                                label="Ciudad"
                                                size="small"
                                                fullWidth
                                                value={locationForm.city}
                                                onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <TextField
                                                label="Dirección o Zona"
                                                placeholder="Calle 100 #..."
                                                fullWidth
                                                value={locationForm.address}
                                                onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton type="button" onClick={handleAutoLocation} color="secondary" title="Detectar mi ubicación">
                                                                <MyLocationIcon />
                                                            </IconButton>
                                                            <IconButton type="button" onClick={handleSearchLocation} color="primary" title="Buscar en mapa">
                                                                <SearchIcon />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                <Divider />

                                {/* Radius */}
                                <Box sx={{ px: 1 }}>
                                    <Typography gutterBottom variant="subtitle2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        Radio de Búsqueda <span>{radius} km</span>
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

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <RadarIcon />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    sx={{ height: 60, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem' }}
                                >
                                    {loading ? 'Escaneando Área...' : 'Lanzar Radar'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Mapa Interactivo */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Box sx={{
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: 500,
                        overflow: 'hidden',
                        position: 'relative',
                        bgcolor: 'background.paper'
                    }}>
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
                                    pathOptions={{ fillColor: '#3f51b5', fillOpacity: 0.15, color: '#3f51b5', weight: 1 }}
                                />
                            )}
                            {loading && position && (
                                <Circle
                                    center={[position.lat, position.lng]}
                                    radius={radius * 1000}
                                    pathOptions={{
                                        fillColor: '#3f51b5',
                                        fillOpacity: 0.4,
                                        color: '#3f51b5',
                                        weight: 0,
                                        className: 'radar-pulse'
                                    }}
                                />
                            )}
                        </MapContainer>
                        {loading && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 1000,
                                bgcolor: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(2px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <CircularProgress size={60} sx={{ mb: 2, color: 'white' }} />
                                <Typography variant="h6" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {scanMessage}
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
                                    Analizando {keywords.length} señales en un radio de {radius}km
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ position: 'absolute', top: 15, right: 15, zIndex: 1000, bgcolor: 'background.paper', p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'divider', boxShadow: 2 }}>
                            <SettingsInputAntennaIcon color="primary" fontSize="small" />
                            <Typography variant="caption" fontWeight="bold">Rastreo Activo</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* Resultados */}
            <Box sx={{ mt: 6 }}>
                {results.length > 0 && (
                    <>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Leads Encontrados ({results.length})</Typography>
                        <Grid container spacing={3}>
                            {results.map((lead, index) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                                    <Card sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1, mr: 1 }}>{lead.title}</Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                    <Chip
                                                        label={lead.paris_status === 'qualified' ? "Web Optimizada" : "Cualificando"}
                                                        size="small"
                                                        color={lead.paris_status === 'qualified' ? "success" : "info"}
                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                    />
                                                    {lead.distance_km !== undefined && (
                                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                            {lead.distance_km} km
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                                                    <BusinessIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                                    <Typography variant="body2" noWrap>{lead.address}</Typography>
                                                </Box>
                                                {lead.website && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
                                                        <LanguageIcon fontSize="small" />
                                                        <Typography variant="body2" component="a" href={lead.website} target="_blank" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'medium' }}>
                                                            {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {lead.phoneNumber && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                                                        <PhoneIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                                        <Typography variant="body2">{lead.phoneNumber}</Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {lead.category || 'Empresa'}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant={lead.synced ? "outlined" : "contained"}
                                                    color={lead.synced ? "success" : "primary"}
                                                    startIcon={syncingId === (lead.title + lead.address) ? <CircularProgress size={16} color="inherit" /> : (lead.synced ? <CheckCircleIcon /> : <SyncIcon />)}
                                                    onClick={() => handleSync(lead, lead.title + lead.address)}
                                                    disabled={!!syncingId || lead.synced}
                                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                                >
                                                    {lead.synced ? 'Sincronizado' : 'Enviar a CRM'}
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Box>

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
        </Box>
    );
}
