$Url = "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/list-cartesia-voices"
$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHNmZnF2cHp1emd2dm93bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE2NjQsImV4cCI6MjA4NjE1NzY2NH0.fz8APxIoZ3TuSDBQAciaaLErzEL6zWTP747MmCpn2FU"
$Headers = @{ "Authorization" = "Bearer $ApiKey" }

try {
    $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers
    $voices = $response 
    
    # Filtrar español o 'multi' que suelen soportar español
    $esVoices = $voices | Where-Object { $_.language -eq "es" -or $_.language -match "multi" -or $_.name -match "Spanish" }
    
    Write-Host "Encontradas $($esVoices.Count) voces en español/multi:"
    $esVoices | Select-Object id, name, description, gender, language | Format-Table -AutoSize
}
catch {
    Write-Host "Error: $_"
}
