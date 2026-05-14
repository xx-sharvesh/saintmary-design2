// ── Admin Panel — Full Logic ──────────────────────────────────────────────────
// Image uploads: file → canvas compress → base64 in JSON
// YouTube: accepts full URL, extracts video ID automatically
// Auth: session-based, admin-only

let siteData  = {};   // content.json
let usersData = {};   // users.json
let currentAdmin = null;
let modalSection = null;
let modalEditIdx = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  currentAdmin = requireAdmin(); // from auth.js — redirects if not admin
  if (!currentAdmin) return;

  document.getElementById('userPill').textContent = currentAdmin.name + ' (Admin)';

  await Promise.all([loadSiteData(), loadUsersData()]);
  populateAllForms();
  renderAll();
});

async function loadSiteData() {
  try {
    const r = await fetch('./data/content.json?t=' + Date.now());
    siteData = await r.json();
  } catch(e) {
    toast('Could not load content.json — make sure you\'re serving via HTTP');
    siteData = { church:{}, live:{}, about:{}, clergy:[], ministries:[], schedule:{events:[]}, sermons:[], events:[], gallery:[] };
  }
}

async function loadUsersData() {
  try {
    const r = await fetch('./data/users.json?t=' + Date.now());
    usersData = await r.json();
  } catch(e) {
    usersData = { users: [], settings: {} };
  }
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────
function showPanel(name) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(l => { if (l.textContent.toLowerCase().includes(name) || l.getAttribute('onclick')?.includes("'"+name+"'")) l.classList.add('active'); });
}

