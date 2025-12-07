$password = "Poulitapou@2"
$hostname = "192.168.1.51"
$username = "vincent.boiteau"

Write-Host "=== Diagnostic DNS pour manga-cleaner ===" -ForegroundColor Cyan

# Test 1: Vérifier la configuration DNS du conteneur
Write-Host "`n1. Configuration DNS du conteneur:" -ForegroundColor Yellow
$cmd1 = "docker exec manga-cleaner cat /etc/resolv.conf"
Write-Host "Commande: $cmd1" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd1" -ForegroundColor White

# Test 2: Tester la résolution DNS
Write-Host "`n2. Test de résolution DNS:" -ForegroundColor Yellow
$cmd2 = "docker exec manga-cleaner nslookup kunmanga.com 8.8.8.8"
Write-Host "Commande: $cmd2" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd2" -ForegroundColor White

# Test 3: Tester la connectivité Internet
Write-Host "`n3. Test de connectivité Internet:" -ForegroundColor Yellow
$cmd3 = "docker exec manga-cleaner ping -c 2 8.8.8.8"
Write-Host "Commande: $cmd3" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd3" -ForegroundColor White

# Test 4: Vérifier la configuration du conteneur
Write-Host "`n4. Configuration réseau du conteneur:" -ForegroundColor Yellow
$cmd4 = "docker inspect manga-cleaner | grep -A 10 Dns"
Write-Host "Commande: $cmd4" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd4" -ForegroundColor White

# Test 5: Vérifier le docker-compose.yml
Write-Host "`n5. Vérifier docker-compose.yml:" -ForegroundColor Yellow
$cmd5 = "cat /volume1/docker/dynogy/services/mangareader/docker-compose.yml | grep -A 5 dns"
Write-Host "Commande: $cmd5" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd5" -ForegroundColor White

# Test 6: Tester depuis le NAS directement
Write-Host "`n6. Test DNS depuis le NAS (hôte):" -ForegroundColor Yellow
$cmd6 = "nslookup kunmanga.com"
Write-Host "Commande: $cmd6" -ForegroundColor Gray
Write-Host "Exécutez sur le NAS: $cmd6" -ForegroundColor White

Write-Host "`n=== Commandes à exécuter sur le NAS ===" -ForegroundColor Cyan
Write-Host "Connectez-vous au NAS et exécutez ces commandes une par une." -ForegroundColor White

