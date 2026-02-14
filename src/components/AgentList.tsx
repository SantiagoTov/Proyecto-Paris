import { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    Avatar,
    Switch,
    Tooltip,
    IconButton,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Agent {
    id: string;
    name: string;
    role: string;
    status: string;
    gender: string;
    target_config: { keyword: string };
    deleted_at?: string | null;
}

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

// Generar avatar basado en el nombre y género del agente
const getAvatarUrl = (name: string, gender: string): string => {
    const avatarList = gender?.toLowerCase() === 'femenino' || gender?.toLowerCase() === 'female'
        ? AVATARS.female
        : AVATARS.male;

    // Usar el hash del nombre para seleccionar consistentemente el mismo avatar
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarList[hash % avatarList.length];
};

export default function AgentList() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [deletedAgents, setDeletedAgents] = useState<Agent[]>([]);
    const [recycleBinOpen, setRecycleBinOpen] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        fetchAgents();
    }, [user]);

    const fetchAgents = async () => {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar agentes:', error);
        } else {
            setAgents(data || []);
        }
    };

    const fetchDeletedAgents = async () => {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

        if (error) {
            console.error('Error al cargar agentes eliminados:', error);
        } else {
            setDeletedAgents(data || []);
        }
    };

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

    // ...

    const handleDeleteAgent = (agentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setAgentToDelete(agentId);
        setDeleteConfirmationOpen(true);
    };

    const confirmDeleteAgent = async () => {
        if (!agentToDelete) return;

        try {
            const { error } = await supabase
                .from('agents')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', agentToDelete);

            if (error) throw error;

            setAgents(prev => prev.filter(a => a.id !== agentToDelete));
            fetchDeletedAgents(); // Actualizar papelera
            setSnackbar({
                open: true,
                message: 'Agente enviado a la papelera',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar agente:', error);
            setSnackbar({
                open: true,
                message: 'Error al eliminar el agente',
                severity: 'error'
            });
        } finally {
            setDeleteConfirmationOpen(false);
            setAgentToDelete(null);
        }
    };

    const handleRestoreAgent = async (agentId: string) => {
        try {
            const { error } = await supabase
                .from('agents')
                .update({ deleted_at: null })
                .eq('id', agentId);

            if (error) throw error;

            setDeletedAgents(prev => prev.filter(a => a.id !== agentId));
            fetchAgents(); // Actualizar lista principal
            setSnackbar({
                open: true,
                message: 'Agente restaurado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al restaurar agente:', error);
            setSnackbar({
                open: true,
                message: 'Error al restaurar el agente',
                severity: 'error'
            });
        }
    };

    const handleDeletePermanently = async (agentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este agente permanentemente? Esta acción NO se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('agents')
                .delete()
                .eq('id', agentId);

            if (error) throw error;

            setDeletedAgents(prev => prev.filter(a => a.id !== agentId));
            setSnackbar({
                open: true,
                message: 'Agente eliminado permanentemente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar agente:', error);
            setSnackbar({
                open: true,
                message: 'Error al eliminar el agente',
                severity: 'error'
            });
        }
    };


    const handleToggleStatus = async (agent: Agent, event: React.MouseEvent) => {
        event.stopPropagation(); // Evitar navegación al detalle

        const newStatus = agent.status === 'active' ? 'paused' : 'active';
        setUpdating(agent.id);

        try {
            const { error } = await supabase
                .from('agents')
                .update({ status: newStatus })
                .eq('id', agent.id);

            if (error) throw error;

            // Actualizar estado local
            setAgents(prev => prev.map(a =>
                a.id === agent.id ? { ...a, status: newStatus } : a
            ));

            setSnackbar({
                open: true,
                message: `Agente ${newStatus === 'active' ? 'activado' : 'pausado'} correctamente`,
                severity: 'success'
            });
        } catch (error: any) {
            console.error('Error al actualizar estado:', error);
            setSnackbar({
                open: true,
                message: 'Error al actualizar el estado del agente',
                severity: 'error'
            });
        } finally {
            setUpdating(null);
        }
    };

    const handleEditAgent = (agentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        navigate(`/agent/${agentId}?edit=true`);
    };

    return (
        <Box sx={{ py: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Mis Agentes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestiona tus agentes de voz con IA
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RestoreFromTrashIcon />}
                        onClick={() => {
                            fetchDeletedAgents();
                            setRecycleBinOpen(true);
                        }}
                    >
                        Papelera
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/agent/new')}
                        sx={{
                            px: 3,
                            py: 1,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        Crear Agente
                    </Button>
                </Box>
            </Box>

            {agents.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 3 }}>
                    {agents.map((agent) => (
                        <Card
                            key={agent.id}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    borderColor: 'primary.main',
                                }
                            }}
                            onClick={() => navigate(`/agent/${agent.id}`)}
                        >
                            <CardContent sx={{ p: 3 }}>
                                {/* Header con Avatar y Switch */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Avatar
                                            src={getAvatarUrl(agent.name, agent.gender)}
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                border: '3px solid',
                                                borderColor: agent.status === 'active' ? 'success.main' : 'grey.600',
                                                bgcolor: 'background.paper'
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                {agent.name}
                                            </Typography>
                                            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                                                {agent.role || 'Sin rol definido'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Botones de acción */}
                                    <Box>
                                        <Tooltip title="Editar agente">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleEditAgent(agent.id, e)}
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&:hover': { color: 'primary.main' }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar agente">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleDeleteAgent(agent.id, e)}
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&:hover': { color: 'error.main' }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* Tipo de negocio */}
                                <Paper
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.default',
                                        mb: 3
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                        Tipo de negocio
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {agent.target_config?.keyword || 'Sin definir'}
                                    </Typography>
                                </Paper>

                                {/* Footer con Switch */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Switch
                                            checked={agent.status === 'active'}
                                            onChange={(e) => handleToggleStatus(agent, e as unknown as React.MouseEvent)}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={updating === agent.id}
                                            color="success"
                                            size="small"
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                color: agent.status === 'active' ? 'success.main' : 'text.secondary'
                                            }}
                                        >
                                            {updating === agent.id
                                                ? 'Actualizando...'
                                                : agent.status === 'active' ? 'Activo' : 'Pausado'
                                            }
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="text"
                                        size="small"
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/agent/${agent.id}`);
                                        }}
                                    >
                                        Ver Tablero →
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <Avatar
                        src="https://api.dicebear.com/7.x/personas/svg?seed=NewAgent&backgroundColor=7C3AED"
                        sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 2,
                            border: '3px solid',
                            borderColor: 'primary.main'
                        }}
                    />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tienes agentes creados aún
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Comienza creando tu primer agente de voz con IA para automatizar llamadas.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/agent/new')}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Crear Primer Agente
                    </Button>
                </Paper>
            )}

            {/* Dialogo de Papelera de Reciclaje */}
            <Dialog
                open={recycleBinOpen}
                onClose={() => setRecycleBinOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestoreFromTrashIcon color="action" />
                    Papelera de Reciclaje
                </DialogTitle>
                <DialogContent dividers>
                    {deletedAgents.length === 0 ? (
                        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                            No hay agentes en la papelera.
                        </Typography>
                    ) : (
                        <List>
                            {deletedAgents.map((agent) => (
                                <ListItem key={agent.id} divider>
                                    <ListItemText
                                        primary={agent.name}
                                        secondary={`Eliminado el: ${new Date(agent.deleted_at!).toLocaleDateString()}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Restaurar">
                                            <IconButton edge="end" onClick={() => handleRestoreAgent(agent.id)} color="primary">
                                                <RestoreFromTrashIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar permanentemente">
                                            <IconButton edge="end" onClick={() => handleDeletePermanently(agent.id)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRecycleBinOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialogo de Confirmación de Eliminación */}
            <Dialog
                open={deleteConfirmationOpen}
                onClose={() => setDeleteConfirmationOpen(false)}
            >
                <DialogTitle>¿Enviar a la papelera?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Este agente se moverá a la papelera y podrá ser restaurado después.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmationOpen(false)}>Cancelar</Button>
                    <Button onClick={confirmDeleteAgent} color="error" autoFocus>
                        Enviar a Papelera
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar de notificaciones */}
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
