import { useMemo, useState } from 'react';
import {
  Box, Card, Typography, Avatar, Chip, IconButton, Button, Tooltip,
  Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Stack, Badge,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Videocam, Chat, Person, FilterList, Search, Clear } from '@mui/icons-material';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';

export default function StudentsList() {
  const { user } = useAuth();
  const theme = useTheme();
  const { state } = useMockData();
  const { showSnackbar } = useSnackbar();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const myStudents = useMemo(() => {
    if (!user) return [];
    return state.students.filter((s) => s.trainerId === user.id);
  }, [state.students, user]);

  const getNextZoom = (studentId: string) => {
    return state.zoomSessions.find((z) =>
      z.studentIds.includes(studentId) && new Date(z.date + 'T' + z.time) >= new Date()
    );
  };

  const filteredRows = useMemo(() => {
    let rows = myStudents.map((student) => {
      const nextZoom = getNextZoom(student.id);
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        status: student.status,
        paymentStatus: student.paymentStatus,
        paid: student.paidAmount,
        total: student.totalDue,
        nextZoom: nextZoom ? new Date(nextZoom.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Aucun',
        raw: student,
      };
    });

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(query) || r.email.toLowerCase().includes(query));
    }

    if (statusFilter !== 'all') {
        rows = rows.filter(r => r.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
        rows = rows.filter(r => r.paymentStatus === paymentFilter);
    }

    return rows;
  }, [myStudents, state.zoomSessions, searchQuery, statusFilter, paymentFilter]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Client',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
            {params.row.raw.firstName?.[0] || ''}{params.row.raw.lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="labelLarge" sx={{ fontWeight: 700, display: 'block' }}>
              {params.value}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Progression',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{
            borderColor: alpha(theme.palette.text.secondary, 0.2),
            color: 'text.secondary',
            fontSize: '11px',
            fontWeight: 700,
            height: 24,
            textTransform: 'uppercase'
          }}
        />
      ),
    },
    {
        field: 'nextZoom',
        headerName: 'Prochain Zoom',
        width: 150,
        renderCell: (params) => (
          params.value !== 'Aucun' ? (
            <Chip
              icon={<Videocam sx={{ fontSize: 14 }} />}
              label={params.value}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontSize: '11px',
                fontWeight: 700,
                height: 24,
              }}
            />
          ) : (
            <Typography variant="bodySmall" sx={{ color: 'text.disabled' }}>Pas de séance</Typography>
          )
        ),
      },
    {
      field: 'paymentStatus',
      headerName: 'Statut Financier',
      width: 120,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value === 'OK' ? 'À JOUR' : 'EN RETARD'}
            size="small"
            color={params.value === 'OK' ? 'success' : 'error'}
            variant="filled"
            sx={{ fontWeight: 800, fontSize: '10px', height: 22 }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Envoyer un message">
            <IconButton
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
                onClick={() => showSnackbar(`Messagerie avec ${params.row.name}`)}
            >
                <Chat sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fiche client">
            <IconButton
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.08) } }}
                onClick={() => showSnackbar(`Détails de ${params.row.name}`)}
            >
                <Person sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
  };

  if (myStudents.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        <PageHeader 
            title="Mes élèves"
            subtitle="Vous n'avez pas encore d'élèves assignés"
            breadcrumbs={[{ label: 'Mon Espace' }, { label: 'Élèves' }]}
        />
        <Card sx={{ borderRadius: 6, textAlign: 'center', py: 12, border: `2px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.text.primary, 0.01), boxShadow: 'none' }}>
          <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.3 }} />
          <Typography variant="headlineSmall" sx={{ fontWeight: 800, mb: 1 }}>
            Aucun élève
          </Typography>
          <Typography variant="bodyLarge" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            Les élèves apparaîtront ici dès qu'ils vous seront assignés par l'administrateur.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 2 }}>
        <PageHeader 
            title="Mes clients"
            subtitle="Suivez la progression et le statut de vos clients"
            breadcrumbs={[{ label: 'Mon Espace' }, { label: 'Clients' }]}
        />

        {/* Filter Zone */}
        <Card sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 5, 
            border: 'none', 
            boxShadow: `0 10px 40px ${alpha(theme.palette.text.primary, 0.03)}`,
            background: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)'
        }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Rechercher un élève..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: '12px', bgcolor: 'background.paper' }
                            }
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 2.5 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Progression</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Progression"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="all">Toutes étapes</MenuItem>
                            {['KBIS', 'CIRE', 'fournisseur', 'site', 'formation', 'termine'].map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 6, md: 2.5 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Paiement</InputLabel>
                        <Select
                            value={paymentFilter}
                            label="Paiement"
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="all">Tous statuts</MenuItem>
                            <MenuItem value="OK">À jour</MenuItem>
                            <MenuItem value="overdue">Retard</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={resetFilters}
                        startIcon={<Clear />}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Reset
                    </Button>
                </Grid>
            </Grid>
        </Card>

        {/* Table Card */}
        <Card sx={{ borderRadius: 1, overflow: 'hidden', border: 'none', boxShadow: `0 10px 40px ${alpha(theme.palette.text.primary, 0.05)}`, mb: 4 }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Badge badgeContent={filteredRows.length} color="primary" sx={{ 
                        '& .MuiBadge-badge': { transform: 'scale(0.8)', top: 4, right: -4, fontWeight: 800 } 
                    }}>
                        <Typography variant="titleSmall" sx={{ fontWeight: 800 }}>
                            Élèves assignés
                        </Typography>
                    </Badge>
                </Stack>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small"><FilterList /></IconButton>
                </Box>
            </Box>
            <Box sx={{ width: '100%' }}>
                <DataGrid
                rows={filteredRows}
                columns={columns}
                rowHeight={72}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                    toolbar: {
                    showQuickFilter: false,
                    },
                }}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.text.primary, 0.03),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    },
                    '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid',
                    borderColor: alpha('#000', 0.04),
                    },
                    '& .MuiDataGrid-row:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                }}
                />
            </Box>
        </Card>
    </Box>
  );
}
