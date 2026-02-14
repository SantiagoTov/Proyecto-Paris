import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Card,
    CardContent,
    Avatar,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Breadcrumbs,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    NavigateNext as NavigateNextIcon,
    Assignment as TaskIcon,
    MoreVert as MoreIcon,
    Search as SearchIcon,
    Schedule as ClockIcon,
    CheckCircle as DoneIcon,
    Pending as PendingIcon,
    RadioButtonUnchecked as TodoIcon,
    Repeat as RepeatIcon,
    EventRepeat as RecurringIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    due_date: string | null;
    lead_id: string | null;
    assignee_id: string | null;
    assignee_type: 'user' | 'agent' | null;
    created_at: string;
    is_recurring: boolean;
    recurrence_interval: number | null;
    recurrence_period: 'days' | 'weeks' | 'months' | null;
    leads?: {
        title: string;
        phone_number: string;
        email: string;
    };
}

interface Agent {
    id: string;
    name: string;
    role: string;
}

interface Lead {
    id: string;
    title: string;
}

const STAGES = [
    { id: 'todo', label: 'Por hacer', color: '#A1A1AA', icon: <TodoIcon fontSize="small" /> },
    { id: 'in_progress', label: 'En progreso', color: '#7C3AED', icon: <PendingIcon fontSize="small" /> },
    { id: 'done', label: 'Finalizado', color: '#10B981', icon: <DoneIcon fontSize="small" /> },
];

