import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Box, Card, CardContent, Typography, LinearProgress, Stack, Button,
  Paper, Avatar, Grid,
} from '@mui/material';
import {
  CheckCircle, Edit, Block, RadioButtonUnchecked,
  Videocam, Warning, Chat, Notifications,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import { STATUS_LABELS } from '@/types';
import type { StudentStatus } from '@/types';

const STEP_ORDER: StudentStatus[] = ['KBIS', 'CIRE', 'fournisseur', 'site', 'formation', 'termine'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const { state } = useMockData();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const student = useMemo(() => {
    if (!user) return null;
    return state.students.find((s) => s.userId === user.id) || null;
  }, [state.students, user]);

  const assignedTrainer = useMemo(() => {
    if (!student?.trainerId) return null;
    return state.trainers.find(t => t.userId === student.trainerId) || null;
  }, [state.trainers, student?.trainerId]);

  const myZoomSessions = useMemo(() => {
    if (!user) return [];
    return state.zoomSessions
      .filter((z) => z.studentIds.includes(student?.id || ""))
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [state.zoomSessions, user, student]);

  const upcomingSessions = myZoomSessions.filter(
    (z) => new Date(z.date + 'T' + z.time) >= new Date()
  );

  const nextSession = upcomingSessions[0] || null;
  const currentStepIndex = student ? STEP_ORDER.indexOf(student.status) : 0;

  const getStepState = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) {
      if (student?.status === 'termine') return 'completed';
      if (student?.paymentStatus === 'overdue' && student?.status === 'KBIS' && !student?.instalment2Paid) {
        return 'blocked';
      }
      return 'inProgress';
    }
    return 'future';
  };

  const getStepIcon = (state: string) => {
    switch (state) {
      case 'completed': return <CheckCircle sx={{ fontSize: 22 }} />;
      case 'inProgress': return <Edit sx={{ fontSize: 18 }} />;
      case 'blocked': return <Block sx={{ fontSize: 20 }} />;
      default: return <RadioButtonUnchecked sx={{ fontSize: 18 }} />;
    }
  };

  const paymentPercentage = student ? (student.paidAmount / student.totalDue) * 100 : 0;

  if (!student) return null;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 2 }}>
        <PageHeader 
            title={`Ravi de vous revoir, ${student.firstName} 👋`}
            subtitle="Suivez l'avancée de votre projet en temps réel"
            breadcrumbs={[{ label: 'Espace Client' }, { label: 'Tableau de bord' }]}
            action={
                <Button
                    variant="outlined"
                    startIcon={<Notifications />}
                    sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                >
                    Notifications
                </Button>
            }
        />

        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
                {/* Visual Roadmap */}
                <Card sx={{ borderRadius: 1, mb: 4, border: 'none', boxShadow: `0 20px 40px ${alpha(theme.palette.text.primary, 0.03)}` }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="titleMedium" sx={{ mb: 4, fontWeight: 800 }}> 
                            Ma Roadmap Entrepreneuriale
                        </Typography>

                        <Box sx={{ position: 'relative' }}>
                        {STEP_ORDER.map((step, index) => {
                            const stepState = getStepState(index);
                            const isLast = index === STEP_ORDER.length - 1;

                            return (
                            <Box key={step} sx={{ display: 'flex', mb: isLast ? 0 : 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 3 }}>
                                <Box
                                    sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor:
                                        stepState === 'completed' ? 'primary.main' :
                                        stepState === 'inProgress' ? alpha(theme.palette.primary.main, 0.1) :
                                        stepState === 'blocked' ? alpha(theme.palette.error.main, 0.1) :
                                        alpha(theme.palette.text.disabled, 0.1),
                                    color:
                                        stepState === 'completed' ? 'white' :
                                        stepState === 'inProgress' ? 'primary.main' :
                                        stepState === 'blocked' ? 'error.main' :
                                        'text.disabled',
                                    boxShadow: stepState === 'completed' ? `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
                                    transition: 'all 0.3s ease',
                                    }}
                                >
                                    {getStepIcon(stepState)}
                                </Box>
                                {!isLast && (
                                    <Box
                                    sx={{
                                        width: 2,
                                        flex: 1,
                                        minHeight: 40,
                                        bgcolor: stepState === 'completed' ? 'primary.main' : alpha(theme.palette.divider, 0.5),
                                        opacity: 0.5,
                                        mt: 1,
                                    }}
                                    />
                                )}
                                </Box>

                                <Box sx={{ flex: 1, pt: 1 }}>
                                <Typography
                                    variant="labelLarge"
                                    sx={{
                                    fontSize: '16px',
                                    fontWeight: stepState === 'inProgress' || stepState === 'blocked' ? 800 : 700,
                                    color: stepState === 'future' ? 'text.disabled' : 'text.primary',
                                    mb: 0.5,
                                    display: 'block'
                                    }}
                                >
                                    {STATUS_LABELS[step]}
                                </Typography>
                                <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                                    {stepState === 'completed' ? 'Validé avec succès' :
                                    stepState === 'inProgress' ? 'Action requise ou en cours' :
                                    stepState === 'blocked' ? 'Paiement en attente' : 'Étape verrouillée'}
                                </Typography>
                                {step === 'KBIS' && stepState !== 'completed' && student && student.paidAmount < 1000 && (
                                    <Typography variant="bodySmall" sx={{ color: 'error.main', fontWeight: 700, display: 'block', mt: 0.5 }}>
                                        ⚠️ Le traitement du KBIS ne peut débuter que lorsque le paiement atteint un minimum de 1000 €.
                                    </Typography>
                                )}
                                {step === 'KBIS' && student?.kbisFile && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<CheckCircle />}
                                        href={student.kbisFile.startsWith('http') ? student.kbisFile : `http://localhost:8000${student.kbisFile}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 1, borderRadius: '8px', fontWeight: 700, color: 'success.main', borderColor: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: 'success.main' } }}
                                    >
                                        Télécharger mon KBIS
                                    </Button>
                                )}
                                </Box>
                            </Box>
                            );
                        })}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
                {/* Next Session Card */}
                <Card sx={{ borderRadius: 1, mb: 4, background: 'linear-gradient(135deg, #2D5BFF, #1A3ABF)', color: 'white', border: 'none', overflow: 'hidden', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
                    <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Videocam sx={{ color: 'rgba(255,255,255,0.8)' }} />
                            <Typography variant="labelLarge" sx={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                                Prochain Rendez-vous
                            </Typography>
                        </Box>

                        {nextSession ? (
                            <Box>
                                <Typography variant="headlineSmall" sx={{ fontWeight: 800, mb: 1, color: 'white' }}>
                                    {nextSession.title}
                                </Typography>
                                <Typography variant="bodyLarge" sx={{ mb: 4, opacity: 0.9, fontWeight: 500 }}>
                                    {dayjs(nextSession.date + 'T' + nextSession.time).format('dddd D MMMM [à] HH:mm')}
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    href={nextSession.link}
                                    target="_blank"
                                    sx={{ 
                                        bgcolor: 'white', 
                                        color: 'primary.main', 
                                        fontWeight: 800, 
                                        borderRadius: '12px',
                                        py: 1.5,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } 
                                    }}
                                >
                                    Rejoindre la séance
                                </Button>
                            </Box>
                        ) : (
                            <Typography variant="bodyMedium" sx={{ opacity: 0.8 }}>
                                Aucune séance planifiée prochainement.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card sx={{ borderRadius: 1, mb: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="titleMedium" sx={{ mb: 3, fontWeight: 800 }}>
                            Situation Financière
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                            <Typography variant="displaySmall" sx={{ fontWeight: 800 }}>
                                {student.paidAmount}€
                            </Typography>
                            <Typography variant="bodyLarge" sx={{ color: 'text.secondary', mb: 0.8 }}>
                                réglés sur {student.totalDue}€
                            </Typography>
                        </Box>

                        <LinearProgress
                            variant="determinate"
                            value={paymentPercentage}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: alpha(theme.palette.text.primary, 0.05),
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                },
                                mb: 3,
                            }}
                        />

                        {student.paymentStatus === 'overdue' && (
                            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }} elevation={0}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Warning sx={{ color: 'error.main', fontSize: 20 }} />
                                    <Box>
                                        <Typography variant="labelLarge" sx={{ color: 'error.main', fontWeight: 800, display: 'block' }}>
                                            Échéance en retard
                                        </Typography>
                                        <Typography variant="bodySmall" sx={{ color: 'error.main' }}>
                                            Certaines fonctionnalités sont restreintes.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        )}
                    </CardContent>
                </Card>

                {/* Trainer Contact Box */}
                <Paper sx={{ p: 3, borderRadius: 1, bgcolor: alpha(theme.palette.text.primary, 0.02), border: 'none' }} elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>
                            {assignedTrainer ? assignedTrainer.firstName[0] : 'F'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="labelLarge" sx={{ fontWeight: 800 }}>
                                {assignedTrainer ? `${assignedTrainer.firstName} ${assignedTrainer.lastName}` : 'Mon Formateur Référent'}
                            </Typography>
                            <Typography variant="bodySmall" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Disponible pour vous aider</Typography>
                            <Button 
                                size="small" 
                                startIcon={<Chat />} 
                                sx={{ fontWeight: 700, borderRadius: '8px' }}
                                onClick={() => navigate('/messages')}
                            >
                                Envoyer un message
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
      </Box>
  );
}
