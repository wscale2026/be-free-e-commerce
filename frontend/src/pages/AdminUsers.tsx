import { useState, useMemo, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import {
  Box, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, IconButton, Chip, Drawer, Avatar, Typography,
  Stack, Tooltip, Grid, InputAdornment, Menu, Divider, Badge, useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Add, Edit, Delete, Close, PersonAdd, FilterList, Search,
  Clear, Person, AdminPanelSettings, MoreVert, Visibility, 
  VisibilityOff, ContentCopy, Phone, Key, Payment, Euro,
  FileDownload, School, Schedule, Star, Description
} from '@mui/icons-material';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import type { Student, PaymentStatus, StudentStatus } from '@/types';

interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  role: 'student' | 'trainer' | 'admin';
  trainerId: string;
  status: StudentStatus;
  paymentStatus: PaymentStatus;
  totalDue: number;
  paidAmount: number;
  initialPayment?: number;
  skipStripe: boolean;
  hasBusiness: string;
  currentOffer: string;
  monthlyRevenue: string;
  challenges: string;
  notes: string;
}

const emptyForm: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  role: 'student',
  trainerId: '',
  status: 'KBIS',
  paymentStatus: 'missed' as const,
  totalDue: 960,
  paidAmount: 0,
  initialPayment: 0,
  skipStripe: false,
  hasBusiness: '',
  currentOffer: '',
  monthlyRevenue: '',
  challenges: '',
  notes: '',
};

