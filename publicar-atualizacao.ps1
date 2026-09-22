# publicar-atualizacao.ps1 - gera o bundle de live update e publica no git, tudo em um passo
# Uso:
#   .\publicar-atualizacao.ps1                 -> sobe o patch sozinho (1.0.4 -> 1.0.5)
#   .\publicar-atualizacao.ps1 -Version 1.1.0  -> usa uma versao especifica
#
# Depois de "git push" os tablets com o app instalado baixam e aplicam
# essa atualizacao sozinhos na proxima vez que abrirem com internet.
# Use isso para mudancas de HTML/CSS/JS. Para mudancas nativas (icone,
# permissao, nome do app) use build-apk.ps1 e reinstale manualmente.

param(
  [string]$Version
)

$root        = $PSScriptRoot
$channelPath = Join-Path $root "updates\channel.json"

if (-not $Version) {
  if (Test-Path $channelPath) {
    $atual = (Get-Content $channelPath -Raw | ConvertFrom-Json).version
    $partes = $atual -split '\.'
    $partes[2] = [int]$partes[2] + 1
    $Version = $partes -join '.'
  } else {
    $Version = "1.0.0"
  }
  Write-Host "Nenhuma versao informada - subindo patch automaticamente: $Version"
}

& (Join-Path $root "build-bundle.ps1") -Version $Version
if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
  Write-Host "ERRO ao gerar o bundle. Publicacao cancelada."
  exit 1
}

Set-Location $root
git add updates
git commit -m "chore(updates): publica bundle $Version"
git push

Write-Host ""
Write-Host "Versao $Version publicada! Os tablets vao atualizar sozinhos na proxima abertura com internet."
