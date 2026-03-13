document.getElementById("formSkincare").addEventListener("submit", function (e) {
  e.preventDefault();

  // ===== TIPOS DE PIEL =====
  const tiposPiel = Array.from(
    document.querySelectorAll('input[name="tipoPiel[]"]:checked')
  ).map(el => el.value);

  const tipoPiel = tiposPiel[0]; // usamos el primero

  const presupuesto = document.getElementById("presupuesto").value;

  // ===== PROBLEMAS =====
  const problemas = Array.from(
    document.querySelectorAll('input[name="problemas[]"]:checked')
  ).map(p => p.value);

  const problemasLimpios = problemas
    .filter(p => p !== "ninguno")
    .map(p => p.toLowerCase())
    .sort(); // ⭐ IMPORTANTÍSIMO

  const contenedor = document.getElementById("rutinaRecomendada");
  contenedor.innerHTML = "";

  if (!tipoPiel || !presupuesto) {
    contenedor.innerHTML = "<p>Por favor completa las opciones 🌸</p>";
    return;
  }

  // ===== BUSCAR RUTINA =====
  const claves = Object.keys(rutinas);

  let mejorCoincidencia = null;
  let maxProblemas = -1;

  claves.forEach(clave => {

    if (!clave.startsWith(`base_${tipoPiel}`)) return;
    if (!clave.endsWith(`_${presupuesto}`)) return;

    // Extraemos las partes entre tipo y presupuesto, ignorando 'extrema'
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

  // clonar rutina
  const rutinaFinal = JSON.parse(JSON.stringify(rutinaBase));

  // ===== AJUSTES DINÁMICOS =====
 // ===== AJUSTES DINÁMICOS (solo cambios) =====
const ajustes = {
  rojeces: r => agregarExtra(r,"Mascarilla calmante","Reduce rojeces y calma."),
  arrugas: r => agregarNoche(r,"Sérum antiarrugas","Reduce líneas finas."),
  acne: r => agregarNoche(r,"Tratamiento antiacné","Reduce granitos."),
  manchas: r => agregarDia(r,"Sérum despigmentante","Unifica el tono."),
  poros: r => agregarExtra(r,"Exfoliante BHA","Limpia poros."),
  luminosidad: r => agregarDia(r,"Sérum iluminador","Aporta luz."),
  sensibilidad: r => agregarDia(r,"Crema calmante","Refuerza barrera."),
  congestion: r => agregarExtra(r,"Exfoliación suave","Descongestiona poros.")
};

// ===== FUNCIONES DE AGREGAR (solo cambian para evitar duplicados) =====
function agregarDia(r,nombre,desc){
  r.dia = r.dia || [];
  if(!r.dia.some(p => p.nombre === nombre)) {
    r.dia.push({nombre,desc});
  }
}

function agregarNoche(r,nombre,desc){
  r.noche = r.noche || [];
  if(!r.noche.some(p => p.nombre === nombre)) {
    r.noche.push({nombre,desc});
  }
}

function agregarExtra(r,nombre,desc){
  r.extraSemanal = r.extraSemanal || [];
  if(!r.extraSemanal.some(p => p.nombre === nombre)) {
    r.extraSemanal.push({nombre,desc});
  }
}

  // ===== MOSTRAR =====
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
