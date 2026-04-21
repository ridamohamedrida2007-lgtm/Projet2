CREATE DATABASE IF NOT EXISTS gestion_service
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE gestion_service;

CREATE TABLE utilisateurs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe  VARCHAR(255) NOT NULL,
  role          ENUM('admin','superviseur','agent') NOT NULL DEFAULT 'agent',
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE agents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  matricule     VARCHAR(20) NOT NULL UNIQUE,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  poste         VARCHAR(100),
  service       VARCHAR(100),
  telephone     VARCHAR(20),
  email         VARCHAR(150) UNIQUE,
  utilisateur_id INT UNIQUE,
  date_embauche DATE,
  statut        ENUM('actif','conge','suspendu') NOT NULL DEFAULT 'actif',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE tableaux_service (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  agent_id      INT NOT NULL,
  date_service  DATE NOT NULL,
  heure_debut   TIME,
  heure_fin     TIME,
  type_shift    ENUM('matin','soir','nuit','repos') NOT NULL,
  statut        ENUM('planifie','confirme','modifie') NOT NULL DEFAULT 'planifie',
  note          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE elements_variables (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  agent_id               INT NOT NULL,
  mois                   INT NOT NULL,
  annee                  INT NOT NULL,
  heures_supplementaires DECIMAL(6,2) NOT NULL DEFAULT 0,
  jours_absence          INT NOT NULL DEFAULT 0,
  motif_absence          VARCHAR(255),
  jours_conge            INT NOT NULL DEFAULT 0,
  prime_rendement        DECIMAL(10,2) NOT NULL DEFAULT 0,
  indemnite_transport    DECIMAL(10,2) NOT NULL DEFAULT 0,
  autres_primes          DECIMAL(10,2) NOT NULL DEFAULT 0,
  valide                 BOOLEAN NOT NULL DEFAULT FALSE,
  valide_par             INT,
  valide_le              TIMESTAMP NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_agent_mois (agent_id, mois, annee),
  CONSTRAINT chk_mois CHECK (mois BETWEEN 1 AND 12),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role)
VALUES
  (
    1,
    'Admin',
    'Système',
    'admin@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'admin'
  ),
  (
    2,
    'El Amrani',
    'Nadia',
    'superviseur@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'superviseur'
  ),
  (
    3,
    'Benali',
    'Karim',
    'karim.benali@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'agent'
  ),
  (
    4,
    'Ouali',
    'Fatima',
    'fatima.ouali@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'agent'
  ),
  (
    5,
    'Haddad',
    'Youssef',
    'youssef.haddad@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'agent'
  ),
  (
    6,
    'Chraibi',
    'Sara',
    'sara.chraibi@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'agent'
  ),
  (
    7,
    'Moussaoui',
    'Ahmed',
    'ahmed.moussaoui@aeroport.ma',
    '$2b$10$dY/zr7sZzVqqOaoxkJCXr..0.E0.3BAn7F.WAfF3HNsZu82ZUO/AO',
    'agent'
  );

INSERT INTO agents (matricule, nom, prenom, poste, service, telephone, email, utilisateur_id, date_embauche, statut) VALUES
('AG001', 'Benali', 'Karim', 'Agent de piste', 'Opérations', NULL, 'karim.benali@aeroport.ma', 3, '2020-03-15', 'actif'),
('AG002', 'Ouali', 'Fatima', 'Hôtesse d accueil', 'Accueil', NULL, 'fatima.ouali@aeroport.ma', 4, '2019-07-01', 'actif'),
('AG003', 'Haddad', 'Youssef', 'Technicien', 'Maintenance', NULL, 'youssef.haddad@aeroport.ma', 5, '2021-01-10', 'actif'),
('AG004', 'Chraibi', 'Sara', 'Agent sécurité', 'Sécurité', NULL, 'sara.chraibi@aeroport.ma', 6, '2018-11-20', 'conge'),
('AG005', 'Moussaoui', 'Ahmed', 'Chef d équipe', 'Opérations', NULL, 'ahmed.moussaoui@aeroport.ma', 7, '2017-05-05', 'actif');
