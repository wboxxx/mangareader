$password = "Poulitapou@2"
$hostname = "192.168.1.51"
$username = "vincent.boiteau"
$remotePath = "/volume1/docker/dynogy/services/mangareader/Dockerfile"
$localFile = "Dockerfile"

$content = Get-Content $localFile -Raw

# Create a temporary script file on remote
$scriptContent = @"
#!/bin/bash
cat > $remotePath << 'EOF'
$content
EOF
"@

# Write script to temp file
$scriptContent | Out-File -FilePath "temp_upload.sh" -Encoding ASCII

# Use plink if available, otherwise use ssh with expect-like approach
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo y | plink -ssh -pw $password $username@$hostname -m temp_upload.sh
} else {
    Write-Host "Plink (PuTTY) not found. Please install PuTTY or run manually:"
    Write-Host "scp Dockerfile $username@$hostname`:$remotePath"
}

Remove-Item -Path "temp_upload.sh" -ErrorAction SilentlyContinue

