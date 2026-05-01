import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'FR' | 'EN';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  FR: {
    // Nav
    'nav.dashboard': 'Tableau de bord',
    'nav.clients': 'Clients',
    'nav.zoom': 'Séances Zoom',
    'nav.reporting': 'Reporting',
    'nav.payments': 'Paiements',
    'nav.messages': 'Messages',
    'nav.trainers': 'Formateurs',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Mon Profil',
    'nav.logout': 'Déconnexion',
    
    // Profile
    'profile.title': 'Mon Profil',
    'profile.info': 'Informations',
    'profile.pref': 'Préférences',
    'profile.security': 'Sécurité',
    'profile.save': 'Enregistrer les modifications',
    'profile.username': "Nom d'utilisateur",
    'profile.email': 'Email professionnel',
    'profile.phone': 'Téléphone',
    'profile.lang': 'Langue',
    'profile.darkMode': 'Mode Sombre',
    'profile.personal': 'Détails personnels',
    'profile.firstName': 'Prénom',
    'profile.lastName': 'Nom',
    'profile.bio': 'Biographie / Présentation',
    'profile.bio_hint': 'Briefing informatif apparaissant sur votre profil public.',
    'profile.notifications': 'Centre de Notifications',
    'profile.system': 'Préférences Système',
    
    // Notifications
    'notif.email': 'E-mails Journaliers',
    'notif.email_desc': 'Recevez un résumé de vos ventes et activités.',
    'notif.sessions': 'Rappels de Sessions',
    'notif.sessions_desc': 'Notifications 15 min avant vos coachings prévus.',
    'notif.payments': 'Alertes de Paiement',
    'notif.payments_desc': 'Soyez notifié dès qu\'un client effectue un règlement.',
    'notif.marketing': 'Offres & Nouveautés',
    'notif.marketing_desc': 'Actualités sur l\'évolution de la plateforme Be-Free.',
    
    // Dashboard
    'dash.title': 'Tableau de Bord',
    'dash.welcome': 'Bienvenue sur votre espace Be-Free',
    'dash.revenue': "Chiffre d'Affaires",
    'dash.clients_total': 'Clients Totaux',
    'dash.team_perf': 'Performance Équipe',
    'dash.goal_reached': 'Objectif financier atteint à',
    'dash.latest_clients': 'Derniers Clients',
    'dash.revenue_evolution': 'Évolution des Revenus',
    'dash.business_type': 'Type de Business',
    'dash.status_distribution': 'État des Dossiers',
    'dash.top_challenges': 'Top Challenges',

    // Users Page
    'users.title': 'Gestion des Clients',
    'users.subtitle': 'Contrôlez les accès et le suivi des dossiers de vos clients',
    'users.new': 'Nouveau client',
    'users.export': 'Exporter',
    'users.search': 'Rechercher un client...',
    'users.filter_status': 'Statut Dossier',
    'users.filter_payment': 'Statut Paiement',

    // Shared
    'table.client': 'Client',
    'table.trainer': 'Responsable',
    'table.amount': 'Montant',
    'table.date': 'Date',
    'table.status': 'Statut',
    'table.actions': 'Actions',
    'table.totalDue': 'Montant Formation',
    'table.financialStatus': 'État Financier',
    'table.paid': 'réglé',
    'table.method': 'Méthode',
    'table.reference': 'Référence',

    'status.paid': 'RÉGLÉ',
    'status.pending': 'EN ATTENTE',
    'status.overdue': 'EN RETARD',

    'stats.totalCollected': "Chiffre d'affaire perçu",
    'stats.collectionRate': 'Taux de recouvrement',
    'stats.overdue': 'Dossiers en retard',
    'stats.newPayments': 'Nouveaux règlements',

    'payments.subtitle': "Vue d'ensemble de la santé financière du centre",
    'payments.newPayment': 'Nouveau règlement',

    'errors.fillFields': 'Veuillez remplir tous les champs',
    'errors.general': 'Une erreur est survenue',
    'success.paymentSaved': 'Paiement enregistré avec succès',
    'success.paymentUpdated': 'Versement mis à jour',
    'success.deleted': 'Dossier supprimé définitivement',
    'notifications.markedOverdue': 'marqué en retard',

    // Trainers
    'trainers.title': 'Gestion des Formateurs',
    'trainers.new': 'Nouveau formateur',
    'trainers.search': 'Rechercher un formateur...',
    'trainers.specialty': 'Spécialité',
    'trainers.students': 'Clients suivis',

    // Payments
    'payments.title': 'Suivi des Paiements',
    'payments.amount': 'Montant',
    'payments.date': 'Date',
    'payments.status': 'Statut',
    'payments.method': 'Méthode',
    'payments.pending': 'En attente',
    'payments.completed': 'Terminé',
    'payments.failed': 'Échoué',

    // Zoom
    'zoom.title': 'Planning des Séances',
    'zoom.new': 'Nouvelle séance',
    'zoom.join': 'Rejoindre',
    'zoom.date': 'Date & Heure',
    'zoom.duration': 'Durée',

    // Messages
    'messages.title': 'Messagerie Interne',
    'messages.send': 'Envoyer',
    'messages.placeholder': 'Tapez votre message...',
  },
  EN: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.zoom': 'Zoom Sessions',
    'nav.reporting': 'Reporting',
    'nav.payments': 'Payments',
    'nav.messages': 'Messages',
    'nav.trainers': 'Trainers',
    'nav.settings': 'Settings',
    'nav.profile': 'My Profile',
    'nav.logout': 'Logout',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.info': 'Information',
    'profile.pref': 'Preferences',
    'profile.security': 'Security',
    'profile.save': 'Save Changes',
    'profile.username': 'Username',
    'profile.email': 'Professional Email',
    'profile.phone': 'Phone Number',
    'profile.lang': 'Language',
    'profile.darkMode': 'Dark Mode',
    'profile.personal': 'Personal Details',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.bio': 'Biography / Presentation',
    'profile.bio_hint': 'Brief information appearing on your public profile.',
    'profile.notifications': 'Notification Center',
    'profile.system': 'System Preferences',

    // Notifications
    'notif.email': 'Daily Emails',
    'notif.email_desc': 'Receive a summary of your sales and activities.',
    'notif.sessions': 'Session Reminders',
    'notif.sessions_desc': 'Notifications 15 min before your scheduled coachings.',
    'notif.payments': 'Payment Alerts',
    'notif.payments_desc': 'Be notified as soon as a client makes a payment.',
    'notif.marketing': 'Offers & News',
    'notif.marketing_desc': 'News about the evolution of the Be-Free platform.',

    // Dashboard
    'dash.title': 'Dashboard',
    'dash.welcome': 'Welcome to your Be-Free space',
    'dash.revenue': 'Revenue',
    'dash.clients_total': 'Total Clients',
    'dash.team_perf': 'Team Performance',
    'dash.goal_reached': 'Financial goal reached at',
    'dash.latest_clients': 'Latest Clients',
    'dash.revenue_evolution': 'Revenue Evolution',
    'dash.business_type': 'Business Type',
    'dash.status_distribution': 'File Status',
    'dash.top_challenges': 'Top Challenges',

    // Users Page
    'users.title': 'Client Management',
    'users.subtitle': 'Control access and follow up on your clients files',
    'users.new': 'New Client',
    'users.export': 'Export',
    'users.search': 'Search a client...',
    'users.filter_status': 'File Status',
    'users.filter_payment': 'Payment Status',

    // Shared
    'table.client': 'Client',
    'table.trainer': 'Manager',
    'table.amount': 'Amount',
    'table.date': 'Date',
    'table.status': 'Status',
    'table.actions': 'Actions',
    'table.totalDue': 'Training Amount',
    'table.financialStatus': 'Financial Status',
    'table.paid': 'paid',
    'table.method': 'Method',
    'table.reference': 'Reference',

    'status.paid': 'PAID',
    'status.pending': 'PENDING',
    'status.overdue': 'OVERDUE',

    'stats.totalCollected': 'Revenue Collected',
    'stats.collectionRate': 'Recovery Rate',
    'stats.overdue': 'Overdue Files',
    'stats.newPayments': 'New Payments',

    'payments.subtitle': 'Overview of center financial health',
    'payments.newPayment': 'New Payment',

    'errors.fillFields': 'Please fill all fields',
    'errors.general': 'An error occurred',
    'success.paymentSaved': 'Payment successfully recorded',
    'success.paymentUpdated': 'Payment updated',
    'success.deleted': 'File permanently deleted',
    'notifications.markedOverdue': 'marked as overdue',

    // Trainers
    'trainers.title': 'Trainer Management',
    'trainers.new': 'New Trainer',
    'trainers.search': 'Search a trainer...',
    'trainers.specialty': 'Specialty',
    'trainers.students': 'Followed clients',

    // Payments
    'payments.title': 'Payment Tracking',
    'payments.amount': 'Amount',
    'payments.date': 'Date',
    'payments.status': 'Status',
    'payments.method': 'Method',
    'payments.pending': 'Pending',
    'payments.completed': 'Completed',
    'payments.failed': 'Failed',

    // Zoom
    'zoom.title': 'Session Planning',
    'zoom.new': 'New Session',
    'zoom.join': 'Join',
    'zoom.date': 'Date & Time',
    'zoom.duration': 'Duration',

    // Messages
    'messages.title': 'Internal Messaging',
    'messages.send': 'Send',
    'messages.placeholder': 'Type your message...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('befree_lang') as Language) || 'FR';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('befree_lang', lang);
  };

  const t = (key: string): string => {
    const langData = translations[language];
    // @ts-ignore
    return langData[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
