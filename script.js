// ---------- CONFIG ----------
const WHATSAPP_NUMBER = "YOUR_PHONE_NUMBER"; // e.g. "9198XXXXXXXX"
const JSON_PATH = "villas.json?v=5";

// ---------- STATE ----------
let villas = [];
let filtered = [];
let activeTypeFilter = "all";
let activeChips = { pool: false, beachside: false };
let roomsFilter = "all";
let searchTerm = "";

// ---------- HELPERS ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
function debounce(fn, wait=250){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait);}; }
function escapeHtml(s=""){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

// ---------- LOAD DATA ----------
fetch(JSON_PATH, { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    villas = Array.isArray(data) ? data : (data.villas || data);
    filtered = villas.slice();
    renderCards();
  })
  .catch(err => console.error("Failed to load villas.json:", err));

// ---------- RENDER CARDS ----------
function renderCards(){
  const container = $("#cardsContainer");
  container.innerHTML = "";
  if(!filtered.length){
    container.innerHTML = "<p style='padding:12px;color:#777'>No villas found.</p>";
    return;
  }

  filtered.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${v.images?.[0] || 'placeholder.jpg'}" alt="${escapeHtml(v.name)}" loading="lazy">
      <div class="card-body">
        <h3>${escapeHtml(v.name)}</h3>
        <p class="muted">${escapeHtml(v.location || '')}</p>
        <button class="btn">View Details</button>
      </div>`;
    card.addEventListener("click", () => openModal(v));
    container.appendChild(card);
  });
}

// ---------- SEARCH & FILTERS ----------
$("#searchInput").addEventListener("input", debounce(e=>{
  searchTerm = e.target.value.trim().toLowerCase();
  applyFilters();
}, 200));

$$(".chip").forEach(chip=>{
  chip.addEventListener("click", (ev)=>{
    const key = chip.dataset.filter;
    // pool / beachside toggle handled separately
    if(key === "pool" || key === "beachside"){
      activeChips[key] = !activeChips[key];
      chip.classList.toggle("active", activeChips[key]);
      applyFilters();
      return;
    }
    if(key === "all"){
      // reset type chips
      activeTypeFilter = "all";
      $$(".chip").forEach(c=>{
        if(!["pool","beachside"].includes(c.dataset.filter)) c.classList.remove("active");
      });
      chip.classList.add("active");
      applyFilters();
      return;
    }
    // type filters: only one active at a time (you can change to multi-select if desired)
    activeTypeFilter = key;
    $$(".chip").forEach(c=>{
      if(!["pool","beachside"].includes(c.dataset.filter)) c.classList.remove("active");
    });
    chip.classList.add("active");
    applyFilters();
  });
});

// rooms dropdown
$("#roomsFilter").addEventListener("change", (e)=>{
  roomsFilter = e.target.value;
  applyFilters();
});

// initialize 'All' (if present)
(() => {
  const allChip = document.querySelector('.chip[data-filter="all"]');
  if(allChip) allChip.classList.add("active");
})();

function applyFilters(){
  filtered = villas.filter(v => {
    // search
    const q = searchTerm;
    if(q){
      const hay = (v.name + " " + (v.location||'') + " " + (v.type||[]).join(' ')).toLowerCase();
      if(!hay.includes(q)) return false;
    }

    // rooms
    if(roomsFilter !== "all"){
      const min = Number(roomsFilter);
      if(!(Number(v.rooms) >= min)) return false;
    }

    // pool & beachside
    if(activeChips.pool && !v.pool) return false;
    if(activeChips.beachside && !v.beachside) return false;

    // type
    if(activeTypeFilter && activeTypeFilter !== "all"){
      if(!(v.type || []).includes(activeTypeFilter)) return false;
    }

    return true;
  });

  renderCards();
}

// ---------- MODAL + SLIDER (FULL-WIDTH 300px) ----------
let currentSlide = 0;

function openModal(v){
  $("#villaName").innerText = v.name || "";
  $("#villaLocation").innerText = v.location || "";
  $("#villaDescription").innerText = v.description || "";

  // types
  const tC = $("#villaTypes"); tC.innerHTML = "";
  (v.type || []).forEach(t => { const sp = document.createElement("span"); sp.className="tag"; sp.innerText=t; tC.appendChild(sp); });

  // amenities
  const am = $("#villaAmenities"); am.innerHTML = "";
  (v.amenities || []).forEach(a => { const li = document.createElement("li"); li.innerText=a; am.appendChild(li); });

  $("#villaRooms").innerText = v.rooms ?? "-";
  $("#villaPool").innerText = v.pool ? "Yes" : "No";
  $("#villaBeachside").innerText = v.beachside ? "Yes" : "No";

  // build slides
  const slides = $("#slides");
  slides.innerHTML = "";
  (v.images || []).forEach(src => {
    const s = document.createElement("div");
    s.className = "slide";
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    s.appendChild(img);
    slides.appendChild(s);
  });

  buildDots((v.images || []).length);

  // WhatsApp link
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const text = encodeURIComponent(`Hi! I want to book ${v.name} (${v.location}).`);
  $("#whatsappLink").href = `${base}?text=${text}`;

  // reset slide to 0
  currentSlide = 0;
  updateSlider();

  // show modal
  $("#villaModal").style.display = "block";
  $("#villaModal").setAttribute("aria-hidden","false");

  // set up arrows and swipe
  setupSliderControls();
}

function closeModal(){
  $("#villaModal").style.display = "none";
  $("#villaModal").setAttribute("aria-hidden","true");
}

// click outside closes
document.getElementById("villaModal").addEventListener("click", (e)=>{
  if(e.target === document.getElementById("villaModal")) closeModal();
});
document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeModal(); });

// slider controls
function updateSlider(){
  const slidesEl = $("#slides");
  slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
  updateDotsActive();
}

function setupSliderControls(){
  const prev = $("#sPrev"), next = $("#sNext");
  prev.onclick = ()=> { currentSlide = Math.max(0, currentSlide - 1); updateSlider(); };
  next.onclick = ()=> { const max = $("#slides").children.length - 1; currentSlide = Math.min(max, currentSlide + 1); updateSlider(); };

  // dots click handled in buildDots()

  // touch swipe
  const slider = $("#slider");
  let startX = 0, deltaX = 0, isTouch = false;
  slider.ontouchstart = (e)=> { isTouch = true; startX = e.touches[0].clientX; };
  slider.ontouchmove = (e)=> { if(!isTouch) return; deltaX = e.touches[0].clientX - startX; };
  slider.ontouchend = ()=> {
    if(Math.abs(deltaX) > 40){
      if(deltaX > 0) { currentSlide = Math.max(0, currentSlide - 1); }
      else { const max = $("#slides").children.length - 1; currentSlide = Math.min(max, currentSlide + 1); }
      updateSlider();
    }
    startX = 0; deltaX = 0; isTouch = false;
  };
}

// dots
function buildDots(count){
  const d = $("#dots");
  d.innerHTML = "";
  for(let i=0;i<count;i++){
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.dataset.index = i;
    dot.onclick = ()=> { currentSlide = i; updateSlider(); };
    d.appendChild(dot);
  }
  updateDotsActive();
}
function updateDotsActive(){
  const dots = Array.from($("#dots").children || []);
  dots.forEach((dot, idx)=> dot.classList.toggle("active", idx === currentSlide));
}

// ---------- DARK MODE ----------
const darkBtn = document.getElementById("darkToggle");
darkBtn.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  darkBtn.innerHTML = document.body.classList.contains("dark") ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
});

// ---------- UTILITY: open from ?open=id ----------
(function checkQueryOpen(){
  const p = new URLSearchParams(location.search).get('open');
  if(p){
    const id = Number(p);
    const check = setInterval(()=>{
      const found = villas.find(x=>x.id==id);
      if(found){ openModal(found); clearInterval(check); }
    }, 200);
    setTimeout(()=>clearInterval(check), 5000);
  }
})();
