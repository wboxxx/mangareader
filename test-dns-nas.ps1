$ErrorActionPreference = "Stop"

$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$password = "Poulitapou@2"

Write-Host "=== Diagnostic DNS sur le NAS ===" -ForegroundColor Cyan

# Fonction pour exécuter une commande SSH
function Invoke-SSHCommand {
    param([string]$Command)
    
    $sshCommand = "echo '$password' | sshpass -p '$password' ssh -o StrictHostKeyChecking=no ${username}@${hostname} `"$Command`""
    
    # Essayer avec sshpass si disponible, sinon utiliser une autre méthode
    if (Get-Command sshpass -ErrorAction SilentlyContinue) {
        Write-Host "Exécution: $Command" -ForegroundColor Gray
        bash -c $sshCommand
    } else {
        Write-Host "sshpass non disponible. Exécutez manuellement:" -ForegroundColor Yellow
        Write-Host "ssh $username@$hostname `"$Command`"" -ForegroundColor White
        return $null
    }
}

Write-Host "`n1. Vérification du docker-compose.yml sur le NAS..." -ForegroundColor Yellow
Invoke-SSHCommand "cat /volume1/docker/dynogy/services/mangareader/docker-compose.yml | grep -A 5 dns"

Write-Host "`n2. Configuration DNS du conteneur..." -ForegroundColor Yellow
Invoke-SSHCommand "docker exec manga-cleaner cat /etc/resolv.conf"

Write-Host "`n3. Test de résolution DNS (8.8.8.8)..." -ForegroundColor Yellow
Invoke-SSHCommand "docker exec manga-cleaner nslookup kunmanga.com 8.8.8.8"

Write-Host "`n4. Test de connectivité Internet..." -ForegroundColor Yellow
Invoke-SSHCommand "docker exec manga-cleaner ping -c 2 8.8.8.8"

Write-Host "`n5. Configuration réseau du conteneur..." -ForegroundColor Yellow
Invoke-SSHCommand "docker inspect manga-cleaner | grep -A 10 Dns"

Write-Host "`n=== Diagnostic terminé ===" -ForegroundColor Cyan

