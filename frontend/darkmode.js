// ===== BOTON DARK MODE =====

const btnDark = document.getElementById("toggleDark");

// aplicar modo guardado
if(localStorage.getItem("modo") === "oscuro"){
document.body.classList.add("dark");
}

// click
if(btnDark){

btnDark.addEventListener("click", () => {

document.body.classList.toggle("dark");

if(document.body.classList.contains("dark")){
localStorage.setItem("modo","oscuro");
}else{
localStorage.setItem("modo","claro");
}

});

}