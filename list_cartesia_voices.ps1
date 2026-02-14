$Url = "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/list-cartesia-voices"
$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHNmZnF2cHp1emd2dm93bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE2NjQsImV4cCI6MjA4NjE1NzY2NH0.fz8APxIoZ3TuSDBQAciaaLErzEL6zWTP747MmCpn2FU"

$Headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type"  = "application/json"
}

try {
    Write-Host "Obteniendo voces..."
    $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers
    
    # Filtrar solo si tiene 'es' o 'multilingual' en descripción si existe
    $response | Format-List -Property id, name, description, gender, language, embedding
    
    # Seleccionar las primeras 20
    $response | Select-Object -First 20 -Property id, name, description, gender, language
    
    # Guardar en archivo para inspeccionar
    $response | ConvertTo-Json -Depth 4 | Out-File "cartesia_voices.json"
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Detalles: $($reader.ReadToEnd())"
    }
}
