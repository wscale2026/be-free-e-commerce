import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box, Card, CardContent, Typography, LinearProgress, Chip,
  List, ListItem, Button, Paper, Grid, IconButton, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment,
} from '@mui/material';
import { Warning, CheckCircle, CreditCard, AccountBalanceWallet, ReceiptLong, FileDownload, Delete } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { useMockData } from '@/context/MockDataContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { PageHeader } from '@/components/PageHeader';
import api from '@/lib/api';


export default function StudentPayments() {
  const { user } = useAuth();
  const theme = useTheme();
  const { state, deletePayment, refreshData } = useMockData();
  const { showSnackbar } = useSnackbar();
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isConfirmingStripe, setIsConfirmingStripe] = useState(false);
  const processedStripeSessionRef = useRef<string | null>(null);

  const student = useMemo(() => {
    if (!user) return null;
    return state.students.find((s) => s.userId === user.id) || null;
  }, [state.students, user]);

  const myPayments = useMemo(() => {
    if (!student) return [];
    return state.payments
      .filter((p) => String(p.student_id) === student.id)
      .map(p => ({
        id: p.id,
        date: p.date,
        amount: Number(p.amount),
        label: p.method || p.reference || 'Paiement',
        status: 'Réglé'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.payments, student]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const studentId = params.get('student_id');
    const amount = params.get('amount');

    if (paymentStatus === 'cancelled') {
      showSnackbar('Paiement annulé. Aucun règlement n’a été enregistré.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (paymentStatus !== 'success' || !sessionId || processedStripeSessionRef.current === sessionId) {
      return;
    }

    processedStripeSessionRef.current = sessionId;
    setIsConfirmingStripe(true);

    // Send student_id + amount so the backend can record WITHOUT calling Stripe API
    api.post('/confirm-checkout-session/', {
      session_id: sessionId,
      student_id: studentId,
      amount: amount,
    })
      .then(async (response) => {
        await refreshData();
        showSnackbar(
          response.data?.created
            ? 'Paiement confirmé et ajouté à votre historique !'
            : 'Paiement déjà enregistré. Historique synchronisé.',
          'success'
        );
      })
      .catch((error) => {
        processedStripeSessionRef.current = null;
        showSnackbar(error.response?.data?.error || 'Impossible de confirmer le paiement Stripe.', 'error');
      })
      .finally(() => {
        setIsConfirmingStripe(false);
        window.history.replaceState({}, '', window.location.pathname);
      });
  }, [refreshData, showSnackbar]);

  const handleDownloadReceipt = (payment: any) => {
    const today = new Date().toLocaleDateString('fr-FR');
    const receiptHtml = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #111; line-height: 1.6; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4F46E5; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 900; color: #4F46E5; letter-spacing: -1px; }
            .receipt-banner { background: #f4f7ff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 50px; border: 1px solid #e0e7ff; }
            .receipt-title { font-size: 32px; font-weight: 900; color: #111; text-transform: uppercase; margin: 0; }
            .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 60px; }
            .group-title { font-size: 11px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; display: block; border-left: 3px solid #4F46E5; padding-left: 10px; }
            .info-box { font-size: 16px; font-weight: 600; color: #333; }
            .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .payment-table th { text-align: left; padding: 15px; background: #111; color: #fff; text-transform: uppercase; font-size: 12px; font-weight: 800; letter-spacing: 1px; }
            .payment-table td { padding: 20px 15px; border-bottom: 1px solid #eee; font-size: 15px; font-weight: 700; }
            .summary-container { display: flex; justify-content: flex-end; }
            .summary-box { width: 350px; background: #111; color: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; opacity: 0.8; }
            .summary-total { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 24px; font-weight: 900; }
            .footer { margin-top: 100px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 30px; }
            .stamp { color: #059669; border: 4px double #059669; padding: 10px 20px; display: inline-block; font-weight: 900; text-transform: uppercase; transform: rotate(-5deg); margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BE-FREE E-COMMERCE</div>
            <div style="text-align: right">
              <div style="font-weight: 800; font-size: 14px;">REÇU N° REC-${Date.now().toString().slice(-6)}</div>
              <div style="color: #666; font-size: 14px;">Date: ${today}</div>
            </div>
          </div>

          <div class="receipt-banner">
            <h1 class="receipt-title">Confirmation de Règlement</h1>
          </div>

          <div class="info-section">
            <div>
              <span class="group-title">ÉMETTEUR</span>
              <div class="info-box">
                <strong>BE-FREE E-COMMERCE</strong><br/>
                Service Comptabilité<br/>
                75008 Paris, France<br/>
                contact@befree.fr
              </div>
            </div>
            <div style="text-align: right">
              <span class="group-title">CLIENT</span>
              <div class="info-box">
                <strong>${student?.firstName} ${student?.lastName}</strong><br/>
                Email: ${student?.email}<br/>
                ID Etudiant: ${student?.id}
              </div>
            </div>
          </div>

          <table class="payment-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Mode de paiement</th>
                <th>Date</th>
                <th style="text-align: right">Montant VALIDE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${payment.label}</td>
                <td>${payment.method || 'Virement/CB'}</td>
                <td>${dayjs(payment.date).format('DD/MM/YYYY')}</td>
                <td style="text-align: right; font-size: 18px;">${payment.amount.toLocaleString('fr-FR')} €</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row"><span>Sous-total HT</span> <span>${(payment.amount / 1.2).toFixed(2)} €</span></div>
              <div class="summary-row"><span>TVA (20%)</span> <span>${(payment.amount - (payment.amount / 1.2)).toFixed(2)} €</span></div>
              <div class="summary-total">
                <span>TOTAL TTC</span>
                <span>${payment.amount.toLocaleString('fr-FR')} €</span>
              </div>
              <div style="text-align: center">
                <div class="stamp">PAYÉ - MERCi</div>
              </div>
            </div>
          </div>

          <div class="footer">
            BE-FREE E-COMMERCE - SIRET 123 456 789 00012 - RCS PARIS<br/>
            Ce document est une preuve officielle de paiement. Toute reproduction frauduleuse est passible de poursuites.<br/>
            <strong>Merci pour votre confiance dans notre programme d'excellence.</strong>
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
  };

  const handleExportStatement = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    
    // Construct rows for all payments
    const rows = myPayments.map(p => `
      <tr>
        <td>${new Date(p.date).toLocaleDateString('fr-FR')}</td>
        <td>${p.label}</td>
        <td><span style="color: #059669; font-weight: 800;">${p.status}</span></td>
        <td style="text-align: right;">${p.amount.toFixed(2)} €</td>
      </tr>
    `).join('');

    const statementHtml = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #111; line-height: 1.6; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #111; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
            .receipt-banner { background: #fdfdfd; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 50px; border: 1px solid #eee; }
            .receipt-title { font-size: 32px; font-weight: 900; color: #111; text-transform: uppercase; margin: 0; }
            .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 60px; }
            .group-title { font-size: 11px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; display: block; border-left: 3px solid #111; padding-left: 10px; }
            .info-box { font-size: 16px; font-weight: 600; color: #333; }
            .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .payment-table th { text-align: left; padding: 15px; background: #f5f5f5; color: #333; text-transform: uppercase; font-size: 12px; font-weight: 800; letter-spacing: 1px; border-bottom: 2px solid #ddd; }
            .payment-table td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600; }
            .summary-container { display: flex; justify-content: flex-end; }
            .summary-box { width: 350px; background: #fafafa; border: 1px solid #eee; color: #111; padding: 30px; border-radius: 16px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; font-weight: 700; color: #555; }
            .summary-total { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 20px; font-weight: 900; color: #111; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BE-FREE E-COMMERCE</div>
            <div style="text-align: right">
              <div style="font-weight: 800; font-size: 14px;">RELEVÉ DE COMPTE</div>
              <div style="color: #666; font-size: 14px;">Édité le: ${today}</div>
            </div>
          </div>

          <div class="receipt-banner">
            <h1 class="receipt-title">Relevé Financier Détaillé</h1>
          </div>

          <div class="info-section">
            <div>
              <span class="group-title">ÉMETTEUR</span>
              <div class="info-box">
                <strong>BE-FREE E-COMMERCE</strong><br/>
                Service Comptabilité<br/>
                75008 Paris, France<br/>
              </div>
            </div>
            <div style="text-align: right">
              <span class="group-title">RÉFÉRENCE CLIENT</span>
              <div class="info-box">
                <strong>${student?.firstName || ''} ${student?.lastName || ''}</strong><br/>
                ID Etudiant: ${student?.id || ''}
              </div>
            </div>
          </div>

          <h3 style="font-weight: 900; text-transform: uppercase; font-size: 14px; margin-bottom: 15px;">Historique des Transactions</h3>
          <table class="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé / Réf</th>
                <th>Statut</th>
                <th style="text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="4" style="text-align:center;">Aucune transaction enregistrée.</td></tr>'}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row">
                <span>Investissement Total</span>
                <span>${student?.totalDue?.toFixed(2) || '0.00'} €</span>
              </div>
              <div class="summary-row">
                <span>Total Réglé</span>
                <span>${student?.paidAmount?.toFixed(2) || '0.00'} €</span>
              </div>
              <div class="summary-total">
                <span>Reste à Payer</span>
                <span style="color: ${(student?.totalDue || 0) - (student?.paidAmount || 0) > 0 ? '#DC2626' : '#059669'};">
                    ${((student?.totalDue || 0) - (student?.paidAmount || 0)).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          <div class="footer">
            Document généré automatiquement le ${today}. Ce relevé annule et remplace tout document antérieur.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(statementHtml);
      printWindow.document.close();
    }
  };

  const handleDeleteClick = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
        await deletePayment(deleteConfirm.id);
        setDeleteConfirm(null);
    } catch (error) {
        console.error("Delete error:", error);
    } finally {
        setIsDeleting(false);
    }
  };

  const [stripeBlockedOpen, setStripeBlockedOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  const handleCheckout = async () => {
      const amountNum = Number(paymentAmount);
      if (!paymentAmount || isNaN(amountNum) || amountNum <= 0) {
          showSnackbar("Veuillez saisir un montant valide.", "error");
          return;
      }
      if (amountNum % 500 !== 0) {
          showSnackbar("Le montant doit être un multiple de 500 € (par ex. 500, 1000, 1500...).", "error");
          return;
      }
      if (!student?.id) {
          showSnackbar("Profil étudiant introuvable.", "error");
          return;
      }

      setIsRedirecting(true);
      try {
          // Backend creates the Stripe Checkout session (official server-side architecture)
          // Customer email/name/phone are pre-filled automatically by the backend
          const response = await api.post('/create-checkout-session/', {
              student_id: student.id,
              amount: amountNum,
          });

          const { url, stripe_mode } = response.data;

          if (!url) {
              showSnackbar("Stripe n'a pas retourné d'URL de paiement.", "error");
              setIsRedirecting(false);
              return;
          }

          // Simple redirect to Stripe Checkout page (no Stripe.js needed)
          console.log(`Redirecting to Stripe [${stripe_mode?.toUpperCase()}]...`);
          window.location.href = url;

      } catch (error: any) {
          setIsRedirecting(false);
          const data = error.response?.data;

          // If server flagged as Stripe network issue, show fallback dialog
          if (data?.stripe_unavailable) {
              setPendingAmount(amountNum);
              setStripeBlockedOpen(true);
              return;
          }

          const errMsg = data?.error || "Erreur lors de l'initialisation du paiement.";
          showSnackbar(errMsg, "error");
      }
  };

  const handleRecordManualPayment = async () => {
      if (!student?.id || !pendingAmount) return;
      try {
          await api.post('/record-payment/', {
              student_id: student.id,
              amount: pendingAmount,
              method: 'Virement Bancaire',
              reference: `VIREMENT_${Date.now()}`,
          });
          await refreshData();
          setStripeBlockedOpen(false);
          setPendingAmount(0);
          setPaymentDialogOpen(false);
          showSnackbar(`Paiement de ${pendingAmount} € enregistré comme virement bancaire.`, 'success');
      } catch (err: any) {
          showSnackbar(err.response?.data?.error || "Erreur lors de l'enregistrement.", 'error');
      }
  };


  if (!student) return null;

  const paymentPercentage = (student.paidAmount / student.totalDue) * 100;
  const isRestricted = student.paymentStatus === 'overdue' && !student.instalment2Paid;

  return (
    <>
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
        <PageHeader 
            title="Gestion Financiaire"
            subtitle="Vue d'ensemble de votre investissement et historique des règlements"
            breadcrumbs={[{ label: 'Espace Client' }, { label: 'Paiements' }]}
            action={
                <Button
                    variant="contained"
                    startIcon={<ReceiptLong />}
                    onClick={handleExportStatement}
                    sx={{ 
                        borderRadius: '14px',
                        px: 3,
                        py: 1.2,
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    Exporter Relevé (PDF)
                </Button>
            }
        />

      <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
              {/* Premium Balance Card */}
              <Card sx={{ 
                  borderRadius: 4, 
                  mb: 4, 
                  border: 'none', 
                  position: 'relative',
                  overflow: 'visible',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 30px 60px ${alpha(theme.palette.text.primary, 0.05)}`,
                  '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 4,
                      padding: '1px',
                      background: `linear-gradient(135deg, ${alpha('#fff', 0.5)}, ${alpha('#fff', 0.05)})`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      pointerEvents: 'none'
                  }
              }}>
                  <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={3}
                        sx={{ mb: 6, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
                      >
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AccountBalanceWallet sx={{ color: 'primary.main', fontSize: 22 }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Récapitulatif de votre Solde</Typography>
                            </Box>
                            <Typography variant="bodyMedium" sx={{ color: 'text.secondary', fontWeight: 500 }}>Mis à jour en temps réel selon les validations administratives</Typography>
                          </Box>
                          <Chip 
                            icon={student.paymentStatus === 'OK' ? <CheckCircle sx={{ fontSize: 18 }} /> : <Warning sx={{ fontSize: 18 }} />}
                            label={student.paymentStatus === 'OK' ? 'COMPTE À JOUR' : 'ÉCHÉANCE EN RETARD'}
                            sx={{ 
                                height: 40,
                                px: 1,
                                bgcolor: student.paymentStatus === 'OK' ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                                color: student.paymentStatus === 'OK' ? '#059669' : '#DC2626',
                                fontWeight: 900,
                                fontSize: '13px',
                                borderRadius: '12px',
                                border: '1px solid',
                                borderColor: student.paymentStatus === 'OK' ? alpha('#10B981', 0.2) : alpha('#EF4444', 0.2),
                            }}
                          />
                      </Stack>

                      <Grid container spacing={3} sx={{ mb: 5 }}>
                          <Grid size={{ xs: 12, md: 6 }}>
                              <Box sx={{ p: 4, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px solid ${alpha(theme.palette.primary.main, 0.05)}` }}>
                                  <Typography variant="labelSmall" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', mb: 2, display: 'block' }}>Total de la formation</Typography>
                                  <Typography variant="h2" sx={{ fontWeight: 900, mb: 1 }}>{student.totalDue} €</Typography>
                                  <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 600 }}>Inscrit au programme certifiant Be-Free</Typography>
                              </Box>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                              <Box sx={{ p: 4, borderRadius: 4, bgcolor: alpha('#10B981', 0.03), border: `1px solid ${alpha('#10B981', 0.05)}` }}>
                                  <Typography variant="labelSmall" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', mb: 2, display: 'block' }}>Montant déjà réglé</Typography>
                                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#059669', mb: 1 }}>{student.paidAmount} €</Typography>
                                  <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 600 }}>{Math.round(paymentPercentage)}% de votre investissement complété</Typography>
                              </Box>
                          </Grid>
                      </Grid>

                      <Box sx={{ mb: 6 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="labelLarge" sx={{ fontWeight: 800 }}>Progression du financement</Typography>
                              <Typography variant="labelLarge" sx={{ fontWeight: 900, color: 'primary.main' }}>{Math.round(paymentPercentage)}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={paymentPercentage}
                            sx={{
                                height: 16,
                                borderRadius: 8,
                                bgcolor: alpha(theme.palette.text.primary, 0.04),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: student.paymentStatus === 'overdue' ? '#EF4444' : 'primary.main',
                                    borderRadius: 8,
                                    boxShadow: student.paymentStatus === 'overdue' ? 'none' : `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                                },
                            }}
                          />
                      </Box>

                      <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), border: `1px solid ${alpha(theme.palette.divider, 0.4)}`, height: '100%' }} elevation={0}>
                                    <Typography variant="labelSmall" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 700 }}>RESTE À PAYER</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{student.totalDue - student.paidAmount} €</Typography>
                                </Paper>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), border: `1px solid ${alpha(theme.palette.divider, 0.4)}`, height: '100%' }} elevation={0}>
                                    <Typography variant="labelSmall" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 700 }}>PROCHAINE ÉCHÉANCE</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: student.paymentStatus === 'overdue' ? '#EF4444' : 'text.primary' }}>
                                        {student.nextDueDate ? dayjs(student.nextDueDate).format('D MMMM YYYY') : 'À définir'}
                                    </Typography>
                                </Paper>
                          </Grid>
                      </Grid>
                  </CardContent>
              </Card>

              {isRestricted && (
                <Paper sx={{ 
                    p: 4, 
                    borderRadius: 4, 
                    bgcolor: alpha('#EF4444', 0.05), 
                    display: 'flex', 
                    gap: 3, 
                    border: '1px solid',
                    borderColor: alpha('#EF4444', 0.1),
                    mb: 4
                }} elevation={0}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: alpha('#EF4444', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Warning sx={{ color: '#EF4444' }} />
                  </Box>
                  <Box>
                    <Typography variant="titleMedium" sx={{ color: '#DC2626', fontWeight: 900, mb: 1, display: 'block' }}>
                        Accès Restreint détecté
                    </Typography>
                    <Typography variant="bodyMedium" sx={{ color: '#991B1B', fontWeight: 500, lineHeight: 1.6 }}>
                        Attention : Suite à un retard de règlement, le téléchargement de vos documents administratifs (KBIS, site...) est momentanément suspendu. 
                        Veuillez régulariser votre situation pour rétablir vos accès complets.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="error" 
                        size="small" 
                        sx={{ mt: 2, fontWeight: 800, borderRadius: '8px', textTransform: 'none', px: 3 }}
                        onClick={() => window.open('https://stripe.com', '_blank')}
                    >
                        Régulariser maintenant
                    </Button>
                  </Box>
                </Paper>
              )}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
              {/* Desktop History UI */}
              <Card sx={{ 
                  borderRadius: 4, 
                  border: 'none', 
                  boxShadow: `0 30px 60px ${alpha(theme.palette.text.primary, 0.03)}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
              }}>
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Détail des Transactions</Typography>
                        <Chip label={`${myPayments.length} Reçus`} size="small" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }} />
                      </Box>

                      {isConfirmingStripe && (
                        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }} elevation={0}>
                          <Typography variant="bodySmall" sx={{ fontWeight: 800 }}>
                            Confirmation du paiement Stripe en cours...
                          </Typography>
                        </Paper>
                      )}

                      <List sx={{ p: 0, flex: 1 }}>
                        {myPayments.length > 0 ? myPayments.map((payment, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              px: 0,
                              py: 2.5,
                              borderBottom: index < myPayments.length - 1 ? '1px solid' : 'none',
                              borderColor: alpha(theme.palette.divider, 0.5),
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover': {
                                  '& .download-btn': { opacity: 1, transform: 'translateX(0)' }
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: '14px', 
                                    bgcolor: alpha(theme.palette.primary.main, 0.05), 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'primary.main',
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                }}>
                                    <CreditCard sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography variant="bodyMedium" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>{payment.label}</Typography>
                                    <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {dayjs(payment.date).format('DD MMMM YYYY')}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box>
                                    <Typography variant="bodyLarge" sx={{ fontWeight: 900, color: 'primary.main', display: 'block' }}>+{payment.amount} €</Typography>
                                    <Typography variant="bodySmall" sx={{ color: '#059669', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}>Validé</Typography>
                                </Box>
                                <Stack direction="row">
                                    <IconButton 
                                        className="download-btn"
                                        size="small" 
                                        onClick={() => handleDownloadReceipt(payment)}
                                        sx={{ 
                                            color: 'primary.main', 
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            opacity: { xs: 1, md: 0 },
                                            transform: { xs: 'none', md: 'translateX(10px)' },
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                        }}
                                    >
                                        <FileDownload sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setDeleteConfirm(payment)}
                                        sx={{ 
                                            color: 'error.main', 
                                            bgcolor: alpha(theme.palette.error.main, 0.05),
                                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                        }}
                                    >
                                        <Delete sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Stack>
                            </Box>
                          </ListItem>
                        )) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
                                <Typography variant="bodyMedium" sx={{ color: 'text.secondary', fontWeight: 600 }}>Aucune transaction trouvée</Typography>
                            </Box>
                        )}
                      </List>

                      <Box sx={{ pt: 4, mt: 'auto' }}>
                        <Button 
                            fullWidth 
                            variant="contained"
                            color="primary"
                            startIcon={<CreditCard />}
                            sx={{ mb: 2, py: 1.8, borderRadius: '14px', fontWeight: 900, boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.3)}` }}
                            onClick={() => setPaymentDialogOpen(true)}
                        >
                            Effectuer un règlement
                        </Button>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700, py: 1.5, borderColor: alpha(theme.palette.divider, 1) }}
                        >
                            Contacter le service comptable
                        </Button>
                      </Box>
                  </CardContent>
              </Card>
          </Grid>
      </Grid>
    </Box>

    {/* Delete Confirmation Dialog */}
    <Dialog 
        open={Boolean(deleteConfirm)} 
        onClose={() => !isDeleting && setDeleteConfirm(null)}
        slotProps={{ 
            paper: { 
                sx: { 
                    borderRadius: 4, 
                    p: 1, 
                    maxWidth: 400,
                    backgroundImage: `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 1)}, ${alpha(theme.palette.background.default, 0.95)})`
                } 
            } 
        }}
    >
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Box sx={{ 
                width: 64, height: 64, borderRadius: '20px', 
                bgcolor: alpha(theme.palette.error.main, 0.1), 
                color: 'error.main', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                mx: 'auto', mb: 2.5,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
                <Warning sx={{ fontSize: 32 }} />
            </Box>
            <DialogTitle sx={{ fontWeight: 900, pb: 1, fontSize: '22px' }}>Supprimer définitivement ?</DialogTitle>
            <DialogContent>
                <Typography variant="bodyMedium" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>
                    Êtes-vous sûr de vouloir supprimer ce règlement de <strong>{deleteConfirm?.amount} €</strong> ?<br/>
                    Cette action est <strong style={{ color: theme.palette.error.main }}>irréversible</strong> et impactera votre solde total.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 2, mt: 2 }}>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                    sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, borderColor: 'divider' }}
                >
                    Annuler
                </Button>
                <Button 
                    fullWidth 
                    variant="contained" 
                    color="error"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    sx={{ 
                        borderRadius: '12px', 
                        py: 1.2, 
                        fontWeight: 800, 
                        boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.3)}`
                    }}
                >
                    {isDeleting ? 'Suppression...' : 'Confirmer'}
                </Button>
            </DialogActions>
        </Box>
    </Dialog>

    {/* Stripe Payment Dialog */}
    <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !isRedirecting && setPaymentDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ 
            paper: { 
                sx: { 
                    borderRadius: 4, 
                    p: 2, 
                } 
            } 
        }}
    >
        <DialogTitle sx={{ fontWeight: 900, pb: 1, fontSize: '22px', textAlign: 'center' }}>Nouveau Règlement</DialogTitle>
        <DialogContent>
            <Typography variant="bodyMedium" sx={{ color: 'text.secondary', fontWeight: 500, textAlign: 'center', mb: 4, mt: 1 }}>
                Saisissez le montant que vous souhaitez régler aujourd'hui par carte bancaire.
            </Typography>
            <TextField
                autoFocus
                fullWidth
                label="Montant à régler"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px', 
                        fontSize: '18px', 
                        fontWeight: 700
                    }
                }}
                slotProps={{
                    input: {
                        endAdornment: <InputAdornment position="end" sx={{ fontWeight: 800 }}>€</InputAdornment>,
                    }
                }}
            />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => setPaymentDialogOpen(false)}
                disabled={isRedirecting}
                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, borderColor: 'divider' }}
            >
                Annuler
            </Button>
            <Button 
                fullWidth 
                variant="contained" 
                onClick={handleCheckout}
                disabled={isRedirecting || !paymentAmount}
                sx={{ 
                    borderRadius: '12px', 
                    py: 1.2, 
                    fontWeight: 800, 
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
            >
                {isRedirecting ? 'Connexion Stripe...' : 'Payer via Stripe'}
            </Button>
        </DialogActions>
    </Dialog>

    {/* Stripe Inaccessible — Fallback Dialog */}
    <Dialog
        open={stripeBlockedOpen}
        onClose={() => setStripeBlockedOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
    >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '20px', pb: 0, textAlign: 'center' }}>
            Paiement Alternatif
        </DialogTitle>
        <DialogContent>
            <Typography variant="bodyMedium" sx={{ color: 'text.secondary', textAlign: 'center', mt: 1, mb: 1, lineHeight: 1.7 }}>
                Stripe n'est pas accessible depuis votre réseau actuel.
            </Typography>
            <Typography variant="bodyMedium" sx={{ color: 'success.main', fontWeight: 700, textAlign: 'center', mb: 3 }}>
                Enregistrez votre règlement — votre historique sera mis à jour immédiatement.
            </Typography>
            <Stack spacing={2}>
                <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={handleRecordManualPayment}
                    sx={{ borderRadius: '12px', py: 1.4, fontWeight: 800, textTransform: 'none', fontSize: '16px' }}
                >
                    ✅ Enregistrer le règlement de {pendingAmount} €
                </Button>
                <Typography variant="bodySmall" sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}>
                    L'administrateur verra ce paiement dans son tableau de bord et pourra confirmer la réception.
                </Typography>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setStripeBlockedOpen(false)}
                    sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', borderColor: 'divider' }}
                >
                    Annuler
                </Button>
            </Stack>
        </DialogContent>
    </Dialog>
    </>
  );
}
