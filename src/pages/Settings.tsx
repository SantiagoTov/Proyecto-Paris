import { useState, useEffect } from 'react';
import {
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Breadcrumbs,
    Box,
    Typography,
    Tabs,
    Tab,
    Chip,
    FormControl,
    Select,
    MenuItem,
    type SelectChangeEvent
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ChevronRight as ChevronRightIcon,
    Notes as NotesIcon,
    Numbers as NumbersIcon,
    ToggleOn as ToggleOnIcon,
    CalendarToday as CalendarTodayIcon,
    CalendarMonth as CalendarMonthIcon,
    Label as LabelIcon,
    Style as StyleIcon,
    AutoAwesome as AutoAwesomeIcon,
    Description as DescriptionIcon,
    Savings as SavingsIcon,
    Email as EmailIcon,
    Language as LanguageIcon,
    Phone as PhoneIcon,
    AccountCircle as AccountCircleIcon,
    Map as MapIcon,
    FlagOutlined as FlagIcon,
    Settings as SettingsIcon,
    NavigateNext as NavigateNextIcon,
    Person as PersonIcon,
    Tune as TuneIcon,
    Public as PublicIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import PhoneVerification from '../components/PhoneVerification';

interface CustomField {
    key: string;
    label: string;
    type: string;
}

interface LeadStage {
    id: string;
    name: string;
    label: string;
    color: string;
    order_index: number;
}

const FIELD_TYPES = [
    { id: 'text', label: 'Texto', icon: <NotesIcon />, description: 'Texto simple o largo' },
    { id: 'number', label: 'Número', icon: <NumbersIcon />, description: 'Valores numéricos' },
    { id: 'boolean', label: 'Verdadero/Falso', icon: <ToggleOnIcon />, description: 'SÍ / NO' },
    { id: 'date', label: 'Fecha', icon: <CalendarTodayIcon />, description: 'Solo fecha' },
    { id: 'datetime', label: 'Fecha y Hora', icon: <CalendarMonthIcon />, description: 'Marca de tiempo' },
    { id: 'select', label: 'Selección Única', icon: <LabelIcon />, description: 'Lista de opciones' },
    { id: 'multi_select', label: 'Multi-selección', icon: <StyleIcon />, description: 'Varias opciones' },
    { id: 'rating', label: 'Calificación', icon: <AutoAwesomeIcon />, description: 'Estrellas' },
    { id: 'file', label: 'Archivos', icon: <DescriptionIcon />, description: 'Nube de archivos' },
    { id: 'currency', label: 'Moneda', icon: <SavingsIcon />, description: 'Divisas' },
    { id: 'email', label: 'Email', icon: <EmailIcon />, description: 'Correo electrónico' },
    { id: 'url', label: 'Sitio Web', icon: <LanguageIcon />, description: 'Enlace web' },
    { id: 'phone', label: 'Teléfono', icon: <PhoneIcon />, description: 'Número telefónico' },
    { id: 'full_name', label: 'Nombre Completo', icon: <AccountCircleIcon />, description: 'Nombre y Apellido' },
    { id: 'address', label: 'Dirección', icon: <MapIcon />, description: 'Mapa y texto' },
];

export default function Settings() {
    const [tabValue, setTabValue] = useState(0);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [stages, setStages] = useState<LeadStage[]>([]);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [saving, setSaving] = useState(false);

    // Dialog states
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [fieldNameDialogOpen, setFieldNameDialogOpen] = useState(false);
    const [selectedFieldType, setSelectedFieldType] = useState('text');
    const [newFieldName, setNewFieldName] = useState('');

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Stages
        const { data: stagesData } = await supabase.from('lead_stages').select('*').order('order_index');
        if (stagesData) setStages(stagesData);

        // Fetch Config (Custom Fields)
        const { data: configData } = await supabase
            .from('user_table_config')
            .select('*')
            .eq('table_name', 'leads')
            .eq('user_id', user.id)
            .maybeSingle();

        if (configData?.custom_fields) {
            setCustomFields(configData.custom_fields);
        }

        // Fetch General Settings (Timezone)
        const { data: generalSettings } = await supabase
            .from('user_table_config')
            .select('*')
            .eq('table_name', 'general_settings')
            .eq('user_id', user.id)
            .maybeSingle();

        if (generalSettings?.metadata?.timezone) {
            setTimezone(generalSettings.metadata.timezone);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddField = () => {
        setTypeSelectorOpen(true);
    };

    const handleConfirmAddField = async () => {
        if (!newFieldName) return;
        const key = newFieldName.toLowerCase().replace(/\s+/g, '_');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newField: CustomField = {
            key,
            label: newFieldName,
            type: selectedFieldType
        };

        const updatedFields = [...customFields, newField];

        // Update DB
        await supabase.from('user_table_config').upsert({
            user_id: user.id,
            table_name: 'leads',
            custom_fields: updatedFields,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,table_name' });

        setCustomFields(updatedFields);
        setNewFieldName('');
        setFieldNameDialogOpen(false);
        setTypeSelectorOpen(false);
    };

    const handleDeleteField = async (key: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updatedFields = customFields.filter(f => f.key !== key);

        await supabase.from('user_table_config').upsert({
            user_id: user.id,
            table_name: 'leads',
            custom_fields: updatedFields,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,table_name' });

        setCustomFields(updatedFields);
    };

    const handleSaveGeneralSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setSaving(true);
        await supabase.from('user_table_config').upsert({
            user_id: user.id,
            table_name: 'general_settings',
            metadata: { timezone },
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,table_name' });
        setSaving(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Header / Breadcrumbs */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1, color: 'text.secondary' }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SettingsIcon fontSize="inherit" /> Sistema
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight="bold">Configuración</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="800" gutterBottom>
                    Configuración
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Administra tu cuenta, verificaciones y modelo de datos.
                </Typography>
            </Box>

            <Paper sx={{
                bgcolor: 'background.paper',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{
                        px: 3,
                        pt: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            py: 2,
                            px: 3,
                            gap: 1
                        }
                    }}
                >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Números Telefónicos" />
                    <Tab icon={<TuneIcon />} iconPosition="start" label="Campos Personalizados" />
                    <Tab icon={<FlagIcon />} iconPosition="start" label="Etapas del Pipeline" />
                    <Tab icon={<PublicIcon />} iconPosition="start" label="General / Regional" />
                </Tabs>

                <Box sx={{ p: 4, minHeight: 400 }}>
                    {/* TAB 0: PHONE VERIFICATION */}
                    {tabValue === 0 && (
                        <Box>
                            <PhoneVerification />
                        </Box>
                    )}

                    {/* TAB 1: CUSTOM FIELDS */}
                    {tabValue === 1 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Campos Personalizados</Typography>
                                    <Typography variant="body2" color="text.secondary">Define la información adicional que quieres guardar de tus prospectos.</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddField}
                                    sx={{ borderRadius: 2, px: 3 }}
                                >
                                    Nuevo Campo
                                </Button>
                            </Box>

                            <Grid container spacing={2}>
                                {customFields.length === 0 ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <Typography variant="body1" color="text.secondary">Aún no has creado campos personalizados para tus prospectos.</Typography>
                                        </Box>
                                    </Grid>
                                ) : (
                                    customFields.map((field) => {
                                        const typeInfo = FIELD_TYPES.find(t => t.id === field.type) || FIELD_TYPES[0];
                                        return (
                                            <Grid size={{ xs: 12 }} key={field.key}>
                                                <Paper sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    bgcolor: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: 3,
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'primary.main' },
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(124, 58, 237, 0.1)',
                                                        color: 'primary.light',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {typeInfo.icon}
                                                    </Box>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">{field.label}</Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {typeInfo.label} • Key: {field.key}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton color="error" size="small" onClick={() => handleDeleteField(field.key)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Paper>
                                            </Grid>
                                        );
                                    })
                                )}
                            </Grid>
                        </Box>
                    )}

                    {/* TAB 2: STAGES */}
                    {tabValue === 2 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Canales y Estados</Typography>
                                    <Typography variant="body2" color="text.secondary">Configura las fases por las que pasan tus prospectos.</Typography>
                                </Box>
                                <Button variant="outlined" startIcon={<AddIcon />} disabled sx={{ borderRadius: 2 }}>Nueva Etapa</Button>
                            </Box>

                            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {stages.map((stage) => (
                                    <ListItem key={stage.id} sx={{
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        borderRadius: 3,
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <ListItemIcon>
                                            <FlagIcon sx={{ color: stage.color === 'default' ? 'text.secondary' : `${stage.color}.main` }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={stage.label}
                                            secondary={`Identificador: ${stage.name}`}
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                        />
                                        <Chip label="Activo" size="small" variant="outlined" sx={{ color: 'success.main', borderColor: 'success.main' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    {/* TAB 3: GENERAL SETTINGS */}
                    {tabValue === 3 && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Configuración Regional</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                Ajusta la zona horaria para que tus tareas y llamadas se programen correctamente.
                            </Typography>

                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Zona Horaria</Typography>
                                        <FormControl fullWidth>
                                            <Select
                                                value={timezone}
                                                onChange={(e: SelectChangeEvent) => setTimezone(e.target.value)}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <MenuItem value="America/Bogota">Bogotá, Colombia (GMT-5)</MenuItem>
                                                <MenuItem value="America/Mexico_City">Ciudad de México (GMT-6)</MenuItem>
                                                <MenuItem value="America/Buenos_Aires">Buenos Aires, Argentina (GMT-3)</MenuItem>
                                                <MenuItem value="America/Santiago">Santiago, Chile (GMT-4)</MenuItem>
                                                <MenuItem value="America/Lima">Lima, Perú (GMT-5)</MenuItem>
                                                <MenuItem value="America/New_York">New York, USA (GMT-5)</MenuItem>
                                                <MenuItem value="Europe/Madrid">Madrid, España (GMT+1)</MenuItem>
                                                {!["America/Bogota", "America/Mexico_City", "America/Buenos_Aires", "America/Santiago", "America/Lima", "America/New_York", "Europe/Madrid"].includes(timezone) && (
                                                    <MenuItem value={timezone}>{timezone} (Detectada)</MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            La hora actual en esta zona es: {new Date().toLocaleTimeString('es-CO', { timeZone: timezone })}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveGeneralSettings}
                                            disabled={saving}
                                            sx={{ mt: 3, borderRadius: 2 }}
                                        >
                                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Dialog
                open={typeSelectorOpen}
                onClose={() => setTypeSelectorOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 4, bgcolor: '#0a0a0a', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}
            >
                <DialogTitle sx={{ pb: 1, pt: 4, px: 4 }}>
                    <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>Seleccionar Tipo de Dato</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Elige el formato de información para este campo.</Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 4 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {FIELD_TYPES.map((type) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={type.id}>
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        setSelectedFieldType(type.id);
                                        setTypeSelectorOpen(false);
                                        setFieldNameDialogOpen(true);
                                    }}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        textTransform: 'none',
                                        color: 'white',
                                        textAlign: 'left',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.light',
                                            bgcolor: 'rgba(124, 58, 237, 0.15)',
                                            borderRadius: 2,
                                            p: 1.25,
                                            minWidth: 44,
                                            height: 44
                                        }}>
                                            {type.icon}
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" fontWeight="700" color="white">
                                                {type.label}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                                                {type.description}
                                            </Typography>
                                        </Box>
                                        <ChevronRightIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.2)' }} />
                                    </Box>
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
            </Dialog>

            <Dialog open={fieldNameDialogOpen} onClose={() => setFieldNameDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nombre del Campo</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Escribe el nombre para tu nuevo campo de tipo <b>{FIELD_TYPES.find(t => t.id === selectedFieldType)?.label}</b>.
                    </Typography>
                    <TextField
                        fullWidth
                        autoFocus
                        label="Nombre del campo"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleConfirmAddField()}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setFieldNameDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleConfirmAddField} disabled={!newFieldName} sx={{ borderRadius: 2, px: 3 }}>
                        Finalizar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
