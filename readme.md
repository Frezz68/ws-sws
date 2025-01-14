# 🌐 Projet WebService - WS-SWS

Bienvenue dans le projet **WS-SWS** ! Ce guide interactif vous aidera à configurer, exécuter et comprendre le projet.

---

## 1️⃣ **Prérequis**

Avant de commencer, assurez-vous d'avoir :

- 📦 **Node.js** : Installez-le via [Node.js](https://nodejs.org) (version 14+).
- 🐳 **Docker** : Téléchargez [Docker Desktop](https://www.docker.com/products/docker-desktop).
- 💻 Un éditeur de code comme **VS Code**.

Vérifiez vos installations avec ces commandes :

```bash
node --version
docker --version
```

## 2️⃣ Installation

### Étape 1 : Cloner le projet

```bash
git clone https://github.com/Frezz68/ws-sws.git
cd ws-sws
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Configurer les variables d’environnement

Créez un fichier .env avec ce contenu :

```env
DB_PASSWORD=yourpassword
DB_DATABASE=yourdatabase
DB_USER=youruser
```

## 3️⃣ Démarrage avec Docker

### Étape 1 : Construire et lancer les conteneurs

```bash
docker compose up --build
```

### Étape 2 : Accéder à l’application

- Frontend : http://localhost:3000
- Administration via PHPMyAdmin : http://localhost:8080

### Étape 3 : Ajouter les tables à la bdd

```bash
-- Création de la table utilisateur
CREATE TABLE utilisateur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
);

-- Création de la table session
CREATE TABLE session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    formateur_id INT NOT NULL,
    FOREIGN KEY (formateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Création de la table émargement
CREATE TABLE emargement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    etudiant_id INT NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE,
    FOREIGN KEY (etudiant_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);
```

### Étape 4 : Lancer le projet

```bash
npm start
```

### 🛠️ Dépendances utilisées

- bcrypt : Pour le hachage des mots de passe.
- mysql : Communication avec la base de données.
- express : Framework Node.js pour construire l’API.
- dotenv : Charger les variables d’environnement.
- jsonwebtoken : Créer des tokens JWT.
- nodemon : Redémarrer le serveur automatiquement.
