$body = @{ email = 'karya.ai.admin@gmail.com'; password = 'AdminPassword123!' } | ConvertTo-Json
$resp = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
$token = ($resp.Content | ConvertFrom-Json).token
$headers = @{ Authorization = 'Bearer ' + $token }

Write-Host "=== TESTING BACKEND API ===" -ForegroundColor Cyan
Write-Host "Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green

$clients = Invoke-WebRequest -Uri 'http://localhost:3000/api/clients' -Headers $headers -UseBasicParsing | ForEach-Object { $_.Content | ConvertFrom-Json }
Write-Host "`nClients found: $($clients.Count)" -ForegroundColor Green

if ($clients -is [array]) {
  $clients | ForEach-Object { 
    Write-Host "  - $($_.displayName) (Status: $($_.status))"
  }
} else {
  Write-Host "  - $($clients.displayName) (Status: $($clients.status))"
}

# Test getting Yaswanth's jobs
$yaswanth = if ($clients -is [array]) { $clients | Where-Object { $_.displayName -eq 'Yaswanth Kumar' } } else { if ($clients.displayName -eq 'Yaswanth Kumar') { $clients } }
if ($yaswanth) {
  Write-Host "`nYaswanth UID: $($yaswanth.uid)" -ForegroundColor Yellow
  $jobs = Invoke-WebRequest -Uri ('http://localhost:3000/api/jobs/' + $yaswanth.uid) -Headers $headers -UseBasicParsing -ErrorAction SilentlyContinue | ForEach-Object { $_.Content | ConvertFrom-Json }
  Write-Host "Jobs found for Yaswanth: $($jobs.Count)" -ForegroundColor Green
  if ($jobs -is [array]) {
    $jobs | ForEach-Object {
      Write-Host "    - $($_.company) | $($_.role) | Status: $($_.status)"
    }
  } elseif ($jobs -and $jobs.company) {
    Write-Host "    - $($jobs.company) | $($jobs.role) | Status: $($jobs.status)"
  }
}
