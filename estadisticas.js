fetch("http://localhost:3000/estadisticas")
  .then(res => res.json())
  .then(data => {

    const conteoPiel = {};
    const conteoProblemas = {};

    data.forEach(d => {

      conteoPiel[d.tipoPiel] = (conteoPiel[d.tipoPiel] || 0) + 1;

      const problemas = JSON.parse(d.problemas || "[]");

      problemas.forEach(p => {
        conteoProblemas[p] = (conteoProblemas[p] || 0) + 1;
      });

    });

    // 🌸 GRÁFICA PIEL
    new Chart(document.getElementById("graficaPiel"), {
      type: "bar",
      data: {
        labels: Object.keys(conteoPiel),
        datasets: [{
          label: "Tipos de piel",
          data: Object.values(conteoPiel),
          backgroundColor: [
            "#f8b4f8",
            "#f497a8",
            "#ffccfc",
            "#ffb3df",
            "#e6beda",
            "#a84f5f"
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 🌸 GRÁFICA PROBLEMAS
    new Chart(document.getElementById("graficaProblemas"), {
      type: "pie",
      data: {
        labels: Object.keys(conteoProblemas),
        datasets: [{
          data: Object.values(conteoProblemas),
          backgroundColor: [
            "#ffd6dc",
            "#ffb3df",
            "#fb8fff",
            "#ffc3fc",
            "#e67c93",
            "#d57acd",
            "#ffadbc",
            "#a84f5f"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  });