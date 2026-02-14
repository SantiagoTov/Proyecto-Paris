import { useState, useEffect, useMemo } from 'react';
import {
    DataGrid,
    type GridColDef,
    GridToolbarContainer,
    GridToolbarExport,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import {
    Paper,
    Typography,
    Box,
    Chip,
    Avatar,
    IconButton,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Divider,
    Grid,
    FormControl,
    InputLabel,
    Select,
    ListItemIcon,
    Checkbox,
    type SelectChangeEvent,
    Portal,
    Tooltip
} from '@mui/material';
import LeadDetailDialog from './LeadDetailDialog';
import { supabase } from '../lib/supabaseClient';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import MapIcon from '@mui/icons-material/Map';
import CategoryIcon from '@mui/icons-material/Category';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TerminalIcon from '@mui/icons-material/Terminal';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LanguageIcon from '@mui/icons-material/Language';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import NumbersIcon from '@mui/icons-material/Numbers';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LabelIcon from '@mui/icons-material/Label';
import StyleIcon from '@mui/icons-material/Style';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotesIcon from '@mui/icons-material/Notes';

interface LeadStage {
    id: string;
    name: string;
    label: string;
    color: string;
    order_index: number;
}

interface CustomField {
    key: string;
    label: string;
    type: string;
}
interface CustomToolbarProps {
    selectedRows: any[];
    onOpenColumnManager: () => void;
    onNewLead: () => void;
}

function CustomToolbar({
    onOpenColumnManager,
    onNewLead,
    selectedRows
}: CustomToolbarProps) {
    return (
        <GridToolbarContainer sx={{
            p: 2,
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            minHeight: 64,
            bgcolor: selectedRows.length > 0 ? 'rgba(124, 58, 237, 0.05)' : 'transparent'
        }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: '100%' }}>
                {selectedRows.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, animation: 'fadeIn 0.3s' }}>
                        <Chip
                            label={selectedRows.length}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 'bold', mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            contactos seleccionados
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 2, height: 20 }} />
                    </Box>
                )}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onNewLead}
                    sx={{
                        borderRadius: 2.5,
                        px: 3,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                        '&:hover': { boxShadow: '0 6px 16px rgba(124, 58, 237, 0.4)' }
                    }}
                >
                    Nuevo Contacto
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <Button
                    startIcon={<ViewColumnIcon />}
                    onClick={onOpenColumnManager}
                    sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                    Columnas
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <GridToolbarExport
                    csvOptions={{ fileName: 'paris_leads_export' }}
                />
            </Box>
        </GridToolbarContainer>
    );
}

// Helper para colores de avatar
const stringToColor = (string: string) => {
    if (!string) return '#000000';
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
};

