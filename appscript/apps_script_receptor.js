/**
 * ============================================================
 *  APPS SCRIPT – RECEPTOR DO FORMULÁRIO OFFLINE
 *  v6 – roteamento por tipo e inserção dinâmica
 * ============================================================
 */

const SHEET_ID_PRINCIPAL  = '17kYliHtfxkcfr-AWO4qhf-qq5QG08kFMiPlJsZciO-Q';
const PASTA_MUNICIPIOS_ID = '1KrCOYIYSkW3BluVclabdMbrZWcD6_3GY';
const DEFAULT_TAB_NAME     = 'Visita Hospital';

const TARGETS = {
  hospital: {
    spreadsheetName: 'Visita Hospital',
    tabName: 'Visita Hospital',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'Hospitais / CER'
  },
  cer: {
    spreadsheetName: 'Visita Hospital',
    tabName: 'Visita Hospital',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'Hospitais / CER'
  },
  maternidade: {
    spreadsheetName: 'Visita Maternidade',
    tabName: 'Visita Maternidade',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'Maternidade'
  },
  ubs: {
    spreadsheetName: 'Visita UBS',
    tabName: 'Visita UBS',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'UBS'
  },
  upa: {
    spreadsheetName: 'Visita UPA',
    tabName: 'Visita UPA',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'UPA'
  },
  sadt: {
    spreadsheetName: 'Visita SADT',
    tabName: 'Visita SADT',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'SADT'
  },
  caps: {
    spreadsheetName: 'Visita CAPS',
    tabName: 'Visita CAPS',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'CAPS'
  },
  vigilancia: {
    spreadsheetName: 'Visita Vigilância Epidemiológica',
    tabName: 'Visita Vigilância Epidemiológica',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'Vigilância Epidemiológica'
  },
  vigilancia_epidemiologica: {
    spreadsheetName: 'Visita Vigilância Epidemiológica',
    tabName: 'Visita Vigilância Epidemiológica',
    municipioFolderId: PASTA_MUNICIPIOS_ID,
    descricao: 'Vigilância Epidemiológica'
  }
};

function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID_PRINCIPAL);
  let abaDebug = ss.getSheetByName('_debug') || ss.insertSheet('_debug');

  try {
    let dados;
    if (e.parameter && e.parameter.payload) {
      dados = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      dados = JSON.parse(e.postData.contents);
    } else {
      abaDebug.appendRow([new Date(), 'ERRO', 'Nenhum dado recebido']);
      return HtmlService.createHtmlOutput('Erro: sem dados');
    }

    const tipo = normalizeTipo(dados.form_tipo || dados.form_id || dados.tipo || 'hospital');
    const config = getTargetConfig(tipo);
    const municipio = normalizarMunicipio(dados.s1_municipio || '');

    saveDataToTarget(config, dados);
    abaDebug.appendRow([new Date(), 'TARGET', tipo + ' -> ' + config.descricao]);
    abaDebug.appendRow([new Date(), 'PRINCIPAL', 'OK']);

    if (municipio) {
      saveMunicipioData(config, municipio, dados);
      abaDebug.appendRow([new Date(), 'MUNICÍPIO', municipio + ' – OK']);
    } else {
      abaDebug.appendRow([new Date(), 'MUNICÍPIO', 'Município não informado – ignorado']);
    }

    return HtmlService.createHtmlOutput(
      '<p style="font-family:sans-serif;color:green">✅ Dados salvos com sucesso.</p>'
    );
  } catch (err) {
    abaDebug.appendRow([new Date(), 'EXCEPTION', err.message, err.stack]);
    return HtmlService.createHtmlOutput('Erro: ' + err.message);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">✅ Receptor ativo.</p>');
}

function normalizeTipo(tipo) {
  if (!tipo) return 'hospital';
  const valor = String(tipo).trim().toLowerCase();
  if (valor === 'cer') return 'cer';
  if (valor === 'hospital') return 'hospital';
  if (valor === 'maternidade') return 'maternidade';
  if (valor === 'ubs') return 'ubs';
  if (valor === 'upa') return 'upa';
  if (valor === 'sadt') return 'sadt';
  if (valor === 'caps') return 'caps';
  if (valor === 'vigilancia' || valor === 'vigilancia-epidemiologica') return 'vigilancia';
  return valor;
}

function getTargetConfig(tipo) {
  const normalizado = normalizeTipo(tipo);
  return TARGETS[normalizado] || TARGETS.hospital;
}

function getSpreadsheetByName(nome, pasta) {
  const arquivos = pasta.getFiles();
  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    if (arquivo.getName() === nome && arquivo.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.open(arquivo);
    }
  }
  return null;
}

function getOrCreateTab(planilha, nomeTab) {
  let aba = planilha.getSheetByName(nomeTab);
  if (!aba) {
    aba = planilha.insertSheet(nomeTab);
  }
  return aba;
}

function sanitizeValue(valor) {
  if (Array.isArray(valor)) return valor.join(', ');
  return valor !== undefined && valor !== null ? String(valor) : '';
}

function getCabecalhosDinamicos(dados) {
  return Object.keys(dados || {}).filter(key => key !== '_labels');
}

function getCabecalhosForDisplay(dados) {
  const labels = dados._labels || {};
  return getCabecalhosDinamicos(dados).map(key => labels[key] || key);
}

