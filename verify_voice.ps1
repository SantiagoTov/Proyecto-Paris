$headers = @{
    "Authorization" = "Bearer a8f95863-0885-4d3b-9060-de7af720b787"
    "Content-Type"  = "application/json"
}

$body = @{
    text = "Validación de permisos de API Key correcta. 1 2 3."
    voiceId = "86V9x9hrQds83qf7zaGn"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/test-voice" `
                      -Method Post `
                      -Headers $headers `
                      -Body $body `
                      -OutFile "output_audio_test.mp3"

    $fileInfo = Get-Item "output_audio_test.mp3"
    Write-Host "✅ ÉXITO: Archivo generado."
    Write-Host "Tamaño: $($fileInfo.Length) bytes"

    if ($fileInfo.Length -gt 1000) {
        Write-Host "RESULTADO: La API Key funciona y generó audio real."
    } else {
        Write-Host "RESULTADO: El archivo es muy pequeño, podría ser un error."
        Get-Content "output_audio_test.mp3"
    }
} catch {
    Write-Host "❌ ERROR: La llamada falló."
    Write-Host $_.Exception.Message
    # Try to read error details if available
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Detalle del error: $errorResponse"
    } catch {}
}
