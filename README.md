# ProjetIntegrateurBanque

Application bancaire pédagogique simulant clients, comptes et transactions fictives pour l'apprentissage.

## 📋 Description

Application web éducative conçue pour enseigner la gestion bancaire et le développement d'applications. Elle simule un système bancaire complet avec :
- Gestion de clients fictifs
- Création et gestion de comptes (chèques, épargne, crédit)
- Opérations bancaires (virements, paiements)
- Historique des transactions
- Interface responsive et intuitive
- Rôles utilisateurs (étudiant et enseignant)

## 👥 Membres

Seyfeddine, Kamilia

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation

1. Cloner le repository :
```bash
git clone https://github.com/MartialIk/ProjetIntegrateurBanque.git
cd ProjetIntegrateurBanque
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer le serveur :
```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

## 🔐 Comptes de Démonstration

### Enseignant (accès complet)
- **Nom d'utilisateur:** `enseignant`
- **Mot de passe:** `prof2024`
- **Permissions:** Création/modification/suppression de clients et comptes, accès aux statistiques

### Étudiant (accès lecture et transactions)
- **Nom d'utilisateur:** `etudiant`
- **Mot de passe:** `etudiant2024`
- **Permissions:** Consultation des données, réalisation de virements et paiements

## 📱 Fonctionnalités

### Pour tous les utilisateurs
- **Tableau de bord** : Vue d'ensemble des statistiques et transactions récentes
- **Consultation des clients** : Liste complète des clients fictifs
- **Consultation des comptes** : Visualisation des comptes par client
- **Transactions** : 
  - Effectuer des virements entre comptes
  - Effectuer des paiements
  - Consulter l'historique complet des transactions

### Pour les enseignants uniquement
- **Gestion des clients** : Ajouter, modifier, supprimer des clients
- **Gestion des comptes** : Créer de nouveaux comptes, activer/désactiver, supprimer
- **Administration** : Statistiques détaillées du système
- **Contrôle complet** : Supervision de toutes les opérations

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Serveur:** `backend/server.js`
- **API REST** avec les endpoints suivants :
  - `/api/login` - Authentification
  - `/api/clients` - Gestion des clients (CRUD)
  - `/api/accounts` - Gestion des comptes (CRUD)
  - `/api/transactions` - Gestion des transactions
  - `/api/stats` - Statistiques (enseignants)

### Frontend
- **HTML5/CSS3/JavaScript** vanilla (sans framework)
- Interface responsive avec design moderne
- **Fichiers:**
  - `public/index.html` - Structure de l'application
  - `public/styles.css` - Styles et responsive design
  - `public/app.js` - Logique de l'application

### Base de Données
- **Format:** JSON (fichiers plats)
- **Localisation:** `data/`
- **Fichiers:**
  - `users.json` - Comptes utilisateurs
  - `clients.json` - Clients bancaires
  - `accounts.json` - Comptes bancaires
  - `transactions.json` - Historique des transactions

## 📊 Données Fictives

L'application inclut des données de démonstration :
- 4 clients fictifs avec informations complètes
- 6 comptes bancaires variés (chèques, épargne, crédit)
- 5 transactions d'exemple
- 2 comptes utilisateurs (enseignant et étudiant)

## 🎯 Objectifs Pédagogiques

Cette application permet aux étudiants d'apprendre :
1. **Concepts bancaires** : Types de comptes, transactions, gestion de soldes
2. **Développement web** : Architecture client-serveur, API REST, interfaces responsive
3. **Gestion de données** : CRUD, validation, intégrité des données
4. **Sécurité** : Authentification, autorisation par rôles
5. **UX/UI** : Design d'interface intuitive et accessible

## 🔒 Sécurité

⚠️ **Note importante** : Cette application est à usage pédagogique uniquement. Les mots de passe sont stockés en clair et l'authentification est simplifiée. Ne pas utiliser en production.

## 🛠️ Technologies Utilisées

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Stockage:** JSON (système de fichiers)
- **Dépendances:**
  - `express` - Framework web
  - `cors` - Gestion CORS
  - `body-parser` - Parsing des requêtes
  - `uuid` - Génération d'identifiants uniques

## 📝 Structure du Projet

```
ProjetIntegrateurBanque/
├── backend/
│   └── server.js           # Serveur Express et API
├── public/
│   ├── index.html          # Interface utilisateur
│   ├── styles.css          # Styles CSS
│   └── app.js              # Logique frontend
├── data/
│   ├── users.json          # Utilisateurs
│   ├── clients.json        # Clients
│   ├── accounts.json       # Comptes
│   └── transactions.json   # Transactions
├── package.json
├── .gitignore
└── README.md
```

## 🤝 Contribution

Pour contribuer à ce projet :
1. Fork le repository
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est à usage éducatif.

