import { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, 
  Stack, alpha, useTheme, LinearProgress, Chip,
} from '@mui/material';
import {
  People, TrendingUp, AccountBalanceWallet, Work,
  Notifications, EventAvailable, Star, MoreVert,
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { useMockData } from '@/context/MockDataContext';
import { useLanguage } from '@/context/LanguageContext';

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

const getPaymentDate = (payment: any) => {
  const parsed = new Date(payment.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTrendLabel = (current: number, previous: number, suffix = '') => {
  if (previous === 0) {
    return current > 0 ? `+${current}${suffix}` : 'Stable';
  }

  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.5) return 'Stable';
  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
};

export default function AdminDashboard() {
  const theme = useTheme();
  const { state } = useMockData();
  const { t } = useLanguage();

  const dashboardData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);

    const payments = state.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount || 0),
      parsedDate: getPaymentDate(payment),
    }));

    const totalRevenue = state.students.reduce((sum, student) => sum + Number(student.paidAmount || 0), 0);
    const totalDue = state.students.reduce((sum, student) => sum + Number(student.totalDue || 0), 0);
    const completedClients = state.students.filter((student) => student.status === 'termine').length;
    const paidClients = state.students.filter((student) => student.paymentStatus === 'OK').length;
    const currentMonthRevenue = payments
      .filter((payment) => payment.parsedDate?.getMonth() === currentMonth && payment.parsedDate?.getFullYear() === currentYear)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const previousMonthRevenue = payments
      .filter((payment) => payment.parsedDate?.getMonth() === previousMonthDate.getMonth() && payment.parsedDate?.getFullYear() === previousMonthDate.getFullYear())
      .reduce((sum, payment) => sum + payment.amount, 0);

    const chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentYear, currentMonth - 6 + index, 1);
      const value = payments
        .filter((payment) => payment.parsedDate?.getMonth() === date.getMonth() && payment.parsedDate?.getFullYear() === date.getFullYear())
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        name: monthFormatter.format(date).replace('.', ''),
        value,
        clients: paidClients,
      };
    });

    const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;
    const conversionRate = state.students.length > 0 ? Math.round((completedClients / state.students.length) * 100) : 0;

    return {
      totalRevenue,
      totalDue,
      currentMonthRevenue,
      previousMonthRevenue,
      chartData,
      collectionRate: Math.min(collectionRate, 100),
      conversionRate,
      paidClients,
      latestClients: [...state.students].reverse().slice(0, 4),
      // Diagnostic Data for Pie Charts
      businessData: (() => {
        const counts: Record<string, number> = {};
        state.students.forEach(s => {
          const val = s.hasBusiness || 'Non renseigné';
          counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      })(),
      statusData: (() => {
        const counts: Record<string, number> = {};
        state.students.forEach(s => {
          const val = s.status || 'Inconnu';
          counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      })(),
      challengesData: (() => {
        const counts: Record<string, number> = {};
        state.students.forEach(s => {
          if (s.challenges) {
            s.challenges.split(', ').forEach(c => {
              if (c) counts[c] = (counts[c] || 0) + 1;
            });
          } else {
            counts['Aucun'] = (counts['Aucun'] || 0) + 1;
          }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      })(),
    };
  }, [state.payments, state.students]);

  const stats = [
    { label: t('dash.clients_total'), value: state.students.length, icon: People, color: '#4F46E5', trend: `${dashboardData.paidClients} ${t('finance.paid') || 'réglé(s)'}` },
    { label: t('dash.revenue'), value: currencyFormatter.format(dashboardData.totalRevenue), icon: AccountBalanceWallet, color: '#10B981', trend: getTrendLabel(dashboardData.currentMonthRevenue, dashboardData.previousMonthRevenue) },
    { label: t('nav.trainers'), value: state.trainers.length, icon: Work, color: '#F59E0B', trend: state.trainers.length > 0 ? 'Actif' : 'À créer' },
    { label: 'Taux de Conversion', value: `${dashboardData.conversionRate}%`, icon: TrendingUp, color: '#EF4444', trend: `${dashboardData.collectionRate}% recouvré` },
  ];

  return (
    <Box sx={{ pb: 8 }}>
      <PageHeader 
        title={t('dash.title')}
        subtitle={t('dash.welcome')}
        breadcrumbs={[{ label: t('nav.dashboard') }, { label: 'General' }]}
      />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
            <Card sx={{ borderRadius: 1, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                  <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(stat.color, 0.1), color: stat.color }}>
                    <stat.icon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, letterSpacing: '0.5px' }}>
                      {stat.label.toUpperCase()}
                    </Typography>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                      <Typography variant="displaySmall" sx={{ fontWeight: 900, fontSize: '28px' }}>{stat.value}</Typography>
                      <Typography variant="bodySmall" sx={{ color: stat.trend.includes('+') ? 'success.main' : 'text.secondary', fontWeight: 800 }}>
                        {stat.trend}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Main Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 1, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="titleLarge" sx={{ fontWeight: 900 }}>{t('dash.revenue_evolution')}</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Chiffre d'affaires mensuel sur les 6 derniers mois</Typography>
                </Box>
                  <Chip label={new Date().getFullYear()} size="small" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
              </Stack>
              
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" name="Revenus" stroke={theme.palette.primary.main} strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Mini-Content */}
        <Grid size={{ xs: 12, lg: 4 }}>
           <Stack spacing={3}>
              <Card sx={{ borderRadius: 1, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="titleSmall" sx={{ fontWeight: 900, mb: 3, display: 'block' }}>{t('dash.latest_clients')}</Typography>
                  <Stack spacing={3}>
                    {dashboardData.latestClients.map((client) => (
                      <Stack key={client.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700, fontSize: '13px' }}>
                            {client.firstName?.[0] || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="bodyMedium" sx={{ fontWeight: 700 }}>{client.firstName} {client.lastName}</Typography>
                            <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Client {client.nextDueDate ? 'Actif' : 'Prospect'}</Typography>
                          </Box>
                        </Stack>
                        <Chip label={client.paymentStatus === 'OK' ? 'RÉGLÉ' : 'EN ATTENTE'} size="small" sx={{ fontSize: '10px', fontWeight: 800, height: 22, bgcolor: client.paymentStatus === 'OK' ? alpha('#10B981', 0.1) : alpha('#F59E0B', 0.1), color: client.paymentStatus === 'OK' ? '#10B981' : '#F59E0B' }} />
                      </Stack>
                    ))}
                    {dashboardData.latestClients.length === 0 && (
                      <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>Aucun client créé pour le moment.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 6, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', bgcolor: theme.palette.primary.main, color: 'white' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="titleSmall" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>{t('dash.team_perf')}</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, display: 'block' }}>{t('dash.goal_reached')} {dashboardData.collectionRate}%</Typography>
                  <LinearProgress variant="determinate" value={dashboardData.collectionRate} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="bodySmall" sx={{ fontWeight: 800 }}>{currencyFormatter.format(dashboardData.totalRevenue)}</Typography>
                    <Typography variant="bodySmall" sx={{ fontWeight: 800 }}>{currencyFormatter.format(dashboardData.totalDue)} Objectif</Typography>
                  </Stack>
                </CardContent>
              </Card>
           </Stack>
        </Grid>
      </Grid>

      {/* Pie Charts Row */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="titleSmall" sx={{ fontWeight: 900, mb: 1, display: 'block' }}>{t('dash.business_type')}</Typography>
              <Typography variant="bodySmall" sx={{ color: 'text.secondary', mb: 3, display: 'block' }}>Répartition par statut d'activité</Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.businessData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.businessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="titleSmall" sx={{ fontWeight: 900, mb: 1, display: 'block' }}>{t('dash.status_distribution')}</Typography>
              <Typography variant="bodySmall" sx={{ color: 'text.secondary', mb: 3, display: 'block' }}>Progression dans le pipeline</Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.statusData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[theme.palette.secondary.main, theme.palette.info.main, theme.palette.success.light, theme.palette.warning.light][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="titleSmall" sx={{ fontWeight: 900, mb: 1, display: 'block' }}>{t('dash.top_challenges')}</Typography>
              <Typography variant="bodySmall" sx={{ color: 'text.secondary', mb: 3, display: 'block' }}>Difficultés les plus rencontrées</Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.challengesData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.challengesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
