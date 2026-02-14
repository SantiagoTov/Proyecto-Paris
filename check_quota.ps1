$headers = @{
    "xi-api-key"   = "sk_b5c93b992f8fb7a85d41ef24414d92f75750ef6be5499477"
    "Content-Type" = "application/json"
}
$body = @{
    text     = "Validando cuota en voz gratuita."
    model_id = "eleven_multilingual_v2"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -OutFile "test_quota_rachel.mp3"
                      
    Write-Host "✅ SÍ HAY CUOTA. Se generó 'test_quota_rachel.mp3'. El problema es caché o ID incorrecto en web."
}
catch {
    Write-Host "❌ NO HAY CUOTA (o error de plan)."
    Write-Host $_.Exception.Response
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Detalle: $($reader.ReadToEnd())"
    }
    catch {}
}
