# Idées pour contourner le 403 Forbidden

## 1. Vérifier si le code est bien déployé
```bash
ssh vincent.boiteau@192.168.1.51 'head -220 /volume1/docker/dynogy/services/mangareader/server.js | tail -45'
```

## 2. Tester directement depuis le NAS
```bash
ssh vincent.boiteau@192.168.1.51 'curl -v "https://kunmanga.com/manga/murim-login/chapter-243/" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 2>&1 | head -30'
```

## 3. Solutions possibles

### Option A: Utiliser Puppeteer (navigateur headless)
- Plus lourd mais simule un vrai navigateur
- Nécessite d'ajouter puppeteer au package.json

### Option B: Utiliser un proxy
- Passer par un service de proxy
- Ou utiliser un proxy local

### Option C: Vérifier les cookies/sessions
- Certains sites nécessitent une session valide
- Peut nécessiter de visiter d'abord la page d'accueil

### Option D: Changer d'approche
- Utiliser une API si disponible
- Ou scraper depuis un autre site

