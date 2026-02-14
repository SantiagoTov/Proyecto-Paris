import { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    IconButton,
    Button
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Close as CloseIcon,
    Alarm as TaskIcon,
    DeleteOutline as DeleteIcon,
    Circle as UnreadIcon,
    BarChart as ReportIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import AgentReportDialog from './AgentReportDialog';

export default function NotificationPanel({ open, onClose }: { open: boolean, onClose: () => void }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [reportOpen, setReportOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setNotifications(data);
    };

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    const markAsRead = async (id: string, type?: string, metadata?: any) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        if (type === 'agent_report') {
            // Mock data or data from metadata
            setSelectedReport({
                agentName: metadata?.agent_name || 'Agente IA',
                totalCalls: metadata?.total_calls || 12,
                contactsReached: metadata?.contacts || 10,
                successRate: metadata?.rate || 85,
                totalDuration: metadata?.duration || '1h 15m',
                achievements: metadata?.achievements || [
                    '5 Prospectos calificados con alto interés',
                    '8 Correos electrónicos verificados',
                    '3 Citas agendadas automáticamente'
                ],
                metrics: [
                    { label: 'Llamadas contestadas', value: metadata?.contacts || 10, total: metadata?.total_calls || 12, color: '#7C3AED' },
                    { label: 'Interés positivo', value: 7, total: 10, color: '#10B981' },
                    { label: 'Conversión a Pipeline', value: 5, total: 10, color: '#F59E0B' }
                ]
            });
            setReportOpen(true);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = async (id: string) => {
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = async () => {
        if (!user) return;
        await supabase.from('notifications').delete().eq('user_id', user.id);
        setNotifications([]);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 400 },
                    bgcolor: '#0f0f0f',
                    backgroundImage: 'none',
                    borderLeft: '1px solid rgba(255,255,255,0.08)'
                }
            }}
        >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <NotificationsIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">Notificaciones</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={markAllAsRead} sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Marcar todo como leído</Button>
                <Button size="small" onClick={clearAll} color="error" sx={{ fontSize: '0.7rem' }}>Limpiar</Button>
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
                {notifications.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                        <NotificationsIcon sx={{ fontSize: 48, mb: 2, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary">No tienes notificaciones</Typography>
                    </Box>
                ) : (
                    notifications.map((n) => (
                        <ListItem
                            key={n.id}
                            sx={{
                                mb: 1.5,
                                borderRadius: 3,
                                bgcolor: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                                border: '1px solid',
                                borderColor: n.read ? 'rgba(255,255,255,0.04)' : 'rgba(124, 58, 237, 0.2)',
                                transition: 'all 0.2s',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                p: 2,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                            }}
                            onClick={() => markAsRead(n.id, n.type, n.metadata)}
                        >
                            <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    {n.type === 'task_reminder' ? (
                                        <TaskIcon fontSize="small" sx={{ color: '#ffb800' }} />
                                    ) : n.type === 'agent_report' ? (
                                        <ReportIcon fontSize="small" color="secondary" />
                                    ) : (
                                        <NotificationsIcon fontSize="small" color="primary" />
                                    )}
                                </ListItemIcon>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: n.read ? 'text.primary' : 'primary.light' }}>
                                        {n.title}
                                    </Typography>
                                </Box>
                                {!n.read && <UnreadIcon sx={{ fontSize: 10, color: 'primary.main', ml: 1 }} />}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                                {n.message}
                            </Typography>

                            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                    {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </Typography>
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </ListItem>
                    ))
                )}
            </List>
            <AgentReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                reportData={selectedReport}
            />
        </Drawer>
    );
}
