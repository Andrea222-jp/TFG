// ===== FORMATEAR TEXTO IA =====
function formatearTextoIA(texto) {

  let html = texto
    .replace(/💧 POR QUÉ ESTA RUTINA/gi, "<h4>💧 Por qué esta rutina</h4>")
    .replace(/🌙 DIFERENCIA DÍA \/ NOCHE/gi, "<h4>🌙 Diferencia día / noche</h4>")
    .replace(/🧴 CÓMO APLICARLA/gi, "<h4>🧴 Cómo aplicarla</h4>")
    .replace(/🌿 CONSEJOS/gi, "<h4>🌿 Consejos</h4>")
    .replace(/- (.+)/g, "<li>$1</li>");

  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

  return html;
}
let rutinaGlobal = null;


// ===== EVENTO FORMULARIO =====
document.getElementById("formSkincare").addEventListener("submit", function (e) {
  e.preventDefault();

  const tipoPiel = document.querySelector('input[name="tipoPiel"]:checked')?.value;
  const presupuesto = document.getElementById("presupuesto").value;

  const problemas = Array.from(
  document.querySelectorAll('input[name="problemas[]"]:checked')
)
.map(p => p.value)
.filter(p => p !== "ninguno");

const problemasLimpios = problemas.map(p => p.toLowerCase()).sort();
  const contenedor = document.getElementById("rutinaRecomendada");
  contenedor.innerHTML = "";

  if (!tipoPiel || !presupuesto) {
    contenedor.innerHTML = "<p>Por favor completa las opciones 🌸</p>";
    return;
  }

  // ===== PINTAR PRODUCTOS =====
  function pintar(titulo, lista) {
  if (!lista || lista.length === 0) return;

  contenedor.innerHTML += `<h3>${titulo}</h3>
  <div class="productos">` +

    lista.map(p => `
      <a href="${p.url || '#'}" target="_blank" class="producto">

  ${p.subtipo ? `<div class="badge-tipo">${p.subtipo}</div>` : ""}
  ${p.rating ? `<div class="badge-rating">⭐ ${p.rating}</div>` : ""}

  <img src="${p.img || 'img/default.jpg'}" alt="${p.nombre}">

  <span>${p.nombre}</span>

</a>
    `).join("") +

    `</div>`;
}

  // ===== LOADING =====
  contenedor.innerHTML += `
    <div class="explicacion loading">
      <h3>🤖 Creando tu rutina perfecta...</h3>
      <div class="shimmer"></div>
      <div class="shimmer"></div>
      <div class="shimmer"></div>
    </div>
  `;

  // ===== IA =====
  fetch("http://localhost:3000/generar-rutina-ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tipoPiel,
      problemas: problemasLimpios,
      presupuesto,
      catalogo
    })
  })
  .then(res => res.json())
  .then(data => {

    rutinaGlobal = data; // 🔥 GUARDAMOS LA RUTINA
    function buscarProducto(nombre) {
      const entry = Object.entries(catalogo)
        .find(([n]) => n === nombre);

      if (!entry) return null;

      return {
        nombre: entry[0],
        ...entry[1]
      };
    }

    const rutinaDia = (data.dia || []).map(buscarProducto).filter(Boolean);
    const rutinaNoche = (data.noche || []).map(buscarProducto).filter(Boolean);

    contenedor.innerHTML = "";

    pintar("🌞 Rutina de día", rutinaDia);
    pintar("🌙 Rutina de noche", rutinaNoche);

    const textoBonito = data.explicacion
      ? formatearTextoIA(data.explicacion)
      : "<p>No hay explicación disponible 😢</p>";

    contenedor.innerHTML += `
      <div class="explicacion">
        <h3>💡 ¿Por qué esta rutina?</h3>
        <div class="ia-texto">${textoBonito}</div>
      </div>
    `;

    // 👇 efecto app pro
    contenedor.scrollIntoView({ behavior: "smooth" });

  })
  .catch(err => {
    console.error("Error IA:", err);

    contenedor.innerHTML = `
      <div class="explicacion">
        <h3>💡 Error</h3>
        <p>No se pudo generar la rutina 😢</p>
      </div>
    `;
  });

});


// ===== GUARDAR =====
function guardarDatos() {

  const tipoPiel = document.querySelector('input[name="tipoPiel"]:checked')?.value;
  const presupuesto = document.getElementById("presupuesto").value;

  const problemas = Array.from(
    document.querySelectorAll('input[name="problemas[]"]:checked')
  )
  .map(p => p.value)
  .filter(p => p !== "ninguno"); // 🔥 CLAVE

  if (!tipoPiel || !presupuesto || !rutinaGlobal) {
    alert("Primero genera una rutina");
    return;
  }

  fetch("http://localhost:3000/guardar-formulario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: localStorage.getItem("sesion"),
      tipoPiel,
      problemas,
      presupuesto,
      rutinaDia: rutinaGlobal.dia,
      rutinaNoche: rutinaGlobal.noche,
      explicacion: rutinaGlobal.explicacion
    })
  })
  .then(() => {

    const msg = document.createElement("div");
    msg.innerText = "Rutina guardada 💖";

    msg.style.position = "fixed";
    msg.style.bottom = "20px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#d57a8a";
    msg.style.color = "white";
    msg.style.padding = "10px 20px";
    msg.style.borderRadius = "20px";

    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 2000);

  })
  .catch(err => console.error(err));
}

// ===== CONTROL "NINGUNO" (UX PRO) =====
document.querySelectorAll('input[name="problemas[]"]').forEach(input => {
  input.addEventListener("change", () => {

    if (input.value === "ninguno" && input.checked) {
      document.querySelectorAll('input[name="problemas[]"]').forEach(i => {
        if (i.value !== "ninguno") i.checked = false;
      });
    }

    if (input.value !== "ninguno" && input.checked) {
      const ninguno = document.querySelector('input[value="ninguno"]');
      if (ninguno) ninguno.checked = false;
    }

  });
});