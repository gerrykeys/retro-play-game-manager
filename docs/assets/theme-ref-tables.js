// The tables of the themes guide (doc/themes/): the parts of Desktop Mode and the keys of its words,
// drawn from window.RP_THEME_REF (theme-ref.js, made from the app), each with a filter. A plain
// script, as the rest of the guide.
;(function () {
  'use strict'
  const ref = window.RP_THEME_REF
  if (!ref) return
  const IT = document.documentElement.lang === 'it'
  const AREAS = IT
    ? { all: 'Ovunque', elements: 'Gli elementi delle scene', lists: 'Le liste', bar: 'Il frame: barra e tasti', card: 'Card, lastre e immagini', home: 'L’aspetto dell’app: Home', systems: 'L’aspetto dell’app: Sistemi', games: 'L’aspetto dell’app: griglie', search: 'L’aspetto dell’app: Cerca', game: 'L’aspetto dell’app: un gioco', overlay: 'Sopra a tutto', scripts: 'Le pagine del tema' }
    : { all: 'Everywhere', elements: 'The elements of scenes', lists: 'Lists', bar: 'The frame: bar and hints', card: 'Cards, plates and pictures', home: 'The app’s look: Home', systems: 'The app’s look: Systems', games: 'The app’s look: grids', search: 'The app’s look: Search', game: 'The app’s look: a game', overlay: 'Over everything', scripts: 'The theme’s pages' }
  const H = IT ? { part: 'Parte', what: 'Cos’è', key: 'Chiave', text: 'Testo dell’app' } : { part: 'Part', what: 'What it is', key: 'Key', text: 'The app’s words' }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  function parts(box, filter) {
    const f = filter.toLowerCase()
    const html = Object.keys(AREAS)
      .map((area) => {
        const rows = ref.parts.filter((p) => p.area === area && (!f || p.name.includes(f) || (IT ? p.it : p.what).toLowerCase().includes(f)))
        if (!rows.length) return ''
        return `<h3>${AREAS[area]}</h3><table class="table wrap"><tr><th>${H.part}</th><th>${H.what}</th></tr>${rows
          .map((p) => `<tr><td><code>.${esc(p.name)}</code></td><td>${esc(IT ? p.it : p.what)}</td></tr>`)
          .join('')}</table>`
      })
      .join('')
    box.innerHTML = html || '<p>—</p>'
  }

  function texts(box, filter) {
    const f = filter.toLowerCase()
    const rows = ref.texts.filter((t) => !f || t.key.toLowerCase().includes(f) || (IT ? t.it : t.en).toLowerCase().includes(f))
    box.innerHTML = `<table class="table wrap"><tr><th>${H.key}</th><th>${H.text}</th></tr>${rows
      .map((t) => `<tr><td><code>${esc(t.key)}</code></td><td>${esc(IT ? t.it : t.en)}</td></tr>`)
      .join('')}</table>`
  }

  const DRAW = { parts, texts }
  document.querySelectorAll('[data-ref]').forEach((box) => {
    const kind = box.dataset.ref
    const draw = DRAW[kind]
    if (!draw) return
    draw(box, '')
    const input = document.querySelector(`[data-ref-filter="${kind}"]`)
    if (input) input.addEventListener('input', () => draw(box, input.value.trim()))
  })
})()
