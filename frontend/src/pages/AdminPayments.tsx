import { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select,
  IconButton, Stack, Avatar, Badge,
  LinearProgress, Menu, ListItemIcon, ListItemText, Divider,
  CircularProgress
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import {
  Warning, Add, FilterList, Edit, Search, Clear,
  AccountBalanceWallet, TrendingUp, BarChart,
  Visibility, MoreVert, Receipt, Close, Delete, Euro
} from '@mui/icons-material';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Action Menu Component ─────────────────────────────────────────────────
function ActionMenu({ row, onView, onEdit, onCancel, onDelete }: {
  row: any;
  onView: (row: any) => void;
  onEdit: (row: any) => void;
  onCancel: (row: any) => void;
  onDelete: (row: any) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { showSnackbar } = useSnackbar();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleGenerateReceipt = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const receiptHtml = `
      <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4F46E5; pb: 20px; margin-bottom: 30px; }
            .company { font-weight: 900; color: #4F46E5; font-size: 24px; text-transform: uppercase; }
            .receipt-title { font-size: 28px; font-weight: 900; margin: 40px 0; text-align: center; color: #111; text-transform: uppercase; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: 800; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .content { font-size: 15px; font-weight: 600; }
            .table { width: 100%; border-collapse: collapse; margin: 40px 0; }
            .table th { text-align: left; background: #f9fafb; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
            .table td { padding: 16px 12px; border-bottom: 1px solid #eee; font-weight: 600; }
            .total-box { margin-left: auto; width: 300px; background: #f4f7ff; padding: 20px; borderRadius: 12px; border: 1px solid #e0e7ff; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total-final { font-size: 20px; font-weight: 900; color: #4F46E5; margin-top: 10px; padding-top: 10px; border-top: 2px solid #4F46E5; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">BE-FREE E-COMMERCE</div>
            <div style="text-align: right">
              <div>Facture N° REC-${Date.now().toString().slice(-6)}</div>
              <div>Date: ${today}</div>
            </div>
          </div>

          <div class="receipt-title">REÇU DE PAIEMENT</div>

          <div class="info-grid">
            <div>
              <div class="section-title">ÉMETTEUR</div>
              <div class="content">
                BE-FREE SAS<br/>
                123 Avenue de la Liberté<br/>
                75008 Paris, France<br/>
                contact@befree.fr
              </div>
            </div>
            <div>
              <div class="section-title">DESTINATAIRE</div>
              <div class="content">
                ${row.name}<br/>
                ${row.email}<br/>
                Responsable: ${row.trainer}
              </div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Montant Réglé</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Formation E-commerce Be-Free</td>
                <td>1</td>
                <td>${row.totalDue} €</td>
                <td>${row.paid} €</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Montant Total :</span> <span>${row.totalDue} €</span></div>
            <div class="total-row"><span>Déjà réglé :</span> <span>${row.paid} €</span></div>
            <div class="total-row" style="color: #666"><span>Remise :</span> <span>0,00 €</span></div>
            <div class="total-final">
              <span>SOLDE DÛ :</span>
              <span>${(row.totalDue - row.paid).toFixed(2)} €</span>
            </div>
          </div>

          <div class="footer">
            BE-FREE E-COMMERCE - SIRET 123 456 789 00012 - RCS PARIS<br/>
            Ce document confirme la réception de votre versement. Merci de votre confiance.
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
    showSnackbar('Fenêtre d\'impression générée ✓', 'success');
    handleClose();
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <MoreVert sx={{ fontSize: 20 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 210, mt: 1 } } }}
      >
        <MenuItem onClick={() => { onView(row); handleClose(); }} sx={{ py: 1.2 }}>
          <ListItemIcon><Visibility sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Voir le détail" slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '14px' } } }} />
        </MenuItem>
        <MenuItem onClick={() => { onEdit(row); handleClose(); }} sx={{ py: 1.2 }}>
          <ListItemIcon><Edit sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Modifier le versement" slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '14px' } } }} />
        </MenuItem>
        <MenuItem onClick={handleGenerateReceipt} sx={{ py: 1.2 }}>
          <ListItemIcon><Receipt sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Générer un reçu" slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '14px' } } }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { onCancel(row); handleClose(); }} sx={{ py: 1.2 }}>
          <ListItemIcon><Close sx={{ fontSize: 18, color: 'warning.main' }} /></ListItemIcon>
          <ListItemText primary="Marquer en retard" slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '14px', color: 'warning.main' } } }} />
        </MenuItem>
        <MenuItem onClick={() => { onDelete(row); handleClose(); }} sx={{ py: 1.2 }}>
          <ListItemIcon><Delete sx={{ fontSize: 18, color: 'error.main' }} /></ListItemIcon>
          <ListItemText primary="Supprimer le dossier" slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '14px', color: 'error.main' } } }} />
        </MenuItem>
      </Menu>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminPayments() {
  const theme = useTheme();
  const { state, updateStudent, deleteStudent, addPayment } = useMockData();
  const { t } = useLanguage();
  const { showSnackbar } = useSnackbar();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trainerFilter, setTrainerFilter] = useState('all');

  // Add payment dialog
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // View detail dialog
  const [viewRow, setViewRow] = useState<any>(null);

  // Edit versement dialog
  const [editRow, setEditRow] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddPayment = async () => {
    if (!formData.studentId || !formData.amount) {
      showSnackbar(t('errors.fillFields'), 'error');
      return;
    }
    const student = state.students.find(s => s.id === formData.studentId);
    if (student) {
      try {
        setIsSubmitting(true);
        await updateStudent({
          ...student,
          paidAmount: student.paidAmount + Number(formData.amount),
          paymentStatus: (student.paidAmount + Number(formData.amount)) >= student.totalDue ? 'OK' : student.paymentStatus,
          nextDueDate: (student.paidAmount + Number(formData.amount)) >= student.totalDue ? null : student.nextDueDate,
        });

        // Also create a historical payment record
        await addPayment({
          student_id: student.id,
          amount: Number(formData.amount),
          method: 'Virement / Espèces',
          reference: `Règlement manuel (Admin)`,
          date: formData.date
        });

        showSnackbar(t('success.paymentSaved'), 'success');
        setAddPaymentOpen(false);
        setFormData({ studentId: '', amount: '', date: new Date().toISOString().split('T')[0] });
      } catch (e) {
        showSnackbar(t('errors.general'), 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditOpen = (row: any) => {
    setEditRow(row);
    setEditAmount(String(row.paid));
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    const student = state.students.find(s => s.id === editRow.id);
    if (!student) return;
    
    try {
        setIsSubmitting(true);
        const oldPaid = student.paidAmount;
        const newPaid = Number(editAmount);
        
        await updateStudent({
          ...student,
          paidAmount: newPaid,
          paymentStatus: newPaid >= student.totalDue ? 'OK' : student.paymentStatus,
        });

        // If balance increased, log the difference as a payment
        if (newPaid > oldPaid) {
            await addPayment({
                student_id: student.id,
                amount: newPaid - oldPaid,
                method: 'Ajustement Solde',
                reference: 'Modification administrative',
                date: new Date().toISOString().split('T')[0]
            });
        }

        showSnackbar(t('success.paymentUpdated'), 'success');
        setEditRow(null);
    } catch (e) {
        showSnackbar(t('errors.general'), 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleMarkOverdue = (row: any) => {
    const student = state.students.find(s => s.id === row.id);
    if (!student) return;
    updateStudent({ ...student, paymentStatus: 'overdue' });
    showSnackbar(`${row.name} ${t('notifications.markedOverdue')}`, 'warning');
  };

  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  
  const handleDelete = async (studentId: string) => {
    try {
      setIsSubmitting(true);
      await deleteStudent(studentId);
      showSnackbar(t('success.deleted'), 'success');
      setDeleteConfirm(null);
    } catch (e) {
      showSnackbar(t('errors.general'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const students = state.students;
    const totalCollected = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalDue = students.reduce((sum, s) => sum + s.totalDue, 0);
    const overdueCount = students.filter(s => s.paymentStatus === 'overdue' || s.paymentStatus === 'missed').length;
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;
    return { totalCollected, overdueCount, collectionRate };
  }, [state.students]);

  const statBlocks = [
    { label: t('stats.totalCollected'), value: `${stats.totalCollected}€`, icon: AccountBalanceWallet, change: '+12.5%', color: '#2D5BFF' },
    { label: t('stats.collectionRate'),   value: `${stats.collectionRate}%`, icon: TrendingUp,           change: '+5%',   color: '#00BCD4' },
    { label: t('stats.overdue'),     value: stats.overdueCount,         icon: Warning,              change: '-2',    color: '#F44336' },
    { label: t('stats.newPayments'),    value: 8,                          icon: BarChart,             change: '+4',    color: '#9C27B0' },
  ];

  // ── Filtered rows ─────────────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    let rows = state.students.map(s => {
      const trainer = state.trainers.find(t => t.userId === s.trainerId);
      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        totalDue: s.totalDue,
        paid: s.paidAmount,
        status: s.paymentStatus,
        trainer: trainer ? `${trainer.firstName} ${trainer.lastName}` : '—',
        trainerId: s.trainerId,
        nextDueDate: s.nextDueDate,
      };
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
    if (trainerFilter !== 'all') rows = rows.filter(r => r.trainerId === trainerFilter);
    return rows;
  }, [state.students, state.trainers, searchQuery, statusFilter, trainerFilter]);

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('table.client'),
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700, fontSize: '14px' }}>
            {params.row.firstName?.[0] || ''}{params.row.lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="labelLarge" sx={{ fontWeight: 700, display: 'block' }}>{params.value}</Typography>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontSize: '11px' }}>{params.row.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'trainer',
      headerName: t('table.trainer'),
      width: 150,
      renderCell: (params) => (
        <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 500 }}>{params.value}</Typography>
      ),
    },
    {
      field: 'totalDue',
      headerName: t('table.totalDue'),
      width: 140,
      renderCell: (params) => (
        <Typography variant="labelLarge" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {params.value}€
        </Typography>
      ),
    },
    {
      field: 'payment',
      headerName: t('table.financialStatus'),
      width: 180,
      renderCell: (params) => {
        const pct = Math.min((params.row.paid / params.row.totalDue) * 100, 100);
        const isError = params.row.status === 'overdue' || params.row.status === 'missed';
        return (
          <Box sx={{ width: '100%', pr: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="labelSmall" sx={{ color: isError ? 'error.main' : 'text.primary', fontWeight: 700 }}>
                {Math.round(pct)}% {t('table.paid')}
              </Typography>
              <Typography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {params.row.paid}€ / {params.row.totalDue}€
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                '& .MuiLinearProgress-bar': { bgcolor: isError ? 'error.main' : 'primary.main', borderRadius: 3 },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: t('table.status'),
      width: 120,
      renderCell: (params) => {
        const isOk = params.value === 'OK';
        return (
          <Chip
            label={isOk ? t('status.paid') : t('status.pending')}
            size="small"
            sx={{
              bgcolor: isOk ? alpha('#4CAF50', 0.1) : alpha('#FFA000', 0.1),
              color: isOk ? '#4CAF50' : '#FFA000',
              fontSize: '11px', fontWeight: 800, height: 24, borderRadius: '6px', border: 'none',
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: t('table.actions'),
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <ActionMenu
          row={params.row}
          onView={(r) => setViewRow(r)}
          onEdit={handleEditOpen}
          onCancel={handleMarkOverdue}
          onDelete={(r) => setDeleteConfirm(r)}
        />
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  
  const paymentRows = useMemo(() => {
    return state.payments.map(p => {
      const student = state.students.find(s => s.id === String(p.student_id));
      return {
        ...p,
        id: p.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Client inconnu',
        dateFormatted: p.date ? format(new Date(p.date), 'dd MMMM yyyy', { locale: fr }) : '—'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.payments, state.students]);

  const paymentColumns: GridColDef[] = [
    { field: 'dateFormatted', headerName: t('table.date'), width: 180 },
    { field: 'studentName', headerName: t('table.client'), width: 200, renderCell: (params) => (
        <Typography variant="labelLarge" sx={{ fontWeight: 700 }}>{params.value}</Typography>
    )},
    { field: 'amount', headerName: t('table.amount'), width: 130, renderCell: (params) => (
        <Typography variant="labelLarge" sx={{ fontWeight: 900, color: 'primary.main' }}>{params.value} €</Typography>
    )},
    { field: 'method', headerName: t('table.method'), width: 150, renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: '6px' }} />
    )},
    { field: 'reference', headerName: t('table.reference'), width: 250, renderCell: (params) => (
        <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{params.value}</Typography>
    )},
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 2 }}>
      <PageHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        breadcrumbs={[{ label: t('nav.admin') }, { label: t('nav.payments') }]}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddPaymentOpen(true)} sx={{ borderRadius: '12px' }}>
            {t('payments.newPayment')}
          </Button>
        }
      />

      {/* Stat Blocks */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statBlocks.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ borderRadius: 4, border: 'none', bgcolor: 'background.paper', boxShadow: `0 10px 20px ${alpha(theme.palette.text.primary, 0.04)}`, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 20px 40px ${alpha(theme.palette.text.primary, 0.08)}` } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: alpha(stat.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                  <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                </Box>
                <Typography variant="displaySmall" sx={{ fontSize: '32px', fontWeight: 800, mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant="labelLarge" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>{stat.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ px: 1, py: 0.2, borderRadius: '6px', bgcolor: stat.change.includes('+') ? alpha('#4CAF50', 0.1) : alpha('#FF5252', 0.1), color: stat.change.includes('+') ? '#4CAF50' : '#FF5252', fontSize: '11px', fontWeight: 800 }}>
                    {stat.change}
                  </Box>
                  <Typography variant="bodySmall" sx={{ color: 'text.disabled', fontWeight: 600 }}>vs mois dernier</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 5, border: 'none', boxShadow: `0 10px 40px ${alpha(theme.palette.text.primary, 0.03)}`, background: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" placeholder="Rechercher un client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: 'background.paper' }, startAdornment: <Search sx={{ color: 'text.disabled', fontSize: 20, mr: 1 }} /> } }} />
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}>
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="OK">Réglé</MenuItem>
                <MenuItem value="overdue">Retard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Responsable</InputLabel>
              <Select value={trainerFilter} label="Responsable" onChange={e => setTrainerFilter(e.target.value)} sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}>
                <MenuItem value="all">Tous les responsables</MenuItem>
                {state.trainers.map(t => <MenuItem key={t.id} value={t.userId}>{t.firstName} {t.lastName}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button variant="outlined" fullWidth onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTrainerFilter('all'); }}
              startIcon={<Clear />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 1, overflow: 'hidden', border: 'none', boxShadow: `0 10px 40px ${alpha(theme.palette.text.primary, 0.05)}`, mb: 4 }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge badgeContent={filteredRows.length} color="primary" sx={{ '& .MuiBadge-badge': { transform: 'scale(0.8)', top: 4, right: -4, fontWeight: 800 } }}>
            <Typography variant="titleSmall" sx={{ fontWeight: 800 }}>Dossiers Financiers Clients</Typography>
          </Badge>
          <IconButton size="small"><FilterList /></IconButton>
        </Box>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          rowHeight={72}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: false } }}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.text.primary, 0.03), borderBottom: '1px solid', borderColor: 'divider' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: alpha('#000', 0.04) },
            '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
          }}
        />
      </Card>

      {/* Transaction Log */}
      <Card sx={{ borderRadius: 1, overflow: 'hidden', border: 'none', boxShadow: `0 10px 40px ${alpha(theme.palette.text.primary, 0.05)}`, mb: 4 }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="titleSmall" sx={{ fontWeight: 800 }}>Journal des Encaissements (Stripe & Manuel)</Typography>
          </Stack>
        </Box>
        <DataGrid
          rows={paymentRows}
          columns={paymentColumns}
          rowHeight={64}
          autoHeight
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: alpha('#000', 0.04) },
          }}
        />
      </Card>

      {/* ── Dialog: Add Payment ─────────────────────────────────────────── */}
      <Dialog open={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} slotProps={{ paper: { sx: { borderRadius: 4, p: 1, maxWidth: 480, width: '100%' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '22px' }}>Enregistrer un encaissement</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Client</InputLabel>
              <Select value={formData.studentId} label="Client" onChange={e => setFormData({ ...formData, studentId: e.target.value })} sx={{ borderRadius: '12px' }}>
                {state.students.map(s => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Montant (€)" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} slotProps={{ input: { sx: { borderRadius: '12px' } } }} />
            <TextField fullWidth type="date" label="Date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '12px' } } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setAddPaymentOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleAddPayment} 
            disabled={isSubmitting || !formData.studentId || !formData.amount}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}
          >
            {isSubmitting ? 'Validation...' : 'Valider'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: View Detail ─────────────────────────────────────────── */}
      <Dialog open={Boolean(viewRow)} onClose={() => setViewRow(null)} slotProps={{ paper: { sx: { borderRadius: 4, p: 1, maxWidth: 500, width: '100%' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '22px' }}>Détail du client</DialogTitle>
        {viewRow && (
          <DialogContent sx={{ mt: 1 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 800, fontSize: '20px' }}>
                  {viewRow.firstName?.[0]}{viewRow.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="titleMedium" sx={{ fontWeight: 800 }}>{viewRow.name}</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>{viewRow.email}</Typography>
                </Box>
              </Box>
              <Grid container spacing={2}>
                {[
                  { label: 'Responsable', value: viewRow.trainer },
                  { label: 'Statut', value: viewRow.status === 'OK' ? 'Soldé' : 'En attente' },
                  { label: 'Montant dû', value: `${viewRow.totalDue} €` },
                  { label: 'Montant réglé', value: `${viewRow.paid} €` },
                  { label: 'Restant', value: `${viewRow.totalDue - viewRow.paid} €` },
                  { label: 'Prochaine échéance', value: viewRow.nextDueDate || '—' },
                ].map(item => (
                  <Grid size={{ xs: 6 }} key={item.label}>
                    <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
                      <Typography variant="bodySmall" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>{item.label}</Typography>
                      <Typography variant="labelLarge" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box>
                <Typography variant="bodySmall" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                  Progression : {Math.round(Math.min((viewRow.paid / viewRow.totalDue) * 100, 100))}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((viewRow.paid / viewRow.totalDue) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.text.primary, 0.06), '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                />
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3 }}>
          <Button variant="contained" onClick={() => setViewRow(null)} sx={{ borderRadius: '10px', fontWeight: 700 }}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Edit Versement ──────────────────────────────────────── */}
      <Dialog open={Boolean(editRow)} onClose={() => setEditRow(null)} slotProps={{ paper: { sx: { borderRadius: 4, p: 1, maxWidth: 420, width: '100%' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '22px' }}>Modifier le versement</DialogTitle>
        {editRow && (
          <DialogContent sx={{ mt: 1 }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="bodyMedium" sx={{ color: 'text.secondary' }}>
                Modification du montant réglé pour <strong>{editRow.name}</strong>.
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Montant réglé (€)"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: '12px' } } }}
              />
              <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
                Montant total dû : <strong>{editRow.totalDue} €</strong>
              </Typography>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setEditRow(null)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit} 
            disabled={isSubmitting || !editAmount}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ─────────────────────────────────── */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ 
          paper: { 
            sx: { 
              borderRadius: '20px', 
              p: 1,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
            } 
          } 
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ 
              width: 60, height: 60, borderRadius: '50%', 
              bgcolor: alpha(theme.palette.error.main, 0.1), 
              color: 'error.main', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              mx: 'auto', mb: 2 
          }}>
            <Delete sx={{ fontSize: 32 }} />
          </Box>
          <DialogTitle sx={{ fontWeight: 900, fontSize: '20px', pb: 1 }}>
            Supprimer le dossier ?
          </DialogTitle>
          <DialogContent>
            <Typography variant="bodyMedium" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              Voulez-vous vraiment supprimer le dossier de <strong>{deleteConfirm?.name}</strong> ?<br/>
              Cela effacera également tous ses paiements.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', mt: 2, pb: 2, gap: 2 }}>
            <Button 
              fullWidth variant="outlined" 
              onClick={() => setDeleteConfirm(null)} 
              sx={{ borderRadius: '12px', py: 1, fontWeight: 700, color: 'text.secondary', borderColor: 'divider' }}
            >
              Annuler
            </Button>
            <Button 
              fullWidth variant="contained" color="error" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)} 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ borderRadius: '12px', py: 1, fontWeight: 800, boxShadow: 'none' }}
            >
              {isSubmitting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
