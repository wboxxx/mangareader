# Script PowerShell pour monitorer le webhook GitHub

$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$serviceDir = "/volume1/docker/dynogy/services/mangareader"
$dynogyDir = "/volume1/docker/dynogy"

Write-Host "=== Monitor du webhook GitHub ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Vérifier l'état Git actuel sur le NAS:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cd $serviceDir && git log -1 --oneline && git status'" -ForegroundColor White
Write-Host ""

Write-Host "2. Surveiller les logs Dynogy en temps réel:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'docker compose -f $dynogyDir/docker-compose.yml logs -f dynogy-agent'" -ForegroundColor White
Write-Host ""

Write-Host "3. Vérifier les fichiers modifiés récemment:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'find $serviceDir -type f -mmin -5 -ls'" -ForegroundColor White
Write-Host ""

Write-Host "4. Comparer avec le remote GitHub:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cd $serviceDir && git fetch origin && git log HEAD..origin/main --oneline'" -ForegroundColor White
Write-Host ""

Write-Host "5. Voir les derniers logs de déploiement:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'ls -t $dynogyDir/logs/mangareader-*.log | head -1 | xargs tail -20'" -ForegroundColor White
Write-Host ""

Write-Host "=== Test du webhook ===" -ForegroundColor Cyan
Write-Host "1. Faites un commit et push sur votre repo local" -ForegroundColor White
Write-Host "2. Exécutez la commande #2 pour voir les logs en temps réel" -ForegroundColor White
Write-Host "3. Vérifiez que les fichiers sont mis à jour avec la commande #3" -ForegroundColor White
Write-Host ""

Write-Host "=== Commandes rapides ===" -ForegroundColor Cyan
Write-Host "# Avant le push - noter le dernier commit:" -ForegroundColor Gray
Write-Host "ssh $username@$hostname 'cd $serviceDir && git log -1 --oneline'" -ForegroundColor White
Write-Host ""
Write-Host "# Après le push - vérifier si mis à jour:" -ForegroundColor Gray
Write-Host "ssh $username@$hostname 'cd $serviceDir && git log -1 --oneline && git status'" -ForegroundColor White

