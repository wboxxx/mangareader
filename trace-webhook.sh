#!/bin/bash
# Script pour tracer le webhook GitHub et vérifier la mise à jour des fichiers

SERVICE_DIR="/volume1/docker/dynogy/services/mangareader"
DYNOGY_DIR="/volume1/docker/dynogy"

echo "=== Traçage du webhook GitHub ==="
echo ""

# 1. Vérifier les logs de Dynogy en temps réel
echo "1. Logs Dynogy (appuyez sur Ctrl+C pour arrêter):"
echo "   docker compose -f $DYNOGY_DIR/docker-compose.yml logs -f dynogy-agent"
echo ""

# 2. Vérifier l'état Git avant/après
echo "2. État Git actuel:"
cd $SERVICE_DIR
echo "   Dernier commit:"
git log -1 --oneline
echo "   Statut:"
git status
echo ""

# 3. Vérifier les fichiers modifiés récemment
echo "3. Fichiers modifiés dans les 5 dernières minutes:"
find $SERVICE_DIR -type f -mmin -5 -ls
echo ""

# 4. Comparer avec le remote
echo "4. Comparaison avec le remote:"
git fetch origin
echo "   Commits en avance sur le remote:"
git log HEAD..origin/main --oneline
echo "   Commits en retard sur le remote:"
git log origin/main..HEAD --oneline
echo ""

# 5. Vérifier les logs de déploiement
echo "5. Derniers logs de déploiement:"
ls -lt $DYNOGY_DIR/logs/mangareader-*.log 2>/dev/null | head -1 | awk '{print $NF}' | xargs tail -20
echo ""

echo "=== Pour tester le webhook ==="
echo "1. Faites un push sur GitHub"
echo "2. Surveillez les logs: docker compose -f $DYNOGY_DIR/docker-compose.yml logs -f dynogy-agent"
echo "3. Vérifiez les fichiers: ls -la $SERVICE_DIR/"
echo "4. Vérifiez Git: cd $SERVICE_DIR && git log -1"

