(function () {
  const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygENDGFKSfazR-csNlIgiQ3n5FP1uDJCOd-EeaS6mhlbAJfyap_27d87nFSFPF0QPo/exec';

  function getAppsScriptUrl() {
    if (window.APP_SCRIPT_CONFIG && window.APP_SCRIPT_CONFIG.currentUrl) {
      return window.APP_SCRIPT_CONFIG.currentUrl;
    }
    return window.FORM_CONFIG?.appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;
  }

  const FORM_META = Object.assign({}, window.FORM_CONFIG || {}, {
    appsScriptUrl: getAppsScriptUrl()
  });

  const STORAGE_KEYS = {
    data: `${FORM_META.id}_form_data`,
    savedAt: `${FORM_META.id}_form_saved_at`,
    queue: `${FORM_META.id}_form_queue`
  };

  function toggleSection(head) {
    const body = head.nextElementSibling;
    const arrow = head.querySelector('.section-toggle');
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    arrow.classList.toggle('open', !isOpen);
  }

  function collectFormData() {
    const data = { timestamp_envio: new Date().toISOString() };
    const form = document.getElementById('main-form');
    const elements = form.elements;
    const checkboxGroups = {};

    for (let el of elements) {
      if (!el.name) continue;
      if (el.type === 'radio') {
        if (!(el.name in data)) data[el.name] = '';
        if (el.checked) data[el.name] = el.value;
      } else if (el.type === 'checkbox') {
        if (!checkboxGroups[el.name]) checkboxGroups[el.name] = [];
        if (el.checked) checkboxGroups[el.name].push(el.value);
      } else {
        data[el.name] = el.value;
      }
    }

    for (let key in checkboxGroups) {
      data[key] = checkboxGroups[key];
    }

    data.form_id = FORM_META.id;
    data.form_tipo = (FORM_META.tipo || FORM_META.id || 'geral').toString().toLowerCase();
    data.form_title = FORM_META.title || '';
    data.form_version = FORM_META.version || '';

    data._labels = buildLabels(data);

    return data;
  }

  function buildLabels(data) {
    const labels = {
      timestamp_envio: 'Data/Hora',
      form_id: 'ID Formulário',
      form_tipo: 'Tipo',
      form_title: 'Título',
      form_version: 'Versão'
    };
    const formEl = document.getElementById('main-form');
    if (!formEl) return labels;

    const usedLabels = {};
    const seen = {};

    formEl.querySelectorAll('[name]').forEach(el => {
      const key = el.name;
      if (seen[key] || labels[key]) return;
      seen[key] = true;

      let labelText = key;
      const field = el.closest('.field');
      if (field) {
        const directLabel = Array.from(field.children).find(ch => ch.tagName === 'LABEL');
        if (directLabel) {
          const text = Array.from(directLabel.childNodes)
            .filter(n => n.nodeType === 3)
            .map(n => n.textContent.trim())
            .join('').trim();
          labelText = text || directLabel.textContent.trim();
        }
      } else {
        const subsec = el.closest('.subsec');
        if (subsec) {
          const internalTitle = subsec.querySelector('.subsec-title');
          const prevTitle = subsec.previousElementSibling;
          const titleEl = internalTitle ||
            (prevTitle && prevTitle.classList.contains('subsec-title') ? prevTitle : null);
          if (titleEl) labelText = titleEl.textContent.trim();
        }
      }

      if (usedLabels[labelText] !== undefined) {
        const section = el.closest('.section-card');
        const sectionTitleEl = section ? section.querySelector('.section-title') : null;
        const sectionTitle = sectionTitleEl ? sectionTitleEl.textContent.trim() : '';
        labelText = sectionTitle ? `${labelText} – ${sectionTitle}` : `${labelText} (${key})`;
      }

      labels[key] = labelText;
      usedLabels[labelText] = true;
    });

    return labels;
  }

  function scheduleAutoSave() {
    clearTimeout(window.__visitaSaveTimer);
    window.__visitaSaveTimer = setTimeout(saveToLocal, 1200);
  }

  function saveToLocal() {
    try {
      const data = collectFormData();
      localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.savedAt, new Date().toLocaleString('pt-BR'));
      const el = document.getElementById('save-status');
      if (el) {
        el.textContent = '✓ Salvo às ' + new Date().toLocaleTimeString('pt-BR');
      }
      updateProgress();
    } catch (e) {
      console.warn('[SAVE] Não foi possível salvar localmente', e.message);
    }
  }

  function loadFromLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.data);
      if (!saved) return;
      const data = JSON.parse(saved);
      const form = document.getElementById('main-form');

      for (let key in data) {
        const val = data[key];
        if (Array.isArray(val)) {
          val.forEach(item => {
            const el = form.querySelector(`input[name="${key}"][value="${item}"]`);
            if (el) el.checked = true;
          });
        } else {
          const els = form.querySelectorAll(`[name="${key}"]`);
          els.forEach(el => {
            if (el.type === 'radio') {
              if (el.value === val) el.checked = true;
            } else if (el.type === 'checkbox') {
              el.checked = (el.value === val);
            } else {
              el.value = val;
            }
          });
        }
      }

      const savedAt = localStorage.getItem(STORAGE_KEYS.savedAt);
      const el = document.getElementById('save-status');
      if (el) {
        el.textContent = savedAt ? '✓ Rascunho de ' + savedAt : '';
      }
      updateProgress();
    } catch (e) {
      console.warn('[LOAD] Não foi possível carregar o rascunho', e.message);
    }
  }

  function updateProgress() {
    const form = document.getElementById('main-form');
    if (!form) return;

    const required = form.querySelectorAll('[required]');
    let filled = 0;
    const radioGroups = {};

    required.forEach(el => {
      if (el.type === 'radio') {
        radioGroups[el.name] = radioGroups[el.name] || false;
        if (el.checked) radioGroups[el.name] = true;
      } else if (el.value && el.value.trim()) {
        filled++;
      }
    });

    filled += Object.values(radioGroups).filter(Boolean).length;
    const total = form.querySelectorAll('input[required]:not([type=radio])').length + Object.keys(radioGroups).length;
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    const bar = document.getElementById('progress-bar');
    if (bar) {
      bar.style.width = pct + '%';
    }
  }

  function updateOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    const isOnline = navigator.onLine;
    if (banner) {
      banner.style.display = isOnline ? 'none' : 'block';
    }

    if (isOnline) {
      const q = getQueue();
      if (q.length > 0) {
        showMsg('queued', `🔄 Conexão restaurada! Sincronizando ${q.length} envio(s) pendente(s)...`);
        setTimeout(trySyncQueue, 1500);
      }
    }
  }

  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.queue) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveQueue(q) {
    localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(q));
    const info = document.getElementById('queue-info');
    if (!info) return;
    if (q.length > 0) {
      info.textContent = `📦 ${q.length} envio(s) pendente(s) – será(ão) enviado(s) automaticamente quando houver conexão.`;
      info.style.display = 'block';
    } else {
      info.style.display = 'none';
    }
  }

  function postDataComIframe(data, iframeId) {
    return new Promise(resolve => {
      try {
        const anterior = document.getElementById(iframeId);
        if (anterior && iframeId !== 'form_target') anterior.remove();

        let iframe;
        if (iframeId === 'form_target') {
          iframe = document.getElementById('form_target');
        } else {
          iframe = document.createElement('iframe');
          iframe.name = iframeId;
          iframe.id = iframeId;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = FORM_META.appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;
        form.target = iframeId;
        form.style.display = 'none';

        const inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = 'payload';
        inp.value = JSON.stringify(data);
        form.appendChild(inp);
        document.body.appendChild(form);

        const onLoad = () => {
          iframe.removeEventListener('load', onLoad);
          try { document.body.removeChild(form); } catch (e) {}
          if (iframeId !== 'form_target') {
            try { document.body.removeChild(iframe); } catch (e) {}
          }
          resolve(true);
        };

        iframe.addEventListener('load', onLoad);

        setTimeout(() => {
          iframe.removeEventListener('load', onLoad);
          try { document.body.removeChild(form); } catch (e) {}
          if (iframeId !== 'form_target') {
            try { document.body.removeChild(iframe); } catch (e) {}
          }
          resolve(false);
        }, 10000);

        form.submit();
      } catch (e) {
        console.error('[POST] Erro:', e.message);
        resolve(false);
      }
    });
  }

  function postData(data) {
    return postDataComIframe(data, 'form_target');
  }

  async function trySyncQueue() {
    const q = getQueue();
    if (q.length === 0) return;

    const remaining = [];

    for (let i = 0; i < q.length; i++) {
      const item = q[i];
      showMsg('queued', `🔄 Sincronizando ${i + 1} de ${q.length}...`);
      const ok = await postDataComIframe(item, 'sync_iframe_' + Date.now());
      if (!ok) remaining.push(item);
      if (i < q.length - 1) await new Promise(resolve => setTimeout(resolve, 1000));
    }

    saveQueue(remaining);

    if (remaining.length === 0) {
      showMsg('success', '✅ Todos os envios pendentes foram sincronizados com sucesso!');
    } else {
      showMsg('error', `⚠ ${remaining.length} envio(s) ainda com falha. Tente novamente.`);
    }
  }

  function validateRequired() {
    const form = document.getElementById('main-form');
    if (!form) return false;

    const textEls = form.querySelectorAll('input[required]:not([type=radio]), textarea[required]');
    for (let el of textEls) {
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--red)';
        el.focus();
        return false;
      }
      el.style.borderColor = '';
    }

    const radioReq = {};
    form.querySelectorAll('input[type=radio][required]').forEach(el => {
      radioReq[el.name] = false;
    });
    form.querySelectorAll('input[type=radio][required]:checked').forEach(el => {
      radioReq[el.name] = true;
    });

    for (let name in radioReq) {
      if (!radioReq[name]) {
        const first = form.querySelector(`input[name="${name}"]`);
        if (first) {
          const card = first.closest('.section-body');
          if (card && !card.classList.contains('open')) {
            card.classList.add('open');
            card.previousElementSibling.querySelector('.section-toggle').classList.add('open');
          }
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }

    return true;
  }

  function salvarCSV(data) {
    try {
      const cabecalhos = Object.keys(data);
      const valores = cabecalhos.map(k => {
        const v = data[k];
        const texto = Array.isArray(v) ? v.join('; ') : (v || '');
        const escapado = String(texto).replace(/"/g, '""');
        return (escapado.includes(',') || escapado.includes('\n') || escapado.includes('"'))
          ? `"${escapado}"`
          : escapado;
      });

      const csv = '\uFEFF' + cabecalhos.join(',') + '\n' + valores.join(',');
      const nomeUnidade = (data.s1_nome_unidade || FORM_META.csvBaseName || 'visita')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '_')
        .substring(0, 30);

      const agora = new Date();
      const dataHora = agora.getFullYear() + String(agora.getMonth() + 1).padStart(2, '0') + String(agora.getDate()).padStart(2, '0') + '_' + String(agora.getHours()).padStart(2, '0') + String(agora.getMinutes()).padStart(2, '0');
      const nomeArquivo = `visita_${nomeUnidade}_${dataHora}.csv`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return nomeArquivo;
    } catch (e) {
      console.error('[CSV] Erro ao gerar CSV:', e.message);
      return null;
    }
  }

  async function submitForm() {
    if (!validateRequired()) {
      showMsg('error', '⚠ Preencha todos os campos obrigatórios (*) antes de enviar.');
      return;
    }

    const btn = document.getElementById('submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Enviando...';
    }

    const data = collectFormData();

    if (!navigator.onLine) {
      const q = getQueue();
      q.push(data);
      saveQueue(q);
      const nomeCSV = salvarCSV(data);
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📤 Enviar para o Google Sheets';
      }
      showMsg('queued', `📦 Sem internet. Dados salvos localmente e exportados para CSV${nomeCSV ? ' (' + nomeCSV + ')' : ''}. Serão enviados automaticamente quando a conexão voltar.`);
      resetForm();
      return;
    }

    const ok = await postData(data);
    const nomeCSV = salvarCSV(data);
    const infoCSV = nomeCSV ? ` Backup CSV salvo: ${nomeCSV}.` : '';

    if (btn) {
      btn.disabled = false;
      btn.textContent = '📤 Enviar para o Google Sheets';
    }

    if (ok) {
      showMsg('success', `✅ Dados enviados com sucesso!${infoCSV}`);
      resetForm();
    } else {
      const q = getQueue();
      q.push(data);
      saveQueue(q);
      showMsg('queued', `⚠ Não foi possível conectar ao servidor. Dados na fila para reenvio automático.${infoCSV}`);
      resetForm();
    }
  }

  function resetForm() {
    const form = document.getElementById('main-form');
    if (form) form.reset();
    localStorage.removeItem(STORAGE_KEYS.data);
    localStorage.removeItem(STORAGE_KEYS.savedAt);
    const status = document.getElementById('save-status');
    if (status) status.textContent = '–';
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showMsg(type, text) {
    const el = document.getElementById('status-msg');
    if (!el) return;
    el.className = type;
    el.textContent = text;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function carregarMunicipios() {
    const hint = document.getElementById('hint_municipio');
    const lista = document.getElementById('lista_municipios');

    function popularLista(municipios) {
      if (!lista) return;
      lista.innerHTML = '';
      municipios.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        lista.appendChild(opt);
      });
    }

    const cache = localStorage.getItem('municipios_ce');
    if (cache) {
      popularLista(JSON.parse(cache));
      if (hint) {
        hint.textContent = '✓ ' + JSON.parse(cache).length + ' municípios do Ceará disponíveis';
        hint.style.color = 'var(--green)';
      }
    }

    if (!navigator.onLine) {
      if (!cache && hint) {
        hint.textContent = '⚠ Sem internet. Digite o município manualmente.';
        hint.style.color = 'var(--orange)';
      }
      return;
    }

    try {
      const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/CE/municipios');
      const dados = await resp.json();
      const nomes = dados.map(m => m.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      localStorage.setItem('municipios_ce', JSON.stringify(nomes));
      popularLista(nomes);
      if (hint) {
        hint.textContent = '✓ ' + nomes.length + ' municípios do Ceará disponíveis';
        hint.style.color = 'var(--green)';
      }
    } catch (e) {
      if (!cache && hint) {
        hint.textContent = '⚠ Não foi possível carregar. Digite o município manualmente.';
        hint.style.color = 'var(--orange)';
      }
    }
  }

  function initForm() {
    const form = document.getElementById('main-form');
    if (!form) return;

    loadFromLocal();
    updateOnlineStatus();
    updateProgress();
    trySyncQueue();

    form.addEventListener('input', scheduleAutoSave);
    form.addEventListener('change', () => {
      scheduleAutoSave();
      updateProgress();
    });

    carregarMunicipios();
  }

  document.addEventListener('DOMContentLoaded', initForm);
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  window.toggleSection = toggleSection;
  window.submitForm = submitForm;
  window.collectFormData = collectFormData;
  window.saveToLocal = saveToLocal;
  window.loadFromLocal = loadFromLocal;
  window.trySyncQueue = trySyncQueue;
  window.salvarCSV = salvarCSV;
  window.carregarMunicipios = carregarMunicipios;
})();
