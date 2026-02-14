
import { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, TextField, Paper, Avatar, Grid, Card, CardActionArea, Chip, IconButton, CircularProgress, Skeleton, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, InputAdornment, Snackbar, Alert, Fade } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

const steps = ['Datos del Agente', 'Productos y Servicios', 'Revisión'];

export default function AgentWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Mensajes dinámicos para el análisis
    const [analysisMessage, setAnalysisMessage] = useState('Analizando contexto...');
    const analysisSteps = [
        'Leyendo documentos base...',
        'Identificando productos clave...',
        'Estructurando servicios...',
        'Finalizando extracción...'
    ];

    // Estado para las voces cargadas dinámicamente
    const [availableVoices, setAvailableVoices] = useState<any[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(true);

    // Cargar voces al montar
    useEffect(() => {
        const fetchVoices = async () => {
            const targetVoiceId = 'b2htR0pMe28pYwCY9gnP';
            try {
                const { data, error } = await supabase.functions.invoke('get-voices');
                if (error) throw error;

                // Filtrar para mostrar SOLO la voz solicitada
                const filteredVoices = (data || []).filter((v: any) => v.id === targetVoiceId);

                // Si la API no devuelve la voz específica, usar el fallback manual para asegurar que aparezca
                if (filteredVoices.length === 0) {
                    setAvailableVoices([{
                        id: 'b2htR0pMe28pYwCY9gnP',
                        name: 'Guido - ElevenLabs',
                        description: 'Voz personalizada solicitada.',
                        gender: 'Masculino',
                        provider: 'elevenlabs',
                        accent: 'Latino',
                        tags: ['Premium', 'Solicitada'],
                        previewUrl: null
                    }]);
                } else {
                    setAvailableVoices(filteredVoices);
                }
            } catch (err) {
                console.error("Error fetching voices:", err);
                // Fallback a ÚNICAMENTE la voz solicitada
                setAvailableVoices([
                    {
                        id: 'b2htR0pMe28pYwCY9gnP',
                        name: 'Guido - ElevenLabs',
                        description: 'Voz personalizada solicitada.',
                        gender: 'Masculino',
                        provider: 'elevenlabs',
                        accent: 'Latino',
                        tags: ['Premium', 'Solicitada'],
                        previewUrl: null
                    }
                ]);
                setLoadingVoices(false);
            }
        };

        fetchVoices();
    }, []);

    // Estado para el audio
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [loadingVoice, setLoadingVoice] = useState<string | null>(null);

    // Estado para Análisis de Conocimiento
    const [files, setFiles] = useState<File[]>([]);
    const [urls, setUrls] = useState<string[]>([]);
    const [currentUrl, setCurrentUrl] = useState('');
    const [products, setProducts] = useState<{ id: string, name: string, description: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', description: '' });


    const playPreview = async (voice: any) => {
        if (audioPlayer) {
            audioPlayer.pause();
            setAudioPlayer(null);
        }

        if (playingVoice === voice.id) {
            setPlayingVoice(null); // Stop if clicking same
            return;
        }

        setLoadingVoice(voice.id);

        try {
            let audioUrl = voice.previewUrl;

            // Override for specific voice to use static file
            if (voice.id === 'b2htR0pMe28pYwCY9gnP') {
                audioUrl = '/sofia_preview.mp3';
            }
            // Si no hay URL predefinida (Cartesia) y no es la voz custom, generamos una muestra al vuelo
            else if (!audioUrl) {
                const isCartesia = voice.provider === 'cartesia';
                const endpoint = isCartesia ? 'test-cartesia' : 'test-voice';
                const text = `Hola, soy ${voice.name.split(' -')[0]}. ¿Cómo puedo ayudarte hoy?`;

                console.log(`Generando preview para ${voice.name}...`);

                const { data, error } = await supabase.functions.invoke(endpoint, {
                    body: { text, voice_id: voice.id },
                });

                if (error) throw error;

                // Crear URL del blob recibido
                if (data instanceof Blob) {
                    audioUrl = URL.createObjectURL(data);
                } else {
                    const blob = new Blob([data], { type: 'audio/mpeg' });
                    audioUrl = URL.createObjectURL(blob);
                }
            }

            const audio = new Audio(audioUrl);
            audio.onended = () => setPlayingVoice(null);
            await audio.play();
            setAudioPlayer(audio);
            setPlayingVoice(voice.id);
        } catch (e) {
            console.error("Error playing preview:", e);
            alert("No se pudo reproducir la demo. Verifica tu conexión o intenta más tarde.");
        } finally {
            setLoadingVoice(null);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone_number: '', // Opcional por ahora
        gender: 'Masculino',
        accent: 'Latino',
        voice_id: 'b2htR0pMe28pYwCY9gnP', // Voz Guido por defecto
        instructions: '',
        company_info: '',
    });


    const handleNext = async () => {
        // 1. Validaciones Previas
        if (activeStep === 0) {
            if (!formData.name || !formData.role || !formData.instructions) {
                setSnackbar({ open: true, message: 'Por favor completa los campos obligatorios.', severity: 'error' });
                return;
            }
        }

        // 2. Lógica de Finalización (Último Paso)
        if (activeStep === steps.length - 1) {
            if (!user) return setSnackbar({ open: true, message: 'No estás autenticado', severity: 'error' });

            setLoading(true);

            const productsText = products.map(p => `- ${p.name}: ${p.description}`).join('\n');
            const enrichedInstructions = `${formData.instructions}\n\nProductos/Servicios:\n${productsText}`;

            const payload = {
                user_id: user.id,
                name: formData.name,
                role: formData.role,
                phone_number: formData.phone_number,
                gender: formData.gender,
                accent: formData.accent,
                voice_id: formData.voice_id,
                instructions: enrichedInstructions,
                company_info: formData.company_info,
                target_config: {
                    lat: 0,
                    lng: 0,
                    radius_km: 0,
                    keyword: ""
                },
                status: 'active'
            };

            try {
                const { error } = await supabase.from('agents').insert(payload);
                if (error) throw error;
                setSnackbar({ open: true, message: '¡Agente Creado Exitosamente!', severity: 'success' });
                setTimeout(() => navigate('/'), 1500);
            } catch (e: any) {
                console.error(e);
                setSnackbar({ open: true, message: `Error al crear agente: ${e.message}`, severity: 'error' });
            } finally {
                setLoading(false);
            }
        }
        // 3. Lógica de Transición (Pasos Intermedios)
        else {
            const currentStep = activeStep;
            setActiveStep((prev) => prev + 1);

            // Si avanzamos desde el paso 0 (Datos) al 1 (Productos), iniciar análisis
            if (currentStep === 0) {
                setIsAnalyzing(true);

                // Función auxiliar para extraer productos localmente (A prueba de fallos)
                const analyzeLocal = (text: string) => {
                    const extracted: any[] = [];
                    const lines = text.split(/\r?\n/);
                    let currentId = 1;

                    lines.forEach(line => {
                        const trimmed = line.trim();
                        if (!trimmed) return;
                        const match = trimmed.match(/^(\d+[\.)]|\*|-|•)?\s*([A-Za-z0-9\sÁÉÍÓÚáéíóúÑñ&"'-]+?)(:| - |–)(.*)$/);
                        if (match && match[2] && match[4]) {
                            extracted.push({
                                id: String(Date.now() + currentId++),
                                name: match[2].trim(),
                                description: match[4].trim()
                            });
                        } else if (/^(\d+[\.)])\s+(.+)$/.test(trimmed)) {
                            const parts = trimmed.match(/^(\d+[\.)])\s+(.+)$/);
                            if (parts && parts[2]) {
                                const content = parts[2];
                                let name = content;
                                let desc = "Producto clave detectado.";
                                if (content.includes(':')) {
                                    const split = content.split(':');
                                    name = split[0].trim();
                                    desc = split.slice(1).join(':').trim();
                                } else if (content.includes(' - ')) {
                                    const split = content.split(' - ');
                                    name = split[0].trim();
                                    desc = split[1].trim();
                                }
                                extracted.push({ id: String(Date.now() + currentId++), name, description: desc });
                            }
                        }
                    });

                    if (extracted.length === 0) {
                        if (text.toLowerCase().includes('crm')) extracted.push({ id: 'def1', name: 'CRM Integrado', description: 'Sistema de gestión de clientes.' });
                        if (text.toLowerCase().includes('radar')) extracted.push({ id: 'def2', name: 'Radar de Prospectos', description: 'Búsqueda geopolítica de clientes.' });
                        if (text.toLowerCase().includes('agente')) extracted.push({ id: 'def3', name: 'Agentes IA', description: 'Automatización de llamadas y ventas.' });
                    }
                    return extracted;
                };

                try {
                    // Simulación de pasos visuales
                    let stepIdx = 0;
                    const interval = setInterval(() => {
                        if (stepIdx < analysisSteps.length) {
                            setAnalysisMessage(analysisSteps[stepIdx]);
                            stepIdx++;
                        }
                    }, 1200);

                    // Intento 1: Llamada a la IA (Backend)
                    let aiSuccess = false;
                    try {
                        const { data, error } = await supabase.functions.invoke('analyze-knowledge', {
                            body: {
                                text: formData.instructions,
                                files: [], // Ignoramos archivos por ahora para velocidad
                                urls: urls
                            }
                        });

                        clearInterval(interval);

                        if (!error && data?.products && Array.isArray(data.products) && data.products.length > 0) {
                            setProducts(data.products);
                            aiSuccess = true;
                        }
                    } catch (ignore) {
                        clearInterval(interval);
                        console.warn("Backend AI failed, switching to local analysis.");
                    }

                    // Intento 2: Fallback Local
                    if (!aiSuccess) {
                        const localProducts = analyzeLocal(formData.instructions);
                        if (localProducts.length > 0) {
                            setProducts(localProducts);
                        } else {
                            setProducts([{ id: '1', name: 'Producto Principal', description: 'Describe aquí tu producto o servicio.' }]);
                        }
                    }

                    setSnackbar({ open: true, message: 'Análisis completado con éxito', severity: 'success' });

                } catch (err) {
                    console.error("Critical error in analysis:", err);
                    setSnackbar({ open: true, message: 'Error durante el análisis.', severity: 'error' });
                    setProducts([{ id: 'err', name: 'Servicio General', description: 'Servicio detectado.' }]);
                } finally {
                    setIsAnalyzing(false);
                }
            }
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            variant="outlined"
                            label="Nombre del Agente"
                            fullWidth
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            helperText="Ej. Agente de Ventas Junior"
                        />
                        <TextField
                            variant="outlined"
                            label="Rol (Persona)"
                            fullWidth
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            helperText="Ej. Vendedor experto en seguros de vida"
                        />
                        {/* Lista de Voces Unificada */}
                        <Typography variant="subtitle2" gutterBottom>Selecciona la Voz del Agente</Typography>
                        <Grid container spacing={2}>
                            {loadingVoices ? (
                                // Skeletons loading state
                                Array.from(new Array(4)).map((_, idx) => (
                                    <Grid size={12} key={idx}>
                                        <Card variant="outlined">
                                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Skeleton variant="circular" width={56} height={56} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Skeleton variant="text" width="60%" height={32} />
                                                    <Skeleton variant="text" width="40%" height={24} />
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                availableVoices.map((voice) => {
                                    const isSelected = formData.voice_id === voice.id;
                                    const isPlaying = playingVoice === voice.id;

                                    return (
                                        <Grid size={12} key={voice.id}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                                    borderWidth: isSelected ? 2 : 1,
                                                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: 2
                                                    }
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            voice_id: voice.id,
                                                            gender: voice.gender || 'Femenino',
                                                            accent: voice.accent || 'Neutro'
                                                        });

                                                    }}
                                                    sx={{ p: 2 }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        {/* Avatar */}
                                                        <Avatar
                                                            src={`https://api.dicebear.com/7.x/personas/svg?seed=${voice.name}&backgroundColor=${voice.gender === 'Femenino' ? 'EC4899' : '3B82F6'}`}
                                                            sx={{ width: 56, height: 56, border: '2px solid', borderColor: isSelected ? 'primary.main' : 'divider' }}
                                                        />

                                                        {/* Info */}
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                <Typography variant="subtitle1" fontWeight={600}>
                                                                    {voice.name}
                                                                </Typography>
                                                                {isSelected && (
                                                                    <Chip label="Seleccionada" color="primary" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                )}
                                                            </Box>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {voice.description}
                                                            </Typography>

                                                            {/* Tags */}
                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                <Chip
                                                                    label={voice.provider === 'elevenlabs' ? 'ElevenLabs' : 'Cartesia'}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.7rem',
                                                                        borderColor: voice.provider === 'elevenlabs' ? 'grey.300' : 'info.light',
                                                                        color: voice.provider === 'elevenlabs' ? 'text.secondary' : 'info.main',
                                                                        bgcolor: voice.provider === 'cartesia' ? 'info.50' : 'transparent'
                                                                    }}
                                                                />
                                                                {voice.gender && <Chip label={voice.gender} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                                                {voice.accent && <Chip label={voice.accent} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                                                {voice.tags?.map((tag: string) => (
                                                                    <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'action.selected' }} />
                                                                ))}
                                                            </Box>
                                                        </Box>

                                                        {/* Play Preview Button */}
                                                        <IconButton
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                playPreview(voice);
                                                            }}
                                                            disabled={loadingVoice === voice.id}
                                                            color={isPlaying ? 'primary' : 'default'}
                                                            sx={{
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                bgcolor: isPlaying ? 'primary.main' : 'background.paper',
                                                                color: isPlaying ? 'white' : 'text.primary',
                                                                '&:hover': {
                                                                    bgcolor: isPlaying ? 'primary.dark' : 'action.hover'
                                                                }
                                                            }}
                                                        >
                                                            {loadingVoice === voice.id ? (
                                                                <CircularProgress size={24} color="inherit" />
                                                            ) : isPlaying ? (
                                                                <StopIcon />
                                                            ) : (
                                                                <PlayArrowIcon />
                                                            )}
                                                        </IconButton>
                                                    </Box>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    )
                                }))}
                        </Grid>






                        <TextField
                            variant="outlined"
                            label="Describe tu empresa, productos y/o servicios"
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.instructions}
                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                            helperText="Instrucciones específicas sobre cómo debe comportarse el agente. Ej: 'Sé amable pero directo. Enfócate en los beneficios del producto.'"
                        />

                        {/* File Upload Section */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Base de Conocimiento (Archivos)
                            </Typography>
                            <Box sx={{ border: '1px dashed #ccc', borderRadius: 1, p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                <input
                                    accept=".pdf,.doc,.docx,.txt"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    multiple
                                    type="file"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFiles([...files, ...Array.from(e.target.files)]);
                                        }
                                    }}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                                        Subir Archivos
                                    </Button>
                                </label>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Soporta PDF, DOC, TXT (Max 5MB)
                                </Typography>
                            </Box>
                            {files.length > 0 && (
                                <List dense>
                                    {files.map((file, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" aria-label="delete" onClick={() => {
                                                    const newFiles = [...files];
                                                    newFiles.splice(index, 1);
                                                    setFiles(newFiles);
                                                }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>

                        {/* URL Input Section */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Enlaces Web (Productos/Servicios)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="https://ejemplo.com/productos"
                                    value={currentUrl}
                                    onChange={(e) => setCurrentUrl(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LinkIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        if (currentUrl && !urls.includes(currentUrl)) {
                                            setUrls([...urls, currentUrl]);
                                            setCurrentUrl('');
                                        }
                                    }}
                                >
                                    Añadir
                                </Button>
                            </Box>
                            {urls.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {urls.map((url, index) => (
                                        <Chip
                                            key={index}
                                            label={url}
                                            onDelete={() => {
                                                const newUrls = [...urls];
                                                newUrls.splice(index, 1);
                                                setUrls(newUrls);
                                            }}
                                            deleteIcon={<DeleteIcon />}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box >
                );
            case 1:
                if (isAnalyzing) {
                    return (
                        <Fade in={true}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                                <CircularProgress size={80} thickness={2} sx={{ mb: 4 }} />
                                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {analysisMessage}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center', maxWidth: 400 }}>
                                    Estamos utilizando inteligencia artificial para extraer los detalles más importantes de tu negocio.
                                </Typography>
                            </Box>
                        </Fade>
                    );
                }

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Productos y Servicios Detectados
                        </Typography>
                        <List>
                            {products.map((product, index) => (
                                <Paper variant="outlined" sx={{ mb: 2 }} key={index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={product.name}
                                            secondary={product.description}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }} onClick={() => {
                                                setNewProduct({ name: product.name, description: product.description });
                                                const newProducts = [...products];
                                                newProducts.splice(index, 1);
                                                setProducts(newProducts);
                                            }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton edge="end" aria-label="delete" onClick={() => {
                                                const newProducts = [...products];
                                                newProducts.splice(index, 1);
                                                setProducts(newProducts);
                                            }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2">Agregar Nuevo Item</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Nombre"
                                    fullWidth
                                    size="small"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Descripción"
                                    fullWidth
                                    size="small"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    disabled={!newProduct.name}
                                    onClick={() => {
                                        setProducts([...products, { ...newProduct, id: Date.now().toString() }]);
                                        setNewProduct({ name: '', description: '' });
                                    }}
                                >
                                    Agregar
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">Resumen del Agente</Typography>
                        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                                    <Typography variant="body1" fontWeight="bold">{formData.name || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Rol</Typography>
                                    <Typography variant="body1">{formData.role || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Voz Seleccionada</Typography>
                                    <Typography variant="body1">{formData.gender} - {formData.accent}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Especialidad</Typography>
                                    <Typography variant="body1">IA entrenada con {products.length} productos/servicios</Typography>
                                </Box>
                            </Box>
                        </Paper>
                        <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                            Nota: La zona de búsqueda se configura ahora desde la sección de Radar.
                        </Typography>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 2 }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
                Crear Nuevo Agente
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 5 }} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box>
                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Atrás
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ px: 4 }}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : activeStep === steps.length - 1 ? 'Crear Agente' : 'Continuar'}
                    </Button>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
}
