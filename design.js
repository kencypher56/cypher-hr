/* ═══ CYPHER-HR Design Module ═══ */
/* Icon management via thesvg CDN + SVG fallbacks */

const THESVG_CDN = 'https://cdn.jsdelivr.net/npm/@thesvg/icons/icons';
const iconCache = {};

const SVG_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  report: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  userPlus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
};

function icon(name, size = 20) {
  const defaultSvg = SVG_ICONS[name] || SVG_ICONS.dashboard;
  
  if (iconCache[name] && iconCache[name] !== 'loading') {
    return `<span class="icon" style="width:${size}px;height:${size}px">${iconCache[name]}</span>`;
  }
  
  if (!iconCache[name]) {
    iconCache[name] = 'loading';
    fetch(`/thesvg/${name}.js`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(text => {
        const match = text.match(/export const svg = \`(.*?)\`;/s) || text.match(/export const variants = \{[\s\S]*?"mono": \`(.*?)\`/s) || text.match(/export const variants = \{[\s\S]*?"default": \`(.*?)\`/s);
        const finalSvg = (match && match[1]) ? match[1] : defaultSvg;
        iconCache[name] = finalSvg;
        document.querySelectorAll(`.thesvg-icon[data-icon="${name}"]`).forEach(el => {
          el.innerHTML = finalSvg;
          el.classList.remove('thesvg-icon');
        });
      })
      .catch(err => {
        iconCache[name] = defaultSvg;
      });
  }
  
  return `<span class="icon thesvg-icon" data-icon="${name}" style="width:${size}px;height:${size}px">${defaultSvg}</span>`;
}

/* ═══ Design Utilities ═══ */
const Design = {
  colors: ['#1570ef','#7a5af8','#ee46bc','#f04438','#12b76a','#f79009','#0ba5ec','#66c61c','#ef6820'],

  randomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  },

  initRipple() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);width:0;height:0;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;transform:translate(-50%,-50%);pointer-events:none;animation:ripple 0.4s ease-out forwards`;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
    });

    if (!document.getElementById('ripple-style')) {
      const s = document.createElement('style');
      s.id = 'ripple-style';
      s.textContent = '@keyframes ripple{to{width:200px;height:200px;opacity:0}}';
      document.head.appendChild(s);
    }
  }
};

Design.initRipple();

/* ═══ Custom Date Picker (DD:MM:YYYY format) ═══ */
function dateInput(id, required = false, placeholder = 'DD:MM:YYYY') {
  const req = required ? 'required' : '';
  return `
    <div class="custom-datepicker" id="${id}_wrapper">
      <div class="datepicker-input-wrapper">
        <input type="text" id="${id}" placeholder="${placeholder}" ${req} maxlength="10" autocomplete="off"
               oninput="formatDateInput(this)" onfocus="openDatepicker('${id}')" onclick="openDatepicker('${id}')">
        <div class="datepicker-icon">${icon('calendar', 16)}</div>
      </div>
      <div class="datepicker-popup" id="${id}_popup" onmousedown="event.preventDefault()" onclick="event.stopPropagation()"></div>
    </div>`;
}

function formatDateInput(el) {
  let v = el.value.replace(/[^\d]/g, '');
  if (v.length > 2) v = v.slice(0,2) + ':' + v.slice(2);
  if (v.length > 5) v = v.slice(0,5) + ':' + v.slice(5,9);
  el.value = v;
}

function parseDateInput(id) {
  const val = document.getElementById(id)?.value;
  if (!val) return '';
  const parts = val.split(':');
  if (parts.length !== 3) return val;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

let activeDatepicker = null;

function openDatepicker(id) {
  if (activeDatepicker && activeDatepicker !== id) closeDatepicker();
  activeDatepicker = id;
  const popup = document.getElementById(`${id}_popup`);
  if (!popup) return;
  
  const val = document.getElementById(id).value;
  let d = new Date();
  if (val && val.length === 10) {
    const parts = val.split(':');
    d = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
  }
  
  renderCalendar(id, d.getMonth(), d.getFullYear());
  popup.classList.add('show');
}

function closeDatepicker() {
  if (!activeDatepicker) return;
  const popup = document.getElementById(`${activeDatepicker}_popup`);
  if (popup) popup.classList.remove('show');
  activeDatepicker = null;
}

document.addEventListener('click', (e) => {
  if (activeDatepicker) {
    const wrapper = document.getElementById(`${activeDatepicker}_wrapper`);
    if (wrapper && !wrapper.contains(e.target)) {
      closeDatepicker();
    }
  }
});

function renderCalendar(id, month, year) {
  const popup = document.getElementById(`${id}_popup`);
  if (!popup) return;
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  let html = `
    <div class="datepicker-header">
      <button type="button" class="datepicker-nav" onclick="changeMonth('${id}', ${month - 1}, ${year})">${icon('chevronRight', 16)}</button>
      <div class="datepicker-title">${months[month]} ${year}</div>
      <button type="button" class="datepicker-nav" onclick="changeMonth('${id}', ${month + 1}, ${year})">${icon('chevronRight', 16)}</button>
    </div>
    <div class="datepicker-grid">
      <div class="datepicker-day-header">Su</div><div class="datepicker-day-header">Mo</div><div class="datepicker-day-header">Tu</div>
      <div class="datepicker-day-header">We</div><div class="datepicker-day-header">Th</div><div class="datepicker-day-header">Fr</div><div class="datepicker-day-header">Sa</div>
  `;
  
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="datepicker-day empty"></div>`;
  }
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  
  const currentVal = document.getElementById(id).value;
  let selD = -1, selM = -1, selY = -1;
  if (currentVal && currentVal.length === 10) {
    const parts = currentVal.split(':');
    selD = parseInt(parts[0]); selM = parseInt(parts[1]) - 1; selY = parseInt(parts[2]);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    let classes = 'datepicker-day';
    if (isCurrentMonth && today.getDate() === i) classes += ' today';
    if (selY === year && selM === month && selD === i) classes += ' selected';
    html += `<div class="${classes}" onclick="selectDate('${id}', ${i}, ${month}, ${year})">${i}</div>`;
  }
  
  html += `</div>`;
  popup.innerHTML = html;
  
  // Fix nav buttons rotation
  const navs = popup.querySelectorAll('.datepicker-nav');
  if (navs[0]) navs[0].querySelector('svg').style.transform = 'rotate(180deg)';
}

function changeMonth(id, month, year) {
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  renderCalendar(id, month, year);
}

function selectDate(id, day, month, year) {
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  const yyyy = year;
  
  const input = document.getElementById(id);
  input.value = `${dd}:${mm}:${yyyy}`;
  
  // Trigger onchange manually if anything listens to it
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  closeDatepicker();
}