export default function Tasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [tasksRes, leadsRes, agentsRes] = await Promise.all([
                supabase
                    .from('tasks')
                    .select('*, leads(title, phone_number, email)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('leads')
                    .select('id, title')
                    .eq('user_id', user.id),
                supabase
                    .from('agents')
                    .select('id, name, role')
                    .eq('user_id', user.id)
            ]);

            if (tasksRes.data) setTasks(tasksRes.data as any);
            if (leadsRes.data) setLeads(leadsRes.data);
            if (agentsRes.data) setAgents(agentsRes.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimezone = async () => {
        if (!user) return;
        const { data } = await supabase.from('user_table_config').select('metadata').eq('user_id', user.id).eq('table_name', 'general_settings').single();
        if (data?.metadata?.timezone) {
            setUserTimezone(data.metadata.timezone);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTimezone();
    }, [user]);

    const handleSaveTask = async () => {
        if (!user || !editingTask?.title) return;

        const taskData = {
            ...editingTask,
            user_id: user.id,
            assignee_type: editingTask.assignee_id === user.id ? 'user' : (editingTask.assignee_id ? 'agent' : 'user'),
            updated_at: new Date().toISOString(),
        };

        // Remove joins before saving
        delete (taskData as any).leads;

        if (editingTask.id) {
            await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
        } else {
            const { data: newTask, error: insertError } = await supabase.from('tasks').insert([taskData]).select().single();

            // Si es recurrente y está ligada a un cliente, guardar el patrón en el cliente
            if (!insertError && newTask && newTask.is_recurring && newTask.lead_id) {
                const { data: lead } = await supabase.from('leads').select('metadata, behavioral_insights').eq('id', newTask.lead_id).single();
                if (lead) {
                    const updatedInsights = {
                        ...(lead.behavioral_insights || {}),
                        purchase_pattern: {
                            interval: newTask.recurrence_interval,
                            period: newTask.recurrence_period,
                            last_order_task_id: newTask.id,
                            updated_at: new Date().toISOString()
                        }
                    };
                    await supabase.from('leads').update({ behavioral_insights: updatedInsights }).eq('id', newTask.lead_id);
                }
            }
        }

        setDialogOpen(false);
        fetchData();
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            await supabase.from('tasks').delete().eq('id', id);
            fetchData();
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        const { data: currentTask } = await supabase.from('tasks').select('*').eq('id', taskId).single();

        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);

        // Lógica de Recurrencia: Si se marca como 'done' y es recurrente, crear la siguiente
        if (newStatus === 'done' && currentTask?.is_recurring) {
            const nextDueDate = new Date(currentTask.due_date || new Date());
            const interval = currentTask.recurrence_interval || 7;

            if (currentTask.recurrence_period === 'days') nextDueDate.setDate(nextDueDate.getDate() + interval);
            else if (currentTask.recurrence_period === 'weeks') nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
            else if (currentTask.recurrence_period === 'months') nextDueDate.setMonth(nextDueDate.getMonth() + interval);

            const { id: _id, created_at: _ca, status: _st, ...newTaskData } = currentTask;
            await supabase.from('tasks').insert([{
                ...newTaskData,
                status: 'todo',
                due_date: nextDueDate.toISOString(),
                created_at: new Date().toISOString()
            }]);

            fetchData();
        }

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.leads?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDrop = async (e: React.DragEvent, status: string) => {
        const taskId = e.dataTransfer.getData('taskId');
        setDragOverStage(null);
        setDraggingTaskId(null);
        if (taskId) {
            handleStatusChange(taskId, status);
        }
    };

    if (loading && tasks.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1, color: 'text.secondary' }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TaskIcon fontSize="inherit" /> Espacio de trabajo
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight="bold">Tareas</Typography>
                    </Breadcrumbs>
                    <Typography variant="h4" fontWeight="800">Tareas</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Buscar tareas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                        }}
                        sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' } }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setEditingTask({ status: 'todo' }); setDialogOpen(true); }}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                    >
                        Nueva Tarea
                    </Button>
                </Stack>
            </Box>

            {/* Kanban Board */}
            <Box sx={{ flexGrow: 1, overflowX: 'auto', display: 'flex', gap: 2, pb: 2 }}>
                {STAGES.map(stage => (
                    <Box
                        key={stage.id}
                        onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                        onDragLeave={() => setDragOverStage(null)}
                        onDrop={(e) => onDrop(e, stage.id)}
                        sx={{
                            minWidth: 320,
                            maxWidth: 320,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: dragOverStage === stage.id ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                            borderRadius: 3,
                            transition: 'all 0.2s',
                            opacity: draggingTaskId && draggingTaskId !== stage.id ? 0.8 : 1
                        }}
                    >
                        {/* Stage Header */}
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    p: 0.5, borderRadius: 1, bgcolor: stage.color + '22', color: stage.color
                                }}>
                                    {stage.icon}
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {stage.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                    {filteredTasks.filter(t => t.status === stage.id).length}
                                </Typography>
                            </Box>
                            <IconButton size="small"><MoreIcon fontSize="small" /></IconButton>
                        </Box>

                        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

                        {/* Cards Stack */}
                        <Stack spacing={1.5} sx={{ px: 1, flexGrow: 1 }}>
                            {filteredTasks
                                .filter(t => t.status === stage.id)
                                .map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={() => { setEditingTask(task); setDialogOpen(true); }}
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                    />
                                ))
                            }
                            <Button
                                fullWidth
                                onClick={() => { setEditingTask({ status: stage.id as any }); setDialogOpen(true); }}
                                sx={{
                                    justifyContent: 'flex-start', color: 'text.disabled', textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', color: 'white' }
                                }}
                                startIcon={<AddIcon fontSize="small" />}
                            >
                                Nueva
                            </Button>
                        </Stack>
                    </Box>
                ))}
            </Box>

            {/* Task Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: { borderRadius: 4, bgcolor: '#0D0D0D', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editingTask?.id ? 'Editar Tarea' : 'Nueva Tarea'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Título de la tarea"
                            autoFocus
                            variant="outlined"
                            value={editingTask?.title || ''}
                            onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            multiline
                            rows={3}
                            value={editingTask?.description || ''}
                            onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    label="Estado"
                                    value={editingTask?.status || 'todo'}
                                    onChange={(e) => setEditingTask(prev => ({ ...prev, status: e.target.value as any }))}
                                >
                                    {STAGES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="Fecha y Hora límite"
                                InputLabelProps={{ shrink: true }}
                                value={editingTask?.due_date ? new Date(new Date(editingTask.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setEditingTask(prev => ({ ...prev, due_date: new Date(e.target.value).toISOString() }))}
                                helperText={`Zona horaria configurada: ${userTimezone}`}
                            />
                        </Stack>
                        <FormControl fullWidth>
                            <InputLabel>Asignado a</InputLabel>
                            <Select
                                label="Asignado a"
                                value={editingTask?.assignee_id || user?.id || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setEditingTask(prev => ({
                                        ...prev,
                                        assignee_id: val,
                                        assignee_type: val === user?.id ? 'user' : 'agent'
                                    }));
                                }}
                            >
                                <MenuItem value={user?.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'secondary.main' }}>
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        Yo (Usuario)
                                    </Box>
                                </MenuItem>
                                {agents.map(agent => (
                                    <MenuItem key={agent.id} value={agent.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                                                {agent.name.charAt(0)}
                                            </Avatar>
                                            {agent.name} (Agente IA)
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Prospecto Relacionado</InputLabel>
                            <Select
                                label="Prospecto Relacionado"
                                value={editingTask?.lead_id || ''}
                                onChange={(e) => setEditingTask(prev => ({ ...prev, lead_id: e.target.value }))}
                            >
                                <MenuItem value="">Ninguno</MenuItem>
                                {leads.map(lead => (
                                    <MenuItem key={lead.id} value={lead.id}>{lead.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider>
                            <Chip label="Configuración de Recurrencia" size="small" icon={<RepeatIcon />} />
                        </Divider>

                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <FormControl fullWidth size="small">
                                    <InputLabel>¿Es recurrente?</InputLabel>
                                    <Select
                                        label="¿Es recurrente?"
                                        value={editingTask?.is_recurring ? 'yes' : 'no'}
                                        onChange={(e) => setEditingTask(prev => ({ ...prev, is_recurring: e.target.value === 'yes' }))}
                                    >
                                        <MenuItem value="no">No, es tarea única</MenuItem>
                                        <MenuItem value="yes">Sí, repetir automáticamente</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            {editingTask?.is_recurring && (
                                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                    <TextField
                                        label="Repetir cada"
                                        type="number"
                                        size="small"
                                        value={editingTask?.recurrence_interval || 1}
                                        onChange={(e) => setEditingTask(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) }))}
                                        sx={{ width: 120 }}
                                    />
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Periodo</InputLabel>
                                        <Select
                                            label="Periodo"
                                            value={editingTask?.recurrence_period || 'days'}
                                            onChange={(e) => setEditingTask(prev => ({ ...prev, recurrence_period: e.target.value as any }))}
                                        >
                                            <MenuItem value="days">Días</MenuItem>
                                            <MenuItem value="weeks">Semanas</MenuItem>
                                            <MenuItem value="months">Meses</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    {editingTask?.id && (
                        <Button color="error" onClick={() => handleDeleteTask(editingTask.id!)}>Eliminar</Button>
                    )}
                    <Button variant="contained" onClick={handleSaveTask} sx={{ borderRadius: 2, px: 4 }}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function TaskCard({ task, onEdit, onDragStart }: { task: Task, onEdit: () => void, onDragStart: (e: React.DragEvent) => void }) {
    const { user } = useAuth();
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

    // Determine assignee display
    const isSelf = task.assignee_id === user?.id || (task.assignee_type === 'user' && !task.assignee_id);
    const assigneeInitial = isSelf ? (user?.email?.charAt(0).toUpperCase() || '?') : '?';
    const assigneeColor = isSelf ? 'secondary.main' : 'primary.main';

    return (
        <Card
            draggable
            onDragStart={onDragStart}
            sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={onEdit}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                    {task.title}
                </Typography>

                {task.leads && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'primary.main' }}>
                            {task.leads.title.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="primary.light" sx={{ fontWeight: 600 }}>
                            {task.leads.title}
                        </Typography>
                    </Box>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    {task.is_recurring && (
                        <Tooltip title={`Se repite cada ${task.recurrence_interval} ${task.recurrence_period}`}>
                            <Chip
                                icon={<RecurringIcon sx={{ fontSize: '12px !important' }} />}
                                label="Recurrente"
                                size="small"
                                sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: 'rgba(192, 38, 211, 0.1)',
                                    color: '#C026D3',
                                    border: '1px solid rgba(192, 38, 211, 0.2)'
                                }}
                            />
                        </Tooltip>
                    )}
                    {task.due_date && (
                        <Chip
                            icon={<ClockIcon sx={{ fontSize: '12px !important' }} />}
                            label={new Date(task.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            size="small"
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                                color: isOverdue ? '#EF4444' : 'text.secondary',
                                border: '1px solid',
                                borderColor: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)'
                            }}
                        />
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title={isSelf ? 'Asignado a ti' : 'Asignado a Agente IA'}>
                        <Avatar sx={{
                            width: 22, height: 22,
                            bgcolor: assigneeColor,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {assigneeInitial}
                        </Avatar>
                    </Tooltip>
                </Stack>
            </CardContent>
        </Card>
    );
}
