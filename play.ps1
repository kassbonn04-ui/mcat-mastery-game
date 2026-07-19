# Launch the MCAT Mastery Game in your default browser.
$index = Join-Path $PSScriptRoot "index.html"
Start-Process $index
Write-Host "Opened $index"
Write-Host "Play tip: use the Map to enter Day 1 Wing of Asphodel."
