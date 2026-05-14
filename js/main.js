// Design 2 — Editorial Bold — Main JS

let content = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  renderAll();
  setupNav();
});

async function loadContent() {
  try {
    const r = await fetch('./data/content.json?t=' + Date.now());
    content = await r.json();
  } catch (e) {
    console.error('Failed to load content.json:', e);
  }
}

function renderAll() {
  renderBrand();
  renderHero();
  renderLive();
  renderAbout();
  renderClergy();
  renderMinistries();
  renderSchedule();
  renderSermons();
  renderEvents();
  renderGallery();
  renderFooter();
}

// ── BRAND BAR ─────────────────────────────────────────────────────────────────
function renderBrand() {
  const el = document.getElementById('topbar');
  if (!el) return;
  const ch = content.church || {};
  el.innerHTML = `
    <div class="brand-name">${esc(ch.name || 'Saint Mary Coptic Orthodox Church')}</div>
    <div class="brand-tagline">Coptic Orthodox · Est. 1985</div>
  `;
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function renderHero() {
  const ch = content.church || {};
  const nameEl = document.getElementById('heroName');
  const tagEl  = document.getElementById('heroTagline');
  if (nameEl) nameEl.textContent = ch.name ? ch.name.replace('Saint Mary Coptic Orthodox Church', 'Saint Mary') : 'Saint Mary';
  if (tagEl)  tagEl.textContent  = ch.tagline || 'Living the Orthodox Faith';
}

// ── LIVE ──────────────────────────────────────────────────────────────────────
function renderLive() {
  const el = document.getElementById('live');
  if (!el) return;
  const live = content.live || {};

  // Always embed the player when a YouTube ID is set — YouTube itself shows LIVE
  // when streaming and the recorded video otherwise. No manual toggle needed.
  if (live.youtubeId) {
    el.innerHTML = `
      <div class="live-inner">
        <span class="eyebrow">Live Worship</span>
        <h2>${esc(live.title || 'Sunday Liturgy')}</h2>
        <div class="live-frame">
          <iframe src="https://www.youtube.com/embed/${esc(live.youtubeId)}?rel=0"
            allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
        <p class="live-next" style="margin-top:1rem">
          Regular stream: <strong style="color:var(--gold-light)">${esc(live.nextStream || 'Sunday, 10:00 AM')}</strong>
        </p>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="live-inner">
        <span class="eyebrow">Live Worship</span>
        <h2>${esc(live.title || 'Sunday Liturgy')}</h2>
        <p class="live-next">Next Stream: <strong style="color:var(--gold-light)">${esc(live.nextStream || 'Sunday, 10:00 AM')}</strong></p>
        <p style="color:rgba(255,255,255,0.5); font-size:0.88rem;">No stream link configured yet. Add a YouTube URL in the admin panel.</p>
      </div>
    `;
  }
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function renderAbout() {
  const el = document.getElementById('about');
  if (!el) return;
  const ab = content.about || {};
  el.innerHTML = `
    <div class="about-inner">
      <span class="eyebrow">Our Parish</span>
      <h2 class="section-title">${esc(ab.title || 'About Our Church')}</h2>
      <hr class="gold-rule">
      <div class="about-grid">
        <div class="about-main">
          <p>${esc(ab.description || '')}</p>
        </div>
        <div class="about-panels">
          <div class="about-panel">
            <h4>Our Vision</h4>
            <p>${esc(ab.vision || '')}</p>
          </div>
          <div class="about-panel">
            <h4>Our Mission</h4>
            <p>${esc(ab.mission || '')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── CLERGY ────────────────────────────────────────────────────────────────────
function renderClergy() {
  const el = document.getElementById('clergy');
  if (!el) return;
  const clergy = content.clergy || [];

  const items = clergy.map(p => {
    const photoHtml = p.image
      ? `<img class="clergy-photo" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.parentElement.innerHTML='<div class=\\'clergy-photo-placeholder\\'>✝</div>'">`
      : `<div class="clergy-photo-placeholder">✝</div>`;
    return `
      <div class="clergy-item">
        <div class="clergy-photo-wrap">${photoHtml}</div>
        <div class="clergy-info">
          <div class="clergy-title-tag">${esc(p.title || '')}</div>
          <h3 class="clergy-name">${esc(p.name || '')}</h3>
          <p class="clergy-bio">${esc(p.bio || '')}</p>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="clergy-inner">
      <span class="eyebrow">Leadership</span>
      <h2 class="section-title">Clergy &amp; Staff</h2>
      <hr class="gold-rule">
      <div class="clergy-list">${items || '<p style="color:rgba(255,255,255,0.5)">Clergy information coming soon.</p>'}</div>
    </div>
  `;
}

// ── MINISTRIES ────────────────────────────────────────────────────────────────
function renderMinistries() {
  const el = document.getElementById('ministries');
  if (!el) return;
  const mins = content.ministries || [];

  const items = mins.map((m, i) => {
    const imgHtml = m.image
      ? `<div class="ministry-img-wrap"><img class="ministry-img" src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';
    return `
    <div class="ministry-item${m.image ? ' has-image' : ''}">
      <div class="ministry-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="ministry-content">
        ${imgHtml}
        <div class="ministry-name">${esc(m.name || '')}</div>
        <p class="ministry-desc">${esc(m.description || '')}</p>
      </div>
    </div>
  `;
  }).join('');

  el.innerHTML = `
    <div class="ministries-inner">
      <span class="eyebrow">Community</span>
      <h2 class="section-title">Our Ministries</h2>
      <hr class="gold-rule">
      <div class="ministries-list">${items}</div>
    </div>
  `;
}

// ── SCHEDULE ──────────────────────────────────────────────────────────────────
function renderSchedule() {
  const el = document.getElementById('schedule');
  if (!el) return;
  const events = content.schedule?.events || [];

  // Group by day
  const byDay = {};
  events.forEach(ev => {
    if (!byDay[ev.day]) byDay[ev.day] = [];
    byDay[ev.day].push(ev);
  });

  const dayOrder = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const cards = dayOrder
    .filter(d => byDay[d])
    .map(day => {
      const services = byDay[day].map(ev => `
        <div class="sched-service">
          <div class="sched-time">${esc(ev.time)}</div>
          <div class="sched-name">${esc(ev.service)}</div>
          ${ev.duration ? `<div class="sched-dur">${esc(ev.duration)}</div>` : ''}
        </div>
      `).join('');
      return `<div class="schedule-day-card"><div class="sched-day">${day}</div>${services}</div>`;
    }).join('');

  el.innerHTML = `
    <div class="schedule-inner">
      <span class="eyebrow">Worship</span>
      <h2 class="section-title">Weekly Services</h2>
      <hr class="gold-rule" style="margin-bottom:0;">
      <div class="schedule-grid">${cards || '<p style="color:rgba(255,255,255,0.5)">Schedule coming soon.</p>'}</div>
    </div>
  `;
}

// ── SERMONS ───────────────────────────────────────────────────────────────────
function renderSermons() {
  const el = document.getElementById('sermons');
  if (!el) return;
  const sermons = content.sermons || [];

  const rows = sermons.map(s => {
    const d = s.date ? new Date(s.date + 'T00:00:00') : null;
    const month = d ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
    const day   = d ? d.getDate() : '';
    const year  = d ? d.getFullYear() : '';
    const watchHtml = s.youtubeId
      ? `<a class="sermon-watch" href="https://www.youtube.com/watch?v=${esc(s.youtubeId)}" target="_blank" rel="noopener">▶ Watch</a>`
      : '';
    return `
      <div class="sermon-row">
        <div class="sermon-date-col">
          <div class="sermon-month">${month}</div>
          <div class="sermon-day-num">${day}</div>
          <div class="sermon-year">${year}</div>
        </div>
        <div>
          <div class="sermon-title">${esc(s.title || '')}</div>
          <div class="sermon-speaker">${esc(s.speaker || '')}</div>
          ${s.description ? `<div class="sermon-desc">${esc(s.description)}</div>` : ''}
        </div>
        <div>${watchHtml}</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="sermons-inner">
      <span class="eyebrow">Teaching</span>
      <h2 class="section-title">Sermon Archive</h2>
      <hr class="gold-rule">
      <div class="sermons-list">${rows || '<p style="color:var(--text-muted)">Sermons coming soon.</p>'}</div>
    </div>
  `;
}

// ── EVENTS ────────────────────────────────────────────────────────────────────
function renderEvents() {
  const el = document.getElementById('events');
  if (!el) return;
  const today  = new Date(); today.setHours(0,0,0,0);
  const events = (content.events || []).filter(ev => {
    if (!ev.date) return true;
    return new Date(ev.date + 'T00:00:00') >= today;
  });

  const cards = events.map(ev => {
    const dateStr = ev.date ? new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const imgHtml = ev.image
      ? `<div class="event-img-wrap"><img class="event-img" src="${esc(ev.image)}" alt="${esc(ev.title)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';
    return `
      <div class="event-card">
        ${imgHtml}
        <div class="event-body">
          <span class="event-date-badge">${esc(dateStr)}</span>
          <div class="event-title">${esc(ev.title || '')}</div>
          <div class="event-meta">${ev.time ? esc(ev.time) + ' ' : ''}${ev.location ? '· ' + esc(ev.location) : ''}</div>
          ${ev.description ? `<p class="event-desc">${esc(ev.description)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="events-inner">
      <span class="eyebrow">Calendar</span>
      <h2 class="section-title">Upcoming Events</h2>
      <hr class="gold-rule">
      ${events.length ? `<div class="events-grid">${cards}</div>` : '<p class="no-events">No upcoming events at this time. Check back soon.</p>'}
    </div>
  `;
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function renderGallery() {
  const el = document.getElementById('gallery');
  if (!el) return;
  const photos = content.gallery || [];

  const items = photos.map(p => `
    <div class="g-item">
      <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.style.display='none'">
      <div class="g-item-overlay">
        <div>
          <div class="g-item-title">${esc(p.title || '')}</div>
          ${p.category ? `<div class="g-item-cat">${esc(p.category)}</div>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="gallery-inner">
      <span class="eyebrow">Life of the Parish</span>
      <h2 class="section-title">Photo Gallery</h2>
      <div class="gallery-mosaic">${items || '<p style="color:rgba(255,255,255,0.5)">Photos coming soon.</p>'}</div>
    </div>
  `;
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function renderFooter() {
  const el = document.getElementById('siteFooter');
  if (!el) return;
  const ch = content.church || {};

  el.innerHTML = `
    <div class="footer-inner">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-name">${esc(ch.name || 'Saint Mary Coptic Orthodox Church')}</div>
          <div class="footer-brand-tag">Coptic Orthodox Diocese</div>
          <p class="footer-desc">A vibrant community of faith rooted in the ancient traditions of the Coptic Orthodox Church, serving our congregation with love and dedication.</p>
        </div>
        <div>
          <div class="footer-col-title">Navigate</div>
          <ul class="footer-links">
            <li><a href="#about">About</a></li>
            <li><a href="#clergy">Clergy</a></li>
            <li><a href="#ministries">Ministries</a></li>
            <li><a href="#schedule">Schedule</a></li>
            <li><a href="#sermons">Sermons</a></li>
            <li><a href="#events">Events</a></li>
            <li><a href="#gallery">Gallery</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-col-title">Contact</div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">✉</span>
            <span class="footer-contact-text">info@saintmarychurch.org</span>
          </div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">☎</span>
            <span class="footer-contact-text">(555) 123-4567</span>
          </div>
          <div class="footer-contact-item">
            <span class="footer-contact-icon">⛪</span>
            <span class="footer-contact-text">123 Church Street<br>Your City, State 00000</span>
          </div>
          <div style="margin-top:1.5rem;">
            <a href="login.html" style="color:var(--gold); font-size:0.78rem; letter-spacing:1px; text-transform:uppercase; font-family:'Helvetica Neue',Arial,sans-serif;">Member Portal →</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="footer-copy">© ${new Date().getFullYear()} ${esc(ch.name || 'Saint Mary Coptic Orthodox Church')}. All rights reserved.</span>
        <span class="footer-copy">Coptic Orthodox Church</span>
      </div>
    </div>
  `;
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function setupNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ── UTIL ──────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
