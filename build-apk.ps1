# build-apk.ps1 — gera o APK completo do app Formularios ISV
# Uso: .\build-apk.ps1
# O APK fica em: formularios-isv.apk na raiz do projeto

$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\usuario\AppData\Local\Android\Sdk"
$env:PATH         = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

$root     = $PSScriptRoot
$www      = Join-Path $root "www"
$apkBuild = "C:\dev\apk-build"

# 1. Popula www/ com os arquivos web
Write-Host "[1/5] Atualizando www/..."
if (Test-Path $www) { Remove-Item $www -Recurse -Force }
New-Item $www -ItemType Directory | Out-Null
Copy-Item (Join-Path $root "index.html") $www
foreach ($pasta in @("hospital","maternidade","ubs","upa","sadt","caps","centro-reabilitacao","vigilancia-epidemiologica","scripts","config","assets","shared")) {
  $origem = Join-Path $root $pasta
  if (Test-Path $origem) { Copy-Item $origem (Join-Path $www $pasta) -Recurse }
}

# 2. Corrige caminhos absolutos nos HTMLs dos formularios (subpastas)
#    No Capacitor o app roda em https://localhost/ — nao existe /formularios-visita-tecnica/
Write-Host "[2/5] Corrigindo caminhos para Capacitor..."
$subforms = @("hospital","maternidade","ubs","upa","sadt","caps","centro-reabilitacao","vigilancia-epidemiologica")
foreach ($pasta in $subforms) {
  $html = Join-Path $www "$pasta\index.html"
  if (Test-Path $html) {
    $content = Get-Content $html -Raw -Encoding UTF8
    # Substitui /formularios-visita-tecnica/ por ../ (todos formularios ficam 1 nivel abaixo da raiz)
    $content = $content -replace [regex]::Escape('/formularios-visita-tecnica/'), '../'
    # Remove registro do Service Worker (nao e necessario no APK, arquivos ja estao bundled)
    $content = $content -replace "(?s)if\s*\('serviceWorker'\s*in\s*navigator\).*?}\s*}\s*</script>", '</script>'
    Set-Content $html $content -Encoding UTF8
  }
}
# Corrige o index.html raiz:
# 1. Links das pastas usam index.html explicito (Capacitor nao resolve diretorios automaticamente)
# 2. Botao voltar dos formularios tambem usa index.html explicito
$indexHtml = Join-Path $www "index.html"
$content = Get-Content $indexHtml -Raw -Encoding UTF8
$formas = @("hospital","maternidade","ubs","upa","sadt","caps","centro-reabilitacao","vigilancia-epidemiologica")
foreach ($f in $formas) {
  $content = $content -replace "href=""$f/""", "href=""$f/index.html"""
}
Set-Content $indexHtml $content -Encoding UTF8

# Corrige botao "Voltar ao Menu" nos formularios: ../ -> ../index.html
foreach ($pasta in $subforms) {
  $html = Join-Path $www "$pasta\index.html"
  if (Test-Path $html) {
    $content = Get-Content $html -Raw -Encoding UTF8
    $content = $content -replace 'href="\.\./"', 'href="../index.html"'
    Set-Content $html $content -Encoding UTF8
  }
}

# Injeta handler de gesto/botao voltar do Android nos formularios (volta ao menu)
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

# Injeta handler de botao voltar no index.html raiz (sair do app)
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
$indexHtml = Join-Path $www "index.html"
$content = Get-Content $indexHtml -Raw -Encoding UTF8
$content = $content -replace '</body>', $backScriptIndex
Set-Content $indexHtml $content -Encoding UTF8

# 3. Sincroniza Capacitor
Write-Host "[3/5] Sincronizando Capacitor..."
Set-Location $root
npx cap sync android | Out-Null

# 4. Copia pasta android para path sem caracteres especiais e corrige configs
Write-Host "[4/5] Preparando pasta de build..."
if (Test-Path $apkBuild) { Remove-Item $apkBuild -Recurse -Force }
Copy-Item (Join-Path $root "android") $apkBuild -Recurse
Set-Content "$apkBuild\local.properties" "sdk.dir=C\:\\Users\\usuario\\AppData\\Local\\Android\\Sdk"
Set-Content "$apkBuild\capacitor.settings.gradle" @"
include ':capacitor-android'
project(':capacitor-android').projectDir = new File('C:/dev/formularios-isv/node_modules/@capacitor/android/capacitor')

include ':capacitor-app'
project(':capacitor-app').projectDir = new File('C:/dev/formularios-isv/node_modules/@capacitor/app/android')
"@
(Get-Content "$apkBuild\build.gradle") -replace "com.android.tools.build:gradle:[\d\.]+", "com.android.tools.build:gradle:8.9.1" | Set-Content "$apkBuild\build.gradle"
(Get-Content "$apkBuild\gradle\wrapper\gradle-wrapper.properties") -replace "gradle-[\d\.]+-all\.zip", "gradle-8.11.1-all.zip" | Set-Content "$apkBuild\gradle\wrapper\gradle-wrapper.properties"

# 5. Builda o APK
Write-Host "[5/5] Gerando APK (pode levar alguns minutos)..."
Set-Location $apkBuild
.\gradlew assembleDebug

$apk = "$apkBuild\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  $size = "{0:N2} MB" -f ((Get-Item $apk).Length / 1MB)
  Copy-Item $apk (Join-Path $root "formularios-isv.apk") -Force
  Write-Host ""
  Write-Host "APK gerado! ($size) → $root\formularios-isv.apk"
} else {
  Write-Host "ERRO: APK nao gerado. Verifique os logs acima."
}
