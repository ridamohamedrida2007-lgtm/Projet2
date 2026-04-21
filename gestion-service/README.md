# Gestion des Tableaux de Service

Application full-stack de gestion des tableaux de service pour Airports of Morocco, Aéroport Essaouira Mogador.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router DOM, Chart.js
- Backend: Node.js, Express, mysql2, JWT, bcryptjs
- Base de données: MySQL via XAMPP

## Structure

```text
gestion-service/
├── backend/
└── frontend/
```

## Prérequis

- Node.js 18+
- XAMPP avec MySQL démarré sur `localhost:3306`
- Base utilisateur MySQL: `root`
- Mot de passe MySQL vide par défaut

## Installation

### 1. Base de données

1. Ouvrir phpMyAdmin.
2. Créer la base `gestion_service` avec la collation `utf8mb4_general_ci` si besoin.
3. Importer le fichier [schema.sql](/c:/Users/pc/Desktop/Projet%202/gestion-service/backend/database/schema.sql).

Compte administrateur par défaut:

- Email: `admin@aeroport.ma`
- Mot de passe: `admin123`

### 2. Backend

```bash
cd gestion-service/backend
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:5000`.

### 3. Frontend

```bash
cd gestion-service/frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`.

## Fonctionnalités

- Authentification JWT avec rôles `admin`, `superviseur`, `agent`
- Tableau de bord avec indicateurs et graphiques
- Gestion CRUD des agents
- Planning hebdomadaire avec détection de conflits
- Gestion des éléments variables mensuels avec validation
- API REST sécurisée

## API

Routes principales:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/agents`
- `GET /api/planning/semaine/:date`
- `GET /api/elements-variables/recap/:mois/:annee`

## Notes

- Le frontend attend le backend sur `http://localhost:5000/api`.
- La politique CORS autorise `http://localhost:5173`.
- Le fichier [.env](/c:/Users/pc/Desktop/Projet%202/gestion-service/backend/.env) du backend contient la configuration locale par défaut.
