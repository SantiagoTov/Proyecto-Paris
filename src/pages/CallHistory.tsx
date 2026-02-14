import { useEffect, useState, useRef, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Tooltip,
    Stack,
    Alert,
    Tabs,
    Tab,
    Drawer,
    Slider,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import RefreshIcon from '@mui/icons-material/Refresh';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../lib/supabaseClient';

interface LlamadaVapi {
    id: string;
    type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
    status: string;
    endedReason: string | null;
    customerNumber: string | null;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    durationSeconds: number | null;
    transcript: string | null;
    summary: string | null;
    successEvaluation: string | null;
    recordingUrl: string | null;
    stereoRecordingUrl: string | null;
    messages: any[];
    cost: number | null;
    costBreakdown: any;
    assistantName: string | null;
    extracted_products?: string[]; // Nuevo campo para productos detectados
}

interface MensajeTranscripcion {
    rol: string;
    contenido: string;
    timestamp?: string;
}

export default function HistorialLlamadas() {
    const [llamadas, setLlamadas] = useState<LlamadaVapi[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [llamadaSeleccionada, setLlamadaSeleccionada] = useState<LlamadaVapi | null>(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroFecha, setFiltroFecha] = useState<string>('todos');

    // Audio player states
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [duracionAudio, setDuracionAudio] = useState(0);
    const [volumen, setVolumen] = useState(80);

    // Tabs
    const [tabActual, setTabActual] = useState(0);

    // Estado para productos/servicios extraídos en el análisis
    const [productos, setProductos] = useState<string[]>([]);
    const [nuevoProductoInput, setNuevoProductoInput] = useState('');
    const [analizando, setAnalizando] = useState(false);

    // Cargar productos al seleccionar llamada
    useEffect(() => {
        if (llamadaSeleccionada) {
            // Si la llamada ya tiene productos guardados, usarlos. Si no, array vacío.
            setProductos(llamadaSeleccionada.extracted_products || []);
        }
    }, [llamadaSeleccionada]);

    const handleAgregarProducto = () => {
        if (!nuevoProductoInput.trim()) return;
        setProductos([...productos, nuevoProductoInput.trim()]);
        setNuevoProductoInput('');
    };

    const handleEliminarProducto = (idx: number) => {
        setProductos(productos.filter((_, i) => i !== idx));
    };

    const handleAnalizarIA = async () => {
        if (!llamadaSeleccionada?.transcript && !llamadaSeleccionada?.summary) {
            alert("No hay suficiente información (transcripción o resumen) para analizar.");
            return;
        }

        setAnalizando(true);
        // TODO: Reemplazar con llamada real a API/Edge Function
        // Por ahora simulamos un análisis basado en el contexto de la llamada
        setTimeout(() => {
            const simulacion = ["Consultoría Legal", "Asesoría Jurídica", "Trámites Notariales"];
            setProductos(simulacion);
            setAnalizando(false);
        }, 2000);
    };

    // Llamadas filtradas
    const llamadasFiltradas = useMemo(() => {
        return llamadas.filter(llamada => {
            // Filtro de búsqueda (número de teléfono o resumen)
            if (busqueda) {
                const searchLower = busqueda.toLowerCase();
                const matchTelefono = llamada.customerNumber?.toLowerCase().includes(searchLower);
                const matchResumen = llamada.summary?.toLowerCase().includes(searchLower);
                if (!matchTelefono && !matchResumen) return false;
            }

            // Filtro por tipo
            if (filtroTipo !== 'todos') {
                if (filtroTipo === 'entrante' && !llamada.type?.includes('inbound')) return false;
                if (filtroTipo === 'saliente' && !llamada.type?.includes('outbound')) return false;
                if (filtroTipo === 'web' && !llamada.type?.includes('web')) return false;
            }

            // Filtro por estado
            if (filtroEstado !== 'todos') {
                const estadoLower = llamada.status?.toLowerCase();
                if (filtroEstado === 'completada' && estadoLower !== 'ended' && estadoLower !== 'completed') return false;
                if (filtroEstado === 'fallida' && estadoLower !== 'failed') return false;
                if (filtroEstado === 'en-progreso' && estadoLower !== 'in-progress') return false;
            }

            // Filtro por fecha
            if (filtroFecha !== 'todos' && llamada.createdAt) {
                const fechaLlamada = new Date(llamada.createdAt);
                const ahora = new Date();

                if (filtroFecha === 'hoy') {
                    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
                    if (fechaLlamada < inicioHoy) return false;
                } else if (filtroFecha === 'semana') {
                    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (fechaLlamada < hace7Dias) return false;
                } else if (filtroFecha === 'mes') {
                    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (fechaLlamada < hace30Dias) return false;
                }
            }

            return true;
        });
    }, [llamadas, busqueda, filtroTipo, filtroEstado, filtroFecha]);

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroTipo('todos');
        setFiltroEstado('todos');
        setFiltroFecha('todos');
    };

    const hayFiltrosActivos = busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos' || filtroFecha !== 'todos';

    useEffect(() => {
        cargarLlamadas();
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const cargarLlamadas = async () => {
        setCargando(true);
        setError(null);
        try {
            const { data, error: fnError } = await supabase.functions.invoke('get-vapi-calls', {
                body: {}
            });

            if (fnError) throw fnError;
            if (data.error) throw new Error(data.error);

            setLlamadas(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error al cargar llamadas de Vapi:', err);
            setError(err.message || 'Error al cargar las llamadas');
        } finally {
            setCargando(false);
        }
    };

    const formatearDuracion = (segundos: number | null): string => {
        if (!segundos) return '00:00';
        const mins = Math.floor(segundos / 60);
        const secs = Math.floor(segundos % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatearFecha = (fechaStr: string | null): string => {
        if (!fechaStr) return '--';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearHora = (fechaStr: string | null): string => {
        if (!fechaStr) return '--';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const traducirEstado = (status: string): string => {
        const traducciones: { [key: string]: string } = {
            'ended': 'Finalizada',
            'failed': 'Fallida',
            'in-progress': 'En Progreso',
            'ringing': 'Sonando',
            'queued': 'En Cola',
            'busy': 'Ocupado',
            'no-answer': 'Sin Respuesta',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return traducciones[status?.toLowerCase()] || status || 'Desconocido';
    };

    const traducirEndReason = (reason: string | null): string => {
        if (!reason) return 'Desconocido';
        const traducciones: { [key: string]: string } = {
            'customer-ended-call': 'Cliente finalizó la llamada',
            'assistant-ended-call': 'Asistente finalizó la llamada',
            'silence-timeout': 'Timeout por silencio',
            'max-duration-reached': 'Duración máxima alcanzada',
            'voicemail-reached': 'Buzón de voz detectado',
            'pipeline-error': 'Error en el pipeline',
            'customer-did-not-answer': 'Cliente no contestó'
        };
        return traducciones[reason] || reason;
    };

    const obtenerColorEstado = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
        switch (status?.toLowerCase()) {
            case 'ended': case 'completed': return 'success';
            case 'failed': case 'busy': case 'no-answer': return 'error';
            case 'in-progress': case 'ringing': return 'warning';
            case 'queued': return 'info';
            default: return 'default';
        }
    };

    const obtenerIconoTipo = (tipo: string) => {
        if (tipo?.includes('inbound')) {
            return <CallReceivedIcon fontSize="small" sx={{ color: '#10B981' }} />;
        }
        return <CallMadeIcon fontSize="small" sx={{ color: '#7C3AED' }} />;
    };

    const traducirTipo = (tipo: string): string => {
        if (tipo?.includes('inbound')) return 'Entrante';
        if (tipo?.includes('outbound')) return 'Saliente';
        if (tipo?.includes('web')) return 'Web';
        return 'Desconocido';
    };

    const abrirDetalle = (llamada: LlamadaVapi) => {
        setLlamadaSeleccionada(llamada);
        setDrawerAbierto(true);
        setTabActual(0);
        setProgreso(0);
        setReproduciendo(false);

        // Setup audio
        const url = llamada.stereoRecordingUrl || llamada.recordingUrl;
        if (url && audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.load();
        }
    };

    const cerrarDetalle = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setReproduciendo(false);
        setDrawerAbierto(false);
        setLlamadaSeleccionada(null);
    };

    const toggleReproduccion = () => {
        if (!audioRef.current) return;

        if (reproduciendo) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setReproduciendo(!reproduciendo);
    };

    const handleProgresoChange = (_: Event, value: number | number[]) => {
        if (!audioRef.current) return;
        const newTime = ((value as number) / 100) * duracionAudio;
        audioRef.current.currentTime = newTime;
        setProgreso(value as number);
    };

    const handleVolumenChange = (_: Event, value: number | number[]) => {
        setVolumen(value as number);
        if (audioRef.current) {
            audioRef.current.volume = (value as number) / 100;
        }
    };

    const renderizarMensajes = (mensajes: any[]): MensajeTranscripcion[] => {
        if (!mensajes || !Array.isArray(mensajes)) return [];

        // Filtrar solo mensajes de conversación real (assistant/bot y user)
        // Excluir: system, tool, function, y mensajes de configuración
        const rolesValidos = ['assistant', 'bot', 'user', 'customer'];

        return mensajes
            .filter((msg: any) => {
                // Debe tener rol y contenido
                if (!msg.role || !(msg.message || msg.content)) return false;

                // Solo roles de conversación
                if (!rolesValidos.includes(msg.role.toLowerCase())) return false;

                const contenido = (msg.message || msg.content || '').toLowerCase();

                // Excluir mensajes que parecen instrucciones o configuración
                if (contenido.includes('eres un agente')) return false;
                if (contenido.includes('tu objetivo es')) return false;
                if (contenido.includes('sigue estas instrucciones')) return false;
                if (contenido.startsWith('[system]')) return false;
                if (contenido.startsWith('system:')) return false;

                // Excluir mensajes muy largos (probablemente instrucciones)
                if (contenido.length > 1000) return false;

                return true;
            })
            .map((msg: any, idx: number) => ({
                rol: msg.role,
                contenido: msg.message || msg.content || '',
                timestamp: msg.time ? formatearHora(msg.time) : `+${(idx * 3).toString().padStart(2, '0')}s`
            }));
    };

    const formatearCosto = (costo: number | null): string => {
        if (costo === null || costo === undefined) return '--';
        return `$${costo.toFixed(4)}`;
    };

    // Navegación entre llamadas
    const navegarLlamada = (direccion: 'prev' | 'next') => {
        if (!llamadaSeleccionada) return;
        const idxActual = llamadasFiltradas.findIndex(l => l.id === llamadaSeleccionada.id);
        const nuevoIdx = direccion === 'next' ? idxActual + 1 : idxActual - 1;

        if (nuevoIdx >= 0 && nuevoIdx < llamadasFiltradas.length) {
            if (audioRef.current) audioRef.current.pause();
            setReproduciendo(false);
            abrirDetalle(llamadasFiltradas[nuevoIdx]);
        }
    };

    // Generar forma de onda simulada
    const generarWaveform = () => {
        const barras = 60;
        return Array.from({ length: barras }, () => Math.random() * 100);
    };

    const [waveformData] = useState(generarWaveform);

    return (
        <Box sx={{ py: 2 }}>
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                onTimeUpdate={() => {
                    if (audioRef.current && duracionAudio > 0) {
                        setProgreso((audioRef.current.currentTime / duracionAudio) * 100);
                    }
                }}
                onLoadedMetadata={() => {
                    if (audioRef.current) {
                        setDuracionAudio(audioRef.current.duration);
                    }
                }}
                onEnded={() => setReproduciendo(false)}
            />

            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Historial de Llamadas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Datos en tiempo real desde Vapi
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={cargarLlamadas}
                    disabled={cargando}
                    startIcon={cargando ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ borderColor: 'divider' }}
                >
                    Actualizar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            {llamadas.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {llamadas.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Total Llamadas</Typography>
                    </Paper>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {llamadas.filter(l => l.status === 'ended').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Completadas</Typography>
                    </Paper>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 600, color: 'warning.main' }}>
                            {formatearDuracion(llamadas.reduce((acc, l) => acc + (l.durationSeconds || 0), 0))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Tiempo Total</Typography>
                    </Paper>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 600, color: 'error.main' }}>
                            ${llamadas.reduce((acc, l) => acc + (l.cost || 0), 0).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Costo Total</Typography>
                    </Paper>
                </Box>
            )}

            {/* Filtros */}
            {llamadas.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {/* Icono de filtro */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <FilterListIcon />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Filtros
                            </Typography>
                        </Box>

                        {/* Búsqueda */}
                        <TextField
                            size="small"
                            placeholder="Buscar por teléfono o resumen..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            sx={{ minWidth: 250 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: busqueda && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setBusqueda('')}>
                                            <ClearIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* Filtro por Tipo */}
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={filtroTipo}
                                label="Tipo"
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="entrante">📞 Entrantes</MenuItem>
                                <MenuItem value="saliente">📱 Salientes</MenuItem>
                                <MenuItem value="web">🌐 Web</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Filtro por Estado */}
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={filtroEstado}
                                label="Estado"
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="completada">✅ Completada</MenuItem>
                                <MenuItem value="fallida">❌ Fallida</MenuItem>
                                <MenuItem value="en-progreso">⏳ En progreso</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Filtro por Fecha */}
                        <ToggleButtonGroup
                            value={filtroFecha}
                            exclusive
                            onChange={(_, value) => value && setFiltroFecha(value)}
                            size="small"
                        >
                            <ToggleButton value="todos">Todas</ToggleButton>
                            <ToggleButton value="hoy">Hoy</ToggleButton>
                            <ToggleButton value="semana">7 días</ToggleButton>
                            <ToggleButton value="mes">30 días</ToggleButton>
                        </ToggleButtonGroup>

                        {/* Botón limpiar filtros */}
                        {hayFiltrosActivos && (
                            <Button
                                size="small"
                                startIcon={<ClearIcon />}
                                onClick={limpiarFiltros}
                                sx={{ ml: 'auto' }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </Box>

                    {/* Indicador de resultados */}
                    {hayFiltrosActivos && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label={`${llamadasFiltradas.length} de ${llamadas.length} llamadas`}
                                size="small"
                                color={llamadasFiltradas.length > 0 ? 'primary' : 'default'}
                            />
                            {llamadasFiltradas.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No hay resultados con los filtros actuales
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            )}

            {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : llamadas.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <PhoneIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No hay llamadas registradas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Las llamadas realizadas por tus agentes aparecerán aquí automáticamente.
                    </Typography>
                </Paper>
            ) : llamadasFiltradas.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Sin resultados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No se encontraron llamadas con los filtros actuales.
                    </Typography>
                    <Button variant="outlined" onClick={limpiarFiltros} startIcon={<ClearIcon />}>
                        Limpiar filtros
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Duración</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Costo</TableCell>
                                <TableCell>Resumen</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {llamadasFiltradas.map((llamada) => (
                                <TableRow
                                    key={llamada.id}
                                    hover
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                    onClick={() => abrirDetalle(llamada)}
                                >
                                    <TableCell>
                                        <Tooltip title={traducirTipo(llamada.type)}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {obtenerIconoTipo(llamada.type)}
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatearFecha(llamada.createdAt)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                        >
                                            {llamada.customerNumber || '--'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {formatearDuracion(llamada.durationSeconds)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={traducirEstado(llamada.status)}
                                            size="small"
                                            color={obtenerColorEstado(llamada.status)}
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatearCosto(llamada.cost)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {llamada.summary || 'Sin resumen'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalle">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    abrirDetalle(llamada);
                                                }}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Drawer de Detalle estilo Vapi */}
            <Drawer
                anchor="right"
                open={drawerAbierto}
                onClose={cerrarDetalle}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', md: 700 },
                        bgcolor: 'background.default',
                        p: 0
                    }
                }}
            >
                {llamadaSeleccionada && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header del Drawer */}
                        <Box sx={{
                            p: 3,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {formatearFecha(llamadaSeleccionada.createdAt)}
                                        </Typography>
                                        <Chip
                                            label={traducirTipo(llamadaSeleccionada.type)}
                                            size="small"
                                            sx={{
                                                bgcolor: 'primary.dark',
                                                color: 'primary.light',
                                                fontWeight: 500
                                            }}
                                        />
                                        <Chip
                                            icon={<SmartToyIcon sx={{ fontSize: 14 }} />}
                                            label="Asistente"
                                            size="small"
                                            sx={{
                                                bgcolor: '#10B981',
                                                color: 'white',
                                                fontWeight: 500,
                                                '& .MuiChip-icon': { color: 'white' }
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        📞 Cliente: {llamadaSeleccionada.customerNumber || 'Desconocido'} · {traducirEndReason(llamadaSeleccionada.endedReason)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                            {formatearCosto(llamadaSeleccionada.cost)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatearDuracion(llamadaSeleccionada.durationSeconds)}
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={cerrarDetalle} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Navegación entre llamadas */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<NavigateBeforeIcon />}
                                    onClick={() => navegarLlamada('prev')}
                                    disabled={llamadasFiltradas.findIndex(l => l.id === llamadaSeleccionada.id) === 0}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    size="small"
                                    endIcon={<NavigateNextIcon />}
                                    onClick={() => navegarLlamada('next')}
                                    disabled={llamadasFiltradas.findIndex(l => l.id === llamadaSeleccionada.id) === llamadasFiltradas.length - 1}
                                >
                                    Siguiente
                                </Button>
                            </Box>
                        </Box>

                        {/* Reproductor de Audio */}
                        {(llamadaSeleccionada.recordingUrl || llamadaSeleccionada.stereoRecordingUrl) && (
                            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#0a0a0a' }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Recording
                                </Typography>

                                {/* Waveform Visualization */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    height: 60,
                                    mb: 2,
                                    px: 1
                                }}>
                                    {waveformData.map((altura, idx) => {
                                        const porcentajeBarra = (idx / waveformData.length) * 100;
                                        const activa = porcentajeBarra <= progreso;
                                        return (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    flex: 1,
                                                    height: `${20 + altura * 0.6}%`,
                                                    bgcolor: activa ? '#10B981' : '#27272A',
                                                    borderRadius: 0.5,
                                                    transition: 'background-color 0.1s ease'
                                                }}
                                            />
                                        );
                                    })}
                                </Box>

                                {/* Controles */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <IconButton
                                        onClick={toggleReproduccion}
                                        sx={{
                                            bgcolor: '#10B981',
                                            color: 'white',
                                            '&:hover': { bgcolor: '#059669' }
                                        }}
                                    >
                                        {reproduciendo ? <PauseIcon /> : <PlayArrowIcon />}
                                    </IconButton>

                                    <Box sx={{ flex: 1 }}>
                                        <Slider
                                            value={progreso}
                                            onChange={handleProgresoChange}
                                            sx={{
                                                color: '#10B981',
                                                '& .MuiSlider-thumb': {
                                                    width: 12,
                                                    height: 12
                                                }
                                            }}
                                        />
                                    </Box>

                                    <Typography variant="caption" sx={{ minWidth: 80, textAlign: 'center', fontFamily: 'monospace' }}>
                                        {formatearDuracion(duracionAudio * (progreso / 100))} / {formatearDuracion(duracionAudio)}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 120 }}>
                                        <VolumeUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Slider
                                            value={volumen}
                                            onChange={handleVolumenChange}
                                            size="small"
                                            sx={{ color: 'text.secondary' }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Tabs
                                value={tabActual}
                                onChange={(_, v) => setTabActual(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tab label="💬 Transcripción" />
                                <Tab label="📋 Resumen" />
                                <Tab label="💰 Costos" />
                                <Tab label="📊 Análisis" />
                            </Tabs>
                        </Box>

                        {/* Contenido de Tabs */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                            {/* Tab: Transcripción */}
                            {tabActual === 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {renderizarMensajes(llamadaSeleccionada.messages || []).map((msg, idx) => {
                                        const esAsistente = msg.rol === 'assistant' || msg.rol === 'bot';
                                        return (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: esAsistente ? 'flex-start' : 'flex-end',
                                                    maxWidth: '85%',
                                                    alignSelf: esAsistente ? 'flex-start' : 'flex-end'
                                                }}
                                            >
                                                {/* Label */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mb: 0.5,
                                                    px: 1
                                                }}>
                                                    {esAsistente ? (
                                                        <SmartToyIcon sx={{ fontSize: 14, color: '#10B981' }} />
                                                    ) : (
                                                        <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    )}
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: esAsistente ? '#10B981' : 'text.secondary'
                                                        }}
                                                    >
                                                        {esAsistente ? 'Asistente' : 'Usuario'}
                                                    </Typography>
                                                </Box>

                                                {/* Mensaje */}
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: esAsistente ? '#0F3D3E' : '#27272A',
                                                        border: '1px solid',
                                                        borderColor: esAsistente ? '#10B981' : 'divider',
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {msg.contenido}
                                                    </Typography>
                                                </Paper>

                                                {/* Timestamp */}
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.5, px: 1 }}
                                                >
                                                    {msg.timestamp}
                                                </Typography>
                                            </Box>
                                        );
                                    })}

                                    {renderizarMensajes(llamadaSeleccionada.messages || []).length === 0 && (
                                        llamadaSeleccionada.transcript ? (
                                            <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                    {llamadaSeleccionada.transcript}
                                                </Typography>
                                            </Paper>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                                No hay transcripción disponible
                                            </Typography>
                                        )
                                    )}

                                    {/* Indicador de fin de llamada */}
                                    {llamadaSeleccionada.endedReason && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                            <Chip
                                                icon={<PhoneDisabledIcon sx={{ fontSize: 16 }} />}
                                                label={traducirEndReason(llamadaSeleccionada.endedReason)}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#7C3AED20',
                                                    color: '#A78BFA',
                                                    border: '1px solid #7C3AED40'
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Tab: Resumen */}
                            {tabActual === 1 && (
                                <Stack spacing={3}>
                                    {llamadaSeleccionada.summary && (
                                        <Paper sx={{ p: 3, bgcolor: '#0F3D3E', border: '1px solid #10B981' }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#10B981' }}>
                                                📋 Resumen Inteligente
                                            </Typography>
                                            <Typography variant="body2">
                                                {llamadaSeleccionada.summary}
                                            </Typography>
                                        </Paper>
                                    )}

                                    {llamadaSeleccionada.successEvaluation && (
                                        <Paper sx={{ p: 3, bgcolor: '#1E3A2F', border: '1px solid #10B981' }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#10B981' }}>
                                                ✅ Evaluación de Éxito
                                            </Typography>
                                            <Typography variant="body2">
                                                {llamadaSeleccionada.successEvaluation}
                                            </Typography>
                                        </Paper>
                                    )}

                                    {!llamadaSeleccionada.summary && !llamadaSeleccionada.successEvaluation && (
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                            No hay resumen disponible para esta llamada
                                        </Typography>
                                    )}
                                </Stack>
                            )}

                            {/* Tab: Costos */}
                            {tabActual === 2 && (
                                <Stack spacing={2}>
                                    <Paper sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <AttachMoneyIcon sx={{ color: 'warning.main' }} />
                                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                {formatearCosto(llamadaSeleccionada.cost)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Costo total
                                            </Typography>
                                        </Box>

                                        {llamadaSeleccionada.costBreakdown && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                                    Desglose de Costos
                                                </Typography>
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableBody>
                                                            {Object.entries(llamadaSeleccionada.costBreakdown).map(([key, value]) => (
                                                                <TableRow key={key}>
                                                                    <TableCell sx={{ border: 'none', pl: 0 }}>
                                                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ border: 'none' }}>
                                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                            ${typeof value === 'number' ? (value as number).toFixed(4) : String(value)}
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        )}
                                    </Paper>
                                </Stack>
                            )}

                            {/* Tab: Análisis */}
                            {tabActual === 3 && (
                                <Stack spacing={3}>
                                    {/* Sección de Productos/Servicios Detectados */}
                                    <Paper sx={{ p: 3, border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.paper' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <AutoAwesomeIcon color="primary" />
                                            <Typography variant="subtitle1" fontWeight={600} color="primary">
                                                Productos y Servicios Detectados
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            La IA analiza la conversación para identificar qué vende este negocio.
                                        </Typography>

                                        {/* Lista de productos */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                            {productos.length > 0 ? (
                                                productos.map((prod, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={prod}
                                                        onDelete={() => handleEliminarProducto(idx)}
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 500 }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    No se han detectado productos aún.
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Input para agregar manual */}
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Agregar producto o servicio manualmente..."
                                                value={nuevoProductoInput}
                                                onChange={(e) => setNuevoProductoInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAgregarProducto()}
                                            />
                                            <Button
                                                variant="contained"
                                                onClick={handleAgregarProducto}
                                                startIcon={<AddIcon />}
                                                disabled={!nuevoProductoInput.trim()}
                                            >
                                                Agregar
                                            </Button>
                                        </Box>

                                        {/* Botón de Análisis IA */}
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleAnalizarIA}
                                            disabled={analizando}
                                            startIcon={analizando ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                                            sx={{ borderStyle: 'dashed' }}
                                        >
                                            {analizando ? 'Analizando conversación...' : 'Re-analizar con IA'}
                                        </Button>
                                    </Paper>

                                    <Paper sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                            📊 Métricas de la Llamada
                                        </Typography>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Duración</Typography>
                                                <Typography variant="h6">{formatearDuracion(llamadaSeleccionada.durationSeconds)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Tipo</Typography>
                                                <Typography variant="h6">{traducirTipo(llamadaSeleccionada.type)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Estado</Typography>
                                                <Typography variant="h6">{traducirEstado(llamadaSeleccionada.status)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Motivo de Fin</Typography>
                                                <Typography variant="body2">{traducirEndReason(llamadaSeleccionada.endedReason)}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    <Paper sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                            ⏱️ Tiempos
                                        </Typography>

                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Creada</Typography>
                                                <Typography variant="body2">{formatearFecha(llamadaSeleccionada.createdAt)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Iniciada</Typography>
                                                <Typography variant="body2">{formatearFecha(llamadaSeleccionada.startedAt)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Finalizada</Typography>
                                                <Typography variant="body2">{formatearFecha(llamadaSeleccionada.endedAt)}</Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
}
