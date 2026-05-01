import { useMemo, useRef, useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, Button, 
  LinearProgress, Divider, Chip, CircularProgress
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  BarChart as BarChartIcon, TrendingUp, People, 
  AccessTime, FileDownload, PieChart as PieChartIcon,
  Payments, CheckCircle, Warning, Chat
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { KANBAN_COLUMNS, STATUS_LABELS } from '@/types';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reporting() {
  const theme = useTheme();
  const { user } = useAuth();
  const { state } = useMockData();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const trainerStudents = useMemo(() => {
    if (!user) return [];
    return state.students.filter((s) => s.trainerId === user.id);
  }, [state.students, user]);

  const completionRate = useMemo(() => {
    if (trainerStudents.length === 0) return 0;
    const completed = trainerStudents.filter(s => s.status === 'termine').length;
    return Math.round((completed / trainerStudents.length) * 100);
  }, [trainerStudents]);

  const unreadMessages = useMemo(() => {
    return state.messages.filter(m => !m.read && trainerStudents.some(s => s.userId === m.fromStudentId)).length;
  }, [state.messages, trainerStudents]);

  const overdueStudents = useMemo(() => {
    return trainerStudents.filter(s => s.paymentStatus === 'overdue' || s.paymentStatus === 'missed').length;
  }, [trainerStudents]);

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return state.zoomSessions
      .filter(z => trainerStudents.some(s => z.studentIds.includes(s.userId)))
      .filter(z => new Date(z.date).getTime() >= now.setHours(0,0,0,0))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [state.zoomSessions, trainerStudents]);

  const stats = [
    { label: 'Clients actifs', value: trainerStudents.length.toString(), icon: People, color: '#2D5BFF' },
    { label: 'Taux de réussite', value: `${completionRate}%`, icon: TrendingUp, color: '#00BCD4' },
    { label: 'En retard', value: overdueStudents.toString(), icon: Warning, color: '#FF5252' },
  ];

  const statusData = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      name: col.title,
      value: trainerStudents.filter(s => s.status === col.id).length,
      color: theme.palette.primary.main
    })).filter(d => d.value > 0);
  }, [trainerStudents, theme.palette.primary.main]);

  const COLORS = ['#2D5BFF', '#00BCD4', '#4CAF50', '#FFC107', '#9C27B0', '#FF5252'];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Rapport_BeFree_${dayjs().format('DD_MM_YYYY')}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', py: 2 }}>
      <PageHeader 
        title="Tableau de Bord & Analyses"
        subtitle="Suivi de performance et engagement des élèves"
        breadcrumbs={[{ label: 'Responsable' }, { label: 'Reporting' }]}
      />

      <Box ref={reportRef} sx={{ p: isExporting ? 4 : 0, bgcolor: isExporting ? 'white' : 'transparent' }}>
        {/* Simple Header for PDF */}
        <Box sx={{ display: isExporting ? 'block' : 'none', mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>BE-FREE</Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 2 }}>Rapport d'Activité Formateur</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Généré le {dayjs().format('DD/MM/YYYY à HH:mm')}</Typography>
            <Divider sx={{ my: 3 }} />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                <Card 
                    sx={{ 
                        borderRadius: 4, 
                        border: 'none',
                        bgcolor: 'background.paper',
                        boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.04)}`,
                    }}
                >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: alpha(stat.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        >
                        <stat.icon sx={{ color: stat.color, fontSize: 22 }} />
                        </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {stat.value}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {stat.label}
                    </Typography>
                </CardContent>
                </Card>
            </Grid>
            ))}
        </Grid>

        <Grid container spacing={3}>
            {/* DATA SECTION: CHARTS (SCREEN) OR TABLE (PDF) */}
            <Grid size={{ xs: 12, md: isExporting ? 12 : 8 }}>
                <Card sx={{ borderRadius: 4, height: '100%', boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.04)}`, border: isExporting ? '1px solid #eee' : 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                            {isExporting ? 'Récapitulatif Détaillé des Élèves' : 'Répartition par État d\'Avancement'}
                        </Typography>
                        
                        {isExporting ? (
                            /* RECAP TABLE FOR PDF */
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Élève</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Statut Actuel</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Progression</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Engagement</Typography>
                                </Box>
                                {trainerStudents.map((student) => (
                                    <Box key={student.id} sx={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 2, p: 2, borderBottom: '1px solid #f0f2f5', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.firstName} {student.lastName}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {STATUS_LABELS[student.status]}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{student.progress}%</Typography>
                                        <Typography variant="body2" sx={{ color: student.engagementScore > 7 ? 'success.main' : 'warning.main', fontWeight: 800 }}>
                                            {student.engagementScore}/10
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            /* CHARTS FOR SCREEN */
                            <Box sx={{ height: 350, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statusData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.1)} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
                                        />
                                        <Bar dataKey="value" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* UPCOMING SESSIONS (Hidden in PDF if too long, or kept as a side note) */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: isExporting ? 'none' : 'block' }}>
            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.04)}` }}>
                <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                    Prochaines Séances
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
                        <Box 
                            key={session.id} 
                            sx={{ 
                                p: 2, 
                                borderRadius: 3, 
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.05)}`
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                                {session.title}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 14 }} />
                                    {dayjs(session.date).format('DD MMM')} à {session.time}
                                </Typography>
                                <Chip 
                                    label={`${session.studentIds.length} élèves`} 
                                    size="small" 
                                    sx={{ height: 20, fontSize: '10px', fontWeight: 800 }} 
                                />
                            </Box>
                        </Box>
                    )) : (
                        <Typography variant="bodyMedium" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                            Aucune séance planifiée
                        </Typography>
                    )}
                </Box>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    sx={{ mt: 3, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    onClick={() => window.location.href = '/zoom'}
                >
                    Gérer mon planning
                </Button>
                </CardContent>
            </Card>
            </Grid>

            {/* ANALYSIS SECTION */}
            <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 4, mt: 3, boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.04)}`, border: isExporting ? '1px solid #eee' : 'none' }}>
                <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="headlineSmall" sx={{ fontWeight: 800, mb: 2 }}>
                            Analyse Qualitative
                        </Typography>
                        <Typography variant="bodyLarge" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 3 }}>
                            Le taux de conversion actuel entre l'étape "Formation" et "Terminé" est de <strong>{completionRate}%</strong>. 
                            Une concentration importante de dossiers est observée à l'étape initiale, 
                            nécessitant une attention particulière sur les documents administratifs.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Card sx={{ p: 2, bgcolor: alpha('#4CAF50', 0.05), border: 'none', flex: 1 }}>
                                <CheckCircle sx={{ color: '#4CAF50', mb: 1 }} />
                                <Typography variant="labelLarge" sx={{ display: 'block', mb: 0.5 }}>Points Forts</Typography>
                                <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Engagement élevé sur les séances de coaching.</Typography>
                            </Card>
                            <Card sx={{ p: 2, bgcolor: alpha('#FFC107', 0.05), border: 'none', flex: 1 }}>
                                <Warning sx={{ color: '#FFC107', mb: 1 }} />
                                <Typography variant="labelLarge" sx={{ display: 'block', mb: 0.5 }}>À Surveiller</Typography>
                                <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Délais administratifs sur certains dossiers.</Typography>
                            </Card>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 4, height: '100%' }}>
                            <Typography variant="titleMedium" sx={{ fontWeight: 800, mb: 2 }}>
                                Recommandations Stratégiques
                            </Typography>
                            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                    "Prioriser les relances pour les dossiers en attente de KBIS.",
                                    "Planifier une session collective pour la recherche fournisseur.",
                                    "Vérifier les accès techniques pour les sites en cours."
                                ].map((rec, i) => (
                                    <Box key={i} component="li" sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, mt: 0.3 }}>
                                            {i + 1}
                                        </Box>
                                        <Typography variant="bodyMedium">{rec}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                </CardContent>
            </Card>
            </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
