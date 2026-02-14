import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    Chip,
    CircularProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Avatar,
    Switch,
    IconButton,
    Snackbar,
    Divider
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Avatares humanizados por género
const AVATARS = {
    male: [
        'https://api.dicebear.com/7.x/personas/svg?seed=Felix&backgroundColor=7C3AED',
        'https://api.dicebear.com/7.x/personas/svg?seed=Adrian&backgroundColor=10B981',
        'https://api.dicebear.com/7.x/personas/svg?seed=Marcus&backgroundColor=F59E0B',
        'https://api.dicebear.com/7.x/personas/svg?seed=Carlos&backgroundColor=EF4444',
        'https://api.dicebear.com/7.x/personas/svg?seed=Diego&backgroundColor=3B82F6',
    ],
    female: [
        'https://api.dicebear.com/7.x/personas/svg?seed=Sophia&backgroundColor=EC4899',
        'https://api.dicebear.com/7.x/personas/svg?seed=Maria&backgroundColor=8B5CF6',
        'https://api.dicebear.com/7.x/personas/svg?seed=Elena&backgroundColor=14B8A6',
        'https://api.dicebear.com/7.x/personas/svg?seed=Isabella&backgroundColor=F97316',
        'https://api.dicebear.com/7.x/personas/svg?seed=Laura&backgroundColor=6366F1',
    ]
};

const getAvatarUrl = (name: string, gender: string): string => {
    const avatarList = gender?.toLowerCase() === 'femenino' || gender?.toLowerCase() === 'female'
        ? AVATARS.female
        : AVATARS.male;
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return avatarList[hash % avatarList.length];
};

const columns: GridColDef[] = [
    { field: 'businessName', headerName: 'Negocio', width: 250 },
    { field: 'phone', headerName: 'Teléfono', width: 150 },
    {
        field: 'status',
        headerName: 'Estado',
        width: 130,
        renderCell: (params) => (
            <Chip
                label={params.value}
                color={params.value === 'Llamado' ? 'success' : 'default'}
                size="small"
                variant="outlined"
            />
        )
    },
    { field: 'outcome', headerName: 'Resultado', flex: 1 },
];

