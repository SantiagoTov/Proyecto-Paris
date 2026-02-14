import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Switch
} from '@mui/material';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import WebhookIcon from '@mui/icons-material/Webhook';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Integrations() {
    const [crmType, setCrmType] = useState('hubspot');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setFetchLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_crm_integrations')
                .select('*')
                .eq('user_id', user.id);

            if (data) {
                setIntegrations(data);
                // Pre-fill form if current type exists
                const current = data.find(i => i.crm_type === crmType);
                if (current) {
                    setApiKey(current.api_key);
                    setApiUrl(current.api_url || '');
                }
            }
        } catch (err) {
            console.error('Error loading integrations:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleTabChange = (_: any, newValue: number) => {
        setTabValue(newValue);
        setApiKey('');
        if (newValue === 0) {
            setCrmType('hubspot');
            setApiUrl('https://api.hubapi.com/crm/v3/objects/companies');
        } else {
            setCrmType('custom');
            setApiUrl('');
        }
    };

    const handleCrmTypeChange = (type: string) => {
        setCrmType(type);
        if (type === 'hubspot') setApiUrl('https://api.hubapi.com/crm/v3/objects/companies');
        else if (type === 'twenty') setApiUrl('https://api.twenty.com/rest/companies');
        else if (type === 'salesforce') setApiUrl('https://your-domain.my.salesforce.com/services/data/v60.0/sobjects/Account');
    };

    const handleSave = async () => {
        if (!apiKey) {
            setError('La clave o token es obligatorio');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const { error: upsertError } = await supabase
                .from('user_crm_integrations')
                .upsert({
                    user_id: user.id,
                    crm_type: crmType,
                    api_key: apiKey,
                    api_url: apiUrl,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,crm_type' });

            if (upsertError) throw upsertError;

            setSuccess(true);
            loadIntegrations();
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('user_crm_integrations')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            loadIntegrations();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta integración?')) return;
        try {
            const { error } = await supabase
                .from('user_crm_integrations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadIntegrations();
        } catch (err) {
            console.error('Error deleting integration:', err);
        }
    };

    function IntegrationList({ data }: { data: any[] }) {
        if (data.length === 0) return (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                No hay conexiones configuradas aquí aún.
            </Typography>
        );

        return (
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <List disablePadding>
                    {data.map((integration, index) => (
                        <Box key={integration.id}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                                            {integration.crm_type === 'custom' ? 'Webhook de Salida' : integration.crm_type}
                                        </Typography>
                                    }
                                    secondary={integration.api_url}
                                />
                                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Switch
                                        checked={integration.is_active}
                                        onChange={() => handleToggle(integration.id, integration.is_active)}
                                        color="success"
                                    />
                                    <IconButton edge="end" color="error" onClick={() => handleDelete(integration.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            {index < data.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </Card>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <SettingsInputComponentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" fontWeight="bold">Configuración de Canales</Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Gestiona cómo París IA sincroniza y envía datos a tus plataformas externas.
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
                    <Tab icon={<HubIcon />} iconPosition="start" label="Integración CRM" />
                    <Tab icon={<WebhookIcon />} iconPosition="start" label="Webhooks de Salida" />
                </Tabs>
            </Box>

            {tabValue === 0 ? (
                <Box>
                    <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>Nueva Conexión CRM</Typography>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Elegir CRM</InputLabel>
                                        <Select
                                            value={crmType}
                                            label="Elegir CRM"
                                            onChange={(e) => handleCrmTypeChange(e.target.value)}
                                        >
                                            <MenuItem value="hubspot">HubSpot (Recomendado)</MenuItem>
                                            <MenuItem value="twenty">Twenty CRM</MenuItem>
                                            <MenuItem value="salesforce">Salesforce</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="URL Base del API"
                                        placeholder="https://api.hubapi.com/v1"
                                        value={apiUrl}
                                        onChange={(e) => setApiUrl(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Clave de API (API Key)"
                                        type={showPassword ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={loading}
                                        sx={{ height: 56, borderRadius: 2 }}
                                    >
                                        {loading ? 'Guardando...' : 'Guardar y Activar CRM'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Typography variant="h6" sx={{ mb: 2 }}>Tus CRMs Configurados</Typography>
                    <IntegrationList data={integrations.filter(i => i.crm_type !== 'custom')} />
                </Box>
            ) : (
                <Box>
                    <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Enviar datos a Webhook</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Ideal para Zapier, Make o integraciones personalizadas.
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="URL del Webhook (Destino)"
                                        placeholder="https://hooks.zapier.com/..."
                                        value={apiUrl}
                                        onChange={(e) => setApiUrl(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Token / Secreto de Seguridad (Opcional)"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        startIcon={<WebhookIcon />}
                                        onClick={() => { setCrmType('custom'); handleSave(); }}
                                        disabled={loading}
                                        sx={{ height: 56, borderRadius: 2 }}
                                    >
                                        {loading ? 'Activando...' : 'Conectar Webhook'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Typography variant="h6" sx={{ mb: 2 }}>Webhooks Activos</Typography>
                    <IntegrationList data={integrations.filter(i => i.crm_type === 'custom')} />
                </Box>
            )}

            <Snackbar
                open={success}
                autoHideDuration={4000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%' }}>¡Configuración guardada correctamente!</Alert>
            </Snackbar>
        </Box>
    );
}
