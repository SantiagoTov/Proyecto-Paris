import { Box, List, ListItem, ListItemButton, ListItemIcon, Tooltip, Divider, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import ContactsIcon from '@mui/icons-material/Contacts';
import ExtensionIcon from '@mui/icons-material/Extension';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    const menuItems = [
        { id: '/', label: 'Mis Prospectos', icon: <ContactsIcon /> },
        { id: '/agents', label: 'Asistentes IA', icon: <PersonIcon /> },
        { id: '/tasks', label: 'Tareas', icon: <AssignmentIcon /> },
        { id: '/calls', label: 'Llamadas Realizadas', icon: <PhoneIcon /> },
        { id: '/integrations', label: 'Conexiones', icon: <ExtensionIcon /> },
        { id: '/data-model', label: 'Configuración', icon: <SettingsIcon /> },
    ];

    return (
        <Box sx={{
            width: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            height: '100%',
            bgcolor: 'background.paper'
        }}>
            {/* Logo */}
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'scale(1.05)'
                    }
                }}
                onClick={() => navigate('/')}
            >
                <Box
                    component="span"
                    sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                    }}
                >
                    P
                </Box>
            </Box>

            <List sx={{ width: '100%', px: 1, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = item.id === '/'
                        ? location.pathname === '/'
                        : (location.pathname === item.id || (item.id === '/agents' && location.pathname.startsWith('/agent')));

                    return (
                        <Tooltip key={item.id} title={item.label} placement="right" arrow>
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    selected={isActive}
                                    onClick={() => navigate(item.id)}
                                    sx={{
                                        borderRadius: 2,
                                        justifyContent: 'center',
                                        py: 1.5,
                                        minHeight: 48,
                                        transition: 'all 0.2s',
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: 'white',
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            color: isActive ? 'white' : 'text.secondary',
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </ListItemButton>
                            </ListItem>
                        </Tooltip>
                    );
                })}
            </List>

            {/* Bottom Actions */}
            <Box sx={{ width: '100%', px: 1, pb: 1 }}>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

                <Tooltip title="Panel de Control" placement="right" arrow>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            onClick={() => navigate('/admin')}
                            selected={location.pathname === '/admin'}
                            sx={{
                                borderRadius: 2,
                                justifyContent: 'center',
                                py: 1.5,
                                minHeight: 48,
                                transition: 'all 0.2s',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 0, color: location.pathname === '/admin' ? 'white' : 'text.secondary' }}>
                                <AdminPanelSettingsIcon />
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                </Tooltip>

                <Tooltip title={`Sesión: ${user?.email}`} placement="right" arrow>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'secondary.main',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {user?.email?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Box>
                </Tooltip>

                <Tooltip title="Cerrar Sesión" placement="right" arrow>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={signOut}
                            sx={{
                                borderRadius: 2,
                                justifyContent: 'center',
                                py: 1.5,
                                minHeight: 48,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: '#ef4444',
                                    '& .MuiListItemIcon-root': {
                                        color: 'white',
                                    }
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                </Tooltip>
            </Box>
        </Box>
    );
}