export default function AgentDetail() {
    const { agentId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [leads, setLeads] = useState<any[]>([]);

    // Estado de edición
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Test call states
    const [testCallOpen, setTestCallOpen] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [calling, setCalling] = useState(false);
    const [callResult, setCallResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (!agentId) return;

        const fetchAgent = async () => {
            try {
                const { data, error } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('id', agentId)
                    .single();

                if (error) throw error;
                setAgent(data);
                setEditData(data); // Inicializar datos de edición
            } catch (error) {
                console.error('Error fetching agent:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();

        // Mock leads for now
        setLeads([
            { id: 1, businessName: 'Ferretería El Tornillo', phone: '3001234567', status: 'Pendiente', outcome: '-' },
            { id: 2, businessName: 'Panadería La Especial', phone: '3109876543', status: 'Llamado', outcome: 'Interesado en demo' },
            { id: 3, businessName: 'Abogados & Asociados', phone: '3205551234', status: 'Pendiente', outcome: '-' },
        ]);
    }, [agentId]);

    const handleStartCampaign = async () => {
        alert('Funcionalidad de barrido en desarrollo. El backend no está conectado.');
    }

    const handleToggleStatus = async () => {
        if (!agent) return;

        const newStatus = agent.status === 'active' ? 'paused' : 'active';

        try {
            const { error } = await supabase
                .from('agents')
                .update({ status: newStatus })
                .eq('id', agentId);

            if (error) throw error;

            setAgent({ ...agent, status: newStatus });
            setSnackbar({
                open: true,
                message: `Agente ${newStatus === 'active' ? 'activado' : 'pausado'} correctamente`,
                severity: 'success'
            });
        } catch (error: any) {
            console.error('Error al actualizar estado:', error);
            setSnackbar({
                open: true,
                message: 'Error al actualizar el estado',
                severity: 'error'
            });
        }
    };

    const handleSaveAgent = async () => {
        if (!editData) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('agents')
                .update({
                    name: editData.name,
                    role: editData.role,
                    instructions: editData.instructions,
                    gender: editData.gender,
                    accent: editData.accent,
                    voice_id: editData.voice_id,
                    phone_number: editData.phone_number,
                    company_info: editData.company_info,
                    target_config: editData.target_config
                })
                .eq('id', agentId);

            if (error) throw error;

            setAgent(editData);
            setIsEditing(false);
            setSearchParams({});
            setSnackbar({
                open: true,
                message: 'Agente actualizado correctamente',
                severity: 'success'
            });
        } catch (error: any) {
            console.error('Error al guardar:', error);
            setSnackbar({
                open: true,
                message: 'Error al guardar los cambios',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditData(agent);
        setIsEditing(false);
        setSearchParams({});
    };

    const handleTestCall = async () => {
        if (!testPhone) {
            setCallResult({ success: false, message: 'Ingresa tu número de teléfono' });
            return;
        }

        const cleanPhone = testPhone.replace(/\D/g, '');
        // Asegurar formato E.164
        const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : (countryCode + cleanPhone);

        setCalling(true);
        setCallResult(null);

        // CLAVES DE CONFIGURACIÓN DIRECTAS
        const VAPI_KEY = "a8f95863-0885-4d3b-9060-de7af720b787";
        const PHONE_ID = "657b8ef9-061c-4a64-b375-4711aef12aa3";

        try {
            console.log("Iniciando llamada configurada...", formattedPhone);

            // Determinar si el ID de voz parece ser de ElevenLabs (generalmente 20 chars) o Cartesia (UUID)
            // Por defecto asumimos 11labs ya que es lo que seleccionaste en el wizard
            const isElevenLabs = agent.voice_id && agent.voice_id.length < 25;
            const voiceProvider = isElevenLabs ? "11labs" : "cartesia";

            const response = await fetch("https://api.vapi.ai/call", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${VAPI_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phoneNumberId: PHONE_ID,
                    customer: { number: formattedPhone },
                    assistant: {
                        firstMessage: `Hola, habla ${agent.name}, de París Inteligencia Artificial. ¿Con quién tengo el gusto?`,
                        transcriber: {
                            provider: "deepgram",
                            model: "nova-2",
                            language: "es" // Forzamos español en la escucha
                        },
                        model: {
                            provider: "openai",
                            model: "gpt-3.5-turbo",
                            temperature: 0.1,
                            messages: [
                                {
                                    role: "system",
                                    content: `(SPANISH SPEAKER ONLY)
                                    Eres ${agent.name}, un experto en ventas.
                                    IDIOMA: SIEMPRE RESPONDE EN ESPAÑOL LATINO.
                                    OBJETIVO: ${agent.instructions}
                                    NO HABLES INGLÉS BAJO NINGUNA CIRCUNSTANCIA.`
                                },
                                {
                                    role: "user",
                                    content: "Hola."
                                },
                                {
                                    role: "assistant",
                                    content: "Hola, buenos días. ¿En qué puedo ayudarte?"
                                }
                            ]
                        },
                        voice: {
                            provider: "cartesia",
                            voiceId: "162e0f37-8504-474c-bb33-c606c01890dc" // Voz Cartesia específica proporcionada por el usuario
                        }
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                setCallResult({ success: true, message: 'Llamada enviada con tu configuración personalizada.' });
            } else {
                console.error("Vapi Error:", data);
                setCallResult({ success: false, message: `Error Vapi: ${data.message}` });
            }

        } catch (error: any) {
            console.error("Error de Red:", error);
            setCallResult({ success: false, message: 'Error de conexión.' });
        } finally {
            setCalling(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
        </Box>
    );

    if (!agent) return <Typography>Agente no encontrado</Typography>;

    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
                Volver a la lista
            </Button>

            <Paper elevation={0} sx={{ p: 4, mb: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        {/* Avatar */}
                        <Avatar
                            src={getAvatarUrl(agent.name, agent.gender)}
                            sx={{
                                width: 80,
                                height: 80,
                                border: '4px solid',
                                borderColor: agent.status === 'active' ? 'success.main' : 'grey.600'
                            }}
                        />

                        <Box>
                            {isEditing ? (
                                <TextField
                                    value={editData?.name || ''}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mb: 1, minWidth: 300 }}
                                    label="Nombre del agente"
                                />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 600 }}>{agent.name}</Typography>
                                    <IconButton size="small" onClick={() => setIsEditing(true)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}

                            {isEditing ? (
                                <TextField
                                    value={editData?.role || ''}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    label="Rol / Persona"
                                />
                            ) : (
                                <Typography variant="subtitle1" color="text.secondary">
                                    {agent.role}
                                </Typography>
                            )}

                            {/* Switch de estado */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                <Switch
                                    checked={agent.status === 'active'}
                                    onChange={handleToggleStatus}
                                    color="success"
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: agent.status === 'active' ? 'success.main' : 'text.secondary'
                                    }}
                                >
                                    {agent.status === 'active' ? 'ACTIVO' : 'PAUSADO'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Botones de edición */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    onClick={handleSaveAgent}
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="large"
                                    startIcon={<PhoneIcon />}
                                    onClick={() => setTestCallOpen(true)}
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    Probar Llamada
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={handleStartCampaign}
                                    sx={{ px: 4, py: 1.5 }}
                                >
                                    Iniciar Barrido
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Detalles editables */}
                {isEditing ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {/* Teléfono asignado */}
                        <TextField
                            fullWidth
                            label="Teléfono del agente"
                            placeholder="+573001234567"
                            value={editData?.phone_number || ''}
                            onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                            helperText="Número asignado al agente (opcional)"
                        />

                        {/* Voice ID */}
                        <TextField
                            fullWidth
                            label="Voice ID (ElevenLabs/Cartesia)"
                            value={editData?.voice_id || ''}
                            onChange={(e) => setEditData({ ...editData, voice_id: e.target.value })}
                            helperText="ID de la voz del proveedor TTS"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Género de voz</InputLabel>
                            <Select
                                value={editData?.gender || ''}
                                label="Género de voz"
                                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                            >
                                <MenuItem value="Masculino">Masculino</MenuItem>
                                <MenuItem value="Femenino">Femenino</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Acento</InputLabel>
                            <Select
                                value={editData?.accent || ''}
                                label="Acento"
                                onChange={(e) => setEditData({ ...editData, accent: e.target.value })}
                            >
                                <MenuItem value="Colombiano">Colombiano</MenuItem>
                                <MenuItem value="Mexicano">Mexicano</MenuItem>
                                <MenuItem value="Argentino">Argentino</MenuItem>
                                <MenuItem value="Español">Español</MenuItem>
                                <MenuItem value="Neutro">Neutro</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Tipo de negocio a buscar"
                            value={editData?.target_config?.keyword || ''}
                            onChange={(e) => setEditData({
                                ...editData,
                                target_config: { ...editData.target_config, keyword: e.target.value }
                            })}
                        />

                        <TextField
                            fullWidth
                            type="number"
                            label="Radio de búsqueda (km)"
                            value={editData?.target_config?.radius_km || ''}
                            onChange={(e) => setEditData({
                                ...editData,
                                target_config: { ...editData.target_config, radius_km: Number(e.target.value) }
                            })}
                        />

                        {/* Coordenadas */}
                        <TextField
                            fullWidth
                            type="number"
                            label="Latitud"
                            value={editData?.target_config?.lat || ''}
                            onChange={(e) => setEditData({
                                ...editData,
                                target_config: { ...editData.target_config, lat: Number(e.target.value) }
                            })}
                            inputProps={{ step: 0.000001 }}
                        />

                        <TextField
                            fullWidth
                            type="number"
                            label="Longitud"
                            value={editData?.target_config?.lng || ''}
                            onChange={(e) => setEditData({
                                ...editData,
                                target_config: { ...editData.target_config, lng: Number(e.target.value) }
                            })}
                            inputProps={{ step: 0.000001 }}
                        />

                        {/* Información de la empresa */}
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Información de la empresa"
                            placeholder="Describe tu empresa, productos o servicios..."
                            value={editData?.company_info || ''}
                            onChange={(e) => setEditData({ ...editData, company_info: e.target.value })}
                            sx={{ gridColumn: '1 / -1' }}
                            helperText="Esta información estará disponible para el agente durante las llamadas"
                        />

                        {/* Instrucciones */}
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="Instrucciones del agente"
                            placeholder="Instrucciones detalladas sobre cómo debe comportarse el agente..."
                            value={editData?.instructions || ''}
                            onChange={(e) => setEditData({ ...editData, instructions: e.target.value })}
                            sx={{ gridColumn: '1 / -1' }}
                            helperText="Define el comportamiento, tono y objetivos del agente"
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RecordVoiceOverIcon fontSize="small" />
                            <Typography variant="body2">{agent.gender} / {agent.accent}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" />
                            <Typography variant="body2">
                                Busca: <strong>{agent.target_config?.keyword}</strong>
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon fontSize="small" />
                            <Typography variant="body2">
                                Radio: {agent.target_config?.radius_km} km
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Tabs de leads */}
            {!isEditing && (
                <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                            <Tab label={`Por Llamar (${leads.filter(l => l.status === 'Pendiente').length})`} />
                            <Tab label={`Historial (${leads.filter(l => l.status !== 'Pendiente').length})`} />
                        </Tabs>
                    </Box>

                    <Box sx={{ height: 400, width: '100%', p: 2 }}>
                        <DataGrid
                            rows={tabValue === 0 ? leads.filter(l => l.status === 'Pendiente') : leads.filter(l => l.status !== 'Pendiente')}
                            columns={columns}
                            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                            pageSizeOptions={[5, 10, 20]}
                            checkboxSelection
                            disableRowSelectionOnClick
                            sx={{ border: 'none' }}
                        />
                    </Box>
                </Box>
            )}

            {/* Modal de Prueba de Llamada */}
            <Dialog open={testCallOpen} onClose={() => !calling && setTestCallOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="primary" />
                        Probar Llamada del Agente
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Ingresa tu número de teléfono y el agente <strong>{agent?.name}</strong> te llamará para que pruebes cómo suena.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ minWidth: 140 }}>
                            <InputLabel>País</InputLabel>
                            <Select
                                value={countryCode}
                                label="País"
                                onChange={(e) => setCountryCode(e.target.value)}
                                disabled={calling}
                            >
                                <MenuItem value="+57">🇨🇴 Colombia (+57)</MenuItem>
                                <MenuItem value="+52">🇲🇽 México (+52)</MenuItem>
                                <MenuItem value="+54">🇦🇷 Argentina (+54)</MenuItem>
                                <MenuItem value="+56">🇨🇱 Chile (+56)</MenuItem>
                                <MenuItem value="+51">🇵🇪 Perú (+51)</MenuItem>
                                <MenuItem value="+593">🇪🇨 Ecuador (+593)</MenuItem>
                                <MenuItem value="+58">🇻🇪 Venezuela (+58)</MenuItem>
                                <MenuItem value="+34">🇪🇸 España (+34)</MenuItem>
                                <MenuItem value="+1">🇺🇸 USA/CAN (+1)</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Número de teléfono"
                            placeholder="Ej: 3001234567"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            disabled={calling}
                        />
                    </Box>

                    {callResult && (
                        <Alert
                            severity={callResult.success ? 'success' : 'error'}
                            sx={{ mb: 2 }}
                        >
                            {callResult.message}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={() => { setTestCallOpen(false); setCallResult(null); }}
                        disabled={calling}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleTestCall}
                        disabled={calling || !testPhone}
                        startIcon={calling ? <CircularProgress size={20} /> : <PhoneIcon />}
                    >
                        {calling ? 'Llamando...' : 'Llamarme Ahora'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
