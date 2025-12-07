# Script pour vérifier et corriger la configuration DNS sur le NAS

$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$remotePath = "/volume1/docker/dynogy/services/mangareader"

Write-Host "=== Vérification et correction DNS ===" -ForegroundColor Cyan

# Afficher les commandes à exécuter
Write-Host "`n1. Vérifier le docker-compose.yml actuel sur le NAS:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cat $remotePath/docker-compose.yml'" -ForegroundColor White

Write-Host "`n2. Vérifier si le conteneur utilise bien les DNS:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'docker exec manga-cleaner cat /etc/resolv.conf'" -ForegroundColor White

Write-Host "`n3. Tester la résolution DNS depuis le conteneur:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'docker exec manga-cleaner nslookup kunmanga.com 8.8.8.8'" -ForegroundColor White

Write-Host "`n4. Si le docker-compose.yml n'a pas les DNS, copiez le fichier local:" -ForegroundColor Yellow
Write-Host "scp docker-compose.yml $username@$hostname`:$remotePath/docker-compose.yml" -ForegroundColor White

Write-Host "`n5. Puis redémarrez le conteneur:" -ForegroundColor Yellow
Write-Host "ssh $username@$hostname 'cd $remotePath && docker compose down && docker compose up -d'" -ForegroundColor White

Write-Host "`n=== Instructions ===" -ForegroundColor Cyan
Write-Host "Le docker-compose.yml local contient la configuration DNS." -ForegroundColor White
Write-Host "Assurez-vous qu'il est bien copié sur le NAS et que le conteneur est redémarré." -ForegroundColor White

