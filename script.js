// ---------- CONFIG ----------
const WHATSAPP_NUMBER = "8838581697"; // Replace with country code + number, e.g. "919XXXXXXXXX"
const JSON_PATH = "villas.json?v=2"; // update version when you change JSON

// ---------- STATE ----------
let villas = [];
let filtered = [];
let activeFilter = "all";
let searchTerm = "";

// ---------- HELPERS ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// debounce
function debounce(fn, wait=250){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait);}; }

// ---------- LOAD & RENDER ----------
fetch(JSON_PATH, { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    // data can be an array or object; accept both
    villas = Array.isArray(data) ? data : data.villas || [];
    filtered = villas.slice();
    renderCards();
  })
  .catch(err => console.error("Failed to load villas.json:", err));

function renderCards(){
  const container = $("#cardsContainer");
  container.innerHTML = "";
  if(!filtered.length){
    container.innerHTML = "<p style='padding:12px;color:#777'>No villas found.</p>";
    return;
  }

  filtered.forEach(villa => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${villa.images?.[0] || 'placeholder.jpg'}" alt="${escapeHtml(villa.name)}" loading="lazy">
      <div class="card-body">
        <h3>${escapeHtml(villa.name)}</h3>
        <p class="muted">${escapeHtml(villa.location || '')}</p>
        <button class="btn">View Details</button>
      </div>`;
    card.onclick = () => openModal(villa);
    container.appendChild(card);
  });
}

// ---------- SEARCH & FILTER ----------
$("#searchInput").addEventListener("input", debounce((e)=>{
  searchTerm = e.target.value.trim().toLowerCase();
  applyFilters();
}, 200));

$$(".chip").forEach(chip=>{
  chip.addEventListener("click", ()=>{
    $$(".chip").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

// default activate 'All'
(() => { const all = document.querySelector('.chip[data-filter="all"]'); if(all) all.classList.add("active"); })();

function applyFilters(){
  filtered = villas.filter(v=>{
    // search by name or location or types
    const q = searchTerm;
    let matchesSearch = true;
    if(q){
      const hay = (v.name + " " + (v.location||'') + " " + (v.type||[]).join(' ')).toLowerCase();
      matchesSearch = hay.includes(q);
    }

    // filter chips
    let matchesFilter = true;
    if(activeFilter && activeFilter !== "all"){
      if(activeFilter === "pool") matchesFilter = !!v.pool;
      else if(activeFilter === "beachside") matchesFilter = !!v.beachside;
      else matchesFilter = (v.type || []).includes(activeFilter);
    }

    return matchesSearch && matchesFilter;
  });

  renderCards();
}

// ---------- MODAL & GALLERY ----------
function openModal(v){
  $("#villaName").innerText = v.name || "";
  $("#villaLocation").innerText = v.location || "";
  $("#villaDescription").innerText = v.description || "";

  // types/tags
  const tC = $("#villaTypes"); tC.innerHTML = "";
  (v.type || []).forEach(t=>{
    const sp = document.createElement("span"); sp.className="tag"; sp.innerText = t; tC.appendChild(sp);
  });

  // amenities
  const am = $("#villaAmenities"); am.innerHTML = "";
  (v.amenities || []).forEach(a=>{
    const li = document.createElement("li"); li.innerText = a; am.appendChild(li);
  });

  $("#villaRooms").innerText = v.rooms || "-";
  $("#villaPool").innerText = v.pool ? "Yes" : "No";
  $("#villaBeachside").innerText = v.beachside ? "Yes" : "No";

  // gallery
  const gallery = $("#villaGallery"); gallery.innerHTML = "";
  (v.images || []).forEach(src=>{
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    gallery.appendChild(img);
  });

  // WhatsApp link with prefilled message
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const text = encodeURIComponent(`Hi! I want to book ${v.name} (${v.location}). Please help.`);
  $("#whatsappLink").href = `${base}?text=${text}`;

  // open modal
  $("#villaModal").style.display = "block";
  $("#villaModal").setAttribute("aria-hidden","false");
  // attach gallery arrow events
  setupGalleryArrows();
}

// close modal
function closeModal(){
  $("#villaModal").style.display = "none";
  $("#villaModal").setAttribute("aria-hidden","true");
}

// close when click outside
document.getElementById("villaModal").addEventListener("click",(e)=>{
  if(e.target === document.getElementById("villaModal")) closeModal();
});

// ESC closes
document.addEventListener("keydown",(e)=>{ if(e.key === "Escape") closeModal(); });

// ----- gallery navigation -----
function setupGalleryArrows(){
  const g = $("#villaGallery");
  const prev = $("#gPrev"), next = $("#gNext");
  if(!g) return;
  prev.onclick = ()=> scrollGallery(g, -1);
  next.onclick = ()=> scrollGallery(g, 1);
}

function scrollGallery(g, dir){
  const children = g.children;
  if(!children.length) return;
  const w = children[0].getBoundingClientRect().width + 10; // width + gap
  g.scrollBy({ left: dir * w, behavior: 'smooth' });
}

// small helper to escape text
function escapeHtml(s=""){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

// ---------- DARK MODE TOGGLE ----------
const darkBtn = document.getElementById("darkToggle");
darkBtn.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  // swap icon
  darkBtn.innerHTML = document.body.classList.contains("dark") ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
});

// ---------- UTILITY: open first villa if param ?id=X (optional) ----------
(function checkQueryOpen(){
  const p = new URLSearchParams(location.search).get('open');
  if(p){
    // wait until data loads
    const id = Number(p);
    const check = setInterval(()=>{
      const found = villas.find(x=>x.id==id);
      if(found){ openModal(found); clearInterval(check); }
    }, 200);
    setTimeout(()=>clearInterval(check), 5000);
  }
})();

