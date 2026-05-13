// ===== EVENTO FORMULARIO =====
document.getElementById("formSkincare").addEventListener("submit", function (e) {
  e.preventDefault();

  // ===== TIPO DE PIEL (RADIO)
  const tipoPiel = document.querySelector('input[name="tipoPiel"]:checked')?.value;

  const presupuesto = document.getElementById("presupuesto").value;

  // ===== PROBLEMAS
  const problemas = Array.from(
    document.querySelectorAll('input[name="problemas[]"]:checked')
  ).map(p => p.value);

  const problemasLimpios = problemas
    .filter(p => p !== "ninguno")
    .map(p => p.toLowerCase())
    .sort();

  const contenedor = document.getElementById("rutinaRecomendada");
  contenedor.innerHTML = "";

  // ===== VALIDACIÓN
  if (!tipoPiel || !presupuesto) {
    contenedor.innerHTML = "<p>Por favor completa las opciones 🌸</p>";
    return;
  }

  // ===== BUSCAR RUTINA
  const claves = Object.keys(rutinas);

  let mejorCoincidencia = null;
  let maxProblemas = -1;

  claves.forEach(clave => {

    if (!clave.startsWith(`base_${tipoPiel}`)) return;
    if (!clave.endsWith(`_${presupuesto}`)) return;

    const partes = clave.split("_").slice(2, -1).filter(p => p !== "extrema").sort();

    const coincide = partes.every(p => problemasLimpios.includes(p));

    if (coincide && partes.length > maxProblemas) {
      mejorCoincidencia = clave;
      maxProblemas = partes.length;
    }

  });

  let rutinaBase = mejorCoincidencia
    ? rutinas[mejorCoincidencia]
    : rutinas[`base_${tipoPiel}_${presupuesto}`];

  if (!rutinaBase) {
    contenedor.innerHTML = "<p>No hay rutina para esta combinación 💔</p>";
    return;
  }

  const rutinaFinal = JSON.parse(JSON.stringify(rutinaBase));

  // ===== MOSTRAR
  function pintar(titulo, lista){
    if(!lista) return;

    contenedor.innerHTML += `<h3>${titulo}</h3>
    <div class="productos">` +

    lista.map(p => `
      <a href="${p.url || '#'}" target="_blank" class="producto">
        <img src="${p.img || 'img/default.jpg'}" alt="${p.nombre}">
        <span>${p.nombre}</span>
      </a>
    `).join("") +

    `</div>`;
  }

  pintar("🌞 Rutina de día", rutinaFinal.dia);
  pintar("🌙 Rutina de noche", rutinaFinal.noche);
  pintar("✨ Extra semanal", rutinaFinal.extraSemanal);
});


// ===== FUNCIÓN GUARDAR (FUERA DEL SUBMIT 🔥)
function guardarDatos() {

  const tipoPiel = document.querySelector('input[name="tipoPiel"]:checked')?.value;
  const presupuesto = document.getElementById("presupuesto").value;

  const problemas = Array.from(
    document.querySelectorAll('input[name="problemas[]"]:checked')
  ).map(p => p.value);

  if (!tipoPiel || !presupuesto) {
    alert("Completa el formulario primero");
    return;
  }

  fetch("http://localhost:3000/guardar-formulario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: localStorage.getItem("sesion"),
      tipoPiel: tipoPiel,
      problemas: problemas,
      presupuesto: presupuesto
    })
  })
  .then(() => alert("Rutina guardada 💾"))
  .catch(() => alert("Error guardando"));
}