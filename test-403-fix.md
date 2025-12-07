# Test si le code est bien déployé

Vérifier sur le NAS si le code avec les améliorations anti-403 est bien déployé :

```bash
# Vérifier les premières lignes de la fonction fetch
ssh vincent.boiteau@192.168.1.51 'head -220 /volume1/docker/dynogy/services/mangareader/server.js | tail -45'
```

Si le code n'a pas la requête vers la page d'accueil et le délai, il faut le redéployer.

