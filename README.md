# Manga Cleaner

Service web Node.js pour nettoyer et afficher les pages de manga depuis KunManga, sans publicités.

## Installation



### Prérequis

- Docker et Docker Compose installés sur votre NAS Synology
- Git installé sur le NAS (voir ci-dessous)
- Ce repo cloné dans `/volume1/git/manga-cleaner` (ou autre emplacement)

### Installation de Git sur Synology NAS

**Méthode 1 : Via Package Center (recommandé)**
1. Ouvrir Package Center sur votre NAS
2. Rechercher "Git Server" ou "Git"
3. Installer le package

**Méthode 2 : Via SSH (si Package Center ne propose pas Git)**
1. Activer SSH dans Panneau de configuration > Terminal et SNMP
2. Se connecter en SSH : `ssh admin@<NAS_IP>`
3. Installer via Entware (si disponible) :
   ```bash
   opkg install git
   ```
   Ou via le gestionnaire de paquets système selon votre version DSM

### Lancement
Depuis le répertoire du projet :

```bash
docker compose up -d
```

Le service sera accessible sur `http://<NAS_IP>:3000`

### Arrêt

```bash
docker compose down
```

### Rebuild après modification

```bash
docker compose up -d --build
```

## Usage

1. Ouvrir `http://<NAS_IP>:3000` dans votre navigateur
2. Coller l'URL d'un chapitre manga (ex: KunManga)
3. Cliquer sur "Nettoyer"
4. La page affichera toutes les images du chapitre sur fond noir, sans publicités

## Architecture

- **Backend** : Node.js + Express
- **Scraping** : Cheerio pour parser le HTML
- **HTTP Client** : node-fetch v2
- **Extraction** : Fonction `extractKunmangaImages()` pour KunManga (extensible à d'autres sites)

## Structure

```
.
├── server.js           # Serveur Express
├── package.json        # Dépendances npm
├── Dockerfile          # Image Docker
├── docker-compose.yml  # Configuration Docker Compose
└── README.md          # Ce fichier
```

## Intégration avec Dynogy

Ce projet est conçu pour être orchestré par Dynogy :

1. Dynogy reçoit un webhook GitHub
2. Dynogy exécute `git pull` dans ce repo
3. Dynogy exécute `docker compose up -d` pour redéployer


