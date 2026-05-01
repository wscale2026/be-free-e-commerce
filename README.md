# 🚀 Be-Free E-commerce Platform

**Be-Free** est une plateforme d'accompagnement et de formation e-commerce premium, conçue pour offrir une expérience fluide et professionnelle tant pour les étudiants que pour les formateurs.

## 🛠️ Stack Technique

### Frontend
- **Framework** : [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **UI Library** : [Material UI (MUI)](https://mui.com/)
- **Design** : Glassmorphism, Responsive Mobile-First
- **State Management** : Context API

### Backend
- **Framework** : [Django](https://www.djangoproject.com/) + [DRF](https://www.django-rest-framework.org/)
- **Base de données** : [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Stockage Media** : [Cloudinary](https://cloudinary.com/)
- **Paiements** : [Stripe](https://stripe.com/)
- **Emails** : SMTP (Gmail/Resend)

---

## ✨ Fonctionnalités Clés

### 🎓 Espace Étudiant
- **Tableau de Bord Dynamique** : Roadmap interactive montrant l'avancée du projet (KBIS, CIRE, Site, etc.).
- **Gestion Financière** : Suivi des paiements, échéances automatiques et intégration Stripe sécurisée.
- **Profil Sécurisé** : Changement de mot de passe avec vérification et suppression de compte en multi-étapes.
- **Notifications** : Alertes en temps réel (In-app & Email) lors de la validation des étapes par le formateur.

### 👨‍🏫 Espace Formateur & Admin
- **Gestion des Échéances** : Définition d'une date d'échéance globale s'appliquant automatiquement à tous les clients.
- **Suivi de Progression** : Validation des étapes clés des étudiants déclenchant des notifications automatiques.
- **Administration** : Gestion complète des profils et des paramètres de la plateforme.

---

## 🚀 Installation Locale

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd Be-Free-E-commerce
```

### 2. Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
# Configurez votre .env
python manage.py migrate
python manage.py runserver
```

### 3. Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 Déploiement (Vercel)

La plateforme est pré-configurée pour un déploiement sur **Vercel**.

### Configuration Backend
- Utilise le runtime `@vercel/python`.
- **Fichier de build** : `backend/build.sh` (gère `collectstatic`).
- **EntryPoint** : `backend/config/wsgi.py`.

### Configuration Frontend
- Utilise `@vercel/static-build`.
- **Routage SPA** : Configuré dans `frontend/vercel.json`.

### Variables d'environnement requises :
- `DATABASE_URL` (Supabase)
- `CLOUDINARY_URL` ou clés API individuelles
- `STRIPE_SECRET_KEY`
- `EMAIL_HOST_PASSWORD`

---

## 📄 Licence
© 2026 Be-Free E-commerce. Tous droits réservés.
