let villas = [];

// Load JSON
fetch("villas.json?v=4", { cache: "no-store" })
  .then(res => res.json())
  .then(data => {
      villas = data;
      loadVillaCards();
  });

// Render cards
function loadVillaCards() {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    villas.forEach(villa => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.onclick = () => openModal(villa);

        card.innerHTML = `
            <img src="${villa.images[0]}">
            <h3>${villa.name}</h3>
            <p>${villa.location}</p>
            <button>View Details</button>
        `;

        container.appendChild(card);
    });
}

// Open modal
function openModal(villa) {
    document.getElementById("villaName").innerText = villa.name;
    document.getElementById("villaLocation").innerText = villa.location;
    document.getElementById("villaDescription").innerText = villa.description;

    // Types
    const typeContainer = document.getElementById("villaTypes");
    typeContainer.innerHTML = "";
    villa.type.forEach(t => {
        const tag = document.createElement("span");
        tag.classList.add("tag");
        tag.innerText = t;
        typeContainer.appendChild(tag);
    });

    // Rooms, pool, beachside
    document.getElementById("villaRooms").innerText = `Rooms: ${villa.rooms}`;
    document.getElementById("villaPool").innerText = `Private Pool: ${villa.pool ? "Yes" : "No"}`;
    document.getElementById("villaBeachside").innerText = `Beachside: ${villa.beachside ? "Yes" : "No"}`;

    // Amenities
    const list = document.getElementById("villaAmenities");
    list.innerHTML = "";
    villa.amenities.forEach(a => {
        const li = document.createElement("li");
        li.innerText = a;
        list.appendChild(li);
    });

    // Gallery
    const gallery = document.getElementById("villaGallery");
    gallery.innerHTML = "";
    villa.images.forEach(img => {
        const image = document.createElement("img");
        image.src = img;
        gallery.appendChild(image);
    });

    document.getElementById("villaModal").style.display = "block";
}

// Close modal
function closeModal() {
    document.getElementById("villaModal").style.display = "none";
}

