$Url = "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/test-cartesia"
$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHNmZnF2cHp1emd2dm93bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE2NjQsImV4cCI6MjA4NjE1NzY2NH0.fz8APxIoZ3TuSDBQAciaaLErzEL6zWTP747MmCpn2FU"

$Headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type"  = "application/json"
}

$Body = @{
    text     = "Hola, esta es una prueba de voz con Cartesia Sonic. La velocidad es impresionante."
    voice_id = "162e0f37-8504-474c-bb33-c606c01890dc" # Catalina (Natural)
} | ConvertTo-Json

try {
    Write-Host "Enviando solicitud a Cartesia (Catalina)..."
    Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body -OutFile "test_cartesia_catalina.mp3"
    Write-Host "¡Audio recibido! Guardado como test_cartesia_catalina.mp3"
    # Verificar tamaño
    (Get-Item "test_cartesia_catalina.mp3").Length
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Detalles: $($reader.ReadToEnd())"
    }
}