function getCabecalhoAtual(aba) {
  if (aba.getLastRow() === 0) return [];
  return aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getValues()[0].filter(col => col !== undefined && col !== '');
}

function prepararCabecalho(aba, dados) {
  const cabecalhoAtual = getCabecalhoAtual(aba);
  const labels = dados._labels || {};
  const labelToKey = {};
  Object.keys(labels).forEach(key => { labelToKey[labels[key]] = key; });

  const cabecalhosNovos = getCabecalhosForDisplay(dados);
  const faltantes = cabecalhosNovos.filter(col => {
    if (cabecalhoAtual.indexOf(col) !== -1) return false;
    const rawKey = labelToKey[col] || col;
    return cabecalhoAtual.indexOf(rawKey) === -1;
  });

  if (aba.getLastRow() === 0 && cabecalhosNovos.length > 0) {
    aba.appendRow(cabecalhosNovos);
    aba.getRange(1, 1, 1, cabecalhosNovos.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
    aba.setFrozenRows(1);
    return;
  }

  if (faltantes.length > 0) {
    aba.insertColumnsAfter(aba.getLastColumn(), faltantes.length);
    const novoCabecalho = cabecalhoAtual.concat(faltantes);
    aba.getRange(1, 1, 1, novoCabecalho.length).setValues([novoCabecalho]);
    aba.getRange(1, 1, 1, novoCabecalho.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
  }
}

function salvarLinha(aba, dados) {
  const labels = dados._labels || {};
  const labelToKey = {};
  Object.keys(labels).forEach(key => { labelToKey[labels[key]] = key; });
  const cabecalhoAtual = getCabecalhoAtual(aba);
  const linha = cabecalhoAtual.map(col => sanitizeValue(dados[labelToKey[col] || col]));
  aba.appendRow(linha);
}

function isDuplicateRow(aba, dados) {
  const ts = dados.timestamp_envio;
  if (!ts || aba.getLastRow() < 2) return false;
  const cabecalho = getCabecalhoAtual(aba);
  const labels = dados._labels || {};
  const tsLabel = labels.timestamp_envio || 'timestamp_envio';
  let colTs = cabecalho.indexOf(tsLabel);
  if (colTs === -1) colTs = cabecalho.indexOf('timestamp_envio');
  if (colTs === -1) return false;
  const valores = aba.getRange(2, colTs + 1, aba.getLastRow() - 1, 1).getValues();
  return valores.some(row => String(row[0]) === String(ts));
}

function saveDataToTarget(config, dados) {
  const ss = SpreadsheetApp.openById(SHEET_ID_PRINCIPAL);
  const aba = getOrCreateTab(ss, config.tabName || DEFAULT_TAB_NAME);
  if (aba.getLastRow() === 0) {
    const cabecalhos = getCabecalhosForDisplay(dados);
    aba.appendRow(cabecalhos);
    aba.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
    aba.setFrozenRows(1);
  }
  prepararCabecalho(aba, dados);
  SpreadsheetApp.flush();
  if (!isDuplicateRow(aba, dados)) salvarLinha(aba, dados);
}

function saveMunicipioData(config, municipio, dados) {
  const pasta = DriveApp.getFolderById(config.municipioFolderId || PASTA_MUNICIPIOS_ID);
  let planilha = getSpreadsheetByName(municipio, pasta);

  if (!planilha) {
    planilha = SpreadsheetApp.create(municipio);
    const arquivo = DriveApp.getFileById(planilha.getId());
    pasta.addFile(arquivo);
    try { DriveApp.getRootFolder().removeFile(arquivo); } catch (e) {}
  }

  const aba = getOrCreateTab(planilha, config.tabName || DEFAULT_TAB_NAME);

  // Remove abas padrão vazias criadas automaticamente (ex: "Página1")
  planilha.getSheets().forEach(function(sheet) {
    if (sheet.getName() !== aba.getName() && sheet.getLastRow() === 0 && sheet.getLastColumn() === 0) {
      try { planilha.deleteSheet(sheet); } catch(e) {}
    }
  });

  if (aba.getLastRow() === 0) {
    const cabecalhos = getCabecalhosForDisplay(dados);
    aba.appendRow(cabecalhos);
    aba.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
    aba.setFrozenRows(1);
  }

  prepararCabecalho(aba, dados);
  SpreadsheetApp.flush();
  if (!isDuplicateRow(aba, dados)) salvarLinha(aba, dados);
}

function normalizarMunicipio(texto) {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ').toLowerCase()
    .replace(/(?:^|\s)\S/g, l => l.toUpperCase());
}

// ─── TESTES ────────────────────────────────────────────────
function testarAcesso() {
  Logger.log('Planilha principal: ' + SpreadsheetApp.openById(SHEET_ID_PRINCIPAL).getName());
  Logger.log('Pasta municípios: ' + DriveApp.getFolderById(PASTA_MUNICIPIOS_ID).getName());
  Logger.log('OK');
}

function autorizarDrive() {
  const pasta = DriveApp.getFolderById(PASTA_MUNICIPIOS_ID);
  Logger.log('Pasta: ' + pasta.getName());
  const teste = SpreadsheetApp.create('_TESTE_DELETAR');
  const arquivo = DriveApp.getFileById(teste.getId());
  pasta.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);
  Logger.log('Criou, moveu e removeu do root: OK');
  arquivo.setTrashed(true);
  Logger.log('Autorização completa!');
}
