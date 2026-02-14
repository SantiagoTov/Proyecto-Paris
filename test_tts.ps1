$headers = @{
    "Authorization" = "Bearer a8f95863-0885-4d3b-9060-de7af720b787"
    "Content-Type"  = "application/json"
}

$body = @{
    text = "Probando facturación usando API directa."
    voiceId = "86V9x9hrQds83qf7zaGn"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://njtsffqvpzuzgvvowmum.supabase.co/functions/v1/test-voice" -Method Post -Headers $headers -Body $body -ErrorAction Stop

Write-Host "Audio generado con éxito."
Write-Host "Tamaño bytes: " $response.length
