import {
    Dialog,
    Box,
    Typography,
    Avatar,
    Grid,
    IconButton,
    Tabs,
    Tab,
    Divider,
    Chip,
    Paper,
    Link,
    TextField,
    List,
    Tooltip,
    MenuItem,
    Select,
    FormControl
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LabelIcon from '@mui/icons-material/Label';
import NotesIcon from '@mui/icons-material/Notes';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Helpers (podrían importarse de utils si existieran, los duplico por seguridad y rapidez)
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

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface LeadDetailDialogProps {
    open: boolean;
    onClose: () => void;
    lead: any;
    onEdit: () => void;
    stages: any[];
    agents: any[];
    customFields?: any[];
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`lead-tabpanel-${index}`}
            aria-labelledby={`lead-tab-${index}`}
            {...other}
            style={{ height: '100%', overflowY: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function LeadDetailDialog({ open, onClose, lead, onEdit, stages, agents, customFields = [] }: LeadDetailDialogProps) {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState<string>('');

    useEffect(() => {
        if (user) setAssigneeId(user.id);
    }, [user]);

    const fetchTasks = async () => {
        if (!lead?.id) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false });
        if (data) setTasks(data);
    };

    useEffect(() => {
        if (open && lead?.id) {
            fetchTasks();
        }
    }, [open, lead?.id]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !lead?.id) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('tasks').insert([{
            title: newTaskTitle,
            lead_id: lead.id,
            user_id: user.id,
            status: 'todo',
            assignee_id: assigneeId,
            assignee_type: assigneeId === user.id ? 'user' : 'agent'
        }]);

        if (!error) {
            setNewTaskTitle('');
            fetchTasks();
        }
    };

    const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    const handleDeleteTask = async (taskId: string) => {
        await supabase.from('tasks').delete().eq('id', taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    if (!lead) return null;

    const leadTitle = typeof lead.title === 'string' ? lead.title : (lead.title?.title || 'Sin título');
    const currentStage = stages.find(s => s.name === lead.status);
    const assignedAgent = agents.find(a => a.id === lead.agent_assigned);

    const DetailRow = ({ icon, label, value }: { icon: any, label: string, value: string | React.ReactNode }) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5 }}>
            <Box sx={{ color: 'text.secondary', mr: 2, mt: 0.3 }}>{icon}</Box>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 500 }}>
                    {label}
                </Typography>
                <Typography component="div" variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {value && typeof value === 'object' && !React.isValidElement(value)
                        ? JSON.stringify(value)
                        : (value || <span style={{ opacity: 0.3 }}>-</span>)
                    }
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f0f0f', // Fondo muy oscuro tipo Twenty
                    backgroundImage: 'none',
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)'
                }
            }}
        >
            {/* Header Toolbar */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                bgcolor: '#141414'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: stringToColor(leadTitle),
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {getInitials(leadTitle)}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {leadTitle}
                    </Typography>
                    <Chip
                        label={currentStage?.label || (typeof lead.status === 'string' ? lead.status : 'Sin estado')}
                        size="small"
                        sx={{
                            height: 24,
                            bgcolor: currentStage?.color ? `${currentStage.color}.main` : 'primary.main',
                            color: 'white', // Texto blanco para contraste en los chips coloreados
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 1
                        }}
                    />
                </Box>
                <Box>
                    <IconButton onClick={onEdit} sx={{ mr: 1, color: 'text.secondary', '&:hover': { color: 'white' } }}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: 'white' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* Sidebar Izquierdo (Detalles) */}
                <Grid size={{ xs: 12, md: 3.5, lg: 3 }} sx={{
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                    overflowY: 'auto',
                    bgcolor: '#141414',
                    p: 3
                }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: stringToColor(leadTitle),
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                mx: 'auto',
                                mb: 2,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                            }}
                        >
                            {getInitials(leadTitle)}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {leadTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Añadido el {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Fecha desconocida'}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                        DATOS GENERALES
                    </Typography>

                    <DetailRow
                        icon={<PersonIcon fontSize="small" />}
                        label="Responsable / Contacto"
                        value={lead.owner_name}
                    />
                    <DetailRow
                        icon={<BusinessIcon fontSize="small" />}
                        label="Categoría"
                        value={<Chip label={typeof lead.category === 'string' ? lead.category : 'General'} size="small" variant="outlined" sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }} />}
                    />
                    <DetailRow
                        icon={<LocationOnIcon fontSize="small" />}
                        label="Ubicación"
                        value={[lead.city, lead.country].filter(Boolean).join(', ')}
                    />
                    <DetailRow
                        icon={<PhoneIcon fontSize="small" />}
                        label="Teléfono"
                        value={lead.phone_number}
                    />
                    <DetailRow
                        icon={<EmailIcon fontSize="small" />}
                        label="Email"
                        value={lead.email}
                    />

                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                        GESTIÓN
                    </Typography>

                    <DetailRow
                        icon={<PersonIcon fontSize="small" sx={{ color: 'primary.main' }} />}
                        label="Asesor Asignado"
                        value={assignedAgent ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: stringToColor(assignedAgent.name) }}
                                >
                                    {getInitials(assignedAgent.name)}
                                </Avatar>
                                {assignedAgent.name}
                            </Box>
                        ) : 'Sin asignar'}
                    />

                    {lead.metadata && Object.keys(lead.metadata).length > 0 && (
                        <>
                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                                CAMPOS PERSONALIZADOS
                            </Typography>
                            {Object.entries(lead.metadata).map(([key, value]: [string, any]) => {
                                const fieldDef = customFields?.find(cf => cf.key === key);
                                const label = fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

                                let displayValue: React.ReactNode = value;

                                if (fieldDef?.type === 'rating') {
                                    displayValue = (
                                        <Box sx={{ display: 'flex', color: '#FFB800' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon key={i} sx={{ fontSize: 16, opacity: i < (value || 0) ? 1 : 0.2 }} />
                                            ))}
                                        </Box>
                                    );
                                } else if (fieldDef?.type === 'url') {
                                    displayValue = (
                                        <Link
                                            href={value.startsWith('http') ? value : `https://${value}`}
                                            target="_blank"
                                            sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LanguageIcon sx={{ fontSize: 14 }} />
                                                {value}
                                            </Box>
                                        </Link>
                                    );
                                } else if (fieldDef?.type === 'email') {
                                    displayValue = (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                            {value}
                                        </Box>
                                    );
                                }

                                return (
                                    <DetailRow
                                        key={key}
                                        icon={<LabelIcon fontSize="small" />}
                                        label={label}
                                        value={displayValue}
                                    />
                                );
                            })}
                        </>
                    )}

                </Grid>

                {/* Panel Derecho (Tabs) */}
                <Grid size={{ xs: 12, md: 8.5, lg: 9 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#141414' }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_, v) => setTabValue(v)}
                            sx={{
                                minHeight: 48,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    minHeight: 48,
                                    fontSize: '0.9rem',
                                    color: 'text.secondary',
                                    '&.Mui-selected': { color: 'white' }
                                },
                                '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 2 }
                            }}
                        >
                            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Historial" />
                            <Tab icon={<NotesIcon fontSize="small" />} iconPosition="start" label="Notas" />
                            <Tab icon={<TaskAltIcon fontSize="small" />} iconPosition="start" label="Tareas" />
                            <Tab icon={<AttachFileIcon fontSize="small" />} iconPosition="start" label="Archivos" />
                            <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Correos" />
                        </Tabs>
                    </Box>

                    {/* Contenido de Tabs */}
                    <Box sx={{ flexGrow: 1, bgcolor: '#0f0f0f', overflowY: 'auto' }}>
                        <CustomTabPanel value={tabValue} index={0}>
                            {/* Visualización de Timeline Placeholder - Estilo Twenty */}
                            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, textAlign: 'center', opacity: 0.7 }}>
                                <Box
                                    component="img"
                                    src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png"
                                    sx={{ width: 120, mb: 2, filter: 'grayscale(100%) opacity(0.5)' }}
                                />
                                <Typography variant="h6" gutterBottom color="text.secondary">
                                    No hay actividad reciente
                                </Typography>
                                <Typography variant="body2" color="text.disabled">
                                    No hay eventos registrados asociados con este contacto.
                                </Typography>
                            </Box>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={1}>
                            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                                <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="subtitle2" gutterBottom>Nota del sistema</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Contacto creado manualmente el {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Fecha desconocida'}.
                                    </Typography>
                                </Paper>
                            </Box>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                            <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="¿Qué gestión hay que hacer?"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'rgba(255,255,255,0.03)',
                                                    borderRadius: 2
                                                }
                                            }}
                                        />
                                        <IconButton
                                            onClick={handleAddTask}
                                            color="primary"
                                            disabled={!newTaskTitle.trim()}
                                            sx={{ bgcolor: 'rgba(124, 58, 237, 0.1)', borderRadius: 2 }}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>ASIGNAR A:</Typography>
                                        <FormControl size="small" sx={{ minWidth: 200 }}>
                                            <Select
                                                value={assigneeId}
                                                onChange={(e) => setAssigneeId(e.target.value)}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    height: 32,
                                                    bgcolor: 'rgba(255,255,255,0.03)',
                                                    borderRadius: 2
                                                }}
                                            >
                                                <MenuItem value={user?.id || ''} sx={{ fontSize: '0.75rem' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'secondary.main' }}>Y</Avatar>
                                                        Yo (Usuario)
                                                    </Box>
                                                </MenuItem>
                                                {agents?.map(agent => (
                                                    <MenuItem key={agent.id} value={agent.id} sx={{ fontSize: '0.75rem' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'primary.main' }}>
                                                                {agent.name.charAt(0)}
                                                            </Avatar>
                                                            {agent.name}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>

                                {tasks.length === 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, opacity: 0.5 }}>
                                        <TaskAltIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
                                        <Typography variant="body2" color="text.secondary">No hay tareas pendientes</Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {tasks.map((task) => (
                                            <Paper
                                                key={task.id}
                                                sx={{
                                                    p: 2,
                                                    bgcolor: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid',
                                                    borderColor: task.status === 'done' ? 'transparent' : 'rgba(255,255,255,0.05)',
                                                    borderRadius: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    opacity: task.status === 'done' ? 0.5 : 1,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleTaskStatus(task.id, task.status)}
                                                    color={task.status === 'done' ? 'success' : 'default'}
                                                >
                                                    {task.status === 'done' ? <DoneIcon fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                                                </IconButton>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            textDecoration: task.status === 'done' ? 'line-through' : 'none'
                                                        }}
                                                    >
                                                        {task.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        Agregada el {new Date(task.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Tooltip title={task.assignee_type === 'user' ? 'Asignado a ti' : 'Asignado a Agente'}>
                                                    <Avatar sx={{
                                                        width: 20, height: 20,
                                                        fontSize: '0.6rem',
                                                        bgcolor: task.assignee_type === 'user' ? 'secondary.main' : 'primary.main',
                                                        opacity: task.status === 'done' ? 0.3 : 1
                                                    }}>
                                                        {task.assignee_type === 'user' ? 'Y' : <PersonIcon sx={{ fontSize: 12 }} />}
                                                    </Avatar>
                                                </Tooltip>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)} sx={{ opacity: 0, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }} className="delete-btn">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Paper>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </CustomTabPanel>
                    </Box>
                </Grid>
            </Grid>
        </Dialog>
    );
}
