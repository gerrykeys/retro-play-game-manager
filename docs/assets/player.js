// The animations of the guide: frames recorded from the app, a pointer that moves and clicks
// over them, the keys pressed, and the steps of the page lit as they happen.
// <div class="player" data-anim="aggiungere"></div> plays window.RP_ANIMS.aggiungere (from
// assets/anim/<lang>.js), whose frames are in assets/anim/<lang>/<id>/.
// A plain script, not a module: the guide works opened as a file too.
;(function () {
  'use strict'

  const doc = document.documentElement
  const LANG = doc.lang === 'it' ? 'it' : 'en'
  const BASE = doc.dataset.base || ''
  const WORDS = {
    en: { pause: 'Pause', play: 'Play', restart: 'Start again', expand: 'Enlarge', close: 'Close', step: 'Step', right: 'Right click', anim: 'Animation' },
    it: { pause: 'Pausa', play: 'Riproduci', restart: 'Ricomincia', expand: 'Ingrandisci', close: 'Chiudi', step: 'Passo', right: 'Clic destro', anim: 'Animazione' }
  }[LANG]

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    cursor:
      '<svg viewBox="0 0 24 30"><path d="M2 1.8v22.6c0 .9 1.1 1.3 1.7.7l5.2-5.3 3.4 8a1 1 0 0 0 1.3.5l3-1.3a1 1 0 0 0 .5-1.3l-3.4-7.9h7.4c.9 0 1.3-1.1.7-1.7L3.7 1.1C3.1.5 2 .9 2 1.8z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  }

  const MOVE_MS = 750
  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms)
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(t)
          reject(new DOMException('stop', 'AbortError'))
        })
      }
    })
  // A frame ready to show: on a slow connection the next one may still be on its way (a
  // frame that failed doesn't hold the animation up)
  const loaded = (img, signal) =>
    img.complete
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', resolve, { once: true })
          if (signal) signal.addEventListener('abort', () => reject(new DOMException('stop', 'AbortError')))
        })

  class Player {
    constructor(root, opts) {
      opts = opts || {}
      this.root = root
      this.id = root.dataset.anim
      this.stepsList = opts.steps || null
      this.captionEl = opts.caption || null
      this.big = !!opts.big
      this.index = 0
      this.playing = false
      this.run = null
      this.anim = (window.RP_ANIMS || {})[this.id] || null
      this.build()
    }

    build() {
      const r = this.root
      r.innerHTML = `
        <div class="screen" role="img" aria-label="${WORDS.anim}: ${r.dataset.label || ''}">
          <div class="zoomer"><div class="loading"></div></div>
          <div class="cursor">${ICONS.cursor}</div>
          <div class="ripple"></div>
          <div class="tag"></div>
          <div class="keys"></div>
        </div>
        <div class="bar">
          <button class="pp" title="${WORDS.pause}" aria-label="${WORDS.pause}">${ICONS.pause}</button>
          <div class="segs"></div>
          <span class="count"></span>
          <button class="rs" title="${WORDS.restart}" aria-label="${WORDS.restart}">${ICONS.restart}</button>
          ${this.big ? '' : `<button class="ex" title="${WORDS.expand}" aria-label="${WORDS.expand}">${ICONS.expand}</button>`}
        </div>`
      this.screen = r.querySelector('.screen')
      this.zoomer = r.querySelector('.zoomer')
      this.cursor = r.querySelector('.cursor')
      this.ripple = r.querySelector('.ripple')
      this.tag = r.querySelector('.tag')
      this.keys = r.querySelector('.keys')
      this.segs = r.querySelector('.segs')
      this.count = r.querySelector('.count')
      this.pp = r.querySelector('.pp')
      const toggle = () => {
        this.userPaused = this.playing
        this.playing ? this.pause() : this.play()
      }
      this.pp.addEventListener('click', toggle)
      this.screen.addEventListener('click', toggle)
      r.querySelector('.rs').addEventListener('click', () => this.goto(0, true))
      const ex = r.querySelector('.ex')
      if (ex) ex.addEventListener('click', () => openBig(this.id, r.dataset.label))
    }

    ensure() {
      if (this.frames) return true
      if (!this.anim) return false
      const base = `${BASE}assets/anim/${LANG}/${this.id}/`
      this.frames = this.anim.steps.map((s, i) => {
        const img = new Image()
        img.className = 'frame'
        img.alt = ''
        img.decoding = 'async'
        img.src = base + s.img
        if (i === 0) {
          img.addEventListener(
            'load',
            () => {
              const l = this.zoomer.querySelector('.loading')
              if (l) l.remove()
            },
            { once: true }
          )
        }
        this.zoomer.appendChild(img)
        return img
      })
      this.segs.innerHTML = this.anim.steps.map((_, i) => `<button title="${WORDS.step} ${i + 1}" aria-label="${WORDS.step} ${i + 1}"><i></i></button>`).join('')
      Array.from(this.segs.children).forEach((b, i) => b.addEventListener('click', () => this.goto(i, true)))
      if (this.stepsList) this.stepsList.querySelectorAll('li[data-at]').forEach((li) => li.addEventListener('click', () => this.goto(Number(li.dataset.at), true)))
      this.show(0, true)
      return true
    }

    show(i, instant) {
      this.index = i
      this.frames.forEach((f, k) => f.classList.toggle('on', k === i))
      Array.from(this.segs.children).forEach((b, k) => {
        const bar = b.querySelector('i')
        bar.style.transition = 'none'
        bar.style.width = k < i ? '100%' : '0'
      })
      this.count.textContent = `${i + 1} / ${this.frames.length}`
      const s = this.anim.steps[i]
      if (instant) this.place(s.cursor || null, true)
      this.lightStep(i)
    }

    lightStep(i) {
      if (!this.stepsList) return
      const items = Array.from(this.stepsList.querySelectorAll('li[data-at]'))
      let on = null
      for (const li of items) if (Number(li.dataset.at) <= i) on = li
      items.forEach((li) => li.classList.toggle('on', li === on))
      if (this.captionEl) this.captionEl.innerHTML = on ? `<b>${WORDS.step} ${items.indexOf(on) + 1}.</b> ${on.dataset.short || ''}` : ''
    }

    // The pointer at x%, y% of the screen
    place(p, instant) {
      if (!p) {
        this.cursor.style.opacity = '0'
        return
      }
      this.cursor.style.opacity = '1'
      if (instant) this.cursor.style.transition = 'none'
      const w = this.screen.clientWidth
      const h = this.screen.clientHeight
      this.cursor.style.transform = `translate(${(p.x / 100) * w - 2}px, ${(p.y / 100) * h - 1}px)`
      if (instant) {
        void this.cursor.offsetWidth
        this.cursor.style.transition = ''
      }
    }

    play() {
      if (!this.ensure() || this.playing) return
      this.playing = true
      this.pp.innerHTML = ICONS.pause
      this.pp.title = WORDS.pause
      this.loop()
    }

    pause() {
      this.playing = false
      if (this.run) this.run.abort()
      this.run = null
      this.pp.innerHTML = ICONS.play
      this.pp.title = WORDS.play
    }

    goto(i, andPlay) {
      if (!this.ensure()) return
      if (this.run) this.run.abort()
      this.run = null
      this.playing = false
      this.userPaused = false
      this.show(i, true)
      if (andPlay) this.play()
    }

    async loop() {
      const ctl = new AbortController()
      this.run = ctl
      try {
        for (;;) {
          await this.stepAt(this.index, ctl.signal)
          const next = (this.index + 1) % this.frames.length
          if (next === 0) await sleep(900, ctl.signal)
          await loaded(this.frames[next], ctl.signal)
          this.show(next)
        }
      } catch (e) {
        if (e.name !== 'AbortError') throw e
      }
    }

    async stepAt(i, signal) {
      const s = this.anim.steps[i]
      const seg = this.segs.children[i] && this.segs.children[i].querySelector('i')
      const total = Math.max(s.hold || 1400, s.cursor ? MOVE_MS + 700 : 900, s.key ? 1300 : 0)
      if (seg) {
        seg.style.transition = 'none'
        seg.style.width = '0'
        void seg.offsetWidth
        seg.style.transition = `width ${total}ms linear`
        seg.style.width = '100%'
      }
      const started = performance.now()
      this.tag.classList.remove('on')
      this.keys.classList.remove('on')
      if (s.key) {
        this.keys.innerHTML = s.key
          .split(' ')
          .map((k) => `<kbd>${k}</kbd>`)
          .join('<span class="plus">+</span>')
        this.keys.classList.add('on')
        if (!s.cursor) this.cursor.style.opacity = '0'
        await sleep(450, signal)
        this.keys.querySelectorAll('kbd').forEach((k) => k.classList.add('press'))
      }
      if (s.cursor) {
        this.place(s.cursor)
        if (s.label && s.action !== 'drag') this.showTag(s.label, s.cursor, false)
        await sleep(MOVE_MS + 80, signal)
        if (s.action === 'click' || s.action === 'right') {
          await this.click(s.cursor, s.action === 'right', signal)
          if (s.action === 'right' && !s.label) this.showTag(WORDS.right, s.cursor, false)
        } else if (s.action === 'drag' && s.to) {
          this.cursor.classList.add('down')
          if (s.label) this.showTag(s.label, s.cursor, true)
          await sleep(200, signal)
          const ms = MOVE_MS + 300
          this.tag.style.transition = `left ${ms}ms cubic-bezier(0.45, 0, 0.2, 1), top ${ms}ms cubic-bezier(0.45, 0, 0.2, 1), opacity .25s`
          this.cursor.style.transitionDuration = `${ms}ms`
          this.place(s.to)
          this.positionTag(s.to)
          await sleep(ms + 80, signal)
          this.cursor.classList.remove('down')
          this.cursor.style.transitionDuration = ''
          this.tag.style.transition = ''
          this.tag.classList.remove('on')
          this.burst(s.to, false)
        }
      }
      const left = total - (performance.now() - started)
      if (left > 0) await sleep(left, signal)
    }

    showTag(text, p, file) {
      this.tag.textContent = text
      this.tag.classList.toggle('file', !!file)
      this.positionTag(p)
      this.tag.classList.add('on')
    }

    positionTag(p) {
      this.tag.style.left = `${p.x}%`
      this.tag.style.top = `${p.y}%`
      this.tag.style.translate = p.x > 75 ? '-110% 0' : '0 0'
    }

    async click(p, right, signal) {
      this.cursor.classList.add('down')
      this.burst(p, right)
      await sleep(160, signal)
      this.cursor.classList.remove('down')
      await sleep(240, signal)
    }

    burst(p, right) {
      const r = this.ripple
      r.classList.remove('go')
      r.classList.toggle('right', !!right)
      r.style.left = `${p.x}%`
      r.style.top = `${p.y}%`
      void r.offsetWidth
      r.classList.add('go')
    }
  }

  // The animation blown up over the page
  function openBig(id, label) {
    const m = document.createElement('div')
    m.className = 'player-modal'
    m.innerHTML = `<button class="icon-btn close" aria-label="${WORDS.close}">${ICONS.close}</button><div class="player" data-anim="${id}" data-label="${label || ''}"></div>`
    document.body.appendChild(m)
    const p = new Player(m.querySelector('.player'), { big: true })
    p.play()
    const close = () => {
      p.pause()
      m.remove()
      removeEventListener('keydown', onKey)
    }
    const onKey = (e) => e.key === 'Escape' && close()
    addEventListener('keydown', onKey)
    m.addEventListener('click', (e) => e.target === m && close())
    m.querySelector('.close').addEventListener('click', close)
  }

  // Players start when they come into sight and stop when they leave it
  const seen =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const p = e.target.__player
              if (!p) continue
              if (e.isIntersecting && e.intersectionRatio > 0.3) {
                if (!p.userPaused) p.play()
              } else if (p.playing) p.pause()
            }
          },
          { threshold: [0, 0.3, 0.6] }
        )
      : null

  function mount(root, opts) {
    if (root.__player) return root.__player
    const p = new Player(root, opts)
    root.__player = p
    if (seen) seen.observe(root)
    else p.play()
    // the pointer stays where it is on the frame when the page changes size
    addEventListener('resize', () => {
      if (p.frames) p.place(p.anim.steps[p.index].to || p.anim.steps[p.index].cursor || null, true)
    })
    return p
  }
  function unmount(root) {
    const p = root.__player
    if (!p) return
    p.pause()
    if (seen) seen.unobserve(root)
  }

  window.RPPlayer = { mount, unmount, openBig }
})()
