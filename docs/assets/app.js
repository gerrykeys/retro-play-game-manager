// The guide: one page per topic (the <article data-topic> of the HTML), reached by #/<topic>.
// The sidebar, the cards of the home page, the search and the pager are built from them.
// A plain script, not a module: the guide works opened as a file too. English in index.html,
// Italian in it/index.html (<html lang> says which, data-base where the assets are). Another
// guide (the themes', doc/themes/) uses the same: its groups in window.RP_GROUPS, the page of its
// other language in data-other, its title in data-title, a card's picture in data-thumb-src.
;(function () {
  'use strict'

  const doc = document.documentElement
  const LANG = doc.lang === 'it' ? 'it' : 'en'
  const ICONS = window.RP_ICONS || {}
  const Player = window.RPPlayer

  const WORDS = {
    en: {
      title: 'Retro Play Game Manager · Guide',
      prev: '← Previous',
      next: 'Next →',
      step: 'Step',
      none: 'Nothing found. Try another word.',
      light: 'Light theme',
      dark: 'Dark theme',
      other: 'Italiano',
      otherShort: 'IT',
      otherTitle: 'Leggi la guida in italiano',
      foldAll: 'Collapse all groups',
      openAll: 'Expand all groups'
    },
    it: {
      title: 'Retro Play Game Manager · Guida',
      prev: '← Precedente',
      next: 'Successivo →',
      step: 'Passo',
      none: 'Nessun risultato. Prova con un’altra parola.',
      light: 'Tema chiaro',
      dark: 'Tema scuro',
      other: 'English',
      otherShort: 'EN',
      otherTitle: 'Read the guide in English',
      foldAll: 'Chiudi tutti i gruppi',
      openAll: 'Apri tutti i gruppi'
    }
  }[LANG]

  const GROUPS = (window.RP_GROUPS && window.RP_GROUPS[LANG]) || {
    en: [
      { id: 'inizia', title: 'Getting started', desc: 'The archive and how to fill it', color: '#8b7bff', icon: 'rocket' },
      { id: 'libreria', title: 'The library', desc: 'Browse, search and open your games', color: '#3ee0c5', icon: 'layout-grid' },
      { id: 'modifica', title: 'Editing games', desc: 'Details, media, scraping, deleting', color: '#ff9f5a', icon: 'pencil' },
      { id: 'versioni', title: 'Versions and ROM Sets', desc: 'One game in several files or MAME versions', color: '#ff6fb5', icon: 'layers' },
      { id: 'frontend', title: 'Frontends', desc: 'Connect ES-DE, MiSTer, RetroArch, RetroPie or Batocera, install and archive', color: '#4cc2ff', icon: 'plug' },
      { id: 'giocare', title: 'Playing', desc: 'Start games, Desktop Mode and saves', color: '#3ddc97', icon: 'gamepad-2' },
      { id: 'strumenti', title: 'Tools', desc: 'Exports, DATs, reports, achievements, AI', color: '#ffbf47', icon: 'wrench' },
      { id: 'riferimento', title: 'Settings and help', desc: 'Settings, keys, glossary, questions', color: '#a5abbd', icon: 'life-buoy' }
    ],
    it: [
      { id: 'inizia', title: 'Per iniziare', desc: 'L’archivio e come riempirlo', color: '#8b7bff', icon: 'rocket' },
      { id: 'libreria', title: 'La libreria', desc: 'Sfogliare, cercare e aprire i giochi', color: '#3ee0c5', icon: 'layout-grid' },
      { id: 'modifica', title: 'Modificare i giochi', desc: 'Dettagli, media, scraping, eliminazione', color: '#ff9f5a', icon: 'pencil' },
      { id: 'versioni', title: 'Versioni e ROM Set', desc: 'Lo stesso gioco in più file o versioni di MAME', color: '#ff6fb5', icon: 'layers' },
      { id: 'frontend', title: 'Frontend', desc: 'Collegare ES-DE, MiSTer, RetroArch, RetroPie o Batocera, installare, archiviare', color: '#4cc2ff', icon: 'plug' },
      { id: 'giocare', title: 'Giocare', desc: 'Avviare i giochi, Desktop Mode e salvataggi', color: '#3ddc97', icon: 'gamepad-2' },
      { id: 'strumenti', title: 'Strumenti', desc: 'Export, DAT, report, obiettivi, AI', color: '#ffbf47', icon: 'wrench' },
      { id: 'riferimento', title: 'Impostazioni e aiuto', desc: 'Impostazioni, tasti, glossario, domande', color: '#a5abbd', icon: 'life-buoy' }
    ]
  }[LANG]
  if (doc.dataset.title) WORDS.title = doc.dataset.title
  const group = (id) => GROUPS.find((g) => g.id === id) || GROUPS[0]
  // A frontend's logo has ids of its own in each copy (__U__ in icons.js)
  let copies = 0
  const icon = (n) => {
    const svg = ICONS[n] || ICONS.sparkles || ''
    return svg.includes('__U__') ? svg.replace(/__U__/g, `fe${++copies}-`) : svg
  }

  const $ = (s, r) => (r || document).querySelector(s)
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s))

  const topics = $$('article[data-topic]').map((el) => ({
    id: el.dataset.topic,
    el,
    title: el.dataset.title,
    desc: el.dataset.desc,
    group: el.dataset.group,
    icon: el.dataset.icon,
    anim: (el.querySelector('.player') || {}).dataset ? el.querySelector('.player') && el.querySelector('.player').dataset.anim : null
  }))
  const byId = new Map(topics.map((t) => [t.id, t]))

  // ---------------- topic pages: head, pager ----------------

  topics.forEach((t, i) => {
    const g = group(t.group)
    t.el.classList.add('page')
    t.el.style.setProperty('--c', g.color)
    const head = document.createElement('header')
    head.className = 'topic-head'
    head.innerHTML = `<div class="crumbs"><i></i>${g.title}</div><h1>${t.title}</h1>${t.el.dataset.lead ? `<p class="lead">${t.el.dataset.lead}</p>` : ''}`
    t.el.prepend(head)
    const prev = topics[i - 1]
    const next = topics[i + 1]
    const pager = document.createElement('nav')
    pager.className = 'pager'
    pager.innerHTML = `${prev ? `<a href="#/${prev.id}"><small>${WORDS.prev}</small><b>${prev.title}</b></a>` : '<span></span>'}${next ? `<a class="next" href="#/${next.id}"><small>${WORDS.next}</small><b>${next.title}</b></a>` : ''}`
    t.el.appendChild(pager)
    const p = t.el.querySelector('.player')
    if (p) p.dataset.label = t.title
  })

  // ---------------- sidebar: one folding group per part of the guide ----------------
  // A topic's data-nav is its shorter name there (a frontend's: only its logo and name).
  // The group of the topic shown opens by itself; the others stay as the reader left them
  // (kept in rp-nav). The button at the top folds them all, or opens them all.

  const nav = $('#nav')
  const NAV_KEY = 'rp-nav'
  let open = (() => {
    try {
      const v = JSON.parse(localStorage.getItem(NAV_KEY))
      if (Array.isArray(v)) return new Set(v)
    } catch (e) {
      /* nothing kept */
    }
    return new Set([GROUPS[0].id])
  })()
  const keepOpen = () => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify(Array.from(open)))
    } catch (e) {
      /* private window or a file: nothing kept */
    }
  }

  nav.innerHTML =
    `<div class="nav-top"><a href="#/" data-id="home">${icon('house')}<span>Home</span></a><button type="button" class="icon-btn nav-fold"></button></div>` +
    GROUPS.map((g) => {
      const items = topics.filter((t) => t.group === g.id)
      if (!items.length) return ''
      return `<section class="nav-group" data-group="${g.id}" style="--c:${g.color}">
        <button type="button" class="nav-head" aria-expanded="false" aria-controls="nav-${g.id}"><span class="gi">${icon(g.icon)}</span><span class="t">${g.title}</span><span class="n">${items.length}</span>${icon('chevron-right')}</button>
        <div class="nav-items" id="nav-${g.id}"><div><div class="nav-list">${items.map((t) => `<a href="#/${t.id}" data-id="${t.id}">${t.el.dataset.nav || t.title}</a>`).join('')}</div></div></div>
      </section>`
    }).join('')

  const navGroups = $$('.nav-group', nav)
  const foldBtn = $('.nav-fold', nav)
  function paintNav() {
    navGroups.forEach((s) => {
      const on = open.has(s.dataset.group)
      s.classList.toggle('open', on)
      s.querySelector('.nav-head').setAttribute('aria-expanded', String(on))
    })
    const any = navGroups.some((s) => open.has(s.dataset.group))
    foldBtn.innerHTML = icon(any ? 'list-chevrons-down-up' : 'list-chevrons-up-down')
    foldBtn.title = any ? WORDS.foldAll : WORDS.openAll
    foldBtn.setAttribute('aria-label', foldBtn.title)
  }
  navGroups.forEach((s) =>
    s.querySelector('.nav-head').addEventListener('click', () => {
      const id = s.dataset.group
      if (open.has(id)) open.delete(id)
      else open.add(id)
      keepOpen()
      paintNav()
    })
  )
  foldBtn.addEventListener('click', () => {
    open = navGroups.some((s) => open.has(s.dataset.group)) ? new Set() : new Set(navGroups.map((s) => s.dataset.group))
    keepOpen()
    paintNav()
  })
  paintNav()
  // No folding animation while the page is first drawn
  nav.classList.add('still')
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('still')))

  // ---------------- home: the cards of every topic ----------------

  const base = doc.dataset.base || ''
  $('#groups').innerHTML = GROUPS.map((g) => {
    const items = topics.filter((t) => t.group === g.id)
    if (!items.length) return ''
    return `<section class="group-block" style="--c:${g.color}">
      <div class="group-head"><div class="gi">${icon(g.icon)}</div><div><h3>${g.title}</h3><p>${g.desc}</p></div></div>
      <div class="cards">${items
        .map((t) => {
          const thumb = t.anim ? (t.el.querySelector('.player').dataset.thumb || '01.webp') : null
          const own = t.el.dataset.thumbSrc
          return `<a class="card" href="#/${t.id}">${
            thumb
              ? `<div class="thumb"><img loading="lazy" decoding="async" alt="" src="${base}assets/anim/${LANG}/${t.anim}/${thumb}"><span class="play">${icon('play')}</span></div>`
              : own
                ? `<div class="thumb"><img loading="lazy" decoding="async" alt="" src="${base}${own}"></div>`
                : `<div class="thumb icon">${icon(t.icon)}</div>`
          }<div class="body"><h4>${t.title}</h4><p>${t.desc}</p></div></a>`
        })
        .join('')}</div></section>`
  }).join('')

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

  // ---------------- routing ----------------

  const home = $('#home')
  const pages = [home].concat(topics.map((t) => t.el))
  let current = null

  function route() {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'home'
    const t = byId.get(id)
    const page = t ? t.el : home
    if (current === page) return
    if (current && Player) $$('.player', current).forEach((p) => Player.unmount(p))
    pages.forEach((p) => p.classList.toggle('on', p === page))
    current = page
    document.title = t ? `${t.title} · Retro Play Game Manager` : WORDS.title
    $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.id === (t ? t.id : 'home')))
    $$('.rn-btn').forEach((a) => a.classList.toggle('on', !!t && a.getAttribute('href') === `#/${t.id}`))
    navGroups.forEach((s) => s.classList.toggle('here', !!t && s.dataset.group === t.group))
    const opening = !!t && !open.has(t.group)
    if (opening) {
      open.add(t.group)
      keepOpen()
      paintNav()
    }
    const on = $('#nav a.on')
    // An opening group is still folding out: scroll to the topic once it is there
    if (on && on.scrollIntoView) setTimeout(() => on.scrollIntoView({ block: 'nearest' }), opening && !nav.classList.contains('still') ? 280 : 0)
    if (Player) {
      $$('.player', page).forEach((p) => {
        const article = p.closest('article, section')
        Player.mount(p, { steps: article ? article.querySelector('.steps') : null, caption: p.parentElement.querySelector('.player-caption') })
      })
    }
    stopDiagram()
    const d = $('.diagram[data-cycle]', page)
    if (d) startDiagram(d, page.querySelector('.steps'), d.parentElement.querySelector('.player-caption'))
    window.scrollTo(0, 0)
    document.body.classList.remove('nav-open')
    updateLangLink()
  }
  addEventListener('hashchange', route)

  // ---------------- the animated diagram: its rows lit one part at a time ----------------

  let diagramTimer = null
  function stopDiagram() {
    clearInterval(diagramTimer)
    diagramTimer = null
  }
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
      let on = null
      for (const li of items) if (Number(li.dataset.at) <= i) on = li
      items.forEach((li) => li.classList.toggle('on', li === on))
      if (caption) caption.innerHTML = on ? `<b>${WORDS.step} ${items.indexOf(on) + 1}.</b> ${on.dataset.short || ''}` : ''
    }
    const tick = () => {
      i = i >= last ? 0 : i + 1
      show()
    }
    items.forEach((li) => {
      if (li.__diagram) return
      li.__diagram = true
      li.addEventListener('click', () => {
        i = Number(li.dataset.at)
        show()
        stopDiagram()
        diagramTimer = setInterval(tick, 2600)
      })
    })
    show()
    diagramTimer = setInterval(tick, 2600)
  }

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

  // ---------------- the other language, on the same topic ----------------

  const langLink = $('#lang')
  function updateLangLink() {
    const other = doc.dataset.other || (LANG === 'en' ? 'it/index.html' : '../index.html')
    langLink.href = other + location.hash
    langLink.title = WORDS.otherTitle
    langLink.innerHTML = `${icon('languages')}<span>${WORDS.otherShort}</span>`
  }
  langLink.addEventListener('click', () => {
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

  const palette = $('#palette')
  const input = $('#palette input')
  const results = $('#palette .results')
  // The words of a topic, with a space between its blocks (textContent runs a heading into
  // the paragraph after it)
  const words = (el) => {
    const c = el.cloneNode(true)
    c.querySelectorAll('p, li, h2, h3, div, summary, td, th, em').forEach((b) => {
      b.prepend(' ')
      b.append(' ')
    })
    return c.textContent
  }
  // Made at the first search
  let made = null
  const index = () => made || (made = topics.map((t) => ({ t, text: `${t.title} ${t.desc} ${words(t.el)}`.replace(/\s+/g, ' ').trim() })))
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let sel = 0

  function openSearch() {
    palette.classList.add('on')
    input.value = ''
    search()
    setTimeout(() => input.focus(), 10)
  }
  function closeSearch() {
    palette.classList.remove('on')
  }
  function search() {
    const q = fold(input.value.trim())
    let found
    if (!q) found = topics.map((t) => ({ t, snip: t.desc }))
    else {
      const words = q.split(/\s+/)
      found = index()
        .map(({ t, text }) => {
          const f = fold(text)
          if (!words.every((w) => f.includes(w))) return null
          const title = fold(t.title)
          const stem = (w) => w.slice(0, Math.max(4, w.length - 2))
          const hits = words.reduce((n, w) => n + f.split(w).length - 1, 0)
          const score = (title.includes(q) ? 0 : words.every((w) => title.includes(stem(w))) ? 3 : 10) + (fold(t.desc).includes(words[0]) ? 0 : 2) - Math.min(hits, 12) * 0.4
          const at = f.indexOf(words[0])
          const start = Math.max(0, at - 50)
          let snip = (start ? '…' : '') + text.slice(start, start + 150) + '…'
          for (const w of words) snip = snip.replace(new RegExp(`(${escapeRe(w)})`, 'ig'), '<mark>$1</mark>')
          return { t, snip, score }
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score)
    }
    sel = 0
    results.innerHTML = found.length
      ? found
          .slice(0, 40)
          .map(({ t, snip }, i) => `<a href="#/${t.id}" class="${i === 0 ? 'sel' : ''}" style="--c:${group(t.group).color}"><i></i><span><b>${t.title}</b><small>${snip}</small></span></a>`)
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
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch))
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

  // ---------------- icons written in the page ----------------

  $$('[data-icon-svg]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.iconSvg)))

  // The latest version, wherever the page names it: the first of the release notes
  const latest = $('[data-topic="note-di-rilascio"] .rel-head h2')
  if (latest) $$('[data-latest]').forEach((el) => (el.textContent = latest.textContent.trim()))

  route()
})()
