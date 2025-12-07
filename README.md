# Manga Cleaner

Service web Node.js pour nettoyer et afficher les pages de manga depuis KunManga, sans publicités.

## Installation

### Prérequis

- Docker et Docker Compose installés sur votre NAS Synology
- Ce repo cloné dans `/volume1/git/manga-cleaner` (ou autre emplacement)

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

