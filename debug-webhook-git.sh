#!/bin/bash
# Script pour déboguer pourquoi git pull ne fonctionne pas

SERVICE_DIR="/volume1/docker/dynogy/services/mangareader"
DYNOGY_DIR="/volume1/docker/dynogy"

echo "=== Diagnostic webhook git pull ==="
echo ""

# 1. Vérifier si Git est installé
echo "1. Vérifier si Git est installé:"
which git || echo "Git n'est PAS installé"
git --version 2>/dev/null || echo "Git n'est pas accessible"
echo ""

# 2. Vérifier le script deploy.sh
echo "2. Vérifier le script deploy.sh:"
if [ -f "$DYNOGY_DIR/agent/deploy.sh" ]; then
    echo "   Fichier trouvé: $DYNOGY_DIR/agent/deploy.sh"
    echo "   Premières lignes:"
    head -20 "$DYNOGY_DIR/agent/deploy.sh"
    echo ""
    echo "   Vérifier les fins de ligne (doit être LF, pas CRLF):"
    file "$DYNOGY_DIR/agent/deploy.sh"
    echo ""
    echo "   Chercher 'git pull' dans le script:"
    grep -n "git pull" "$DYNOGY_DIR/agent/deploy.sh" || echo "   'git pull' non trouvé"
else
    echo "   Fichier deploy.sh non trouvé dans $DYNOGY_DIR/agent/"
fi
echo ""

# 3. Vérifier si le repo est un repo Git
echo "3. Vérifier si le repo est un repo Git:"
if [ -d "$SERVICE_DIR/.git" ]; then
    echo "   .git directory existe"
    cd "$SERVICE_DIR"
    echo "   Remote URL:"
    git remote -v 2>/dev/null || echo "   Erreur: git remote ne fonctionne pas"
    echo "   Dernier commit:"
    git log -1 --oneline 2>/dev/null || echo "   Erreur: git log ne fonctionne pas"
else
    echo "   .git directory n'existe PAS - ce n'est pas un repo Git"
fi
echo ""

# 4. Vérifier les logs de déploiement récents
echo "4. Derniers logs de déploiement:"
LATEST_LOG=$(ls -t $DYNOGY_DIR/logs/mangareader-*.log 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
    echo "   Fichier: $LATEST_LOG"
    echo "   Chercher 'git pull' dans les logs:"
    grep -i "git pull\|git pull\|pull" "$LATEST_LOG" || echo "   'git pull' non trouvé dans les logs"
    echo ""
    echo "   Dernières lignes du log:"
    tail -50 "$LATEST_LOG"
else
    echo "   Aucun log trouvé"
fi
echo ""

# 5. Tester manuellement git pull
echo "5. Tester git pull manuellement:"
cd "$SERVICE_DIR" 2>/dev/null
if [ -d ".git" ]; then
    echo "   Tentative de git pull:"
    git pull 2>&1 || echo "   Erreur lors du git pull"
else
    echo "   Pas un repo Git, impossible de tester"
fi

