<<<<<<< HEAD
# 🏆 Tournoi Inter-IUT Lorraine 2027

Application web complète pour gérer le tournoi sportif inter-IUT de Lorraine.

## 🎯 Fonctionnalités

### ✅ Phase 1 (En cours)
- [x] Page d'accueil avec compte à rebours
- [x] Design system couleurs Lorraine
- [x] Configuration Airtable
- [ ] Authentification joueurs/bénévoles/admin
- [ ] Portail joueurs
- [ ] Dashboard bénévoles
- [ ] Dashboard admin

### 🔜 À venir
- Urgences médicales + Objets perdus
- Check-in participants (QR code)
- Saisie scores en direct
- Votes MVP
- Notifications push
- Galerie photos

## 🚀 Installation & Démarrage

### Prérequis
- Node.js 18+ installé
- Accès à la base Airtable

### Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env.local avec :
AIRTABLE_TOKEN=votre_token_ici
AIRTABLE_BASE_ID=votre_base_id_ici
NEXTAUTH_SECRET=secret_aleatoire_genere
NEXTAUTH_URL=http://localhost:3000

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur http://localhost:3000

### Build de production

```bash
npm run build
npm start
```

## 📁 Structure du projet

```
tournoi-iut/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page d'accueil
│   ├── layout.tsx         # Layout principal
│   ├── globals.css        # Styles globaux
│   ├── joueur/            # Portail joueurs
│   ├── benevole/          # Dashboard bénévoles
│   └── admin/             # Dashboard admin
├── components/            # Composants réutilisables
├── lib/                   # Utilitaires et configuration
│   └── airtable.ts       # Configuration Airtable
├── public/               # Assets statiques
│   └── logo.png          # Logo InterCampus
└── package.json
```

## 🎨 Design System

### Couleurs Lorraine
- **Bleu primaire** : #004B87 (headers, boutons)
- **Rouge accent** : #DC143C (urgences, alertes)
- **Or** : #FFD700 (trophées, podiums)

### Typographie
- Font : Inter (Google Fonts)
- Titres : Bold
- Corps : Regular/Medium

## 🔌 Connexion Airtable

L'application se connecte à votre base Airtable existante avec 12 tables :

1. IUT & Délégations
2. Équipes
3. Participants
4. Matchs
5. Résultats & Classements
6. Logistique Repas
7. Transports
8. Hébergement
9. Budget
10. Tâches & To-Do
11. Communication & Sponsors
12. Sécurité & Incidents

## 📧 Contact

**Coordinateur** : Lilian SCHMITT  
**Email** : lilian.schmitt1@etu.univ-lorraine.fr

## 📅 Timeline de développement

- **Semaine 1** : Interface publique + Auth + Portail joueurs
- **Semaine 2** : Dashboard bénévoles + admin
- **Semaine 3** : Fonctionnalités avancées (votes, notifications)
- **Semaine 4** : Tests + Corrections
- **Deadline** : J-7 avant le tournoi (14 janvier 2027)

## 🚀 Déploiement

L'application sera déployée sur Vercel :
- **URL de production** : tournoi-iut-lorraine.vercel.app
- **Deploy automatique** : À chaque commit sur main
- **SSL/HTTPS** : Automatique
- **CDN** : Mondial

## 📝 License

© 2027 IUT Saint-Dié-des-Vosges - Tous droits réservés
