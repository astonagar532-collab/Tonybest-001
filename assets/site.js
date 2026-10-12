const DATA_URL = 'content/data.json';
let SITE_DATA = null;
const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');},{threshold:.1}) : null;
function initReveal(){ document.querySelectorAll('.reveal').forEach(el=> io && io.observe(el)); }
function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const list = document.getElementById('nav-list');
  if(!toggle || !list) return;
  const mq = window.matchMedia('(max-width: 820px)');
  const apply = () => { list.style.display = mq.matches ? 'none' : 'flex'; toggle.style.display = mq.matches ? 'inline-block' : 'none'; toggle.setAttribute('aria-expanded','false'); };
  apply(); mq.addEventListener('change', apply);
  toggle.addEventListener('click', ()=>{
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    list.style.display = open ? 'none' : 'flex';
  });
}
function initTabs(){
  document.querySelectorAll('.tabs').forEach(group=>{
    const tabs = group.querySelectorAll('[role=tab]');
    tabs.forEach(tab=> tab.addEventListener('click', ()=>{
      tabs.forEach(t=>{ t.setAttribute('aria-selected','false'); const id=t.getAttribute('aria-controls'); document.getElementById(id).hidden=true; });
      tab.setAttribute('aria-selected','true');
      document.getElementById(tab.getAttribute('aria-controls')).hidden=false;
      localStorage.setItem('td-tier-tab', tab.textContent.trim());
    }));
    const saved = localStorage.getItem('td-tier-tab');
    if(saved){ const found = Array.from(tabs).find(t=>t.textContent.trim()===saved); if(found) found.click(); }
  });
}
function money(n, code){
  const digits = (code==='JPY') ? 0 : (Number.isInteger(Number(n)) ? 0 : 1);
  return Number(n).toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
}
function rate(code){ return Number(SITE_DATA?.rates?.[code]) || 1; }
function buffer(){ return Number(SITE_DATA?.budget_buffer) || 0.1; }
function initCalc(){
  const form = document.getElementById('calc'); if(!form) return;
  const prog = document.getElementById('prog');
  const out = document.getElementById('result');
  const tierSel = document.getElementById('tier');
  const acts = ()=> Array.from(document.querySelectorAll('.act:checked')).map(a=>Number(a.dataset.usd)||0);
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const trav = Math.max(1, Number(document.getElementById('trav').value));
    const nights = Math.max(1, Number(document.getElementById('nights').value));
    const tier = tierSel.value;
    const t = SITE_DATA.tiers[tier] || SITE_DATA.tiers['Mid'];
    const perDayUSD = Number(t.usd);
    const extras = acts().reduce((s,v)=>s+v,0);
    const perPersonUSD = perDayUSD + extras;
    const mult = nights * trav * (1 + buffer());
    const totalUSD = perPersonUSD * mult;
    prog.style.width = Math.min(100, (perPersonUSD / 250)*100) + '%';
    const rows = ['USD','EUR','GBP','INR'].filter(c=>SITE_DATA.rates[c]).map(c =>
      `<li><strong>${c}</strong> ~ ${money(totalUSD * rate(c), c)}</li>`).join('');
    out.innerHTML = `<div class="card"><h2>Estimate (+${Math.round(buffer()*100)}% buffer)</h2><ul class="list">${rows}</ul></div>`;
  });
  document.getElementById('exportJson')?.addEventListener('click', ()=>{
    const data = {
      travelers: Number(document.getElementById('trav').value),
      nights: Number(document.getElementById('nights').value),
      tier: tierSel.value,
      optional_activities_usd_each: acts(),
      base_currency: SITE_DATA.base_currency,
      last_updated: SITE_DATA.last_updated
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='budget-plan.json'; a.click();
  });
}
function initPicker(){
  const vf = document.getElementById('vibeFilter');
  const pf = document.getElementById('priceFilter');
  const btn = document.getElementById('applyPicker');
  const list = document.getElementById('neighborhoodResults');
  const matrix = document.getElementById('areaMatrix');
  if(!btn || !list) return;
  const render = ()=>{
    list.innerHTML = '';
    const vibe = (vf.value||'').toLowerCase();
    const price = Number(pf.value||Infinity);
    const rows = [];
    SITE_DATA.areas
      .filter(a => (!vibe || a.vibe.toLowerCase()===vibe))
      .filter(a => a.avg_nightly_usd <= (isFinite(price)? price : 999999))
      .forEach(a => {
        const card = document.createElement('article'); card.className='card reveal';
        card.innerHTML = `<h3>${a.name} <span class="small">${a.destination}</span></h3><p>Vibe: ${a.vibe} &middot; Nightly avg: $${a.avg_nightly_usd}</p>`;
        list.appendChild(card); if(window.IntersectionObserver) io.observe(card);
        rows.push(`<tr><td>${a.destination}</td><td>${a.name}</td><td>${a.vibe}</td><td>${a.pros.join(', ')}</td><td>${a.cons.join(', ')}</td></tr>`);
      });
    if(!rows.length) rows.push('<tr><td colspan="5">No areas match those filters. Try a higher price ceiling or a different vibe.</td></tr>');
    if(matrix) matrix.innerHTML = rows.join('');
  };
  btn.addEventListener('click', render); render();
}
function hydrateLists(){
  const airportRoot = document.getElementById('airportTable');
  if(airportRoot){
    const rows = (SITE_DATA.transport?.airport_transfer||[]).map(a=>`<tr><td>${a.destination}</td><td>${a.mode}</td><td>${a.time_min} min</td><td>$${a.cost_usd}</td><td>${a.notes}</td></tr>`).join('');
    airportRoot.innerHTML = `<table class="striped"><thead><tr><th>Where</th><th>Mode</th><th>Time</th><th>From</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  const localRoot = document.getElementById('localTransit');
  if(localRoot){
    const l = SITE_DATA.transport?.local;
    if(l) localRoot.innerHTML = `<table class="striped"><thead><tr><th>Modes</th><th>Single fare</th><th>Daily cap</th></tr></thead><tbody><tr><td>${l.modes.join(', ')}</td><td>$${l.single_fare_usd}</td><td>$${l.daily_cap_usd}</td></tr></tbody></table><p class="small">${l.service_note}</p>`;
  }
  const routeRoot = document.getElementById('routeTable');
  if(routeRoot){
    const rows = (SITE_DATA.transport?.routes||[]).map(r=>`<tr><td>${r.from}</td><td>${r.to}</td><td>${r.best_mode}</td><td>${r.time_min} min</td><td>$${r.cost_usd}</td></tr>`).join('');
    routeRoot.innerHTML = `<table class="striped"><thead><tr><th>From</th><th>To</th><th>Best mode</th><th>Time</th><th>From</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  const attRoot = document.getElementById('attractionList');
  if(attRoot){
    attRoot.innerHTML = (SITE_DATA.attractions||[]).map(a=>`<article class="card"><h3>${a.name}</h3><p>Typical: $${a.price_usd} &middot; best: ${a.best_time}</p><p class="small">${a.notes}</p></article>`).join('');
  }
  const foodRoot = document.getElementById('foodList');
  if(foodRoot){
    foodRoot.innerHTML = (SITE_DATA.food||[]).map(f=>`<li class="card"><strong>${f.dish}</strong><br><span class="small">${f.where} &mdash; ~$${f.cost_usd} &middot; tip: ${f.hygiene_tip}</span></li>`).join('');
  }
  const it48 = document.getElementById('it48');
  if(it48){
    it48.innerHTML = (SITE_DATA.itineraries?.['48h']||[]).map(i=>`<li><strong>${i.time}</strong> &mdash; ${i.place} &middot; ~$${i.cost_usd} <span class="small">${i.note||''}</span></li>`).join('');
  }
  const safetyRoot = document.getElementById('safetyList');
  if(safetyRoot){
    safetyRoot.innerHTML = (SITE_DATA.safety?.scams||[]).map(s=>`<li>${s}</li>`).join('');
  }
  const etiquetteRoot = document.getElementById('etiquetteList');
  if(etiquetteRoot){
    etiquetteRoot.innerHTML = (SITE_DATA.safety?.etiquette||[]).map(s=>`<li>${s}</li>`).join('');
  }
  const faqRoot = document.getElementById('faqList');
  if(faqRoot){
    faqRoot.innerHTML = (SITE_DATA.faq||[]).slice(0,20).map((f,idx)=>`<div class="item"><h3><button aria-expanded="false" aria-controls="faq${idx}" id="q${idx}">${f.q}</button></h3><div id="faq${idx}" role="region" aria-labelledby="q${idx}" class="panel" hidden>${f.a}</div></div>`).join('');
    faqRoot.addEventListener('click', (e)=>{
      if(e.target.tagName==='BUTTON'){ const btn=e.target; const id=btn.getAttribute('aria-controls'); const p=document.getElementById(id); const open=btn.getAttribute('aria-expanded')==='true'; btn.setAttribute('aria-expanded', String(!open)); p.hidden=open; }
    });
  }
  const vibeRoot = document.getElementById('vibeFilter');
  if(vibeRoot && !vibeRoot.dataset.filled){
    (SITE_DATA.vibes||[]).forEach(v=>{
      const o = document.createElement('option'); o.value = v; o.textContent = v.replace('-',' '); vibeRoot.appendChild(o);
    });
    vibeRoot.dataset.filled = '1';
  }
  const emergencyRoot = document.getElementById('emergencyNote');
  if(emergencyRoot && SITE_DATA.safety?.emergency_note) emergencyRoot.textContent = SITE_DATA.safety.emergency_note;
  const scopeRoot = document.getElementById('siteScope');
  if(scopeRoot) scopeRoot.textContent = SITE_DATA.scope;
}
window.addEventListener('DOMContentLoaded', async ()=>{
  initReveal(); initNav(); initTabs();
  try { const res = await fetch(DATA_URL); SITE_DATA = await res.json(); } catch(e) { console.warn('DATA load failed', e); }
  if(!SITE_DATA) return;
  document.querySelectorAll('[data-bind="last_updated"]').forEach(el=> el.textContent = SITE_DATA.last_updated);
  const tiers = SITE_DATA.tiers || {};
  for (const key of Object.keys(tiers)){
    for (const code of ['usd','eur','inr']){
      const el = document.querySelector(`[data-bind="tier.${key}.${code}"]`);
      if (el) el.textContent = money(tiers[key]?.[code], code.toUpperCase());
    }
  }
  hydrateLists(); initPicker(); initCalc();
});