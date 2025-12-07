# Script pour vérifier le webhook sans Git

$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$serviceDir = "/volume1/docker/dynogy/services/mangareader"
$dynogyDir = "/volume1/docker/dynogy"

Write-Host "=== Vérification du webhook (sans Git) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Timestamps des fichiers actuellement:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'ls -la $serviceDir/*.js $serviceDir/*.yml $serviceDir/*.json 2>/dev/null'" -ForegroundColor White
Write-Host ""

Write-Host "2. Contenu de server.js (premières lignes):" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'head -10 $serviceDir/server.js'" -ForegroundColor White
Write-Host ""

Write-Host "3. Surveiller les logs Dynogy en temps réel:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'docker compose -f $dynogyDir/docker-compose.yml logs -f dynogy-agent'" -ForegroundColor White
Write-Host ""

Write-Host "4. Vérifier les fichiers modifiés récemment (après push):" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'find $serviceDir -type f -mmin -2 -exec ls -lh {} \;'" -ForegroundColor White
Write-Host ""

Write-Host "5. Voir les logs de déploiement:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'ls -t $dynogyDir/logs/mangareader-*.log | head -1 | xargs tail -30'" -ForegroundColor White
Write-Host ""

Write-Host "=== Procédure de test ===" -ForegroundColor Cyan
Write-Host "1. Exécutez la commande #1 pour noter les timestamps" -ForegroundColor White
Write-Host "2. Faites un commit et push sur votre repo" -ForegroundColor White
Write-Host "3. Exécutez la commande #3 dans un terminal séparé pour voir les logs" -ForegroundColor White
Write-Host "4. Après quelques secondes, exécutez la commande #4 pour voir les fichiers mis à jour" -ForegroundColor White
Write-Host "5. Comparez avec la commande #2 pour vérifier le contenu" -ForegroundColor White

