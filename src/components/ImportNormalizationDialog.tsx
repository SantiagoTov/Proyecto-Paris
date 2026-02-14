import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
    Divider,
    TextField
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddIcon from '@mui/icons-material/Add';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (mappedData: any[]) => void;
    rawData: any[];
}

const PREDEFINED_FIELDS = [
    { value: 'title', label: 'Nombre o Negocio' },
    { value: 'phone_number', label: 'Teléfono' },
    { value: 'email', label: 'Correo Electrónico' },
    { value: 'address', label: 'Dirección' },
    { value: 'website', label: 'Sitio Web' },
    { value: 'category', label: 'Categoría' },
    { value: 'rating', label: 'Calificación' },
    { value: 'reviews_count', label: 'Reseñas' },
    { value: 'ignore', label: '(No importar)' }
];

export default function ImportNormalizationDialog({ open, onClose, onConfirm, rawData }: Props) {
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [customFields, setCustomFields] = useState<string[]>([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [showAddField, setShowAddField] = useState(false);

    useEffect(() => {
        if (open && rawData.length > 0) {
            const firstItem = rawData[0];
            const sourceKeys = Object.keys(firstItem);
            const initialMappings: Record<string, string> = {};

            sourceKeys.forEach(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'title' || lowerKey === 'name') initialMappings[key] = 'title';
                else if (lowerKey.includes('phone')) initialMappings[key] = 'phone_number';
                else if (lowerKey.includes('mail')) initialMappings[key] = 'email';
                else if (lowerKey === 'address' || lowerKey === 'location') initialMappings[key] = 'address';
                else if (lowerKey === 'website' || lowerKey === 'url') initialMappings[key] = 'website';
                else if (lowerKey === 'category' || lowerKey === 'type') initialMappings[key] = 'category';
                else if (lowerKey === 'rating') initialMappings[key] = 'rating';
                else if (lowerKey.includes('review')) initialMappings[key] = 'reviews_count';
                else initialMappings[key] = 'metadata'; // Will be treated as generic meta
            });

            setMappings(initialMappings);
        }
    }, [open, rawData]);

    const handleConfirm = () => {
        const processedData = rawData.map(item => {
            const newItem: any = { metadata: {} };
            Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
                if (targetKey === 'ignore') return;

                // If it's a standard field
                if (PREDEFINED_FIELDS.some(f => f.value === targetKey)) {
                    newItem[targetKey] = item[sourceKey];
                } else if (targetKey === 'metadata') {
                    newItem.metadata[sourceKey] = item[sourceKey];
                } else {
                    // Custom field mapped by user
                    newItem.metadata[targetKey] = item[sourceKey];
                }
            });
            return newItem;
        });
        onConfirm(processedData);
    };

    const handleAddCustomField = () => {
        if (!newFieldName) return;
        const normalized = newFieldName.toLowerCase().replace(/\s+/g, '_');
        if (!customFields.includes(normalized)) {
            setCustomFields([...customFields, normalized]);
        }
        setNewFieldName('');
        setShowAddField(false);
    };

    if (rawData.length === 0) return null;

    const sourceKeys = Object.keys(rawData[0]);
    const previewCount = 3; // Hardcoding for preview as state was removed in diff

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoFixHighIcon color="primary" /> Organizar e Importar
            </DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Indica en qué parte de tu tabla quieres guardar cada dato encontrado por el Radar. Los datos que no coincidan se guardarán como "Información Adicional".
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Organización de datos</Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddField(true)}
                        color="secondary"
                    >
                        Crear Campo Destino
                    </Button>
                </Box>

                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 4 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Dato encontrado</TableCell>
                                <TableCell align="center"></TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tu columna de destino</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sourceKeys.map((key) => (
                                <TableRow key={key}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{key}</Typography>
                                        <Typography variant="caption" color="text.secondary">ej: {String(rawData[0][key]).substring(0, 40)}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <CompareArrowsIcon color="disabled" fontSize="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={mappings[key] || 'metadata'}
                                            onChange={(e) => setMappings({ ...mappings, [key]: e.target.value })}
                                            size="small"
                                            fullWidth
                                        >
                                            <MenuItem value="metadata"><em>-- Información Adicional --</em></MenuItem>
                                            <Divider />
                                            {PREDEFINED_FIELDS.map(f => (
                                                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                                            ))}
                                            {customFields.length > 0 && <Divider />}
                                            {customFields.map(cf => (
                                                <MenuItem key={cf} value={cf}>✨ {cf}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>

                {showAddField && (
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,215,0,0.05)', borderRadius: 2, mb: 3, border: '1px dashed orange' }}>
                        <Typography variant="subtitle2" gutterBottom>Crear nuevo campo de destino</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Nombre del campo (ej: NIT, Redes Sociales...)"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                autoFocus
                            />
                            <Button variant="contained" color="secondary" onClick={handleAddCustomField}>Crear</Button>
                            <Button onClick={() => setShowAddField(false)}>Cancelar</Button>
                        </Box>
                    </Box>
                )}

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Previsualización (3 filas)</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow>
                                {PREDEFINED_FIELDS.filter(f => f.value !== 'ignore').map(f => (
                                    <TableCell key={f.value} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{f.label}</TableCell>
                                ))}
                                {customFields.map(cf => (
                                    <TableCell key={cf} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>✨ {cf}</TableCell>
                                ))}
                                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Información Adicional</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rawData.slice(0, previewCount).map((row, i) => {
                                const processedRow: any = { metadata: {} };
                                Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
                                    if (targetKey === 'ignore') return;
                                    if (PREDEFINED_FIELDS.some(f => f.value === targetKey)) {
                                        processedRow[targetKey] = row[sourceKey];
                                    } else if (targetKey === 'metadata') {
                                        processedRow.metadata[sourceKey] = row[sourceKey];
                                    } else { // Custom field
                                        processedRow.metadata[targetKey] = row[sourceKey];
                                    }
                                });

                                return (
                                    <TableRow key={i}>
                                        {PREDEFINED_FIELDS.filter(f => f.value !== 'ignore').map(f => (
                                            <TableCell key={f.value}>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                    {processedRow[f.value] || '-'}
                                                </Typography>
                                            </TableCell>
                                        ))}
                                        {customFields.map(cf => (
                                            <TableCell key={cf}>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                    {processedRow.metadata[cf] || '-'}
                                                </Typography>
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                {Object.keys(processedRow.metadata).length > 0 ? JSON.stringify(processedRow.metadata) : '-'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button onClick={handleConfirm} variant="contained" size="large" sx={{ borderRadius: 2, px: 4 }}>
                    Importar {rawData.length} Prospectos
                </Button>
            </DialogActions>
        </Dialog>
    );
}
