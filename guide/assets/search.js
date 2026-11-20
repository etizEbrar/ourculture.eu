/* Ourculture guide — site search (no server needed). Index: search-index.js in each language folder. */
(function () {
  var FR = (document.documentElement.lang || 'en').slice(0, 2) === 'fr';
  var T = FR ? {
    ph: 'Rechercher dans le guide (ex. : podcast, entretien, algorithme)…', close: 'Fermer', none: 'Aucun résultat pour',
    hint: 'Tapez au moins 2 lettres. Les accents et majuscules sont ignorés.', count: function (n) { return n + (n > 1 ? ' résultats' : ' résultat'); },
    loading: 'Chargement de l’index…', title: 'Rechercher'
  } : {
    ph: 'Search the guide (e.g. podcast, interview, algorithm)…', close: 'Close', none: 'No results for',
    hint: 'Type at least 2 letters. Accents and capitals are ignored.', count: function (n) { return n + (n > 1 ? ' results' : ' result'); },
    loading: 'Loading the index…', title: 'Search'
  };
  var INDEX = null, box, input, list, status, sel = -1, items = [];

  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'").replace(/œ/g, 'oe').replace(/æ/g, 'ae'); }
  // per-character normalisation keeping a map to the original string (for highlighting)
  function normMap(s) {
    var out = '', map = [];
    for (var i = 0; i < s.length; i++) { var n = norm(s[i]); for (var k = 0; k < n.length; k++) { out += n[k]; map.push(i); } }
    map.push(s.length);
    return { n: out, map: map };
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(s, terms) {
    var m = normMap(s), ranges = [];
    terms.forEach(function (t) { var p = 0, i; while ((i = m.n.indexOf(t, p)) !== -1) { ranges.push([m.map[i], m.map[i + t.length - 1] + 1]); p = i + t.length; } });
    if (!ranges.length) return esc(s);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    ranges.forEach(function (r) { if (r[0] < pos) return; out += esc(s.slice(pos, r[0])) + '<mark>' + esc(s.slice(r[0], r[1])) + '</mark>'; pos = r[1]; });
    return out + esc(s.slice(pos));
  }
  function snippet(x, terms) {
    var m = normMap(x), best = -1;
    for (var i = 0; i < terms.length; i++) { var p = m.n.indexOf(terms[i]); if (p !== -1 && (best === -1 || p < best)) best = p; }
    if (best === -1) return x.slice(0, 180) + (x.length > 180 ? '…' : '');
    var o = m.map[best], a = Math.max(0, o - 70), b = Math.min(x.length, o + 150);
    while (a > 0 && x[a] !== ' ') a--;
    while (b < x.length && x[b] !== ' ') b++;
    return (a > 0 ? '…' : '') + x.slice(a, b).trim() + (b < x.length ? '…' : '');
  }

  function build() {
    box = document.createElement('div');
    box.className = 'oc-search'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T.title);
    box.innerHTML = '<div class="oc-search-panel"><div class="oc-search-bar">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
      '<input type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(T.ph) + '" aria-label="' + esc(T.title) + '"/>' +
      '<button type="button" class="oc-search-close" aria-label="' + esc(T.close) + '">Esc</button></div>' +
      '<p class="oc-search-status"></p><ol class="oc-search-results"></ol></div>';
    document.body.appendChild(box);
    input = box.querySelector('input'); list = box.querySelector('ol'); status = box.querySelector('.oc-search-status');
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.oc-search-close').addEventListener('click', close);
    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { var a = items[sel >= 0 ? sel : 0]; if (a) { a.click(); } }
    });
    list.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) close(); });
  }
  function move(d) {
    if (!items.length) return;
    sel = (sel + d + items.length) % items.length;
    items.forEach(function (a, i) { a.classList.toggle('sel', i === sel); });
    items[sel].scrollIntoView({ block: 'nearest' });
  }
  function load(cb) {
    if (INDEX) return cb();
    if (window.OC_SEARCH_INDEX) { INDEX = prep(window.OC_SEARCH_INDEX); return cb(); }
    status.textContent = T.loading;
    var s = document.createElement('script');
    s.src = 'search-index.js';
    s.onload = function () { INDEX = prep(window.OC_SEARCH_INDEX || []); cb(); };
    document.head.appendChild(s);
  }
  function prep(arr) { return arr.map(function (e) { return { e: e, t: norm(e.t), c: norm(e.c || ''), x: norm(e.x) }; }); }
  function run() {
    var q = input.value.trim(); sel = -1;
    var terms = norm(q).split(/[\s,;:!?.()«»"]+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) { list.innerHTML = ''; items = []; status.textContent = T.hint; return; }
    var res = [];
    INDEX.forEach(function (r) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], inT = r.t.indexOf(t) !== -1, inC = r.c.indexOf(t) !== -1, cnt = 0, p = 0;
        while ((p = r.x.indexOf(t, p)) !== -1 && cnt < 20) { cnt++; p += t.length; }
        if (!inT && !inC && !cnt) return;
        score += (inT ? 12 : 0) + (inC ? 3 : 0) + cnt;
      }
      res.push([score, r]);
    });
    res.sort(function (a, b) { return b[0] - a[0]; });
    status.textContent = res.length ? T.count(res.length) : T.none + ' « ' + q + ' »';
    list.innerHTML = res.slice(0, 40).map(function (p) {
      var e = p[1].e;
      return '<li><a href="' + esc(e.u) + '"><span class="r-ctx">' + esc(e.c || '') + '</span><span class="r-title">' + highlight(e.t, terms) +
        '</span><span class="r-snip">' + highlight(snippet(e.x, terms), terms) + '</span></a></li>';
    }).join('');
    items = Array.prototype.slice.call(list.querySelectorAll('a'));
  }
  function open() {
    if (!box) build();
    box.hidden = false; document.documentElement.classList.add('oc-search-open');
    setTimeout(function () { input.focus(); input.select(); }, 20);
    load(function () { run(); });
  }
  function close() { if (box) { box.hidden = true; document.documentElement.classList.remove('oc-search-open'); } }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-oc-search]'); if (b) { e.preventDefault(); open(); } });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea/i.test((document.activeElement || {}).tagName || ''))) { e.preventDefault(); open(); }
    else if (e.key === 'Escape' && box && !box.hidden) close();
  });
})();
