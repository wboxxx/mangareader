# Fix DNS pour Dynogy

Le conteneur `dynogy-agent` n'a pas accès à Internet pour faire `git pull`.

## Solution

Vérifier et modifier `/volume1/docker/dynogy/docker-compose.yml` pour ajouter `network_mode: host` ou configurer les DNS.

Sur le NAS :
```bash
cd /volume1/docker/dynogy
cat docker-compose.yml
```

Si le conteneur `dynogy-agent` n'a pas `network_mode: host`, l'ajouter ou ajouter la configuration DNS comme pour manga-cleaner.

