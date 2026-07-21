# build-www.ps1 — copia os arquivos web para www/ e sincroniza com o Android
# Uso: .\build-www.ps1

$root = $PSScriptRoot
$www  = Join-Path $root "www"

Write-Host "Limpando www/..."
if (Test-Path $www) { Remove-Item $www -Recurse -Force }
New-Item $www -ItemType Directory | Out-Null

$pastas = @(
  "hospital", "maternidade", "ubs", "upa", "sadt",
  "caps", "centro-reabilitacao", "vigilancia-epidemiologica",
  "scripts", "config", "assets", "shared"
)

Write-Host "Copiando arquivos..."
Copy-Item (Join-Path $root "index.html") $www

foreach ($pasta in $pastas) {
  $origem = Join-Path $root $pasta
  if (Test-Path $origem) {
    Copy-Item $origem (Join-Path $www $pasta) -Recurse
  }
}

Write-Host "Sincronizando com Android..."
$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\usuario\AppData\Local\Android\Sdk"
npx cap sync android

Write-Host ""
Write-Host "Pronto! Abra o Android Studio para gerar o APK:"
Write-Host "  npx cap open android"