export default function AdminUsers() {
  const { state, addStudent, updateStudent, deleteStudent, addPayment } = useMockData();
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuActionUser, setMenuActionUser] = useState<any>(null);

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  const generateCredentials = useCallback((first: string, last: string) => {
    const fPart = first.trim().split(' ')[0].toLowerCase() || 'cli';
    const lPart = last.trim().split(' ')[0].toLowerCase() || 'befree';
    const username = `${fPart}.${lPart}`;
    const password = Math.random().toString(36).substring(2, 10).toUpperCase();
    return { username, password };
  }, []);

  const handleCopyCredentials = (user: any) => {
    const text = `Accès Be-Free\nUtilisateur : ${user.username}\nMot de passe : ${user.password}`;
    navigator.clipboard.writeText(text);
    showSnackbar('Identifiants copiés', 'success');
  };

  const [defaultTotalDue, setDefaultTotalDue] = useState(960);

  useEffect(() => {
    api.get('/platform/settings/').then(res => {
      if (res.data.default_total_due) {
        const val = Number(res.data.default_total_due);
        setDefaultTotalDue(val);
        setForm(prev => ({ ...prev, totalDue: val }));
      }
    }).catch(err => console.error("Error loading settings:", err));
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const trainers = state.trainers;

  const filteredRows = useMemo(() => {
    let filtered = state.students.map((s) => {
      const trainer = trainers.find((t) => t.userId === s.trainerId);
      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        role: 'Client',
        trainer: trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Non assigné',
        status: s.status,
        paymentStatus: s.paymentStatus,
        lastInteraction: s.lastInteraction,
        raw: s,
      };
    });

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(row => 
            row.name.toLowerCase().includes(query) || 
            row.email.toLowerCase().includes(query)
        );
    }

    if (statusFilter !== 'all') {
        filtered = filtered.filter(row => row.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
        filtered = filtered.filter(row => row.paymentStatus === paymentFilter);
    }

    return filtered;
  }, [state.students, trainers, searchQuery, statusFilter, paymentFilter]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Utilisateur',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar 
            sx={{ 
                width: 38, 
                height: 38, 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: 'primary.main',
                fontSize: '14px',
                fontWeight: 700,
                textTransform: 'uppercase'
            }}
          >
            {params.row.raw?.firstName?.[0] || ''}{params.row.raw?.lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {params.value || 'Utilisateur'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              {params.row.email || ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
        field: 'phone',
        headerName: 'Téléphone',
        width: 140,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Phone sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.row.raw.phone || '—'}</Typography>
          </Stack>
        ),
      },
      {
          field: 'username',
          headerName: 'Identifiant',
          width: 150,
          renderCell: (params) => (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Person sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{params.row.raw.username || 'n/a'}</Typography>
              </Stack>
          )
      },
      {
          field: 'password',
          headerName: 'Mot de passe',
          width: 150,
          renderCell: (params) => {
              const isVisible = visiblePasswords.has(params.row.id);
              const pwd = params.row.raw.password || '********';
              return (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography 
                          variant="body2" 
                          sx={{ 
                              fontFamily: 'monospace', 
                              letterSpacing: isVisible ? '1px' : '2px', 
                              bgcolor: alpha(theme.palette.warning.main, 0.05), 
                              p: 0.5, 
                              borderRadius: '4px',
                              minWidth: '70px',
                              textAlign: 'center'
                          }}
                      >
                          {isVisible ? pwd : '••••••••'}
                      </Typography>
                      <IconButton size="small" onClick={() => togglePasswordVisibility(params.row.id)}>
                          {isVisible ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                      </IconButton>
                  </Stack>
              );
          }
      },
    {
      field: 'status',
      headerName: 'Étape',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            fontSize: '10px',
            height: 22,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        />
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Paiement',
      width: 110,
      align: 'center',
      renderCell: (params) => {
        const isOk = params.value === 'OK';
        return (
            <Chip
                label={isOk ? 'RÉGLÉ' : 'EN ATTENTE'}
                size="small"
                sx={{
                    bgcolor: isOk ? alpha('#4CAF50', 0.1) : alpha('#FFA000', 0.1),
                    color: isOk ? '#4CAF50' : '#FFA000',
                    fontSize: '10px',
                    height: 22,
                    fontWeight: 800,
                    borderRadius: '6px'
                }}
            />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      align: 'right',
      renderCell: (params: any) => (
        <ActionMenu 
          user={params.row.raw} 
          onEdit={handleEdit} 
          onCopy={handleCopyCredentials} 
          onDelete={(id) => setDeleteConfirm(id)} 
        />
      ),
    },
  ];

  const handleAdd = () => {
    setForm({ ...emptyForm, totalDue: defaultTotalDue, ...generateCredentials('', '') });
    setDialogOpen(true);
  };

  const handleFirstNameChange = (val: string) => {
    const creds = generateCredentials(val, form.lastName);
    setForm({ ...form, firstName: val, ...creds });
  };

  const handleLastNameChange = (val: string) => {
    const creds = generateCredentials(form.firstName, val);
    setForm({ ...form, lastName: val, ...creds });
  };

  const handleEdit = (student: Student) => {
    setSelectedUser(student);
    setForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || '',
      username: student.username || '',
      role: 'student',
      trainerId: student.trainerId || '',
      status: student.status,
      paymentStatus: student.paymentStatus,
      totalDue: student.totalDue,
      paidAmount: student.paidAmount,
      initialPayment: 0,
      skipStripe: false,
      hasBusiness: student.hasBusiness || '',
      currentOffer: student.currentOffer || '',
      monthlyRevenue: student.monthlyRevenue || '',
      challenges: student.challenges || '',
      notes: student.notes || '',
    });
    setEditDrawerOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      showSnackbar('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const newStudent: Student = {
      id: `s${Date.now()}`,
      userId: '',
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      username: form.username,
      password: form.password,
      status: form.status,
      trainerId: form.trainerId || null,
      paymentStatus: form.paymentStatus,
      instalment2Paid: false,
      nextZoomDate: null,
      lastInteraction: 'À l\'instant',
      totalDue: 0, // Ignored by backend as it uses global default
      paidAmount: form.initialPayment || 0,
      nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      engagementScore: 5,
      progress: 0,
      hasBusiness: form.hasBusiness,
      currentOffer: form.currentOffer,
      monthlyRevenue: form.monthlyRevenue,
      challenges: form.challenges,
      notes: form.notes,
    };

    try {
      await addStudent(newStudent);
      showSnackbar('Compte client créé avec succès', 'success');
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (error: any) {
      console.error("Full creation error details:", error.response?.data);
      const raw = error.response?.data?.message || error.response?.data?.detail || error.response?.data || 'Erreur lors de la création du client';
      const msg = Array.isArray(raw) ? raw.join(' ') : (typeof raw === 'object' ? JSON.stringify(raw) : raw);
      showSnackbar(msg, 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    const updated: Student = {
      ...selectedUser,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      username: form.username,
      status: form.status,
      trainerId: form.trainerId || null,
      paymentStatus: form.paymentStatus,
      totalDue: form.totalDue,
      paidAmount: form.paidAmount,
      instalment2Paid: form.paidAmount >= form.totalDue * 0.5,
      hasBusiness: form.hasBusiness,
      currentOffer: form.currentOffer,
      monthlyRevenue: form.monthlyRevenue,
      challenges: form.challenges,
      notes: form.notes,
    };
    
    try {
        await updateStudent(updated);

        // Auto-generate a payment record if the admin increased the paid balance
        const oldPaidAmount = selectedUser.paidAmount || 0;
        const newPaidAmount = updated.paidAmount || 0;
        
        if (newPaidAmount > oldPaidAmount) {
            const difference = newPaidAmount - oldPaidAmount;
            await addPayment({
                student_id: updated.id,
                amount: difference,
                method: 'Ajout manuel (Admin)',
                reference: `Régularisation`,
                date: new Date().toISOString().split('T')[0]
            });
        }

        showSnackbar('Utilisateur mis à jour ✓', 'success');
        setEditDrawerOpen(false);
    } catch (error: any) {
        const raw = error.response?.data?.message || error.response?.data?.detail || 'Erreur lors de la mise à jour (Vérifiez les champs)';
        const msg = Array.isArray(raw) ? raw.join(' ') : raw;
        console.error("Update error:", error.response?.data);
        showSnackbar(msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      showSnackbar('Client supprimé avec succès', 'success');
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erreur lors de la suppression';
      showSnackbar(msg, 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPaymentFilter('all');
  };

    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => setExportAnchor(event.currentTarget);
    const handleExportClose = () => setExportAnchor(null);

    const getExportData = () => {
        return state.students.map(s => {
            const trainer = trainers.find(t => t.userId === s.trainerId);
            return {
                'ID': s.id,
                'Prénom': s.firstName,
                'Nom': s.lastName,
                'Email': s.email,
                'Téléphone': s.phone || '',
                'Identifiant': s.username || '',
                'Mot de passe': s.password || '',
                'Statut Dossier': s.status,
                'Formateur': trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Non assigné',
                'Score (%)': `${s.progress}%`,
                'Engagement': s.engagementScore,
                'Dernier Zoom': s.nextZoomDate || 'N/A',
                'Échéance': s.nextDueDate || 'N/A',
                'Dernière Interaction': s.lastInteraction || 'Jamais',
                'Statut Paiement': s.paymentStatus === 'OK' ? 'RÉGLÉ' : 'EN ATTENTE',
                'Total Dû (€)': s.totalDue,
                'Déjà Payé (€)': s.paidAmount,
                'Business actuel': s.hasBusiness || '',
                'Offre actuelle': s.currentOffer || '',
                'CA mensuel': s.monthlyRevenue || '',
                'Challenges': s.challenges || '',
                'Notes': s.notes || ''
            };
        });
    };

    const exportCSV = () => {
        const data = getExportData();
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `clients_be_free_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        handleExportClose();
        showSnackbar('CSV exporté', 'success');
    };

    const exportExcel = () => {
        const data = getExportData();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clients');
        XLSX.writeFile(wb, `clients_be_free_${new Date().toISOString().split('T')[0]}.xlsx`);
        handleExportClose();
        showSnackbar('Excel exporté', 'success');
    };

    const exportPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const students = state.students;
        const dateStr = new Date().toLocaleDateString('fr-FR');

        // Professional Title Page / Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('BE-FREE E-COMMERCE', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`RELEVÉ DÉTAILLÉ DES ÉLÈVES - ${dateStr}`, 105, 22, { align: 'center' });

        let currentY = 35;

        students.forEach((s, index) => {
            const trainer = trainers.find(t => t.userId === s.trainerId);
            
            // Check if we need a new page
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            // Student Header
            doc.setFillColor(243, 244, 246);
            doc.rect(14, currentY, 182, 10, 'F');
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${s.firstName} ${s.lastName}`, 18, currentY + 7);
            currentY += 12;

            const rows = [
                ['Prénom', s.firstName],
                ['Nom', s.lastName],
                ['Email', s.email],
                ['Téléphone (WhatsApp)', s.phone || 'N/A'],
                ['Business actuel', s.has_business || s.hasBusiness || 'N/A'],
                ['Offre actuelle', s.current_offer || s.currentOffer || 'N/A'],
                ['CA mensuel', s.monthly_revenue || s.monthlyRevenue || 'N/A'],
                ['Challenges principaux', s.challenges || 'N/A'],
            ];

            autoTable(doc, {
                body: rows,
                startY: currentY,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 60, fontStyle: 'bold', fillColor: [249, 250, 251] },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    if (data.cursor) {
                        currentY = data.cursor.y + 10;
                    }
                }
            });
        });

        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} sur ${pageCount}`, 105, 287, { align: 'center' });
        }

        doc.save(`BE_FREE_PROFILES_${new Date().toISOString().split('T')[0]}.pdf`);
        handleExportClose();
        showSnackbar('Fiches PDF générées', 'success');
    };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <PageHeader 
            title={t('users.title')}
            subtitle={t('users.subtitle')}
            breadcrumbs={[{ label: t('nav.dashboard') }, { label: t('nav.clients') }]}
            action={
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExportClick}
                        sx={{ borderRadius: '12px', px: 3, fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}
                    >
                        {t('users.export')}
                    </Button>
                    <Menu
                        anchorEl={exportAnchor}
                        open={Boolean(exportAnchor)}
                        onClose={handleExportClose}
                        slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1, minWidth: 160 } } }}
                    >
                        <MenuItem onClick={exportExcel} sx={{ gap: 1.5, fontWeight: 600 }}><Box component="span" sx={{ color: '#1D6F42' }}>📊</Box> Excel (.xlsx)</MenuItem>
                        <MenuItem onClick={exportCSV} sx={{ gap: 1.5, fontWeight: 600 }}><Box component="span" sx={{ color: 'text.secondary' }}>📄</Box> CSV (.csv)</MenuItem>
                        <MenuItem onClick={exportPDF} sx={{ gap: 1.5, fontWeight: 600 }}><Box component="span" sx={{ color: '#E44032' }}>📕</Box> PDF (.pdf)</MenuItem>
                    </Menu>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleAdd}
                        sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                    >
                        {t('users.new')}
                    </Button>
                </Stack>
            }
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
                        placeholder={t('users.search')}
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
                        <InputLabel>Étape</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Étape"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="all">Toutes les étapes</MenuItem>
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
                            <MenuItem value="OK">Réglé</MenuItem>
                            <MenuItem value="overdue">Retard</MenuItem>
                            <MenuItem value="missed">En attente</MenuItem>
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
                        Réinitialiser
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Liste des Clients
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
                        showQuickFilter: false, // Hidden since we have our custom filter zone
                    },
                    }}
                    checkboxSelection
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: alpha(theme.palette.text.primary, 0.01),
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.5),
                        },
                        '& .MuiDataGrid-row:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                    }}
                />
            </Box>
        </Card>

        {/* Add Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ 
            paper: { 
              sx: { 
                borderRadius: isMobile ? 0 : '24px', 
                p: { xs: 1, sm: 2 },
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
              } 
            } 
          }}
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>Nouveau Client</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Créez un dossier complet pour votre client</Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <Stack spacing={4} sx={{ mt: isMobile ? 0 : 1 }}>
              {/* SECTION: IDENTITÉ */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Person sx={{ fontSize: 18 }} /> Identité & Contact
                </Typography>
                <Stack spacing={2.5}>
                  <TextField label="Prénom" fullWidth value={form.firstName} onChange={(e) => handleFirstNameChange(e.target.value)} required slotProps={{ input: { sx: { borderRadius: '12px' } } }} />
                  <TextField label="Nom" fullWidth value={form.lastName} onChange={(e) => handleLastNameChange(e.target.value)} required slotProps={{ input: { sx: { borderRadius: '12px' } } }} />
                  <TextField label="Email professionnel" type="email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required slotProps={{ input: { sx: { borderRadius: '12px' }, startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }} />
                  <TextField label="Numéro de téléphone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} slotProps={{ input: { sx: { borderRadius: '12px' }, startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }} />
                </Stack>
              </Box>

              {/* SECTION: ACCÈS */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Key sx={{ fontSize: 18 }} /> Accès Plateforme
                </Typography>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.1), borderStyle: 'dashed' }}>
                  <Stack spacing={2.5}>
                    <TextField label="Identifiant" fullWidth value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontFamily: 'monospace' } } }} />
                    <TextField label="Mot de passe" fullWidth value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} slotProps={{ input: { sx: { borderRadius: '10px', bgcolor: 'background.paper', fontWeight: 700, fontFamily: 'monospace' } } }} />
                  </Stack>
                </Card>
              </Box>

              {/* SECTION: ATTRIBUTION */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AdminPanelSettings sx={{ fontSize: 18 }} /> Suivi & Finance
                </Typography>
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel>Formateur référent</InputLabel>
                    <Select value={form.trainerId} label="Formateur référent" onChange={(e) => setForm({ ...form, trainerId: e.target.value })} sx={{ borderRadius: '12px' }}>
                      <MenuItem value=""><em>Non assigné</em></MenuItem>
                      {trainers.map((t) => <MenuItem key={t.id} value={t.userId}>{t.firstName} {t.lastName}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Étape initiale</InputLabel>
                    <Select value={form.status} label="Étape initiale" onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })} sx={{ borderRadius: '12px' }}>
                      {['KBIS', 'CIRE', 'fournisseur', 'site', 'formation', 'termine'].map((s) => (
                        <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>État du paiement</InputLabel>
                    <Select value={form.paymentStatus} label="État du paiement" onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })} sx={{ borderRadius: '12px' }}>
                      <MenuItem value="missed">En attente</MenuItem>
                      <MenuItem value="OK">Réglé</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Versement initial (€)" type="number" fullWidth value={form.initialPayment} onChange={(e) => setForm({ ...form, initialPayment: Number(e.target.value) })} slotProps={{ input: { sx: { borderRadius: '12px' }, startAdornment: <InputAdornment position="start"><Euro sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }} />
                </Stack>
              </Box>

              {/* SECTION: FORMATION */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <School sx={{ fontSize: 18 }} /> Détails de Formation
                </Typography>
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel>Business actuel</InputLabel>
                    <Select 
                      value={form.hasBusiness} 
                      label="Business actuel" 
                      onChange={(e) => setForm({ ...form, hasBusiness: e.target.value })} 
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Oui, j'ai déjà une activité">Oui, j'ai déjà une activité</MenuItem>
                      <MenuItem value="Non, je suis débutant">Non, je suis débutant</MenuItem>
                      <MenuItem value="J'ai une idée mais pas encore lancé">J'ai une idée mais pas encore lancé</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField 
                    label="Offre actuelle" 
                    fullWidth 
                    multiline 
                    rows={2} 
                    value={form.currentOffer} 
                    onChange={(e) => setForm({ ...form, currentOffer: e.target.value })} 
                    placeholder="Quel est votre produit/service actuel ?"
                    slotProps={{ input: { sx: { borderRadius: '12px' } } }} 
                  />
                  <TextField 
                    label="CA des 30 derniers jours (€)" 
                    fullWidth 
                    value={form.monthlyRevenue} 
                    onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })} 
                    placeholder="Ex: 500€"
                    slotProps={{ input: { sx: { borderRadius: '12px' } } }} 
                  />
                  <FormControl fullWidth>
                    <InputLabel>Challenges principaux</InputLabel>
                    <Select 
                      multiple
                      value={form.challenges ? form.challenges.split(', ').filter(Boolean) : []} 
                      label="Challenges principaux" 
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, challenges: typeof val === 'string' ? val : val.join(', ') });
                      }} 
                      sx={{ borderRadius: '12px' }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="Créer mon entreprise (KBIS, SIRET)">Créer mon entreprise (KBIS, SIRET)</MenuItem>
                      <MenuItem value="Trouver un produit rentable">Trouver un produit rentable</MenuItem>
                      <MenuItem value="Créer mon site e-commerce">Créer mon site e-commerce</MenuItem>
                      <MenuItem value="Scaler mes ventes">Scaler mes ventes</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, px: 3 }}>Annuler</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!form.firstName || !form.lastName || !form.email} sx={{ px: 4, py: 1.2, borderRadius: '12px', fontWeight: 800, textTransform: 'none', fontSize: '15px' }}>
              Créer le dossier
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Drawer */}
        <Drawer
          anchor="right"
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 }, borderLeft: 'none' } } }}
        >
          <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Modifier l'utilisateur
              </Typography>
              <IconButton onClick={() => setEditDrawerOpen(false)} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="labelLarge" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Informations Générales
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                    label="Prénom"
                    fullWidth
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <TextField
                    label="Nom"
                    fullWidth
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <TextField
                        label="Téléphone"
                        fullWidth
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                </Box>
                <TextField
                    label="Nom d'utilisateur"
                    fullWidth
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="labelLarge" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Attribution & Suivi
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Formateur référent</InputLabel>
                    <Select
                    value={form.trainerId}
                    label="Formateur référent"
                    onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                    >
                    <MenuItem value="">
                        <em>Non assigné</em>
                    </MenuItem>
                    {trainers.map((t) => (
                        <MenuItem key={t.id} value={t.userId}>
                        {t.firstName} {t.lastName}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel>Étape actuelle</InputLabel>
                    <Select
                    value={form.status}
                    label="Étape actuelle"
                    onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
                    >
                    {['KBIS', 'CIRE', 'fournisseur', 'site', 'formation', 'termine'].map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel>État financier</InputLabel>
                    <Select
                    value={form.paymentStatus}
                    label="État financier"
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                    >
                    <MenuItem value="OK">RÉGLÉ</MenuItem>
                    <MenuItem value="missed">EN ATTENTE</MenuItem>
                    <MenuItem value="overdue">RETARD</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Montant Total (€)"
                        type="number"
                        fullWidth
                        value={form.totalDue}
                        onChange={(e) => setForm({ ...form, totalDue: Number(e.target.value) })}
                    />
                    <TextField
                        label="Montant Réglé (€)"
                        type="number"
                        fullWidth
                        value={form.paidAmount}
                        onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                    />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="labelLarge" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Détails Formation
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Business actuel</InputLabel>
                    <Select value={form.hasBusiness} label="Business actuel" onChange={(e) => setForm({ ...form, hasBusiness: e.target.value })}>
                      <MenuItem value="Oui, j'ai déjà une activité">Oui, j'ai déjà une activité</MenuItem>
                      <MenuItem value="Non, je suis débutant">Non, je suis débutant</MenuItem>
                      <MenuItem value="J'ai une idée mais pas encore lancé">J'ai une idée mais pas encore lancé</MenuItem>
                    </Select>
                </FormControl>
                <TextField 
                    label="Offre actuelle" 
                    fullWidth 
                    multiline 
                    rows={2} 
                    value={form.currentOffer} 
                    onChange={(e) => setForm({ ...form, currentOffer: e.target.value })} 
                />
                <TextField 
                    label="CA des 30 derniers jours (€)" 
                    fullWidth 
                    value={form.monthlyRevenue} 
                    onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })} 
                />
                <FormControl fullWidth>
                    <InputLabel>Challenges principaux</InputLabel>
                    <Select 
                      multiple
                      value={form.challenges ? form.challenges.split(', ').filter(Boolean) : []} 
                      label="Challenges principaux" 
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, challenges: typeof val === 'string' ? val : val.join(', ') });
                      }} 
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="Créer mon entreprise (KBIS, SIRET)">Créer mon entreprise (KBIS, SIRET)</MenuItem>
                      <MenuItem value="Trouver un produit rentable">Trouver un produit rentable</MenuItem>
                      <MenuItem value="Créer mon site e-commerce">Créer mon site e-commerce</MenuItem>
                      <MenuItem value="Scaler mes ventes">Scaler mes ventes</MenuItem>
                    </Select>
                </FormControl>
              </Box>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleUpdate}
              sx={{ py: 2, mt: 4, borderRadius: '14px', fontWeight: 800, fontSize: '16px' }}
            >
              Enregistrer les modifications
            </Button>
          </Box>
        </Drawer>

        {/* Delete Confirmation */}
        <Dialog
          open={!!deleteConfirm}
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
              Suppression Définitive
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                Voulez-vous vraiment supprimer <strong>{state.students.find(s => s.id === deleteConfirm)?.firstName}</strong> ?<br/>
                Cette action est irréversible et supprimera tout son historique.
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
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)} 
                sx={{ borderRadius: '12px', py: 1, fontWeight: 800, boxShadow: 'none', '&:hover': { bgcolor: 'error.dark' } }}
              >
                Supprimer
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

      </Box>
  );
}

// ─── Action Menu Component ─────────────────────────────────────────────────
function ActionMenu({ user, onEdit, onCopy, onDelete }: { 
    user: any; 
    onEdit: (u: any) => void; 
    onCopy: (u: any) => void; 
    onDelete: (id: string) => void; 
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton size="small" onClick={handleClick}>
                <MoreVert sx={{ fontSize: 20 }} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 190, mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } } }}
            >
                <MenuItem onClick={() => { handleClose(); onEdit(user); }} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px' }}>
                    <Edit sx={{ fontSize: 18, color: 'text.secondary' }} /> Modifier le client
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); onCopy(user); }} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px', color: 'primary.main' }}>
                    <ContentCopy sx={{ fontSize: 18 }} /> Copier identifiants
                </MenuItem>
                <Divider sx={{ my: 1, opacity: 0.5 }} />
                <MenuItem onClick={() => { handleClose(); onDelete(user.id); }} sx={{ gap: 1.5, fontWeight: 700, fontSize: '14px', color: 'error.main' }}>
                    <Delete sx={{ fontSize: 18 }} /> Supprimer définitivement
                </MenuItem>
            </Menu>
        </>
    );
}
