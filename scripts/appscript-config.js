(function () {
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbzOPMw55x3jA4TaL-ByElRic4w8RUwTHd6bXPZD6tKsoLY9GdygGKXLB0lbsIBPT4kr/exec';
  const PLACEHOLDER_URL = 'https://script.google.com/macros/s/AKfycbyAySxv-mk-8h8JKh6kp9WuLO8i86GQQKu7rIi7C5rC7YGT9D-JXyHGOrS_1KrcK__i/exec';

  const params = new URLSearchParams(window.location.search || '');
  const stored = localStorage.getItem('formularios-visita-tecnica-appscript-url');

  window.APP_SCRIPT_CONFIG = Object.assign({
    defaultUrl: DEFAULT_URL,
    placeholderUrl: PLACEHOLDER_URL,
    currentUrl: DEFAULT_URL,
    source: 'default'
  }, window.APP_SCRIPT_CONFIG || {});

  const overrideUrl = params.get('appscript') || stored;

  if (overrideUrl) {
    window.APP_SCRIPT_CONFIG.currentUrl = overrideUrl;
    window.APP_SCRIPT_CONFIG.source = params.get('appscript') ? 'query-string' : 'local-storage';
    localStorage.setItem('formularios-visita-tecnica-appscript-url', overrideUrl);
  } else {
    window.APP_SCRIPT_CONFIG.currentUrl = window.APP_SCRIPT_CONFIG.currentUrl || window.APP_SCRIPT_CONFIG.url || DEFAULT_URL;
    window.APP_SCRIPT_CONFIG.source = 'default';
  }

  window.APP_SCRIPT_CONFIG.getUrl = function () {
    return window.APP_SCRIPT_CONFIG.currentUrl || DEFAULT_URL;
  };

  window.APP_SCRIPT_CONFIG.setUrl = function (url) {
    window.APP_SCRIPT_CONFIG.currentUrl = url;
    window.APP_SCRIPT_CONFIG.source = 'manual';
    localStorage.setItem('formularios-visita-tecnica-appscript-url', url);
    return url;
  };
})();