// ─── POPULATE INLINE FORMS ────────────────────────────────────────────────────
function populateAllForms() {
  // Church info
  const ch = siteData.church || {};
  setValue('churchName',    ch.name    || '');
  setValue('churchTagline', ch.tagline || '');

  // About
  const ab = siteData.about || {};
  setValue('aboutTitle',   ab.title       || '');
  setValue('aboutDesc',    ab.description || '');
  setValue('aboutVision',  ab.vision      || '');
  setValue('aboutMission', ab.mission     || '');

  // Live stream
  const live = siteData.live || {};
  setValue('liveTitle',      live.title      || '');
  setValue('liveNextStream', live.nextStream || '');
  setValue('liveChannelId',  live.channelId  || '');
  setValue('liveYoutubeUrl', live.youtubeId ? 'https://www.youtube.com/watch?v=' + live.youtubeId : '');
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ─── SAVE INLINE SECTIONS ─────────────────────────────────────────────────────
function saveChurchInfo() {
  siteData.church = { ...siteData.church,
    name:    document.getElementById('churchName').value.trim(),
    tagline: document.getElementById('churchTagline').value.trim()
  };
  toast('Church info saved — export Content JSON to apply.');
}

function saveAbout() {
  siteData.about = {
    title:       document.getElementById('aboutTitle').value.trim(),
    description: document.getElementById('aboutDesc').value.trim(),
    vision:      document.getElementById('aboutVision').value.trim(),
    mission:     document.getElementById('aboutMission').value.trim()
  };
  toast('About section saved — export Content JSON to apply.');
}

function saveLive() {
  const ytUrl    = document.getElementById('liveYoutubeUrl').value.trim();
  const chId     = document.getElementById('liveChannelId').value.trim();
  siteData.live  = { ...siteData.live,
    title:      document.getElementById('liveTitle').value.trim(),
    nextStream: document.getElementById('liveNextStream').value.trim(),
    channelId:  chId,
    youtubeId:  extractYouTubeId(ytUrl)
  };
  toast('Live stream saved — export Content JSON to apply.');
}

// ─── RENDER ALL LISTS ─────────────────────────────────────────────────────────
function renderAll() {
  renderList('clergy',     item => ({ primary: item.name,  secondary: item.title, img: item.image }));
  renderList('ministries', item => ({ primary: item.name,  secondary: item.description, img: item.image }));
  renderScheduleList();
  renderList('sermons', item => ({ primary: item.title, secondary: item.speaker + (item.date ? ' · ' + fmtDate(item.date) : ''), icon: '🎙️' }));
  renderList('events',  item => ({ primary: item.title, secondary: fmtDate(item.date) + (item.location ? ' · ' + item.location : ''), img: item.image }));
  renderList('gallery', item => ({ primary: item.title, secondary: item.category, img: item.image }));
  renderUsersTable();
}

function renderList(section, getDisplay) {
  const items = section === 'schedule'
    ? (siteData.schedule?.events || [])
    : (siteData[section] || []);
  const el = document.getElementById('list-' + section);
  if (!el) return;

  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><em>📋</em>No items yet — click the + button above to add one.</div>';
    return;
  }

  el.innerHTML = items.map((item, i) => {
    const d = getDisplay(item);
    const thumb = d.img
      ? `<img class="rec-thumb" src="${esc(d.img)}" alt="" onerror="this.style.display='none'">`
      : `<div class="rec-icon">${d.icon || '📄'}</div>`;
    return `<div class="record-item">
      ${thumb}
      <div class="rec-info">
        <strong>${esc(d.primary || 'Untitled')}</strong>
        <span>${esc(d.secondary || '')}</span>
      </div>
      <div class="rec-actions">
        <button class="btn-info" onclick="openModal('${section}',${i})">Edit</button>
        <button class="btn-danger" onclick="deleteItem('${section}',${i})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function renderScheduleList() {
  const events = siteData.schedule?.events || [];
  const el = document.getElementById('list-schedule');
  if (!el) return;
  if (!events.length) {
    el.innerHTML = '<div class="empty-state"><em>📅</em>No services yet — click + to add one.</div>';
    return;
  }
  el.innerHTML = events.map((ev, i) => `
    <div class="record-item">
      <div class="rec-icon">📅</div>
      <div class="rec-info">
        <strong>${esc(ev.day)} at ${esc(ev.time)} — ${esc(ev.service)}</strong>
        <span>${esc(ev.duration || '')}</span>
      </div>
      <div class="rec-actions">
        <button class="btn-info" onclick="openModal('schedule',${i})">Edit</button>
        <button class="btn-danger" onclick="deleteItem('schedule',${i})">Delete</button>
      </div>
    </div>`).join('');
}

function renderUsersTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  const users = usersData.users || [];
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:2rem">No users found.</td></tr>'; return; }

  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${esc(u.name)}</td>
      <td style="color:var(--gray)">${esc(u.email)}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td><span class="status-badge status-${u.status}">${u.status}</span></td>
      <td style="color:var(--gray);font-size:0.8rem">${esc(u.createdAt || '')}</td>
      <td>
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap">
          ${u.status === 'pending' ? `<button class="btn-success btn-sm btn" onclick="approveUser(${i})" style="font-size:0.7rem;padding:0.25rem 0.6rem">Approve</button>` : ''}
          ${u.role === 'member' && u.status === 'active' ? `<button class="btn-warning btn-sm btn" onclick="makeAdmin(${i})" style="font-size:0.7rem;padding:0.25rem 0.6rem">→ Admin</button>` : ''}
          ${u.role === 'admin' && u.id !== currentAdmin.id ? `<button class="btn-info btn-sm btn" onclick="revokeAdmin(${i})" style="font-size:0.7rem;padding:0.25rem 0.6rem">Revoke Admin</button>` : ''}
          ${u.id !== currentAdmin.id ? `<button class="btn-danger" onclick="removeUser(${i})">Remove</button>` : '<span style="font-size:0.72rem;color:var(--gray)">(you)</span>'}
        </div>
      </td>
    </tr>`).join('');
}

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────
function addUser() {
  const name  = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('newUserPass').value.trim();
  const role  = document.getElementById('newUserRole').value;

  if (!name || !email || !pass) { toast('Please fill in Name, Email and Password.'); return; }

  const exists = (usersData.users || []).find(u => u.email.toLowerCase() === email);
  if (exists) { toast('A user with this email already exists.'); return; }

  if (!usersData.users) usersData.users = [];
  usersData.users.push({ id: Date.now(), name, email, password: pass, role, status: 'active', createdAt: new Date().toISOString().split('T')[0] });

  document.getElementById('newUserName').value  = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserPass').value  = '';
  renderUsersTable();
  toast('User added — export Users JSON to save permanently.');
}

function approveUser(idx) {
  usersData.users[idx].status = 'active';
  renderUsersTable();
  toast('User approved — export Users JSON to save.');
}

function makeAdmin(idx) {
  if (!confirm('Grant admin access to ' + usersData.users[idx].name + '?')) return;
  usersData.users[idx].role = 'admin';
  renderUsersTable();
  toast('Role updated — export Users JSON to save.');
}

function revokeAdmin(idx) {
  if (!confirm('Revoke admin access from ' + usersData.users[idx].name + '?')) return;
  usersData.users[idx].role = 'member';
  renderUsersTable();
  toast('Role updated — export Users JSON to save.');
}

function removeUser(idx) {
  if (!confirm('Remove user ' + usersData.users[idx].name + '? This cannot be undone until you reload.')) return;
  usersData.users.splice(idx, 1);
  renderUsersTable();
  toast('User removed — export Users JSON to save.');
}

// ─── DELETE CONTENT ITEMS ─────────────────────────────────────────────────────
function deleteItem(section, idx) {
  if (!confirm('Delete this record?')) return;
  if (section === 'schedule') { siteData.schedule.events.splice(idx, 1); }
  else { siteData[section].splice(idx, 1); }
  renderAll();
  toast('Deleted — export Content JSON to save permanently.');
}

// ─── MODAL CONFIGS ────────────────────────────────────────────────────────────
const MODAL_CONFIGS = {
  clergy: {
    label: 'Clergy Member',
    fields: [
      { key: 'name',  label: 'Full Name',    type: 'text',     required: true },
      { key: 'title', label: 'Title / Role', type: 'text',     required: true, placeholder: 'e.g. Senior Priest' },
      { key: 'image', label: 'Photo',        type: 'upload',   hint: 'JPG or PNG — max 5 MB — auto-compressed' },
      { key: 'bio',   label: 'Biography',    type: 'textarea' }
    ]
  },
  ministries: {
    label: 'Ministry',
    fields: [
      { key: 'image',       label: 'Ministry Image', type: 'upload',   required: true, hint: 'Upload a representative image for this ministry' },
      { key: 'name',        label: 'Ministry Name',  type: 'text',     required: true },
      { key: 'description', label: 'Description',    type: 'textarea', required: true }
    ]
  },
  schedule: {
    label: 'Service',
    fields: [
      { key: 'day',      label: 'Day',          type: 'select', required: true,
        options: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] },
      { key: 'time',     label: 'Time',         type: 'text',   required: true, placeholder: '10:00 AM' },
      { key: 'service',  label: 'Service Name', type: 'text',   required: true, placeholder: 'Divine Liturgy' },
      { key: 'duration', label: 'Duration',     type: 'text',   placeholder: '2 hours' }
    ]
  },
  sermons: {
    label: 'Sermon',
    fields: [
      { key: 'title',       label: 'Sermon Title',   type: 'text',     required: true },
      { key: 'speaker',     label: 'Speaker',        type: 'text',     required: true },
      { key: 'date',        label: 'Date',           type: 'date',     required: true },
      { key: 'youtubeId',   label: 'YouTube Link',   type: 'youtube',  placeholder: 'https://www.youtube.com/watch?v=...' },
      { key: 'description', label: 'Description',    type: 'textarea' }
    ]
  },
  events: {
    label: 'Event',
    fields: [
      { key: 'title',       label: 'Event Title', type: 'text',     required: true },
      { key: 'date',        label: 'Date',        type: 'date',     required: true },
      { key: 'time',        label: 'Time',        type: 'text',     placeholder: '6:00 PM' },
      { key: 'location',    label: 'Location',    type: 'text',     placeholder: 'Church Hall' },
      { key: 'image',       label: 'Event Image', type: 'upload' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  gallery: {
    label: 'Gallery Photo',
    fields: [
      { key: 'image',    label: 'Photo',    type: 'upload', required: true },
      { key: 'title',    label: 'Caption',  type: 'text',   required: true },
      { key: 'category', label: 'Category', type: 'text',   placeholder: 'Church, Services, Events...' }
    ]
  }
};

// ─── MODAL OPEN/CLOSE ─────────────────────────────────────────────────────────
function openModal(section, editIdx = null) {
  modalSection = section;
  modalEditIdx = editIdx;

  const cfg = MODAL_CONFIGS[section];
  document.getElementById('modalTitle').textContent = (editIdx !== null ? 'Edit ' : 'Add ') + cfg.label;

  const existing = editIdx !== null
    ? (section === 'schedule' ? siteData.schedule.events[editIdx] : siteData[section][editIdx])
    : {};

  document.getElementById('modalBody').innerHTML = cfg.fields.map(f => buildField(f, existing)).join('');

  // Set up file input listeners AFTER rendering
  cfg.fields.filter(f => f.type === 'upload').forEach(f => setupUpload(f.key, existing[f.key] || ''));

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => { const first = document.getElementById('modalBody').querySelector('input:not([type=file]):not([type=hidden]),textarea,select'); if (first) first.focus(); }, 80);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  modalSection = null; modalEditIdx = null;
}

function handleBgClick(e) { if (e.target.id === 'modalOverlay') closeModal(); }

// ─── BUILD MODAL FIELD HTML ───────────────────────────────────────────────────
function buildField(f, existing) {
  const val = existing[f.key] || '';
  const req = f.required ? '<span class="req"> *</span>' : '';
  const hint = f.hint ? `<p class="field-hint">${f.hint}</p>` : '';

  if (f.type === 'upload') {
    const hasImg = !!val;
    return `<div class="form-group">
      <label>${f.label}${req}</label>
      <div class="upload-box" id="ub_${f.key}" onclick="document.getElementById('mf_${f.key}_file').click()">
        <img id="prev_${f.key}" class="upload-preview" src="${esc(val)}" style="${hasImg ? 'display:block' : 'display:none'}">
        <div class="upload-ph" id="uph_${f.key}" style="${hasImg ? 'display:none' : ''}">
          <span class="upload-ph-icon">📷</span>
          <span>Click to upload image</span>
          <small>JPG, PNG, WEBP • auto-compressed</small>
        </div>
        <input type="file" id="mf_${f.key}_file" accept="image/*" style="display:none" onclick="event.stopPropagation()">
      </div>
      <input type="hidden" id="mf_${f.key}" value="${esc(val)}">
      ${hint}
    </div>`;
  }

  if (f.type === 'youtube') {
    const displayVal = existing.youtubeId ? 'https://www.youtube.com/watch?v=' + existing.youtubeId : '';
    return `<div class="form-group">
      <label>${f.label || 'YouTube Link'}${req}</label>
      <input type="text" id="mf_${f.key}" value="${esc(displayVal)}" placeholder="${f.placeholder || 'https://www.youtube.com/watch?v=...'}">
      <p class="field-hint">Paste the full YouTube URL. Shorts, youtu.be and embed links also work.</p>
    </div>`;
  }

  if (f.type === 'select') {
    const opts = (f.options || []).map(o => `<option value="${esc(o)}" ${val === o ? 'selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="form-group"><label>${f.label}${req}</label><select id="mf_${f.key}">${opts}</select>${hint}</div>`;
  }

  if (f.type === 'textarea') {
    return `<div class="form-group"><label>${f.label}${req}</label><textarea id="mf_${f.key}" placeholder="${f.placeholder || ''}">${esc(val)}</textarea>${hint}</div>`;
  }

  return `<div class="form-group"><label>${f.label}${req}</label><input type="${f.type}" id="mf_${f.key}" value="${esc(val)}" placeholder="${f.placeholder || ''}">${hint}</div>`;
}

// ─── IMAGE UPLOAD HANDLER ─────────────────────────────────────────────────────
function setupUpload(key, existingVal) {
  const fileInput = document.getElementById('mf_' + key + '_file');
  if (!fileInput) return;

  fileInput.addEventListener('change', function(e) {
    e.stopPropagation();
    const file = this.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('Image too large — please use a file under 8 MB'); return; }

    compressImg(file, (b64) => {
      document.getElementById('mf_' + key).value = b64;
      const prev = document.getElementById('prev_' + key);
      prev.src = b64; prev.style.display = 'block';
      const ph = document.getElementById('uph_' + key);
      if (ph) ph.style.display = 'none';
    });
  });
}

function compressImg(file, callback, maxW = 900, maxH = 900, quality = 0.82) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let [w, h] = [img.width, img.height];
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── SAVE MODAL ───────────────────────────────────────────────────────────────
function saveModal() {
  const cfg = MODAL_CONFIGS[modalSection];
  const existing = modalEditIdx !== null
    ? (modalSection === 'schedule' ? siteData.schedule.events[modalEditIdx] : siteData[modalSection][modalEditIdx])
    : {};
  const record = {};
  let valid = true;

  cfg.fields.forEach(f => {
    if (f.type === 'upload') {
      const val = document.getElementById('mf_' + f.key)?.value || existing[f.key] || '';
      if (f.required && !val) { toast('Please upload an image for "' + f.label + '"'); valid = false; }
      record[f.key] = val;
      return;
    }
    if (f.type === 'youtube') {
      const el = document.getElementById('mf_' + f.key);
      record['youtubeId'] = extractYouTubeId(el?.value?.trim() || '');
      return;
    }
    const el = document.getElementById('mf_' + f.key);
    if (!el) return;
    const val = el.value.trim();
    if (f.required && !val) {
      el.style.borderColor = '#e74c3c';
      el.style.boxShadow = '0 0 0 3px rgba(192,57,43,0.12)';
      valid = false;
    } else {
      el.style.borderColor = ''; el.style.boxShadow = '';
    }
    record[f.key] = val;
  });

  if (!valid) { toast('Please fill in all required fields (marked *)'); return; }

  if (modalSection === 'schedule') {
    if (!siteData.schedule) siteData.schedule = { title: 'Weekly Services', events: [] };
    if (modalEditIdx !== null) siteData.schedule.events[modalEditIdx] = { ...siteData.schedule.events[modalEditIdx], ...record };
    else siteData.schedule.events.push(record);
  } else {
    if (!siteData[modalSection]) siteData[modalSection] = [];
    if (modalEditIdx !== null) siteData[modalSection][modalEditIdx] = { id: siteData[modalSection][modalEditIdx].id || Date.now(), ...siteData[modalSection][modalEditIdx], ...record };
    else siteData[modalSection].push({ id: Date.now(), ...record });
  }

  closeModal();
  renderAll();
  toast('Saved! Click "Export Content JSON" to download and re-upload.');
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function downloadContentJSON() {
  downloadJSON(siteData, 'content.json');
  toast('Downloaded content.json — upload to data/ on your server.');
}

function downloadUsersJSON() {
  downloadJSON(usersData, 'users.json');
  toast('Downloaded users.json — upload to data/ on your server.');
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function extractYouTubeId(input) {
  if (!input) return '';
  input = input.trim();
  // Already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  // Extract from URL
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return input; // return as-is
}

function fmtDate(str) {
  if (!str) return '';
  try { return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return str; }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3500);
}
