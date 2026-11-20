/* Ourculture guide — available languages.
   To add a language: put its folder next to /fr/ (e.g. /hu/, /tr/) and add one line below.
   The language menu of every page (EN, FR and the new ones) is built from this list. */
window.OC_LANGS = [
  { code: 'en', name: 'English',  path: ''    },
  { code: 'fr', name: 'Français', path: 'fr/' }
  // { code: 'hu', name: 'Magyar',  path: 'hu/' },
  // { code: 'tr', name: 'Türkçe',  path: 'tr/' }
];

(function () {
  function init() {
    document.querySelectorAll('.lang-menu').forEach(function (m) {
      var root = m.dataset.root || '', page = m.dataset.page || 'index.html', cur = m.dataset.current;
      var list = m.querySelector('.lang-list'), btn = m.querySelector('button');
      if (window.OC_LANGS && list) {
        list.innerHTML = window.OC_LANGS.map(function (l) {
          var here = l.code === cur;
          return '<a href="' + root + l.path + page + '" hreflang="' + l.code + '" lang="' + l.code + '"' +
            (here ? ' class="current" aria-current="true"' : '') + '><b>' + l.code.toUpperCase() + '</b> ' + l.name + '</a>';
        }).join('');
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !m.classList.contains('open');
        document.querySelectorAll('.lang-menu.open').forEach(function (x) { x.classList.remove('open'); });
        m.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
      });
    });
    document.addEventListener('click', function () { document.querySelectorAll('.lang-menu.open').forEach(function (x) { x.classList.remove('open'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.lang-menu.open').forEach(function (x) { x.classList.remove('open'); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
