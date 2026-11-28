// The guide: a page for each topic, written by doc/tools/build-site.mjs from doc/tools/pages/ with
// the sidebar, the home's cards and the pager already in it. This script adds what moves: the
// folding sidebar, the animations, the search, the theme, the frontends' logos.
// A plain script, not a module: the guide works opened as a file too, where a link to a folder
// goes to its index.html. English or Italian by <html lang>; data-base is the way to the site's
// root; the palette's data-index the script with the words of every topic (window.RP_SEARCH).
;(function () {
  'use strict'

  const doc = document.documentElement
  const LANG = doc.lang === 'it' ? 'it' : 'en'
  const ICONS = window.RP_ICONS || {}
  const Player = window.RPPlayer
  const BASE = doc.dataset.base || ''
  const FILE = location.protocol === 'file:'

  const WORDS = {
    en: {
      step: 'Step',
      none: 'Nothing found. Try another word.',
      light: 'Light theme',
      dark: 'Dark theme',
      foldAll: 'Collapse all groups',
      openAll: 'Expand all groups',
      copied: 'Copied'
    },
    it: {
      step: 'Passo',
      none: 'Nessun risultato. Prova con un’altra parola.',
      light: 'Tema chiaro',
      dark: 'Tema scuro',
      foldAll: 'Chiudi tutti i gruppi',
      openAll: 'Apri tutti i gruppi',
      copied: 'Copiata'
    }
  }[LANG]

  // A frontend's logo has ids of its own in each copy (__U__ in icons.js)
  let copies = 0
  const icon = (n) => {
    const svg = ICONS[n] || ICONS.sparkles || ''
    return svg.includes('__U__') ? svg.replace(/__U__/g, `fe${++copies}-`) : svg
  }

  const $ = (s, r) => (r || document).querySelector(s)
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s))

  // ---------------- opened as a file: a link to a folder goes to its index.html ----------------

  const fileHref = (h) => {
    if (!FILE || /^[a-z][a-z0-9+.-]*:/i.test(h) || h.startsWith('#')) return h
    const at = h.search(/[?#]/)
    const p = at < 0 ? h : h.slice(0, at)
    return p.endsWith('/') ? p + 'index.html' + (at < 0 ? '' : h.slice(at)) : h
  }
  const fixLinks = (root) => FILE && $$('a[href]', root).forEach((a) => a.setAttribute('href', fileHref(a.getAttribute('href'))))
  fixLinks(document)

  // An old address of a topic (#/<id>) typed or followed on a page already open: the page's first
  // script takes it to the topic's own page when it runs again
  addEventListener('hashchange', () => location.hash.startsWith('#/') && location.reload())

  // ---------------- icons written in the page ----------------

  $$('[data-icon-svg]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.iconSvg)))

  // ---------------- sidebar: one folding group per part of the guide ----------------
  // The group of the page shown opens by itself; the others stay as the reader left them (kept
  // in rp-nav, which the page reads before it is drawn, as where the sidebar was scrolled to).
  // The button at the top folds them all, or opens them all.

  const nav = $('#nav')
  const sidebar = $('.sidebar')
  const NAV_KEY = 'rp-nav'
  // The groups, and the subgroups folding inside them (kept as sub:<id>)
  const navGroups = $$('.nav-group, .nav-sub', nav)
  const keyOf = (s) => s.dataset.group || 'sub:' + s.dataset.sub
  const headOf = (s) => s.querySelector('.nav-head, .nav-subhead')
  const foldBtn = $('.nav-fold', nav)
  navGroups.forEach((s) => headOf(s).insertAdjacentHTML('beforeend', icon('chevron-right')))
  let open = new Set(navGroups.filter((s) => s.classList.contains('open')).map(keyOf))
  const keepOpen = () => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify(Array.from(open)))
    } catch (e) {
      /* private window or a file: nothing kept */
    }
  }
  function paintNav() {
    navGroups.forEach((s) => {
      const on = open.has(keyOf(s))
      s.classList.toggle('open', on)
      headOf(s).setAttribute('aria-expanded', String(on))
    })
    const any = navGroups.some((s) => open.has(keyOf(s)))
    foldBtn.innerHTML = icon(any ? 'list-chevrons-down-up' : 'list-chevrons-up-down')
    foldBtn.title = any ? WORDS.foldAll : WORDS.openAll
    foldBtn.setAttribute('aria-label', foldBtn.title)
  }
  navGroups.forEach((s) =>
    headOf(s).addEventListener('click', () => {
      const id = keyOf(s)
      if (open.has(id)) open.delete(id)
      else open.add(id)
      keepOpen()
      paintNav()
    })
  )
  foldBtn.addEventListener('click', () => {
    open = navGroups.some((s) => open.has(keyOf(s))) ? new Set() : new Set(navGroups.map(keyOf))
    keepOpen()
    paintNav()
  })
  if ($('.nav-group.here, .nav-sub.here', nav)) keepOpen()
  paintNav()
  // The topic shown in sight, and no folding animation while the page is first drawn
  const on = $('a.on', nav)
  if (on && sidebar) {
    const a = on.getBoundingClientRect()
    const b = sidebar.getBoundingClientRect()
    if (a.top < b.top || a.bottom > b.bottom) on.scrollIntoView({ block: 'nearest' })
  }
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('still')))
  addEventListener('pagehide', () => {
    try {
      if (sidebar) sessionStorage.setItem('rp-nav-y', String(sidebar.scrollTop))
    } catch (e) {
      /* nothing kept */
    }
  })

  // ---------------- the MCP tools' questions: a click copies one ----------------

  const copied = (b) => {
    b.dataset.done = WORDS.copied
    b.classList.add('is-copied')
    clearTimeout(b.copiedTimer)
    b.copiedTimer = setTimeout(() => b.classList.remove('is-copied'), 1800)
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-copy]')
    if (!b) return
    const text = b.dataset.copy
    // Without the clipboard of the page (an old browser, some file:// pages), a hidden field
    const field = () => {
      const t = document.createElement('textarea')
      t.value = text
      t.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(t)
      t.select()
      try {
        if (document.execCommand('copy')) copied(b)
      } catch (x) {
        /* nothing copied */
      }
      t.remove()
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => copied(b), field)
    else field()
  })

  // ---------------- the frontends' logos, before their names ----------------
  // Where the text names a frontend, its logo (the app's own) comes before the name: once in
  // each list of steps, box, question, paragraph, title or link, never in code, keys or the
  // animations.

  const FE_NAME = /\b(ES-DE|MiSTer(?: FPGA)?|RetroArch|RetroPie|Batocera)\b/g
  const FE_KIND = { 'ES-DE': 'esde', MiSTer: 'mister', RetroArch: 'retroarch', RetroPie: 'retropie', Batocera: 'batocera' }
  const FE_SKIP = 'code, kbd, pre, script, style, svg, textarea, mark, .player, .player-caption, .fe-name'
  const FE_GROUP = '.steps, .box, details'
  const FE_BLOCK = 'p, li, summary, h1, h2, h3, h4, h5, dt, dd, td, th, figcaption, .row'
  function frontendLogos(root) {
    const found = []
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    while (walk.nextNode()) {
      const n = walk.currentNode
      if (n.nodeValue.match(FE_NAME) && !n.parentElement.closest(FE_SKIP)) found.push(n)
    }
    for (const n of found) {
      const el = n.parentElement
      const block = el.closest(FE_GROUP) || el.closest(FE_BLOCK) || el
      const had = new Set($$('.fe-name', block).map((s) => s.dataset.fe))
      const text = n.nodeValue
      const out = document.createDocumentFragment()
      let at = 0
      for (const m of text.matchAll(FE_NAME)) {
        const kind = FE_KIND[m[1].split(' ')[0]]
        if (had.has(kind)) continue
        had.add(kind)
        out.append(text.slice(at, m.index))
        const name = document.createElement('span')
        name.className = 'fe-name'
        name.dataset.fe = kind
        name.innerHTML = icon(`fe-${kind}`)
        name.append(m[1])
        out.append(name)
        at = m.index + m[1].length
      }
      if (!at) continue
      out.append(text.slice(at))
      n.replaceWith(out)
    }
  }
  frontendLogos(nav)
  frontendLogos($('.main'))

  // ---------------- the page: its animations, its diagram ----------------

  const page = $('.page.on') || $('.main')
  if (Player) {
    $$('.player', page).forEach((p) => {
      const article = p.closest('article, section')
      Player.mount(p, { steps: article ? article.querySelector('.steps') : null, caption: p.parentElement.querySelector('.player-caption') })
    })
  }

  // The animated diagram: its rows lit one part at a time
  let diagramTimer = null
  function startDiagram(d, steps, caption) {
    const rows = $$('.row', d)
    const last = Math.max.apply(null, rows.map((r) => Number(r.dataset.row)))
    const items = steps ? $$('li[data-at]', steps) : []
    let i = 0
    const show = () => {
      rows.forEach((r) => {
        const n = Number(r.dataset.row)
        r.classList.toggle('on', n === i)
        r.classList.toggle('seen', n < i)
      })
      let lit = null
      for (const li of items) if (Number(li.dataset.at) <= i) lit = li
      items.forEach((li) => li.classList.toggle('on', li === lit))
      if (caption) caption.innerHTML = lit ? `<b>${WORDS.step} ${items.indexOf(lit) + 1}.</b> ${lit.dataset.short || ''}` : ''
    }
    const tick = () => {
      i = i >= last ? 0 : i + 1
      show()
    }
    items.forEach((li) =>
      li.addEventListener('click', () => {
        i = Number(li.dataset.at)
        show()
        clearInterval(diagramTimer)
        diagramTimer = setInterval(tick, 2600)
      })
    )
    show()
    diagramTimer = setInterval(tick, 2600)
  }
  const diagram = $('.diagram[data-cycle]', page)
  if (diagram) startDiagram(diagram, page.querySelector('.steps'), diagram.parentElement.querySelector('.player-caption'))

  // ---------------- theme ----------------

  const themeBtn = $('#theme')
  const isDark = () => {
    const set = doc.dataset.theme
    return set ? set === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  }
  function paintTheme() {
    themeBtn.innerHTML = isDark() ? icon('sun') : icon('moon')
    themeBtn.title = isDark() ? WORDS.light : WORDS.dark
  }
  themeBtn.addEventListener('click', () => {
    doc.dataset.theme = isDark() ? 'light' : 'dark'
    try {
      localStorage.setItem('rp-theme', doc.dataset.theme)
    } catch (e) {
      /* private window or a file: nothing kept */
    }
    paintTheme()
  })
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme)
  paintTheme()

  // ---------------- the other language: the reader's choice is kept ----------------

  $('#lang').addEventListener('click', () => {
    try {
      localStorage.setItem('rp-lang', LANG === 'en' ? 'it' : 'en')
    } catch (e) {
      /* nothing kept */
    }
  })

  // ---------------- mobile menu ----------------

  $('#menu').addEventListener('click', () => document.body.classList.toggle('nav-open'))
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar, #menu')) document.body.classList.remove('nav-open')
  })

  // ---------------- search ----------------
  // The words of every topic come with the first search (the palette's data-index)

  const palette = $('#palette')
  const input = $('#palette input')
  const results = $('#palette .results')
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let index = null
  let asked = false
  function loadIndex() {
    if (index || asked) return
    asked = true
    const ready = () => {
      index = (window.RP_SEARCH || []).map((t) => {
        const text = `${t.t} ${t.d} ${t.x}`.replace(/\s+/g, ' ').trim()
        return { t, text, f: fold(text), title: fold(t.t), desc: fold(t.d) }
      })
      if (palette.classList.contains('on')) search()
    }
    if (window.RP_SEARCH) return ready()
    const s = document.createElement('script')
    s.src = palette.dataset.index
    s.onload = ready
    s.onerror = () => (asked = false)
    document.head.appendChild(s)
  }
  let sel = 0

  function openSearch() {
    loadIndex()
    palette.classList.add('on')
    input.value = ''
    search()
    setTimeout(() => input.focus(), 10)
  }
  function closeSearch() {
    palette.classList.remove('on')
  }
  function search() {
    if (!index) {
      results.innerHTML = ''
      return
    }
    const q = fold(input.value.trim())
    let found
    if (!q) found = index.map((e) => ({ e, snip: escHtml(e.t.d) }))
    else {
      const words = q.split(/\s+/)
      found = index
        .map((e) => {
          const { f, title, text } = e
          if (!words.every((w) => f.includes(w))) return null
          const stem = (w) => w.slice(0, Math.max(4, w.length - 2))
          const hits = words.reduce((n, w) => n + f.split(w).length - 1, 0)
          const score = (title.includes(q) ? 0 : words.every((w) => title.includes(stem(w))) ? 3 : 10) + (e.desc.includes(words[0]) ? 0 : 2) - Math.min(hits, 12) * 0.4
          const at = f.indexOf(words[0])
          const start = Math.max(0, at - 50)
          let snip = escHtml((start ? '…' : '') + text.slice(start, start + 150) + '…')
          for (const w of words) snip = snip.replace(new RegExp(`(${escapeRe(w)})`, 'ig'), '<mark>$1</mark>')
          return { e, snip, score }
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score)
    }
    sel = 0
    results.innerHTML = found.length
      ? found
          .slice(0, 40)
          .map(({ e, snip }, i) => `<a href="${fileHref(BASE + e.t.p)}" class="${i === 0 ? 'sel' : ''}" style="--c:${e.t.c}"><i></i><span><b>${escHtml(e.t.t)}</b><small>${snip}</small></span></a>`)
          .join('')
      : `<div class="empty">${WORDS.none}</div>`
    $$('b', results).forEach(frontendLogos)
  }
  input.addEventListener('input', search)
  input.addEventListener('keydown', (e) => {
    const items = $$('a', results)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items.forEach((a, i) => a.classList.toggle('sel', i === sel))
      if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter' && items[sel]) {
      items[sel].click()
    }
  })
  results.addEventListener('click', (e) => e.target.closest('a') && closeSearch())
  palette.addEventListener('click', (e) => e.target === palette && closeSearch())
  $('#search').addEventListener('click', openSearch)
  // Its words on their way as soon as the reader goes for the search
  $('#search').addEventListener('pointerenter', loadIndex)
  $$('[data-open-search]').forEach((b) => {
    b.addEventListener('click', openSearch)
    b.addEventListener('pointerenter', loadIndex)
  })
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      palette.classList.contains('on') ? closeSearch() : openSearch()
    } else if (e.key === '/' && !palette.classList.contains('on') && !/input|textarea/i.test((document.activeElement || {}).tagName || '')) {
      e.preventDefault()
      openSearch()
    } else if (e.key === 'Escape') {
      closeSearch()
      document.body.classList.remove('nav-open')
    }
  })
})()
