import { useState, useEffect, useCallback } from 'react';
import {
    Snackbar,
    Alert,
    Box,
    Typography,
    Button,
    IconButton,
    Slide,
    type SlideProps
} from '@mui/material';
import {
    Alarm as AlarmIcon,
    Close as CloseIcon,
    NavigateNext as OpenIcon,
    CheckCircle as DoneIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="left" />;
}

export default function TaskReminderSystem() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [activeTask, setActiveTask] = useState<any>(null);
    const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

    const checkTasks = useCallback(async () => {
        if (!user) return;

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

        const { data: tasks } = await supabase
            .from('tasks')
            .select('*, leads(title)')
            .eq('user_id', user.id)
            .eq('status', 'todo')
            .not('due_date', 'is', null)
            .gte('due_date', now.toISOString())
            .lte('due_date', thirtyMinutesFromNow.toISOString());

        if (tasks && tasks.length > 0) {
            const nextTask = tasks.find(t => !notifiedTasks.has(t.id));

            if (nextTask) {
                // Guardar en el historial de la DB
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: `Tarea próxima: ${nextTask.title}`,
                    message: `Tienes una gestión pendiente para el cliente ${nextTask.leads?.title || 'Sin cliente'}.`,
                    type: 'task_reminder',
                    link: '/tasks'
                });

                setActiveTask(nextTask);
                setNotifiedTasks(prev => new Set([...prev, nextTask.id]));
                setOpen(true);

                try {
                    const audio = new Audio('/notification.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(() => { });
                } catch (e) { }
            }
        }
    }, [user, notifiedTasks]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(checkTasks, 60000);
        checkTasks();
        return () => clearInterval(interval);
    }, [user, checkTasks]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleMarkAsDone = async () => {
        if (!activeTask) return;

        await supabase
            .from('tasks')
            .update({ status: 'done', updated_at: new Date().toISOString() })
            .eq('id', activeTask.id);

        // También marcar la notificación como leída si existe
        await supabase.from('notifications')
            .update({ read: true })
            .eq('user_id', user?.id)
            .ilike('title', `%${activeTask.title}%`);

        setOpen(false);
    };

    const handleGoToTasks = () => {
        navigate('/tasks');
        setOpen(false);
    };

    if (!activeTask) return null;

    const remainingTime = Math.round((new Date(activeTask.due_date).getTime() - new Date().getTime()) / 60000);

    return (
        <Snackbar
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            TransitionComponent={SlideTransition}
            sx={{ mt: 8 }}
        >
            <Alert
                icon={<AlarmIcon fontSize="inherit" />}
                severity="warning"
                onClose={handleClose}
                sx={{
                    width: '100%',
                    minWidth: 320,
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    '& .MuiAlert-icon': { color: '#ffb800' }
                }}
                action={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pr: 1 }}>
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleClose}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
            >
                <Box sx={{ pr: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffb800' }}>
                        ¡Tarea próxima! (En {remainingTime} min)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {activeTask.title}
                    </Typography>
                    {activeTask.leads && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Cliente: {activeTask.leads.title}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<OpenIcon fontSize="small" />}
                            onClick={handleGoToTasks}
                            sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.2 }}
                        >
                            Ver Tareas
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<DoneIcon fontSize="small" />}
                            onClick={handleMarkAsDone}
                            sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.2, borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981' }}
                        >
                            Listo
                        </Button>
                    </Box>
                </Box>
            </Alert>
        </Snackbar>
    );
}
