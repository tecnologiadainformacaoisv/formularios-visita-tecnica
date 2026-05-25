/**
 * ============================================================
 *  APPS SCRIPT – RECEPTOR DO FORMULÁRIO OFFLINE (HOSPITAL)
 *  v5 – Cabeçalhos legíveis na planilha do município
 * ============================================================
 */

const SHEET_ID_PRINCIPAL  = '17kYliHtfxkcfr-AWO4qhf-qq5QG08kFMiPlJsZciO-Q';
const PASTA_MUNICIPIOS_ID = '1KrCOYIYSkW3BluVclabdMbrZWcD6_3GY';
const ABA_TIPO            = 'Visita Hospital';

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

    salvarNaPlanilha(ss, dados);
    abaDebug.appendRow([new Date(), 'PRINCIPAL', 'OK']);

    const municipio = normalizarMunicipio(dados.s1_municipio || '');
    if (municipio) {
      salvarPorMunicipio(municipio, dados);
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

// ─── SALVA NA PLANILHA PRINCIPAL ───────────────────────────
function salvarNaPlanilha(ss, dados) {
  let aba = ss.getSheets()[0];

  if (aba.getLastRow() === 0) {
    const cab = getCabecalhos();
    aba.appendRow(cab);
    aba.getRange(1, 1, 1, cab.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
    aba.setFrozenRows(1);
  }

  const linha = getCabecalhos().map(col => {
    const val = dados[col];
    if (Array.isArray(val)) return val.join(', ');
    return val !== undefined && val !== null ? String(val) : '';
  });
  aba.appendRow(linha);
}

// ─── SALVA NA PLANILHA DO MUNICÍPIO ────────────────────────
function salvarPorMunicipio(municipio, dados) {
  const pasta = DriveApp.getFolderById(PASTA_MUNICIPIOS_ID);

  let planilha = null;
  const arquivos = pasta.getFilesByName(municipio);
  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    if (arquivo.getMimeType() === MimeType.GOOGLE_SHEETS) {
      planilha = SpreadsheetApp.open(arquivo);
      break;
    }
  }

  if (!planilha) {
    planilha = SpreadsheetApp.create(municipio);
    const arquivo = DriveApp.getFileById(planilha.getId());
    pasta.addFile(arquivo);
    try { DriveApp.getRootFolder().removeFile(arquivo); } catch(e) {}
  }

  let aba = planilha.getSheetByName(ABA_TIPO);
  if (!aba) {
    aba = planilha.insertSheet(ABA_TIPO);
    try {
      ['Plan1', 'Sheet1', 'Página1'].forEach(nome => {
        const padrao = planilha.getSheetByName(nome);
        if (padrao && planilha.getSheets().length > 1) planilha.deleteSheet(padrao);
      });
    } catch(e) {}
  }

  // Usa cabeçalhos LEGÍVEIS na planilha do município
  if (aba.getLastRow() === 0) {
    const cab = getCabecalhosLegiveis();
    aba.appendRow(cab);
    aba.getRange(1, 1, 1, cab.length).setFontWeight('bold').setBackground('#0f4c75').setFontColor('#ffffff');
    aba.setFrozenRows(1);
  }

  // Dados na mesma ordem dos cabeçalhos (usa as chaves para mapear)
  const chaves = getCabecalhos();
  const linha = chaves.map(col => {
    const val = dados[col];
    if (Array.isArray(val)) return val.join(', ');
    return val !== undefined && val !== null ? String(val) : '';
  });
  aba.appendRow(linha);
}

// ─── NORMALIZA MUNICÍPIO ───────────────────────────────────
function normalizarMunicipio(texto) {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ').toLowerCase()
    .replace(/(?:^|\s)\S/g, l => l.toUpperCase());
}

// ─── CABEÇALHOS EM CÓDIGO (para mapear os dados) ───────────
function getCabecalhos() {
  return [
    'timestamp_envio',
    's1_nome_hospital','s1_gestao','s1_natureza','s1_endereco','s1_municipio',
    's1_cep','s1_telefone','s1_email','s1_diretor_geral','s1_crm_diretor_geral',
    's1_diretor_medico','s1_crm_diretor_medico','s1_coord_enfermagem','s1_coren',
    's1_diretor_adm','s1_crc','s1_resp_tecnico','s1_data_visita','s1_responsavel_visita',
    's2_regimento_interno','s2_regimento_interno_atual',
    's2_organograma','s2_organograma_atual',
    's2_plano_diretor','s2_plano_diretor_atual',
    's2_pops_protocolos','s2_pops_protocolos_atual',
    's2_plano_contingencia','s2_plano_contingencia_atual',
    's2_plano_emergencia','s2_plano_emergencia_atual',
    's2_pgrss','s2_pgrss_atual',
    's2_plano_riscos','s2_plano_riscos_atual',
    's2_plano_seguranca','s2_plano_seguranca_atual',
    's2_relatorio_nsp','s2_relatorio_nsp_atual',
    's2_escalas','s2_escalas_atual',
    's2_alvara','s2_alvara_atual',
    's2_cert_bombeiros','s2_cert_bombeiros_atual',
    's2_registro_anvisa','s2_registro_anvisa_atual',
    's2_obs',
    's3_limpeza','s3_ventilacao','s3_sinalizacao','s3_acessibilidade',
    's3_iluminacao','s3_seguranca_patrimonial','s3_controle_vetores','s3_obs',
    's4_recepcao_propria','s4_sala_preparo','s4_sala_laudos','s4_pacs',
    's4_rxdigital_func','s4_rxdigital_manut','s4_rxconv_func','s4_rxconv_manut',
    's4_ultrassom_func','s4_ultrassom_manut','s4_mamografia_func','s4_mamografia_manut',
    's4_tomografia_func','s4_tomografia_manut','s4_rm_func','s4_rm_manut',
    's4_arco_func','s4_arco_manut','s4_densitometria_func','s4_densitometria_manut',
    's4_endoscopia_func','s4_endoscopia_manut','s4_obs',
    's5_n_consultorios','s5_sala_proc','s5_sala_exames','s5_sinalizacao_fluxo',
    's5_especialidades','s5_media_consultas','s5_absenteismo','s5_obs',
    's6_leitos_vermelha','s6_leitos_amarela','s6_leitos_verde',
    's6_leitos_reanimacao','s6_leitos_observacao',
    's6_cond_vermelha','s6_cond_amarela','s6_cond_verde',
    's6_cond_reanimacao','s6_cond_observacao','s6_equipamentos','s6_obs',
    's7_clinica_medica','s7_cirurgica','s7_ortopedia','s7_pediatria',
    's7_obstetricia','s7_psiquiatria','s7_oncologia','s7_cardiologia','s7_obs',
    's8_preparto_leitos','s8_parto_normal_salas','s8_cesarea_salas',
    's8_ppp','s8_recuperacao','s8_boas_praticas','s8_obs',
    's9_salas_operacionais','s9_salas_inativas','s9_srpa_leitos','s9_equipamentos','s9_obs',
    's10_leitos_autorizados','s10_leitos_operacionais','s10_taxa_ocupacao',
    's10_vent','s10_monitor','s10_capnografo','s10_arterial_line',
    's10_bomba','s10_o2','s10_rx_portatil','s10_obs',
    's11_servico','s11_n_maquinas','s11_n_pacientes','s11_sala_exclusiva','s11_obs',
    's12_sistema_info','s12_validades','s12_psicotr','s12_medicamentos_faltantes','s12_obs',
    's13_funcionamento','s13_processamento','s13_transporte','s13_obs',
    's14_esterilizacao','s14_fluxo','s14_rastreabilidade','s14_obs',
    's15_pmoc','s15_extintores','s15_manutencao_prev','s15_obs',
    's16_dietoterapia','s16_controle_validade','s16_coccao','s16_obs',
    's17_rdc50','s17_limpeza_concorrente','s17_limpeza_terminal','s17_obs',
    's18_roupas','s18_lavanderia','s18_separacao','s18_obs',
    's19_id_leito','s19_pulseiras','s19_notificacao','s19_obs',
    's20_faturamento','s20_producao','s20_indicadores','s20_obs',
    's21_medicos','s21_enfermeiros','s21_tec_enfermagem','s21_fisioterapeutas',
    's21_psicologos','s21_assist_sociais','s21_farmaceuticos','s21_nutricionistas',
    's22_nao_conformidades','s23_recomendacoes',
    's24_resp_visita','s24_cargo_resp','s24_resp_hospital'
  ];
}

// ─── CABEÇALHOS LEGÍVEIS (para exibição na planilha) ───────
function getCabecalhosLegiveis() {
  return [
    'Carimbo de data/hora',
    // SEÇÃO 1
    'Nome do Hospital','Gestão','Natureza do Hospital','Endereço','Município',
    'CEP','Telefone','E-mail','Diretor Geral','CRM / Registro do Diretor Geral',
    'Diretor Médico','CRM do Diretor Médico','Coordenador de Enfermagem','COREN',
    'Diretor Administrativo-Financeiro','CRC','Responsável Técnico','Data da Visita','Responsável(is) pela Visita',
    // SEÇÃO 2
    'Regimento Interno','Regimento Interno – Atualizado?',
    'Organograma','Organograma – Atualizado?',
    'Plano Diretor Hospitalar','Plano Diretor – Atualizado?',
    'POPs e Protocolos','POPs e Protocolos – Atualizado?',
    'Plano de Contingência','Plano de Contingência – Atualizado?',
    'Plano de Emergência e Brigada','Plano de Emergência – Atualizado?',
    'PGRSS (Resíduos)','PGRSS – Atualizado?',
    'Plano de Gerenciamento de Riscos','Plano de Riscos – Atualizado?',
    'Plano de Segurança do Paciente','Plano de Segurança – Atualizado?',
    'Relatório NSP/CCIH mensal','Relatório NSP – Atualizado?',
    'Escalas atualizadas e assinadas','Escalas – Atualizado?',
    'Alvará Sanitário','Alvará – Atualizado?',
    'Certificado do Corpo de Bombeiros','Cert. Bombeiros – Atualizado?',
    'Registro ANVISA de equipamentos','ANVISA – Atualizado?',
    'Obs. Documentação',
    // SEÇÃO 3
    'Limpeza','Ventilação / Climatização','Sinalização Interna','Acessibilidade',
    'Iluminação','Segurança Patrimonial','Controle de Vetores','Obs. Hotelaria',
    // SEÇÃO 4
    'SADT – Recepção própria','SADT – Sala de preparo','SADT – Sala de laudos','SADT – PACS',
    'Raio-X Digital – Func.','Raio-X Digital – Manut.','Raio-X Conv. – Func.','Raio-X Conv. – Manut.',
    'Ultrassom – Func.','Ultrassom – Manut.','Mamografia – Func.','Mamografia – Manut.',
    'Tomografia – Func.','Tomografia – Manut.','RM – Func.','RM – Manut.',
    'Arco Cirúrgico – Func.','Arco Cirúrgico – Manut.','Densitometria – Func.','Densitometria – Manut.',
    'Endoscopia – Func.','Endoscopia – Manut.','Obs. SADT',
    // SEÇÃO 5
    'Nº Consultórios','Sala Pequenos Procedimentos','Sala Exames Rápidos','Sinalização e Fluxo',
    'Especialidades Ativas','Média Consultas/dia','Absenteísmo (%)','Obs. Ambulatório',
    // SEÇÃO 6
    'Leitos Sala Vermelha','Leitos Sala Amarela','Leitos Sala Verde',
    'Leitos Reanimação','Leitos Observação',
    'Condição Sala Vermelha','Condição Sala Amarela','Condição Sala Verde',
    'Condição Reanimação','Condição Observação','Equipamentos U/E','Obs. U/E',
    // SEÇÃO 7
    'Clínica Médica','Cirúrgica','Ortopedia','Pediatria',
    'Obstetrícia','Psiquiatria','Oncologia','Cardiologia','Obs. Internamento',
    // SEÇÃO 8
    'Pré-parto – Leitos','Parto Normal – Salas','Cesárea – Salas',
    'Sala PPP','Sala Recuperação – Leitos','Boas Práticas','Obs. Centro Obstétrico',
    // SEÇÃO 9
    'Salas Operacionais','Salas Inativas','SRPA – Leitos','Equipamentos CC','Obs. Centro Cirúrgico',
    // SEÇÃO 10
    'UTI – Leitos Autorizados','UTI – Leitos Operacionais','UTI – Taxa Ocupação (%)',
    'Ventilador','Monitor Multiparamétrico','Capnógrafo','Arterial Line',
    'Bomba de Infusão','O₂ / Ar / Vácuo','Raio-X Portátil','Obs. UTI',
    // SEÇÃO 11
    'Hemodiálise – Serviço','Nº Máquinas','Nº Pacientes Hemodiálise','Sala Exclusiva','Obs. Hemodiálise',
    // SEÇÃO 12
    'Farmácia – Sistema Informatizado','Validades Auditadas','Controle Psicotrópicos','Medicamentos Faltantes','Obs. Farmácia',
    // SEÇÃO 13
    'Laboratório – Funcionamento','Processamento Próprio','Transporte Referência','Obs. Laboratório',
    // SEÇÃO 14
    'CME – Esterilização','CME – Fluxo Limpo/Sujo','Rastreabilidade Caixas','Obs. CME',
    // SEÇÃO 15
    'PMOC Atualizado','Extintores Validade','Manutenção Preventiva','Obs. Manutenção',
    // SEÇÃO 16
    'Dietoterapia','Controle Validade Alimentos','Cocção e Áreas Limpas','Obs. Nutrição',
    // SEÇÃO 17
    'RDC 50/ANVISA','Limpeza Concorrente','Limpeza Terminal','Obs. Higienização',
    // SEÇÃO 18
    'Roupas Limpas','Lavanderia','Separação Sujo/Limpo','Obs. Lavanderia',
    // SEÇÃO 19
    'Identificação de Leito','Pulseiras de Identificação','Notificação Eventos Adversos','Obs. Segurança',
    // SEÇÃO 20
    'Faturamento SUS','Produção Atualizada','Indicadores Atualizados','Obs. Administrativo',
    // SEÇÃO 21
    'Médicos (Prev/Exist/Déf)','Enfermeiros (Prev/Exist/Déf)','Técnicos Enfermagem (Prev/Exist/Déf)','Fisioterapeutas (Prev/Exist/Déf)',
    'Psicólogos (Prev/Exist/Déf)','Assistentes Sociais (Prev/Exist/Déf)','Farmacêuticos (Prev/Exist/Déf)','Nutricionistas (Prev/Exist/Déf)',
    // SEÇÃO 22–24
    'Não Conformidades','Recomendações',
    'Responsável pela Visita','Cargo / Função','Responsável pelo Hospital'
  ];
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
