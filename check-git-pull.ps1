# Script pour vérifier pourquoi git pull ne fonctionne pas

$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$serviceDir = "/volume1/docker/dynogy/services/mangareader"
$dynogyDir = "/volume1/docker/dynogy"

Write-Host "=== Diagnostic webhook git pull ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Vérifier si Git est installé:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'which git || echo Git non installe'" -ForegroundColor White
Write-Host ""

Write-Host "2. Vérifier le script deploy.sh:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'head -30 $dynogyDir/agent/deploy.sh'" -ForegroundColor White
Write-Host "ssh $username@$hostname 'grep -n \"git pull\" $dynogyDir/agent/deploy.sh'" -ForegroundColor White
Write-Host ""

Write-Host "3. Vérifier si le repo est un repo Git:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cd $serviceDir && [ -d .git ] && echo Repo Git OK || echo Pas un repo Git'" -ForegroundColor White
Write-Host "ssh $username@$hostname 'cd $serviceDir && git remote -v 2>/dev/null || echo Git ne fonctionne pas'" -ForegroundColor White
Write-Host ""

Write-Host "4. Voir les logs de déploiement récents:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'ls -t $dynogyDir/logs/mangareader-*.log | head -1 | xargs grep -i \"git pull\"'" -ForegroundColor White
Write-Host "ssh $username@$hostname 'ls -t $dynogyDir/logs/mangareader-*.log | head -1 | xargs tail -50'" -ForegroundColor White
Write-Host ""

Write-Host "5. Tester git pull manuellement:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cd $serviceDir && git pull'" -ForegroundColor White
Write-Host ""

Write-Host "=== Problèmes possibles ===" -ForegroundColor Cyan
Write-Host "1. Git n'est pas installé sur le NAS" -ForegroundColor White
Write-Host "2. Le script deploy.sh a des fins de ligne Windows (CRLF au lieu de LF)" -ForegroundColor White
Write-Host "3. Le script deploy.sh ne contient pas 'git pull'" -ForegroundColor White
Write-Host "4. Le repo n'est pas un repo Git valide" -ForegroundColor White
Write-Host "5. Problème de permissions Git" -ForegroundColor White

