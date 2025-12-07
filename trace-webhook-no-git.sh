#!/bin/bash
# Script pour tracer le webhook sans Git installé

SERVICE_DIR="/volume1/docker/dynogy/services/mangareader"
DYNOGY_DIR="/volume1/docker/dynogy"

echo "=== Traçage du webhook (sans Git) ==="
echo ""

# 1. Vérifier les timestamps des fichiers avant
echo "1. Timestamps des fichiers actuellement:"
ls -la $SERVICE_DIR/*.js $SERVICE_DIR/*.yml $SERVICE_DIR/*.json 2>/dev/null
echo ""

# 2. Vérifier le contenu d'un fichier spécifique (ex: server.js)
echo "2. Premières lignes de server.js:"
head -10 $SERVICE_DIR/server.js
echo ""

# 3. Surveiller les logs Dynogy
echo "3. Pour surveiller les logs Dynogy en temps réel:"
echo "   docker compose -f $DYNOGY_DIR/docker-compose.yml logs -f dynogy-agent"
echo ""

# 4. Vérifier les fichiers modifiés récemment
echo "4. Fichiers modifiés dans les 5 dernières minutes:"
find $SERVICE_DIR -type f -mmin -5 -exec ls -lh {} \;
echo ""

# 5. Vérifier les logs de déploiement
echo "5. Derniers logs de déploiement:"
LATEST_LOG=$(ls -t $DYNOGY_DIR/logs/mangareader-*.log 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
    echo "   Fichier: $LATEST_LOG"
    tail -30 "$LATEST_LOG"
else
    echo "   Aucun log trouvé"
fi
echo ""

echo "=== Test du webhook ==="
echo "1. Notez les timestamps des fichiers ci-dessus"
echo "2. Faites un push sur GitHub"
echo "3. Surveillez les logs: docker compose -f $DYNOGY_DIR/docker-compose.yml logs -f dynogy-agent"
echo "4. Vérifiez les nouveaux timestamps: find $SERVICE_DIR -type f -mmin -2 -exec ls -lh {} \;"
echo "5. Comparez le contenu: head -10 $SERVICE_DIR/server.js"

