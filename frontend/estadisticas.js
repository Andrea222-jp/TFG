// ===========================
// ESTADISTICAS.JS PREMIUM
// ===========================

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

/* KPI */

document.getElementById("totalUsuarios").textContent = data.length;

const topPiel = Object.entries(conteoPiel).sort((a,b)=>b[1]-a[1])[0];
document.getElementById("topPiel").textContent =
topPiel ? topPiel[0] : "-";

const topProblema = Object.entries(conteoProblemas).sort((a,b)=>b[1]-a[1])[0];
document.getElementById("topProblema").textContent =
topProblema ? topProblema[0] : "-";

document.getElementById("totalProblemas").textContent =
Object.values(conteoProblemas).reduce((a,b)=>a+b,0);

/* GRAFICA BARRAS */

new Chart(document.getElementById("graficaPiel"), {
type:"bar",
data:{
labels:Object.keys(conteoPiel),
datasets:[{
data:Object.values(conteoPiel),
backgroundColor:[
"#f5b8cb",
"#d97f98",
"#e8a6bb",
"#f4c9d7",
"#c77790",
"#ebb3c4"
],
borderRadius:12
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{display:false}
},
scales:{
y:{
beginAtZero:true,
grid:{color:"rgba(0,0,0,.05)"}
},
x:{
grid:{display:false}
}
}
}
});

/* GRAFICA DONUT */

new Chart(document.getElementById("graficaProblemas"), {
type:"doughnut",
data:{
labels:Object.keys(conteoProblemas),
datasets:[{
data:Object.values(conteoProblemas),
backgroundColor:[
"#ffd4df",
"#f8b5ca",
"#e28ca9",
"#d97f98",
"#f4c1d2",
"#c96d89",
"#ebb0c3",
"#f8dbe5"
],
borderWidth:2,
borderColor:"#fff"
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
cutout:"58%",
plugins:{
legend:{
position:"top",
labels:{
padding:16,
font:{
family:"Manrope",
size:12,
weight:"700"
}
}
}
}
}
});

});