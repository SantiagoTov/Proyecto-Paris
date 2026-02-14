import { createTheme, ThemeProvider, CssBaseline, Box, Paper } from '@mui/material';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AgentList from './components/AgentList';
import AgentWizard from './components/AgentWizard';
import AgentDetail from './components/AgentDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import HistorialLlamadas from './pages/CallHistory';
import CRM from './pages/CRM';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import TaskReminderSystem from './components/TaskReminderSystem';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C3AED', // Violeta Vapi
      light: '#A78BFA',
      dark: '#5B21B6',
    },
    secondary: {
      main: '#10B981', // Verde esmeralda
    },
    background: {
      default: '#0F0F0F',
      paper: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA',
    },
    divider: '#27272A',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #27272A',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #27272A',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#27272A',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

function Layout() {
  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0F0F0F 100%)',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <Paper
        elevation={0}
        square
        sx={{
          width: 72,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          zIndex: 1200
        }}
      >
        <Sidebar />
      </Paper>

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        <TaskReminderSystem />
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<CRM />} />
                <Route path="/agents" element={<AgentList />} />
                <Route path="/agent/new" element={<AgentWizard />} />
                <Route path="/agent/:agentId" element={<AgentDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/calls" element={<HistorialLlamadas />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
