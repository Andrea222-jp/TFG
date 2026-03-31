const email = localStorage.getItem("sesion");
const contenedor = document.getElementById("contenedorRutinas");

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

      data.forEach(r => {

        const problemas = JSON.parse(r.problemas || "[]");

        // ===== BUSCAR RUTINA
        const claves = Object.keys(rutinas);

        let mejorCoincidencia = null;
        let maxProblemas = -1;

        claves.forEach(clave => {

          if (!clave.startsWith(`base_${r.tipoPiel}`)) return;
          if (!clave.endsWith(`_${r.presupuesto}`)) return;

          const partes = clave.split("_").slice(2, -1).sort();

          const coincide = partes.every(p => problemas.includes(p));

          if (coincide && partes.length > maxProblemas) {
            mejorCoincidencia = clave;
            maxProblemas = partes.length;
          }

        });

        let rutinaBase = mejorCoincidencia
          ? rutinas[mejorCoincidencia]
          : rutinas[`base_${r.tipoPiel}_${r.presupuesto}`];

        if (!rutinaBase) return;

        const rutinaFinal = JSON.parse(JSON.stringify(rutinaBase));

        function pintar(titulo, lista){
          if(!lista) return "";

          return `
            <h4 style="margin-top:15px; color:#d57a8a;">${titulo}</h4>
            <div class="productos">` +

            lista.map(p => `
              <a href="${p.url || '#'}" target="_blank" class="producto">
                <img src="${p.img || 'img/default.jpg'}">
                <span>${p.nombre}</span>
              </a>
            `).join("") +

            `</div>`;
        }

        contenedor.innerHTML += `
          <div class="card">
            <div class="info">
              <p><b>Tipo:</b> ${r.tipoPiel}</p>
              <p><b>Problemas:</b> ${problemas.join(", ")}</p>
              <p><b>Presupuesto:</b> ${r.presupuesto}</p>
            </div>

            ${pintar("🌞 Rutina de día", rutinaFinal.dia)}
            ${pintar("🌙 Rutina de noche", rutinaFinal.noche)}
            ${pintar("✨ Extra semanal", rutinaFinal.extraSemanal)}
          </div>
        `;

      });

    });
}