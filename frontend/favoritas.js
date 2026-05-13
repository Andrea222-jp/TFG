const email = localStorage.getItem("sesion");
const contenedor = document.getElementById("contenedorFavoritas");


// ===== GENERAR RUTINA DESDE CATALOGO =====
function generarRutina({ tipoPiel, problemas, presupuesto }) {

  presupuesto = presupuesto.toLowerCase();

  const estructura = {
    dia: ["limpiador", "tonico", "serum", "hidratante", "protector solar"],
    noche: ["limpiador", "tonico", "serum", "hidratante"]
  };

  function filtrarProductos(categoria) {

    let filtrados = Object.entries(catalogo)
      .filter(([nombre, p]) =>
        p.categoria === categoria &&
        p.piel.includes(tipoPiel) &&
        p.precio.includes(presupuesto) &&
        (
          problemas.length === 0 ||
          problemas.some(pr => p.problemas.includes(pr))
        )
      );

    // 🔥 fallback si no encuentra nada
    if (filtrados.length === 0) {
      filtrados = Object.entries(catalogo)
        .filter(([nombre, p]) =>
          p.categoria === categoria &&
          p.piel.includes(tipoPiel)
        );
    }

    return filtrados.map(([nombre, p]) => ({
      nombre,
      ...p
    }));
  }

  function construir(lista) {
    return lista.map(cat => {
      const productos = filtrarProductos(cat);

      if (productos.length === 0) return null;

      return productos[Math.floor(Math.random() * productos.length)];
    }).filter(Boolean);
  }

  return {
    dia: construir(estructura.dia),
    noche: construir(estructura.noche)
  };
}


// ===== CARGAR FAVORITAS =====
if (!email) {
  contenedor.innerHTML = "<p>No hay sesión</p>";
} else {

  fetch(`http://localhost:3000/mis-rutinas/${email}`)
    .then(res => res.json())
    .then(data => {

      const favoritas = data.filter(r => r.favorita == 1);

      if (favoritas.length === 0) {
        contenedor.innerHTML = "<p>No tienes favoritas aún 💔</p>";
        return;
      }

      let html = "";

      favoritas.forEach(r => {

        const problemas = r.problemas || [];

       const rutinaFinal = {
  dia: r.rutinaDia || [],
  noche: r.rutinaNoche || []
};
        function pintar(titulo, lista){
          if(!lista || lista.length === 0) return "";

          return `
            <h4 style="margin-top:15px; color:#d57a8a;">${titulo}</h4>
            <div class="productos">` +

            lista.map(nombre => {

  const p = catalogo[nombre] || {};

  return `
    <a href="${p.url || '#'}" target="_blank" class="producto">
      <img src="${p.img || 'img/default.jpg'}">
      <span>${nombre}</span>
    </a>
  `;
})
            
            .join("") +

            `</div>`;
        }

        html += `
          <div class="card">

            <div class="info">
              <p><b>Tipo:</b> ${r.tipoPiel}</p>
              <p><b>Problemas:</b> ${problemas.join(", ")}</p>
              <p><b>Presupuesto:</b> ${r.presupuesto}</p>
            </div>

            ${pintar("🌞 Rutina de día", rutinaFinal.dia)}
            ${pintar("🌙 Rutina de noche", rutinaFinal.noche)}

          </div>
        `;
      });

      contenedor.innerHTML = html;

    })
    .catch(err => {
      console.error(err);
      contenedor.innerHTML = "<p>Error cargando favoritas</p>";
    });
}