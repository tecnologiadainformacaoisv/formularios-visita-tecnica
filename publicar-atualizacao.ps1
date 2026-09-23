# publicar-atualizacao.ps1 - atualiza a versao do app, gera o bundle de live
# update e publica no git, tudo em um passo.
#
# Uso:
#   .\publicar-atualizacao.ps1                 -> sobe o patch sozinho (1.0.5 -> 1.0.6)
#   .\publicar-atualizacao.ps1 -Version 1.1.0  -> usa uma versao especifica
#
# Atualiza a versao nos 8 pontos do projeto (index.html meta+rodape,
# config/manifest.json e os 6 FORM_CONFIG.version), gera o bundle
# versionado e da git push. Depois disso os tablets com o app instalado
# baixam e aplicam essa atualizacao sozinhos na proxima vez que abrirem
# com internet. Use isso para mudancas de HTML/CSS/JS. Para mudancas
# nativas (icone, permissao, nome do app) use build-apk.ps1 e reinstale
# manualmente.

param(
  [string]$Version
)

$root = $PSScriptRoot
$indexHtml = Join-Path $root "index.html"

$conteudoIndex = Get-Content $indexHtml -Raw -Encoding UTF8
if ($conteudoIndex -notmatch 'name="app-version" content="([\d\.]+)"') {
  Write-Host "ERRO: nao encontrei a versao atual em index.html (meta app-version)."
  exit 1
}
$versaoAtual = $matches[1]

if (-not $Version) {
  $partes = $versaoAtual -split '\.'
  $partes[2] = [int]$partes[2] + 1
  $Version = $partes -join '.'
  Write-Host "Nenhuma versao informada - subindo patch automaticamente: $versaoAtual -> $Version"
} else {
  Write-Host "Atualizando versao: $versaoAtual -> $Version"
}

if ($Version -eq $versaoAtual) {
  Write-Host "ERRO: a versao informada ($Version) e igual a atual. Escolha uma versao diferente."
  exit 1
}

# 1. Atualiza a versao nos 8 pontos do projeto
Write-Host "Sincronizando versao em index.html, config/manifest.json e nos formularios..."

$conteudoIndex = $conteudoIndex -replace "name=`"app-version`" content=`"$([regex]::Escape($versaoAtual))`"", "name=`"app-version`" content=`"$Version`""
# Ancorado ao trecho exato do rodape (nao troca qualquer "v<versao>" solto
# que apareca em outro contexto do arquivo no futuro). Usa "." no lugar do
# caractere "·" para nao depender de encoding non-ASCII na leitura deste
# proprio arquivo .ps1 (sem BOM, PowerShell 5.1 pode le-lo errado).
$conteudoIndex = $conteudoIndex -replace "(&nbsp;.&nbsp; v)$([regex]::Escape($versaoAtual))", "`${1}$Version"
[System.IO.File]::WriteAllText($indexHtml, $conteudoIndex, (New-Object System.Text.UTF8Encoding $false))

$manifestPath = Join-Path $root "config\manifest.json"
$conteudoManifest = Get-Content $manifestPath -Raw -Encoding UTF8
$conteudoManifest = $conteudoManifest -replace "Vers([ãa])o $([regex]::Escape($versaoAtual))\.", "Vers`$1o $Version."
[System.IO.File]::WriteAllText($manifestPath, $conteudoManifest, (New-Object System.Text.UTF8Encoding $false))

$formularios = @("ubs", "upa", "sadt", "caps", "centro-reabilitacao", "vigilancia-epidemiologica")
foreach ($f in $formularios) {
  $path = Join-Path $root "$f\index.html"
  if (Test-Path $path) {
    $conteudo = Get-Content $path -Raw -Encoding UTF8
    $conteudo = $conteudo -replace "version:\s*'$([regex]::Escape($versaoAtual))'", "version: '$Version'"
    [System.IO.File]::WriteAllText($path, $conteudo, (New-Object System.Text.UTF8Encoding $false))
  }
}

# 2. Gera o bundle versionado (ja inclui checagem de integridade)
& (Join-Path $root "build-bundle.ps1") -Version $Version
if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
  Write-Host "ERRO ao gerar o bundle. Publicacao cancelada (a versao ja foi alterada nos arquivos fonte - revise antes de rodar de novo)."
  exit 1
}

# 3. Publica no git
Set-Location $root
git add index.html config/manifest.json ubs/index.html upa/index.html sadt/index.html caps/index.html centro-reabilitacao/index.html vigilancia-epidemiologica/index.html updates
git commit -m "chore(release): v$Version"
git push

Write-Host ""
Write-Host "Versao $Version publicada! Os tablets vao atualizar sozinhos na proxima abertura com internet."
