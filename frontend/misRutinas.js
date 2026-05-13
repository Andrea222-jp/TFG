const email = localStorage.getItem("sesion");
const contenedor = document.getElementById("contenedorRutinas");

function safeParse(data) {
  try {
    if (!data) return [];

    if (Array.isArray(data)) return data;

    if (typeof data === "string") {

      try {
        return JSON.parse(data);
      } catch {

        const limpio = data
          .replace(/^\[/, "")
          .replace(/\]$/, "")
          .replace(/'/g, "");

        return limpio
          .split(",")
          .map(x => x.trim())
          .filter(Boolean);
      }
    }

    return [];

  } catch (e) {
    console.log("Error parseando:", data);
    return [];
  }
}
if (!email) {
  contenedor.innerHTML = "<p style='text-align:center;'>No hay sesión iniciada</p>";
} else {

  fetch(`http://localhost:3000/mis-rutinas/${email}`)
    .then(res => res.json())
    .then(data => {

      if (!data || data.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center;'>No tienes rutinas guardadas</p>";
        return;
      }

      let html = "";

      // ✅ función pintar
       function pintar(titulo, lista) {
        if (!lista || lista.length === 0) return "";

        const productos = lista.map(nombre => ({
          nombre,
          data: catalogo?.[nombre] 
        })).filter(p => p.data);

        let bloque = `
          <h4 style="margin-top:15px; color:#d57a8a;">${titulo}</h4>
          <div class="productos">
        `;

        bloque += productos.map(({ nombre, data }) => `
          <a href="${data.url || '#'}" target="_blank" class="producto">
            ${data.subtipo ? `<div class="badge-tipo">${data.subtipo}</div>` : ""}
            ${data.rating ? `<div class="badge-rating">⭐ ${data.rating}</div>` : ""}
            <img src="${data.img || 'img/default.jpg'}">
            <span>${nombre}</span>
          </a>
        `).join("");

        bloque += `</div>`;
        return bloque;
      }

      // ✅ pintar todas las rutinas
      data.forEach(r => {
         console.log("RAW problemas:", r.problemas);

let problemas = safeParse(r.problemas);

// 🔥 FILTRO INTELIGENTE
problemas = problemas.filter(p => 
  typeof p === "string" &&
  p.length < 30 &&        // evita nombres largos (productos)
  !p.includes(" ")        // evita strings tipo "CeraVe Cleanser"
);
        const rutinaFinal = {
          dia: safeParse(r.rutinaDia),
          noche: safeParse(r.rutinaNoche)
        };

        const corazon = r.favorita == 1 ? "❤️" : "🤍";

        html += `
          <div class="card">

            <div class="card-header">
              <span class="eliminar" onclick="eliminarRutina(event, ${r.id})">🗑️</span>
              <span class="corazon" onclick="toggleFavorita(event, ${r.id}, this)">
                ${corazon}
              </span>
            </div>

            <div class="info">
  <p><b>Tipo:</b> ${r.tipoPiel}</p>
  <p><b>Problemas:</b> ${problemas.length > 0 ? problemas.join(", ") : "Sin problemas"}</p>
  <p><b>Presupuesto:</b> ${r.presupuesto}</p>
</div>

            ${pintar("🌞 Rutina de día", rutinaFinal.dia)}
            ${pintar("🌙 Rutina de noche", rutinaFinal.noche)}

          </div>
        `;
      });
      contenedor.innerHTML = html;

    })
    .catch(error => {
      console.error(error);
      contenedor.innerHTML = "<p>Error cargando rutinas</p>";
    });
}

// ❤️ FAVORITA
function toggleFavorita(event, id, corazon) {

  event.preventDefault();
  event.stopPropagation();

  corazon.textContent = corazon.textContent === "🤍" ? "❤️" : "🤍";

  fetch(`http://localhost:3000/favorita/${id}`)
    .catch(err => console.error(err));
}


// 🗑️ ELIMINAR RUTINA
function eliminarRutina(event, id) {

  fetch(`http://localhost:3000/eliminar-rutina/${id}`, {
    method: "DELETE"
  })
  .then(() => {

    const card = event.target.closest(".card");

    card.style.transition = "0.3s";
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";

    setTimeout(() => {
      card.remove();
    }, 300);

  })
  .catch(err => console.error(err));
}


// 🔐 CAMBIAR CONTRASEÑA
function cambiarPass() {

  const nuevaPassword = document.getElementById("nuevaPass").value;
  const email = localStorage.getItem("sesion");

  if (!nuevaPassword) {
    alert("Escribe una contraseña");
    return;
  }

  fetch("http://localhost:3000/cambiar-password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      nuevaPassword
    })
  })
  .then(res => res.json())
  .then(() => {

    const msg = document.createElement("div");
    msg.innerText = "Contraseña actualizada 💖";

    msg.style.position = "fixed";
    msg.style.bottom = "25px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#d57a8a";
    msg.style.color = "white";
    msg.style.padding = "10px 20px";
    msg.style.borderRadius = "20px";
    msg.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";

    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 2000);

    document.getElementById("nuevaPass").value = "";
  })
  .catch(err => console.error(err));
}