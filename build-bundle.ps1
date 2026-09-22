# build-bundle.ps1 — gera um bundle de live update (.zip) para o APK via Capacitor Updater
# Uso: .\build-bundle.ps1 -Version 1.0.5
#
# Gera updates\bundle-<Version>.zip e atualiza updates\channel.json.
# Depois é só: git add updates, git commit, git push.
# Os tablets com o APK instalado baixam e aplicam essa atualização sozinhos
# na próxima vez que abrirem o app com internet — sem precisar reinstalar o APK.
#
# Use isso para mudanças de HTML/CSS/JS (labels, textos, lógica de formulário).
# Só volte a usar build-apk.ps1 (gerar e reinstalar o APK) se mudar algo nativo
# (ícone, permissão Android, nome do app, plugins nativos).

param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$root    = $PSScriptRoot
$www     = Join-Path $root "www"
$updates = Join-Path $root "updates"
$pagesBaseUrl = "https://tecnologiadainformacaoisv.github.io/formularios-visita-tecnica/updates"

# 1. Popula www/ com os arquivos web (igual ao build-apk.ps1)
Write-Host "[1/4] Atualizando www/..."
if (Test-Path $www) { Remove-Item $www -Recurse -Force }
New-Item $www -ItemType Directory | Out-Null
Copy-Item (Join-Path $root "index.html") $www
foreach ($pasta in @("hospital","maternidade","ubs","upa","sadt","caps","centro-reabilitacao","vigilancia-epidemiologica","scripts","config","assets","shared")) {
  $origem = Join-Path $root $pasta
  if (Test-Path $origem) { Copy-Item $origem (Join-Path $www $pasta) -Recurse }
}

# 2. Corrige caminhos absolutos e remove registro do SW (igual ao build-apk.ps1)
Write-Host "[2/4] Corrigindo caminhos para Capacitor..."
$subforms = @("hospital","maternidade","ubs","upa","sadt","caps","centro-reabilitacao","vigilancia-epidemiologica")
foreach ($pasta in $subforms) {
  $html = Join-Path $www "$pasta\index.html"
  if (Test-Path $html) {
    $content = Get-Content $html -Raw -Encoding UTF8
    $content = $content -replace [regex]::Escape('/formularios-visita-tecnica/'), '../'
    $content = $content -replace "(?s)if\s*\('serviceWorker'\s*in\s*navigator\).*?}\s*}\s*</script>", '</script>'
    Set-Content $html $content -Encoding UTF8
  }
}
$indexHtml = Join-Path $www "index.html"
$content = Get-Content $indexHtml -Raw -Encoding UTF8
foreach ($f in $subforms) {
  $content = $content -replace "href=""$f/""", "href=""$f/index.html"""
}
Set-Content $indexHtml $content -Encoding UTF8
foreach ($pasta in $subforms) {
  $html = Join-Path $www "$pasta\index.html"
  if (Test-Path $html) {
    $content = Get-Content $html -Raw -Encoding UTF8
    $content = $content -replace 'href="\.\./"', 'href="../index.html"'
    Set-Content $html $content -Encoding UTF8
  }
}
$backScriptForm = @'
<script>
document.addEventListener('DOMContentLoaded', function() {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    window.Capacitor.Plugins.App.addListener('backButton', function() {
      window.location.href = '../index.html';
    });
  }
});
</script>
</body>
'@
foreach ($pasta in $subforms) {
  $html = Join-Path $www "$pasta\index.html"
  if (Test-Path $html) {
    $content = Get-Content $html -Raw -Encoding UTF8
    $content = $content -replace '</body>', $backScriptForm
    Set-Content $html $content -Encoding UTF8
  }
}
$backScriptIndex = @'
<script>
document.addEventListener('DOMContentLoaded', function() {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    window.Capacitor.Plugins.App.addListener('backButton', function() {
      window.Capacitor.Plugins.App.exitApp();
    });
  }
});
</script>
</body>
'@
$content = Get-Content $indexHtml -Raw -Encoding UTF8
$content = $content -replace '</body>', $backScriptIndex
Set-Content $indexHtml $content -Encoding UTF8

# 3. Empacota www/ em um zip versionado (arquivos na raiz do zip, sem pasta pai)
Write-Host "[3/5] Empacotando bundle-$Version.zip..."
if (-not (Test-Path $updates)) { New-Item $updates -ItemType Directory | Out-Null }
$zipPath = Join-Path $updates "bundle-$Version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$esperados = (Get-ChildItem $www -Recurse -File).Count
$tentativas = 0
$ok = $false
do {
  $tentativas++
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $erro = $null
  Compress-Archive -Path (Join-Path $www "*") -DestinationPath $zipPath -CompressionLevel Optimal -ErrorVariable erro -ErrorAction SilentlyContinue

  $noZip = 0
  if (-not $erro -and (Test-Path $zipPath)) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $noZip = $zip.Entries.Count
    $zip.Dispose()
  }

  if (-not $erro -and $noZip -eq $esperados) {
    $ok = $true
  } else {
    Write-Host "  Bundle incompleto ou com erro (tentativa ${tentativas}: www/ tem $esperados arquivo(s), zip tem $noZip), tentando novamente..."
    Start-Sleep -Milliseconds 500
  }
} while (-not $ok -and $tentativas -lt 3)

if (-not $ok) {
  Write-Host ""
  Write-Host "ERRO: nao foi possivel gerar um bundle completo apos $tentativas tentativas."
  Write-Host "Isso costuma acontecer quando outro processo (editor, antivirus) trava um arquivo durante o empacotamento."
  Write-Host "Feche esses programas e rode de novo."
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  exit 1
}
Write-Host "  OK: $noZip arquivo(s) confirmados no bundle."

# 4. Atualiza o manifesto (updates/channel.json) que os apps instalados consultam
Write-Host "[4/5] Atualizando updates\channel.json..."
$checksum = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLower()
$manifest = @{
  version  = $Version
  url      = "$pagesBaseUrl/bundle-$Version.zip"
  checksum = $checksum
} | ConvertTo-Json
Set-Content (Join-Path $updates "channel.json") $manifest -Encoding UTF8

Write-Host ""
Write-Host "Bundle $Version pronto em updates\bundle-$Version.zip"
Write-Host "Agora rode:"
Write-Host "  git add updates"
Write-Host "  git commit -m ""chore(updates): publica bundle $Version"""
Write-Host "  git push"
Write-Host ""
Write-Host "Os tablets com o APK instalado vao baixar e aplicar essa atualizacao"
Write-Host "sozinhos na proxima vez que abrirem o app com internet."