// Helper para iniciales
const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function BulkActionDock({
    selectedRows,
    onBulkDelete,
    onBulkStatusChange,
    onBulkAgentAssign,
    onBulkRatingUpdate,
    onBulkCategoryUpdate,
    onClearSelection,
    onSync,
    stages,
    agents,
    isSyncing
}: any) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [agentAnchorEl, setAgentAnchorEl] = useState<null | HTMLElement>(null);
    const [ratingAnchorEl, setRatingAnchorEl] = useState<null | HTMLElement>(null);

    if (selectedRows.length === 0) return null;

    return (
        <Portal>
            <Box sx={{
                position: 'fixed',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: '50px',
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(124, 58, 237, 0.5)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(124, 58, 237, 0.2)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                        {selectedRows.length} contactos seleccionados
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.2)' }} />

                <Tooltip title="Asignar Agente">
                    <Button
                        variant="text"
                        startIcon={<SupportAgentIcon />}
                        onClick={(e) => setAgentAnchorEl(e.currentTarget)}
                        sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, textTransform: 'none', borderRadius: 10 }}
                    >
                        Asignar Asesor
                    </Button>
                </Tooltip>

                <Tooltip title="Cambiar Etapa">
                    <Button
                        variant="text"
                        startIcon={<FlagOutlinedIcon />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, textTransform: 'none', borderRadius: 10 }}
                    >
                        Cambiar de Etapa
                    </Button>
                </Tooltip>

                <Tooltip title="Eliminar">
                    <IconButton
                        color="error"
                        onClick={onBulkDelete}
                        sx={{ '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' } }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.2)' }} />

                <IconButton onClick={onClearSelection} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
                    <CloseIcon />
                </IconButton>

                {/* Menú Etapas */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { borderRadius: 3, mt: -1, minWidth: 200 } }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {stages.map((s: any) => (
                        <MenuItem key={s.id} onClick={() => { onBulkStatusChange(s.name); setAnchorEl(null); }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.color || 'grey.500', mr: 2 }} />
                            {s.label}
                        </MenuItem>
                    ))}
                </Menu>

                {/* Menú Agentes */}
                <Menu
                    anchorEl={agentAnchorEl}
                    open={Boolean(agentAnchorEl)}
                    onClose={() => setAgentAnchorEl(null)}
                    PaperProps={{ sx: { borderRadius: 3, mt: -1, minWidth: 220 } }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <MenuItem onClick={() => { onBulkAgentAssign(''); setAgentAnchorEl(null); }}>Sin asignar</MenuItem>
                    {agents.map((agent: any) => (
                        <MenuItem key={agent.id} onClick={() => { onBulkAgentAssign(agent.id); setAgentAnchorEl(null); }}>
                            <ListItemIcon>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: stringToColor(agent.name) }}>{getInitials(agent.name)}</Avatar>
                            </ListItemIcon>
                            <ListItemText>{agent.name}</ListItemText>
                        </MenuItem>
                    ))}
                </Menu>

                {/* Menú Rating */}
                <Menu
                    anchorEl={ratingAnchorEl}
                    open={Boolean(ratingAnchorEl)}
                    onClose={() => setRatingAnchorEl(null)}
                    PaperProps={{ sx: { borderRadius: 3, mt: -1, minWidth: 160 } }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {[5, 4, 3, 2, 1, 0].map((star) => (
                        <MenuItem key={star} onClick={() => { onBulkRatingUpdate(star); setRatingAnchorEl(null); }}>
                            <StarOutlineIcon sx={{ mr: 1, color: star > 0 ? '#FFB800' : 'text.disabled', fontSize: 18 }} />
                            {star > 0 ? `${star} Estrellas` : 'Sin calificación'}
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </Portal>
    );
}


function SupportAgentSelect({ defaultValue }: { defaultValue: string }) {
    const [agents, setAgents] = useState<any[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            setLoadingAgents(true);
            const { data } = await supabase.from('agents').select('id, name').is('deleted_at', null);
            if (data) setAgents(data);
            setLoadingAgents(false);
        };
        fetchAgents();
    }, []);

    return (
        <FormControl fullWidth size="small">
            <InputLabel id="agent-select-label">Asesor Asignado</InputLabel>
            <Select
                labelId="agent-select-label"
                id="form-agent"
                label="Asesor Asignado"
                defaultValue={defaultValue || ''}
            >
                {loadingAgents ? (
                    <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Cargando asesores...</MenuItem>
                ) : (
                    agents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                            <ListItemIcon>
                                <Avatar
                                    sx={{
                                        width: 24, height: 24, fontSize: '0.7rem',
                                        bgcolor: stringToColor(agent.name)
                                    }}
                                >
                                    {getInitials(agent.name)}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>{agent.name}</ListItemText>
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>
    );
}

export default function LeadTable() {
    const [leads, setLeads] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [stages, setStages] = useState<LeadStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTab, setCurrentTab] = useState('all');
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ el: HTMLElement, id: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [columnManagerOpen, setColumnManagerOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['title', 'status', 'phone_number', 'email', 'owner_name', 'agent_assigned', 'country', 'city']);
    const [columnOrder, setColumnOrder] = useState<string[]>(['title', 'status', 'phone_number', 'email', 'address', 'category', 'owner_name', 'agent_assigned', 'country', 'city', 'rating', 'website', 'created_at']);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [leadFormOpen, setLeadFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<any>(null);
    const [newFieldName, setNewFieldName] = useState('');
    const [newStageName, setNewStageName] = useState('');
    const [newStageId, setNewStageId] = useState('');
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [addColumnAnchor, setAddColumnAnchor] = useState<null | HTMLElement>(null);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [reallocationOpen, setReallocationOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<LeadStage | null>(null);
    const [targetStageName, setTargetStageName] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedLeadDetail, setSelectedLeadDetail] = useState<any>(null);
    const [colorMenuAnchor, setColorMenuAnchor] = useState<{ el: HTMLElement, stageId: string } | null>(null);
    const [draggingColumnIndex, setDraggingColumnIndex] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [fieldNameDialogOpen, setFieldNameDialogOpen] = useState(false);
    const [selectedFieldType, setSelectedFieldType] = useState('text');

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

    const COLUMN_ICONS: Record<string, any> = {
        title: <BusinessIcon fontSize="small" />,
        status: <FlagOutlinedIcon fontSize="small" />,
        phone_number: <PhoneIcon fontSize="small" />,
        email: <EmailIcon fontSize="small" />,
        address: <MapIcon fontSize="small" />,
        category: <CategoryIcon fontSize="small" />,
        rating: <StarOutlineIcon fontSize="small" />,
        website: <PublicIcon fontSize="small" />,
        owner_name: <PersonIcon fontSize="small" />,
        agent_assigned: <SupportAgentIcon fontSize="small" />,
        country: <LanguageIcon fontSize="small" />,
        city: <LocationCityIcon fontSize="small" />,
        created_at: <CalendarTodayIcon fontSize="small" />,
        updated_at: <HistoryIcon fontSize="small" />,
        custom: <AssignmentIcon fontSize="small" />
    };

    const fetchConfig = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_table_config')
            .select('*')
            .eq('table_name', 'leads')
            .eq('user_id', user.id)
            .maybeSingle();

        if (data) {
            // Unificamos visibilidad
            if (data.visible_columns) setVisibleColumns(data.visible_columns);

            // Unificamos campos personalizados
            if (data.custom_fields) setCustomFields(data.custom_fields);

            // Unificamos orden (asegurando que campos nuevos no se queden fuera)
            if (data.config?.column_order) {
                const savedOrder = data.config.column_order as string[];
                const standardFields = ['title', 'status', 'phone_number', 'email', 'address', 'category', 'owner_name', 'agent_assigned', 'country', 'city', 'rating', 'website', 'created_at'];
                const customFieldKeys = (data.custom_fields || []).map((cf: any) => `meta_${cf.key}`);
                const allCurrentFields = [...standardFields, ...customFieldKeys];

                // Mantener el orden guardado pero añadir los campos nuevos que no estaban en el orden guardado
                const news = allCurrentFields.filter(f => !savedOrder.includes(f));
                setColumnOrder([...savedOrder.filter(f => allCurrentFields.includes(f)), ...news]);
            }
        }
    };

    const saveConfig = async (newVisible: string[], newCustomFields?: CustomField[], newOrder?: string[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Intentar obtener el config actual para no sobreescribir otros ajustes del JSONB
        const { data: existing } = await supabase
            .from('user_table_config')
            .select('config')
            .eq('table_name', 'leads')
            .eq('user_id', user.id)
            .maybeSingle();

        const currentConfig = existing?.config || {};

        await supabase.from('user_table_config').upsert({
            user_id: user.id,
            table_name: 'leads',
            visible_columns: newVisible,
            custom_fields: newCustomFields || customFields,
            config: {
                ...currentConfig,
                column_order: newOrder || columnOrder,
                last_updated_by: 'LeadTable'
            },
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,table_name' });
    };

    const fetchLeads = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (!error) setLeads(data || []);
        setLoading(false);
    };

    const fetchStages = async () => {
        const { data, error } = await supabase.from('lead_stages').select('*').order('order_index', { ascending: true });
        if (!error) setStages(data || []);
    };

    const fetchAgents = async () => {
        const { data } = await supabase.from('agents').select('id, name').is('deleted_at', null);
        if (data) setAgents(data);
    };

    useEffect(() => {
        fetchLeads();
        fetchStages();
        fetchConfig();
        fetchAgents();
    }, []);

    // Sincronizar columnOrder con campos personalizados nuevos
    useEffect(() => {
        const standardFields = ['title', 'status', 'phone_number', 'email', 'address', 'category', 'owner_name', 'agent_assigned', 'country', 'city', 'rating', 'website', 'created_at'];
        const customFieldKeys = customFields.map(cf => `meta_${cf.key}`);
        const allFields = [...standardFields, ...customFieldKeys];

        setColumnOrder(prev => {
            const preserved = prev.filter(f => allFields.includes(f));
            const news = allFields.filter(f => !prev.includes(f));
            return [...preserved, ...news];
        });
    }, [customFields]);

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddCustomField = () => {
        if (!newFieldName) return;
        const key = newFieldName.toLowerCase().replace(/\s+/g, '_');
        if (customFields.some(f => f.key === key)) {
            showSnackbar('El campo ya existe', 'error');
            return;
        }
        const newField: CustomField = { key, label: newFieldName, type: selectedFieldType };
        const updatedFields = [...customFields, newField];
        const newOrder = [...columnOrder, `meta_${key}`];

        setCustomFields(updatedFields);
        setColumnOrder(newOrder);
        saveConfig(visibleColumns, updatedFields, newOrder);

        setNewFieldName('');
        setFieldNameDialogOpen(false);
        showSnackbar(`Campo "${newFieldName}" creado como ${selectedFieldType}`, 'success');
    };

    const handleUpdateStage = async (id: string, updates: Partial<LeadStage>) => {
        const stage = stages.find(s => s.id === id);
        if (!stage) return;

        // Si se actualiza el 'name', debemos actualizar todos los leads vinculados
        if (updates.name && updates.name !== stage.name) {
            const { error: leadsError } = await supabase
                .from('leads')
                .update({ status: updates.name })
                .eq('status', stage.name);

            if (leadsError) {
                showSnackbar('Error al actualizar leads vinculados', 'error');
                return;
            }
        }

        const { error } = await supabase.from('lead_stages').update(updates).eq('id', id);
        if (!error) {
            fetchStages();
            if (updates.name) fetchLeads(); // Refrescar si cambió el slug
            showSnackbar('Etapa actualizada', 'success');
        } else {
            showSnackbar('Error al actualizar etapa', 'error');
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Hacer el elemento transparente durante el drag
        const target = e.target as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.4'; }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDraggingIndex(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === targetIndex) return;

        const newStages = [...stages];
        const [draggedItem] = newStages.splice(draggingIndex, 1);
        newStages.splice(targetIndex, 0, draggedItem);

        // Actualizar localmente para feedback inmediato
        setStages(newStages);

        // Persistir en DB
        const updates = newStages.map((s, idx) =>
            supabase.from('lead_stages').update({ order_index: idx }).eq('id', s.id)
        );

        try {
            await Promise.all(updates);
            fetchStages();
        } catch (err) {
            showSnackbar('Error al reordenar etapas', 'error');
        }
    };

    const handleColumnDragStart = (e: React.DragEvent, index: number) => {
        setDraggingColumnIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        const target = e.target as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.4'; }, 0);
    };

    const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggingColumnIndex === null || draggingColumnIndex === targetIndex) return;

        const newOrder = [...columnOrder];
        const [draggedItem] = newOrder.splice(draggingColumnIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);

        setColumnOrder(newOrder);
        setDraggingColumnIndex(null);
        saveConfig(visibleColumns, customFields, newOrder);
    };

    const handleAddStage = async () => {
        if (!newStageName) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const maxOrder = stages.reduce((max, s) => Math.max(max, s.order_index), -1);
        const { error } = await supabase.from('lead_stages').insert({
            name: newStageId || newStageName.toLowerCase().replace(/\s+/g, '_'),
            label: newStageName,
            color: 'default',
            order_index: maxOrder + 1,
            user_id: user.id
        });
        if (!error) {
            fetchStages();
            setNewStageName('');
            setNewStageId('');
            showSnackbar('Etapa añadida', 'success');
        }
        else showSnackbar('Error al añadir etapa', 'error');
    };

    const handleDeleteStage = async (stage: LeadStage) => {
        const leadsInStage = leads.filter(l => l.status === stage.name);

        if (leadsInStage.length > 0) {
            setStageToDelete(stage);
            setReallocationOpen(true);
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar la etapa "${stage.label}"?`)) return;

        const { error } = await supabase.from('lead_stages').delete().eq('id', stage.id);
        if (!error) { fetchStages(); showSnackbar('Etapa eliminada', 'success'); }
        else showSnackbar('Error al eliminar stage', 'error');
    };

    const handleReallocateAndDelete = async () => {
        if (!stageToDelete || !targetStageName) return;

        setLoading(true);
        try {
            // 1. Reubicar leads
            const { error: updateError } = await supabase
                .from('leads')
                .update({ status: targetStageName })
                .eq('status', stageToDelete.name);

            if (updateError) throw updateError;

            // 2. Eliminar etapa
            const { error: deleteError } = await supabase
                .from('lead_stages')
                .delete()
                .eq('id', stageToDelete.id);

            if (deleteError) throw deleteError;

            showSnackbar(`Etapa eliminada y leads reubicados`, 'success');
            setReallocationOpen(false);
            setStageToDelete(null);
            setTargetStageName('');
            fetchStages();
            fetchLeads();
        } catch (err: any) {
            showSnackbar('Error durante la reubicación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLead = async (formData: any) => {
        const { id, ...data } = formData;
        const { data: { user } } = await supabase.auth.getUser();
        let error;
        if (id) {
            const { error: e } = await supabase.from('leads').update(data).eq('id', id);
            error = e;
        } else {
            const { error: e } = await supabase.from('leads').insert({ ...data, user_id: user?.id, status: data.status || 'new' });
            error = e;
        }
        if (error) showSnackbar('Error al guardar lead', 'error');
        else { showSnackbar(id ? 'Lead actualizado' : 'Lead creado', 'success'); setLeadFormOpen(false); fetchLeads(); }
    };

    const handleLeadDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggingLeadId(leadId);
        e.dataTransfer.effectAllowed = 'move';
        // Añadir el ID al dataTransfer por si acaso
        e.dataTransfer.setData('leadId', leadId);

        const target = e.currentTarget as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.5'; }, 0);
    };

    const handleLeadDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggingLeadId(null);
        setDragOverStage(null);
    };

    const handleLeadDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        setDragOverStage(null);
        const leadId = e.dataTransfer.getData('leadId') || draggingLeadId;

        if (!leadId) return;

        // Si ya está en esa etapa, no hacer nada
        const lead = leads.find(l => l.id === leadId);
        if (lead?.status === targetStatus) return;

        // Feedback inmediato local
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: targetStatus } : l));

        try {
            const { error } = await supabase.from('leads').update({ status: targetStatus }).eq('id', leadId);
            if (error) throw error;
            showSnackbar(`Contacto movido a ${targetStatus}`, 'success');
        } catch (err) {
            showSnackbar('Error al mover el contacto', 'error');
            fetchLeads(); // Revertir cambios locales
        } finally {
            setDraggingLeadId(null);
        }
    };

    const handleAgentUpdate = async (id: string, agentId: string) => {
        const { error } = await supabase.from('leads').update({ agent_assigned: agentId || null }).eq('id', id);
        if (!error) {
            fetchLeads();
            showSnackbar('Agente actualizado', 'success');
        } else {
            showSnackbar('Error al actualizar agente', 'error');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', id);
        if (!error) { fetchLeads(); showSnackbar(`Actualizado a ${newStatus}`, 'success'); }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Borrar ${selectedRows.length} registros?`)) return;
        const { error } = await supabase.from('leads').delete().in('id', selectedRows);
        if (!error) { fetchLeads(); showSnackbar('Registros eliminados', 'success'); setSelectedRows([]); }
    };

    const handleBulkStatusChange = async (status: string) => {
        if (selectedRows.length === 0) return;
        const { error } = await supabase.from('leads').update({ status }).in('id', selectedRows);
        if (!error) { fetchLeads(); showSnackbar(`${selectedRows.length} leads actualizados`, 'success'); setSelectedRows([]); }
        else showSnackbar('Error al actualizar estados', 'error');
    };

    const handleBulkAgentAssign = async (agentId: string) => {
        if (selectedRows.length === 0) return;
        const { error } = await supabase.from('leads').update({ agent_assigned: agentId || null }).in('id', selectedRows);
        if (!error) {
            fetchLeads();
            showSnackbar(`${selectedRows.length} leads asignados`, 'success');
            setSelectedRows([]);
        } else {
            showSnackbar('Error al asignar agente', 'error');
        }
    };

    const handleBulkRatingUpdate = async (rating: number) => {
        if (selectedRows.length === 0) return;
        const { error } = await supabase.from('leads').update({ rating }).in('id', selectedRows);
        if (!error) {
            fetchLeads();
            showSnackbar(`${selectedRows.length} contactos calificados`, 'success');
            setSelectedRows([]);
        } else {
            showSnackbar('Error al actualizar calificación', 'error');
        }
    };

    const handleBulkCategoryUpdate = async (category: string) => {
        if (selectedRows.length === 0) return;
        const { error } = await supabase.from('leads').update({ category }).in('id', selectedRows);
        if (!error) {
            fetchLeads();
            showSnackbar(`${selectedRows.length} contactos categorizados`, 'success');
            setSelectedRows([]);
        } else {
            showSnackbar('Error al actualizar categoría', 'error');
        }
    };

    const handleSync = async (lead: any) => {
        setSyncingId(lead.id);
        try {
            const { error } = await supabase.functions.invoke('sync-crm', { body: { lead } });
            if (error) throw error;
            await supabase.from('leads').update({ synced: true }).eq('id', lead.id);
            showSnackbar(`Contacto sincronizado`, 'success');
            fetchLeads();
        } catch (err: any) {
            showSnackbar(err.message || 'Error de sincronización', 'error');
        } finally {
            setSyncingId(null);
        }
    };

    const handleToolbarEdit = () => {
        if (selectedRows.length !== 1) return;
        const lead = leads.find(l => l.id === selectedRows[0]);
        if (lead) { setEditingLead(lead); setLeadFormOpen(true); }
    };

    const handleToolbarSync = async () => {
        for (const id of selectedRows) {
            const lead = leads.find(l => l.id === id);
            if (lead) await handleSync(lead);
        }
    };

    const columns: GridColDef[] = useMemo(() => {
        const stageColors: Record<string, any> = Object.fromEntries(stages.map(s => [s.name, s.color]));
        const stageLabels: Record<string, string> = Object.fromEntries(stages.map(s => [s.name, s.label]));

        const allPossibleColumns: GridColDef[] = [
            {
                field: 'title',
                headerName: 'Cliente / Empresa',
                width: 220,
                renderCell: (params) => (
                    <Chip
                        label={typeof params.value === 'string' ? params.value : (params.value?.title || 'Sin título')}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadDetail(params.row);
                            setDetailOpen(true);
                        }}
                        sx={{
                            fontWeight: 700,
                            borderRadius: '8px',
                            bgcolor: 'rgba(124, 58, 237, 0.08)',
                            color: 'primary.light',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                            }
                        }}
                    />
                )
            },
            {
                field: 'status',
                headerName: 'Estado',
                width: 150,
                renderCell: (params) => (
                    <Chip
                        label={stageLabels[params.value] || params.value}
                        size="small"
                        color={stageColors[params.value] || 'default'}
                        sx={{ fontWeight: 'bold' }}
                        onClick={(e) => setStatusMenuAnchor({ el: e.currentTarget, id: params.row.id })}
                    />
                )
            },
            {
                field: 'phone_number',
                headerName: 'Teléfono',
                width: 150,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                    />
                ) : null
            },
            {
                field: 'email',
                headerName: 'Email',
                width: 200,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<EmailIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                    />
                ) : null
            },
            {
                field: 'address',
                headerName: 'Dirección',
                width: 220,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<MapIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                    />
                ) : null
            },
            {
                field: 'category',
                headerName: 'Categoría',
                width: 140,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<CategoryIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}
                    />
                ) : null
            },
            {
                field: 'owner_name',
                headerName: 'Captado por',
                width: 160,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(124, 58, 237, 0.05)', color: 'primary.light', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                ) : null
            },
            {
                field: 'agent_assigned',
                headerName: 'Asesor',
                width: 200,
                renderCell: (params) => {
                    const agent = agents.find(a => a.id === params.value);
                    return (
                        <Box sx={{
                            bgcolor: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            pl: 0.5, pr: 1, height: 36, display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(124, 58, 237, 0.05)' }
                        }}>
                            <Avatar
                                sx={{
                                    width: 24, height: 24, fontSize: '0.65rem', fontWeight: 800,
                                    bgcolor: agent ? stringToColor(agent.name) : 'grey.800',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                {agent ? getInitials(agent.name) : '?'}
                            </Avatar>
                            <Select
                                fullWidth
                                size="small"
                                value={params.value || ''}
                                onChange={(e) => handleAgentUpdate(params.row.id, e.target.value)}
                                renderValue={() => agent ? agent.name : 'Sin asignar'}
                                sx={{
                                    height: 32,
                                    ml: 0.5,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    '& .MuiSelect-select': { py: 0 }
                                }}
                                displayEmpty
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            borderRadius: 2,
                                            mt: 1,
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>?</Avatar>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Sin asignar</Typography>
                                    </Box>
                                </MenuItem>
                                {agents.map(a => (
                                    <MenuItem key={a.id} value={a.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar
                                                sx={{
                                                    width: 20, height: 20, fontSize: '0.6rem',
                                                    bgcolor: stringToColor(a.name)
                                                }}
                                            >
                                                {getInitials(a.name)}
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{a.name}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    );
                }
            },
            {
                field: 'country',
                headerName: 'País',
                width: 130,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<PublicIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                    />
                ) : null
            },
            {
                field: 'city',
                headerName: 'Ciudad',
                width: 130,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<LocationCityIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                    />
                ) : null
            },
            {
                field: 'rating',
                headerName: '★',
                width: 90,
                type: 'number',
                renderCell: (params) => (
                    <Chip
                        label={`${params.value || 0} ★`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255, 184, 0, 0.1)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.2)', fontWeight: 800, fontSize: '0.75rem' }}
                    />
                )
            },
            {
                field: 'website',
                headerName: 'Web',
                width: 180,
                renderCell: (params) => params.value ? (
                    <Chip
                        icon={<PublicIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value.replace(/^https?:\/\//, '')}
                        size="small"
                        component="a"
                        href={params.value.startsWith('http') ? params.value : `https://${params.value}`}
                        target="_blank"
                        clickable
                        sx={{ bgcolor: 'rgba(124, 58, 237, 0.05)', color: 'primary.light', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: 1.5, fontSize: '0.75rem', textDecoration: 'none' }}
                    />
                ) : null
            },
            {
                field: 'created_at',
                headerName: 'Creado',
                width: 160,
                renderCell: (params) => (
                    <Chip
                        icon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
                        label={params.value ? new Date(params.value).toLocaleDateString() : '-'}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem', color: 'text.disabled' }}
                    />
                )
            },
            // Defined Custom Fields
            ...customFields.map(cf => ({
                field: `meta_${cf.key}`,
                headerName: cf.label,
                width: 150,
                renderCell: (params: any) => {
                    const val = params.row.metadata?.[cf.key];
                    if (!val) return null;

                    if (cf.type === 'rating') {
                        return (
                            <Chip
                                label={`${val} ★`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255, 184, 0, 0.1)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.2)', fontWeight: 800, fontSize: '0.75rem' }}
                            />
                        );
                    }
                    if (cf.type === 'url') {
                        return (
                            <Chip
                                icon={<LanguageIcon sx={{ fontSize: '14px !important' }} />}
                                label={val.replace(/^https?:\/\//, '')}
                                size="small"
                                component="a"
                                href={val.startsWith('http') ? val : `https://${val}`}
                                target="_blank"
                                clickable
                                sx={{ bgcolor: 'rgba(124, 58, 237, 0.05)', color: 'primary.light', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: 1.5, fontSize: '0.75rem', textDecoration: 'none' }}
                            />
                        );
                    }
                    if (cf.type === 'email') {
                        return (
                            <Chip
                                icon={<EmailIcon sx={{ fontSize: '14px !important' }} />}
                                label={val}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                            />
                        );
                    }
                    if (cf.type === 'phone') {
                        return (
                            <Chip
                                icon={<PhoneIcon sx={{ fontSize: '14px !important' }} />}
                                label={val}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                            />
                        );
                    }

                    return (
                        <Chip
                            icon={undefined}
                            label={val}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid divider', borderRadius: 1.5, fontSize: '0.75rem' }}
                        />
                    );
                }
            })),
            {
                field: 'add_column',
                headerName: '',
                width: 50,
                sortable: false,
                filterable: false,
                hideable: false,
                disableColumnMenu: true,
                renderHeader: () => (
                    <IconButton size="small" onClick={(e) => setAddColumnAnchor(e.currentTarget)} sx={{ color: 'primary.main' }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                ),
            }
        ];

        return columnOrder
            .map(field => allPossibleColumns.find(c => c.field === field))
            .filter((col): col is GridColDef => !!col && (visibleColumns.includes(col.field) || col.field === 'add_column'));
    }, [stages, visibleColumns, customFields, syncingId, columnOrder]);

    const hiddenColumns = useMemo(() => {
        const standard = ['title', 'status', 'phone_number', 'email', 'address', 'category', 'owner_name', 'agent_assigned', 'country', 'city', 'rating', 'website', 'created_at'].filter(c => !visibleColumns.includes(c));
        const customs = customFields.filter(cf => !visibleColumns.includes(`meta_${cf.key}`));
        return { standard, customs };
    }, [visibleColumns, customFields]);

    const kanbanLeads = useMemo(() => leads.filter(lead => {
        const search = searchTerm.toLowerCase();
        const leadTitle = typeof lead.title === 'string' ? lead.title : (lead.title?.title || '');
        const title = (leadTitle || '').toLowerCase();
        const phone = (lead.phone_number || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        return title.includes(search) || phone.includes(search) || email.includes(search);
    }), [leads, searchTerm]);

    const filteredLeads = useMemo(() => kanbanLeads.filter(lead => {
        return currentTab === 'all' || lead.status === currentTab;
    }), [kanbanLeads, currentTab]);

    const kanbanView = useMemo(() => (
        <Box sx={{
            flexGrow: 1,
            height: '100%',
            overflowX: 'auto',
            overflowY: 'auto',
            bgcolor: 'background.default',
            /* Scrollbar minimalista general */
            '&::-webkit-scrollbar': { width: 6, height: 6 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 10, bgcolor: 'rgba(255,255,255,0.05)' },
            '&:hover::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)' }
        }}>
            <Box sx={{
                display: 'flex',
                gap: 1,
                p: 2,
                alignItems: 'stretch', // Fuerza a que todos los hijos midan lo mismo
                minHeight: '100%',
                width: 'max-content', // Evita que se colapse horizontalmente
                minWidth: '100%'
            }}>
                {stages.map(stage => {
                    const stageLeads = kanbanLeads.filter(l => l.status === stage.name);
                    const stageColor = stage.color === 'default' ? 'divider' : `${stage.color}.main`;
                    const stageColorAlpha = stage.color === 'default' || stage.color === 'divider' ? 'rgba(255,255,255,0.02)' : `var(--mui-palette-${stage.color}-main)`;

                    return (
                        <Box
                            key={stage.id}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (draggingLeadId && dragOverStage !== stage.name) {
                                    setDragOverStage(stage.name);
                                }
                            }}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                if (draggingLeadId) setDragOverStage(stage.name);
                            }}
                            onDragLeave={(e) => {
                                // Solo quitar el estado si salimos del contenedor real, no de un hijo
                                const rect = e.currentTarget.getBoundingClientRect();
                                const { clientX: x, clientY: y } = e;
                                if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                                    setDragOverStage(null);
                                }
                            }}
                            onDrop={(e) => handleLeadDrop(e, stage.name)}
                            sx={{
                                minWidth: 320,
                                maxWidth: 320,
                                display: 'flex',
                                flexDirection: 'column',
                                alignSelf: 'stretch',
                                // Sin fondo ni bordes por defecto
                                bgcolor: dragOverStage === stage.name ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: dragOverStage === stage.name ? 'primary.main' : 'transparent',
                                boxShadow: dragOverStage === stage.name ? `0 0 40px rgba(124, 58, 237, 0.15)` : 'none',
                                position: 'relative',
                                mr: 2,
                                transition: 'all 0.3s ease',
                                // Zonas sensibles para el drag
                                '&:hover': {
                                    bgcolor: draggingLeadId && !dragOverStage ? 'rgba(255,255,255,0.03)' : dragOverStage === stage.name ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.01)'
                                },
                            }}
                        >
                            <Box sx={{
                                p: 2,
                                pb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                opacity: draggingLeadId && dragOverStage !== stage.name ? 0.5 : 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        bgcolor: stageColor,
                                        boxShadow: `0 0 8px ${stageColorAlpha}`
                                    }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: '800', letterSpacing: '0.08em', color: 'text.secondary', fontSize: '0.7rem' }}>
                                        {stage.label.toUpperCase()}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.disabled', opacity: 0.6 }}>
                                        {stageLeads.length}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack
                                spacing={1.5}
                                sx={{
                                    p: 1,
                                    flexGrow: 1, // Crucial: el stack ocupa todo el espacio sobrante
                                    overflowY: 'visible',
                                    bgcolor: 'transparent',
                                    minHeight: 100, // Espacio mínimo para soltar incluso si está vacía
                                }}
                            >
                                {stageLeads.length === 0 ? (
                                    <Box sx={{
                                        py: 4, px: 2, textAlign: 'center', opacity: 0.2,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                                        border: '1px dashed', borderColor: 'divider', borderRadius: 2, m: 1
                                    }}>
                                        <Typography variant="caption" sx={{ fontWeight: 500 }}>Aún no hay prospectos aquí</Typography>
                                    </Box>
                                ) : (
                                    stageLeads.map(lead => (
                                        <Card
                                            key={lead.id}
                                            elevation={0}
                                            draggable
                                            onDragStart={(e) => handleLeadDragStart(e, lead.id)}
                                            onDragEnd={handleLeadDragEnd}
                                            sx={{
                                                borderRadius: '16px',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: 'background.paper',
                                                position: 'relative',
                                                overflow: 'hidden', // Asegura que la franja no se salga
                                                '&:before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    left: 0, top: 0, bottom: 0, width: 4, // Cubre todo el alto
                                                    bgcolor: stageColor,
                                                    opacity: 0.9
                                                },
                                                '&:hover': {
                                                    transform: 'translateY(-4px) scale(1.01)',
                                                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                                                    borderColor: 'primary.main',
                                                    zIndex: 1,
                                                    '& .card-actions': { opacity: 1 }
                                                },
                                                opacity: draggingLeadId === lead.id ? 0.3 : 1,
                                                transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                                                cursor: 'grab',
                                                '&:active': { cursor: 'grabbing' }
                                            }}
                                            onClick={() => { setEditingLead(lead); setLeadFormOpen(true); }}
                                        >
                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                {/* Cabecera de la Card */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                    <Typography variant="body2" sx={{
                                                        fontWeight: '700',
                                                        color: 'text.primary',
                                                        lineHeight: 1.4,
                                                        fontSize: '0.95rem',
                                                        letterSpacing: '-0.01em',
                                                        flexGrow: 1, mr: 1
                                                    }}>
                                                        {typeof lead.title === 'string' ? lead.title : (lead.title?.title || 'Prospecto sin nombre')}
                                                    </Typography>
                                                    <Box sx={{
                                                        display: 'flex', alignItems: 'center',
                                                        bgcolor: 'rgba(255, 184, 0, 0.1)',
                                                        px: 1, py: 0.4, borderRadius: 2,
                                                        border: '1px solid rgba(255, 184, 0, 0.2)'
                                                    }}>
                                                        <StarOutlineIcon sx={{ fontSize: 13, color: '#FFB800', mr: 0.4 }} />
                                                        <Typography variant="caption" sx={{ color: '#FFB800', fontWeight: '800', fontSize: '0.75rem' }}>
                                                            {lead.rating || 0}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Datos de contacto con burbujas modernas */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                    {lead.phone_number && (
                                                        <Box sx={{
                                                            display: 'flex', alignItems: 'center', gap: 0.6,
                                                            bgcolor: 'rgba(124, 58, 237, 0.08)',
                                                            px: 1, py: 0.5, borderRadius: 1.5,
                                                            color: 'primary.light', border: '1px solid rgba(124, 58, 237, 0.1)'
                                                        }}>
                                                            <PhoneIcon sx={{ fontSize: 13 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Llamar</Typography>
                                                        </Box>
                                                    )}
                                                    {lead.email && (
                                                        <Box sx={{
                                                            display: 'flex', alignItems: 'center', gap: 0.6,
                                                            bgcolor: 'rgba(255,255,255,0.03)',
                                                            px: 1, py: 0.5, borderRadius: 1.5,
                                                            color: 'text.secondary', border: '1px solid divider'
                                                        }}>
                                                            <EmailIcon sx={{ fontSize: 13 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Email</Typography>
                                                        </Box>
                                                    )}
                                                    {(lead.city || lead.country) && (
                                                        <Box sx={{
                                                            display: 'flex', alignItems: 'center', gap: 0.6,
                                                            bgcolor: 'rgba(255,255,255,0.02)',
                                                            px: 1, py: 0.5, borderRadius: 1.5,
                                                            color: 'text.disabled'
                                                        }}>
                                                            <MapIcon sx={{ fontSize: 13 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                                                {lead.city || lead.country}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Divider sx={{ mb: 2, opacity: 0.5 }} />

                                                {/* Footer de la Card con Avatar y Categoría */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{
                                                            width: 28, height: 28, borderRadius: '50%',
                                                            bgcolor: 'primary.dark',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid', borderColor: 'background.paper',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                        }}>
                                                            <PersonIcon sx={{ fontSize: 16, color: 'white' }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
                                                                {lead.owner_name?.split(' ')[0] || 'Sin asignar'}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 500 }}>
                                                                Captado por
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Chip
                                                        label={lead.category || 'NUEVO'}
                                                        size="small"
                                                        sx={{
                                                            height: 20, px: 0.5, fontSize: '0.6rem', fontWeight: 800,
                                                            borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)',
                                                            color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em'
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>

                                            {/* Botones de acción rápida que aparecen al hacer hover */}
                                            <Box className="card-actions" sx={{
                                                position: 'absolute', right: 8, top: 8, // Movido hacia adentro
                                                display: 'flex', gap: 0.5, opacity: 0,
                                                transition: 'all 0.2s ease',
                                                pointerEvents: 'auto', // Asegurar que se puedan clickear
                                                zIndex: 10
                                            }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); setEditingLead(lead); setLeadFormOpen(true); }}
                                                    sx={{
                                                        width: 28, height: 28,
                                                        bgcolor: 'background.paper',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        boxShadow: 2,
                                                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                                    }}
                                                >
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); setStatusMenuAnchor({ el: e.currentTarget, id: lead.id }); }}
                                                    sx={{
                                                        width: 28, height: 28,
                                                        bgcolor: 'background.paper',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        boxShadow: 2,
                                                        '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                                    }}
                                                >
                                                    <HistoryIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        </Card>
                                    ))
                                )}

                                <Button
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        py: 1,
                                        mb: 4,
                                        textTransform: 'none',
                                        color: 'text.disabled',
                                        fontSize: '0.75rem',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => { setEditingLead({ status: stage.name }); setLeadFormOpen(true); }}
                                >
                                    Añadir contacto
                                </Button>
                            </Stack>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    ), [kanbanLeads, stages, searchTerm, draggingLeadId, dragOverStage]);

    return (
        <Paper
            elevation={0}
            sx={{
                flexGrow: 1,
                bgcolor: 'background.paper',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
        >
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                bgcolor: 'rgba(255,255,255,0.01)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                    <TextField
                        placeholder="Buscar por nombre, email o teléfono..."
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ maxWidth: 450 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'primary.main' }} /></InputAdornment>,
                            sx: {
                                borderRadius: 2.5,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid transparent',
                                '&:hover': { borderColor: 'divider' },
                                '&.Mui-focused': { borderColor: 'primary.main' }
                            }
                        }}
                    />
                    <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />
                    <Button
                        startIcon={<SettingsIcon />}
                        onClick={() => setSettingsOpen(true)}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', bgcolor: 'rgba(124, 58, 237, 0.05)' }
                        }}
                    >
                        Configurar Etapas
                    </Button>
                    <Button
                        startIcon={<ViewColumnIcon />}
                        onClick={() => setColumnManagerOpen(true)}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', bgcolor: 'rgba(124, 58, 237, 0.05)' }
                        }}
                    >
                        Personalizar Campos
                    </Button>
                </Box>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                    sx={{
                        bgcolor: 'background.default',
                        borderRadius: 2.5,
                        p: 0.5,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <ToggleButton value="table" sx={{ border: 'none', borderRadius: '2.5px !important', px: 2, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } } }}>
                        <ViewStreamIcon fontSize="small" sx={{ mr: 1 }} /> Lista
                    </ToggleButton>
                    <ToggleButton value="kanban" sx={{ border: 'none', borderRadius: '2.5px !important', px: 2, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } } }}>
                        <ViewKanbanIcon fontSize="small" sx={{ mr: 1 }} /> Tablero
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {viewMode === 'table' && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'rgba(255,255,255,0.005)' }}>
                    <Tabs
                        value={currentTab}
                        onChange={(_, v) => setCurrentTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                            '& .MuiTab-root': { py: 2, minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: '0.9rem' }
                        }}
                    >
                        <Tab label="Todos los Contactos" value="all" />
                        {stages.map(stage => <Tab key={stage.id} label={stage.label} value={stage.name} />)}
                    </Tabs>
                </Box>
            )}

            <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {viewMode === 'table' ? (
                    <DataGrid
                        rows={filteredLeads}
                        columns={columns}
                        loading={loading}
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as any)}
                        onColumnVisibilityModelChange={() => {
                            // Sincronización con menú nativo (opcional)
                        }}
                        slots={{ toolbar: CustomToolbar as any }}
                        slotProps={{
                            toolbar: {
                                onOpenColumnManager: () => setColumnManagerOpen(true),
                                onNewLead: () => { setEditingLead(null); setLeadFormOpen(true); },
                                selectedRows,
                            } as any
                        }}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-main': { overflow: 'hidden' },
                            '& .MuiDataGrid-cell': {
                                borderColor: 'divider',
                                '&:focus': { outline: 'none' }
                            },

                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: 'background.default',
                                borderColor: 'divider'
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '1px solid',
                                borderColor: 'divider'
                            }
                        }}
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    />
                ) : (
                    kanbanView
                )}
            </Box>

            <BulkActionDock
                selectedRows={selectedRows}
                onBulkDelete={handleBulkDelete}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkAgentAssign={handleBulkAgentAssign}
                onBulkRatingUpdate={handleBulkRatingUpdate}
                onBulkCategoryUpdate={handleBulkCategoryUpdate}
                onClearSelection={() => setSelectedRows([])}
                onSync={handleToolbarSync}
                stages={stages}
                agents={agents}
                isSyncing={syncingId !== null}
            />

            <LeadDetailDialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                lead={selectedLeadDetail}
                stages={stages}
                agents={agents}
                customFields={customFields}
                onEdit={() => {
                    setEditingLead(selectedLeadDetail);
                    setDetailOpen(false); // Cerramos detalle al abrir edición
                    setLeadFormOpen(true);
                }}
            />



            {/* Formulario Lead */}
            <Dialog open={leadFormOpen} onClose={() => setLeadFormOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{editingLead ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}><TextField fullWidth label="Nombre del Negocio" variant="outlined" size="small" defaultValue={editingLead?.title} id="form-title" /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Teléfono" variant="outlined" size="small" defaultValue={editingLead?.phone_number} id="form-phone" /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" variant="outlined" size="small" defaultValue={editingLead?.email} id="form-email" /></Grid>
                            <Grid size={{ xs: 12 }}><TextField fullWidth label="Dirección" variant="outlined" size="small" defaultValue={editingLead?.address} id="form-address" /></Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth select label="Estado" size="small" value={editingLead?.status || 'new'} onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })} id="form-status">
                                    {stages.map(s => <MenuItem key={s.name} value={s.name}>{s.label}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Categoría" size="small" defaultValue={editingLead?.category} id="form-category" /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Nombre del Responsable" size="small" defaultValue={editingLead?.owner_name} id="form-owner" /></Grid>
                            <Grid size={{ xs: 6 }}><SupportAgentSelect defaultValue={editingLead?.agent_assigned} /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="País" size="small" defaultValue={editingLead?.country} id="form-country" /></Grid>
                            <Grid size={{ xs: 6 }}><TextField fullWidth label="Ciudad" size="small" defaultValue={editingLead?.city} id="form-city" /></Grid>

                            {customFields.length > 0 && (
                                <>
                                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }}><Chip label="Campos Personalizados" size="small" /></Divider></Grid>
                                    {customFields.map(cf => (
                                        <Grid size={{ xs: 6 }} key={cf.key}>
                                            <TextField
                                                fullWidth
                                                label={cf.label}
                                                variant="outlined"
                                                size="small"
                                                defaultValue={editingLead?.metadata?.[cf.key]}
                                                id={`form-custom-${cf.key}`}
                                            />
                                        </Grid>
                                    ))}
                                </>
                            )}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setLeadFormOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={() => {
                        const formData: any = {
                            id: editingLead?.id,
                            title: (document.getElementById('form-title') as HTMLInputElement).value,
                            phone_number: (document.getElementById('form-phone') as HTMLInputElement).value,
                            email: (document.getElementById('form-email') as HTMLInputElement).value,
                            address: (document.getElementById('form-address') as HTMLInputElement).value,
                            status: (document.getElementById('form-status') as HTMLInputElement)?.value || editingLead?.status,
                            category: (document.getElementById('form-category') as HTMLInputElement).value,
                            owner_name: (document.getElementById('form-owner') as HTMLInputElement).value,
                            agent_assigned: (document.getElementById('form-agent') as HTMLInputElement)?.value,
                            country: (document.getElementById('form-country') as HTMLInputElement).value,
                            city: (document.getElementById('form-city') as HTMLInputElement).value,
                            metadata: editingLead?.metadata || {}
                        };
                        customFields.forEach(cf => {
                            formData.metadata[cf.key] = (document.getElementById(`form-custom-${cf.key}`) as HTMLInputElement).value;
                        });
                        handleSaveLead(formData);
                    }}>Guardar Contacto</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={columnManagerOpen} onClose={() => setColumnManagerOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    Personalizar Campos
                </DialogTitle>
                <DialogContent>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Arrastra para reordenar y usa los cuadros para mostrar/ocultar.
                    </Typography>
                    <List sx={{ py: 0 }}>
                        {columnOrder.map((col, index) => {
                            const isVisible = visibleColumns.includes(col);
                            const isCustom = col.startsWith('meta_');
                            const label = isCustom
                                ? customFields.find(f => `meta_${f.key}` === col)?.label
                                : col.replace('_', ' ');

                            return (
                                <ListItem
                                    key={col}
                                    draggable
                                    onDragStart={(e) => handleColumnDragStart(e, index)}
                                    onDragEnd={(e) => { (e.target as HTMLElement).style.opacity = '1'; setDraggingColumnIndex(null); }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleColumnDrop(e, index)}
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        mb: 1,
                                        borderRadius: 2.5,
                                        cursor: 'grab',
                                        bgcolor: draggingColumnIndex === index ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.02)',
                                        border: '1px solid',
                                        borderColor: draggingColumnIndex === index ? 'primary.main' : 'divider',
                                        '&:hover': {
                                            bgcolor: 'rgba(124, 58, 237, 0.05)',
                                            borderColor: 'primary.light',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        },
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}
                                >
                                    <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                                        <Checkbox
                                            size="small"
                                            checked={isVisible}
                                            onChange={() => {
                                                const next = isVisible
                                                    ? visibleColumns.filter(c => c !== col)
                                                    : [...visibleColumns, col];
                                                setVisibleColumns(next);
                                                saveConfig(next, customFields, columnOrder);
                                            }}
                                            sx={{
                                                p: 0.5,
                                                color: 'text.disabled',
                                                '&.Mui-checked': { color: 'primary.main' }
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, minWidth: 0 }}>
                                        <Box sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: isVisible ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.03)',
                                            color: isVisible ? 'primary.main' : 'text.disabled',
                                            transition: 'all 0.2s'
                                        }}>
                                            {COLUMN_ICONS[col] || COLUMN_ICONS.custom}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textTransform: 'capitalize',
                                                fontWeight: isVisible ? 600 : 400,
                                                color: isVisible ? 'text.primary' : 'text.disabled',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {label}
                                        </Typography>
                                    </Box>
                                    {isCustom && (
                                        <IconButton size="small" color="error" onClick={() => {
                                            const nextFields = customFields.filter(f => `meta_${f.key}` !== col);
                                            const nextOrder = columnOrder.filter(c => c !== col);
                                            const nextVisible = visibleColumns.filter(c => c !== col);
                                            setCustomFields(nextFields);
                                            setColumnOrder(nextOrder);
                                            setVisibleColumns(nextVisible);
                                            saveConfig(nextVisible, nextFields, nextOrder);
                                        }}>
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>

                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setTypeSelectorOpen(true)}
                            startIcon={<AddIcon />}
                            sx={{
                                borderRadius: 3,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                borderStyle: 'dashed',
                                '&:hover': { borderStyle: 'solid' }
                            }}
                        >
                            Crear Nuevo Campo
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setColumnManagerOpen(false)} variant="contained" fullWidth sx={{ borderRadius: 2.5, py: 1 }}>
                        Aplicar Cambios
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Configurar Etapas</DialogTitle>
                <DialogContent>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Gestiona las etapas de tu proceso comercial. Puedes cambiar nombres, colores y el orden de aparición.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Nombre de la etapa (ej: Contactado)"
                            value={newStageName}
                            onChange={(e) => {
                                setNewStageName(e.target.value);
                                // Auto-generar ID si el usuario no lo ha tocado manualmente
                                if (!newStageId) setNewStageId(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="id_interno (ej: contacted)"
                                value={newStageId}
                                onChange={(e) => setNewStageId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                InputProps={{
                                    startAdornment: <TerminalIcon sx={{ fontSize: 14, mr: 1, color: 'text.disabled' }} />,
                                    sx: { fontFamily: 'monospace', fontSize: '0.75rem' }
                                }}
                            />
                            <Button variant="contained" onClick={handleAddStage} startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>Añadir</Button>
                        </Box>
                    </Box>
                    <List sx={{ py: 0 }}>
                        {stages.map((stage, index) => (
                            <ListItem
                                key={stage.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e)}
                                onDrop={(e) => handleDrop(e, index)}
                                sx={{
                                    border: '1px solid',
                                    borderColor: draggingIndex === index ? 'primary.main' : 'divider',
                                    borderRadius: 2.5,
                                    mb: 1,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    p: 1.25,
                                    gap: 1.5,
                                    bgcolor: draggingIndex === index ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.01)',
                                    cursor: 'grab',
                                    transition: 'all 0.2s',
                                    '&:active': { cursor: 'grabbing' },
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', borderColor: 'primary.main' }
                                }}
                            >
                                <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20, flexShrink: 0 }} />

                                <Box
                                    onClick={(e) => setColorMenuAnchor({ el: e.currentTarget, stageId: stage.id })}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        p: 0.5,
                                        borderRadius: '50%',
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'scale(1.1)' }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 14, height: 14, borderRadius: '50%',
                                            bgcolor: stage.color === 'default' ? 'divider' : `${stage.color}.main`,
                                            boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                                    <TextField
                                        variant="standard"
                                        defaultValue={stage.label}
                                        placeholder="Etiqueta"
                                        onBlur={(e) => handleUpdateStage(stage.id, { label: e.target.value })}
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}>
                                        <TerminalIcon sx={{ fontSize: 10 }} />
                                        <TextField
                                            variant="standard"
                                            defaultValue={stage.name}
                                            placeholder="id_interno"
                                            onBlur={(e) => {
                                                const newVal = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                                if (newVal !== stage.name) handleUpdateStage(stage.id, { name: newVal });
                                            }}
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: {
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'monospace',
                                                    color: 'text.secondary'
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>
                                        {leads.filter(l => l.status === stage.name).length}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteStage(stage); }}
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            color: 'text.disabled',
                                            '&:hover': { color: 'error.main', bgcolor: 'rgba(244, 67, 54, 0.1)' }
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button variant="outlined" onClick={() => setSettingsOpen(false)}>Cerrar</Button></DialogActions>
            </Dialog>

            {/* Reallocation Dialog */}
            <Dialog open={reallocationOpen} onClose={() => setReallocationOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                    <WarningAmberIcon /> Reubicar Contactos
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        La etapa <b>"{stageToDelete?.label}"</b> tiene {leads.filter(l => l.status === stageToDelete?.name).length} contactos activos.
                        Para eliminarla, debes mover estos contactos a otra etapa.
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Mover contactos a...</InputLabel>
                        <Select
                            value={targetStageName}
                            label="Mover contactos a..."
                            onChange={(e: SelectChangeEvent) => setTargetStageName(e.target.value)}
                        >
                            {stages.filter(s => s.id !== stageToDelete?.id).map(s => (
                                <MenuItem key={s.id} value={s.name}>{s.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setReallocationOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!targetStageName || loading}
                        onClick={handleReallocateAndDelete}
                    >
                        Reubicar y Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={colorMenuAnchor?.el}
                open={Boolean(colorMenuAnchor)}
                onClose={() => setColorMenuAnchor(null)}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        mt: 0.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 1
                    }
                }}
            >
                <Typography variant="caption" sx={{ px: 1, py: 0.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                    SELECCIONAR COLOR
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
                    {['success', 'warning', 'error', 'info', 'primary', 'default'].map(c => (
                        <Box
                            key={c}
                            onClick={() => {
                                if (colorMenuAnchor) handleUpdateStage(colorMenuAnchor.stageId, { color: c });
                                setColorMenuAnchor(null);
                            }}
                            sx={{
                                width: 20, height: 20, borderRadius: '50%',
                                bgcolor: c === 'default' ? 'divider' : `${c}.main`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '2px solid transparent',
                                '&:hover': { transform: 'scale(1.2)', borderColor: 'text.primary' }
                            }}
                        />
                    ))}
                </Box>
            </Menu>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>

            <Menu anchorEl={statusMenuAnchor?.el} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}>
                {stages.map((s) => (
                    <MenuItem key={s.id} onClick={() => { if (statusMenuAnchor) handleStatusUpdate(statusMenuAnchor.id, s.name); setStatusMenuAnchor(null); }}>{s.label}</MenuItem>
                ))}
            </Menu>

            {/* Menú de añadir columnas inspirado en la referencia */}
            <Menu
                anchorEl={addColumnAnchor}
                open={Boolean(addColumnAnchor)}
                onClose={() => setAddColumnAnchor(null)}
                PaperProps={{
                    sx: {
                        minWidth: 220,
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }
                }}
            >
                <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                    AÑADIR CAMPO
                </Typography>
                {hiddenColumns.standard.map(col => (
                    <MenuItem key={col} onClick={() => {
                        const next = [...visibleColumns, col];
                        setVisibleColumns(next);
                        saveConfig(next);
                        setAddColumnAnchor(null);
                    }} sx={{ py: 1 }}>
                        <ListItemIcon sx={{ color: 'primary.main' }}>{COLUMN_ICONS[col] || <ViewColumnIcon fontSize="small" />}</ListItemIcon>
                        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={col.charAt(0).toUpperCase() + col.slice(1).replace('_', ' ')} />
                    </MenuItem>
                ))}
                {hiddenColumns.customs.map(cf => (
                    <MenuItem key={cf.key} onClick={() => {
                        const next = [...visibleColumns, `meta_${cf.key}`];
                        setVisibleColumns(next);
                        saveConfig(next);
                        setAddColumnAnchor(null);
                    }} sx={{ py: 1 }}>
                        <ListItemIcon sx={{ color: 'secondary.main' }}>{COLUMN_ICONS.custom}</ListItemIcon>
                        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={cf.label} />
                    </MenuItem>
                ))}
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { setColumnManagerOpen(true); setAddColumnAnchor(null); }} sx={{ py: 1 }}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} primary="Personalizar Campos" />
                </MenuItem>
            </Menu>
            {/* Diálogo de Selección de Tipo de Campo - Inspirado en Twenty */}
            <Dialog
                open={typeSelectorOpen}
                onClose={() => setTypeSelectorOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: '#0a0a0a',
                        backgroundImage: 'none',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, pt: 4, px: 4 }}>
                    <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>Basic</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>All the basic field types you need to start</Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 4 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {FIELD_TYPES.map((type) => (
                            <Grid item xs={12} sm={6} key={type.id}>
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

            {/* Diálogo para Nombre del Campo */}
            <Dialog
                open={fieldNameDialogOpen}
                onClose={() => setFieldNameDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nombre del Campo</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Introduce el nombre para tu nuevo campo de tipo <b>{FIELD_TYPES.find(t => t.id === selectedFieldType)?.label}</b>.
                    </Typography>
                    <TextField
                        fullWidth
                        autoFocus
                        label="Nombre del campo (ej: LinkedIn)"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomField()}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setFieldNameDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddCustomField}
                        disabled={!newFieldName}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Crear Campo
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper >
    );
}

