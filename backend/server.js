require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer"); 
const OpenAI = require("openai");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== 🤖 OPENAI =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== 📩 CONFIG GMAIL =====
const EMAIL = process.env.EMAIL;
const PASS = process.env.PASS;        

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: PASS
  }
});

// 👉 comprobar que funciona
transporter.verify((error) => {
  if (error) {
    console.log("Error con el correo ❌", error);
  } else {
    console.log("Servidor listo para enviar emails ✅");
  }
});

// ===== BASE DE DATOS =====
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error conectando a la base de datos", err);
  } else {
    console.log("Conectado a SQLite");
  }
});

// ===== CREAR TABLAS =====
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS respuestas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      tipoPiel TEXT,
      problemas TEXT,
      presupuesto TEXT,
      favorita INTEGER DEFAULT 0
    )
  `);

  // ⭐ ya existente
  db.run(`
    ALTER TABLE respuestas ADD COLUMN favorita INTEGER DEFAULT 0
  `, (err) => {
    if (err) {
      console.log("Columna favorita ya existe 👍");
    } else {
      console.log("Columna favorita añadida 💖");
    }
  });

  // 🔥 NUEVAS COLUMNAS
  db.run(`ALTER TABLE respuestas ADD COLUMN rutinaDia TEXT`, () => {});
  db.run(`ALTER TABLE respuestas ADD COLUMN rutinaNoche TEXT`, () => {});
  db.run(`ALTER TABLE respuestas ADD COLUMN explicacion TEXT`, () => {});
});


// ===== REGISTRO (CON HASH) =====
app.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuarios (nombre, email, password)
      VALUES (?, ?, ?)
    `;

    db.run(query, [nombre, email, hash], function (err) {
      if (err) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }

      res.json({ mensaje: "Usuario registrado correctamente" });
    });

  } catch (error) {
    res.status(500).json({ error: "Error encriptando contraseña" });
  }
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM usuarios WHERE email = ?`;

  db.get(query, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const valido = await bcrypt.compare(password, user.password);

    if (!valido) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    res.json({
      mensaje: "Login correcto",
      usuario: user
    });
  });
});

// ===== 💌 RECUPERAR CONTRASEÑA =====
app.post("/recuperar", (req, res) => {
  const { email } = req.body;

  console.log("📩 EMAIL RECIBIDO:", email); // 👈 AÑADE ESTO

  db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {

    if (!user) {
      return res.status(404).json({ error: "No existe ese email" });
    }

    const nuevaPass = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(nuevaPass, 10);

    db.run("UPDATE usuarios SET password = ? WHERE email = ?", [hash, email]);

    try {
      await transporter.sendMail({
  from: `"Skinmatch 🧴" <${EMAIL}>`,
  to: email,
  subject: "Recuperar contraseña",
  text: `Tu nueva contraseña es: ${nuevaPass}`
});

      res.json({ mensaje: "Nueva contraseña enviada 💖" });

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error enviando email" });
    }

  });
});


// ===== 🔐 CAMBIAR CONTRASEÑA =====
app.put("/cambiar-password", async (req, res) => {
  const { email, nuevaPassword } = req.body;

  if (!email || !nuevaPassword) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hash = await bcrypt.hash(nuevaPassword, 10);

    db.run(
      "UPDATE usuarios SET password = ? WHERE email = ?",
      [hash, email],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Error cambiando contraseña" });
        }

        res.json({ mensaje: "Contraseña actualizada 💖" });
      }
    );

  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ===== GUARDAR FORMULARIO =====
app.post("/guardar-formulario", async (req, res) => {
  const { 
    email, 
    tipoPiel, 
    problemas, 
    presupuesto, 
    rutinaDia, 
    rutinaNoche, 
    explicacion 
  } = req.body;

   console.log("Guardando problemas:", problemas);

  try {

    db.run(
      `INSERT INTO respuestas 
      (email, tipoPiel, problemas, presupuesto, rutinaDia, rutinaNoche, explicacion) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        tipoPiel,
        JSON.stringify(problemas),
        presupuesto,
        JSON.stringify(rutinaDia),
        JSON.stringify(rutinaNoche),
        explicacion || ""
      ],
      function (err) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Error guardando" });
        }

        res.json({ mensaje: "Rutina guardada 💖" });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando rutina" });
  }
});

// ===== ⭐ MARCAR FAVORITA =====
app.get("/favorita/:id", (req, res) => {
  const id = req.params.id;

  console.log("Toggle favorita:", id);

  db.run(
    `UPDATE respuestas 
     SET favorita = CASE 
       WHEN favorita = 1 THEN 0 
       ELSE 1 
     END 
     WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error actualizando favorita" });
      }

      res.json({ mensaje: "Favorita actualizada ⭐" });
    }
  );
});

// ===== ESTADISTICAS =====
app.get("/estadisticas", (req, res) => {
  db.all("SELECT tipoPiel, problemas, presupuesto FROM respuestas", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error obteniendo datos" });
    }
    res.json(rows);
  });
});

// ===== MIS RUTINAS =====
app.get("/mis-rutinas/:email", (req, res) => {
  const email = req.params.email;

  db.all(
    "SELECT * FROM respuestas WHERE email = ?",
    [email],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error obteniendo datos" });
      }

      const limpias = rows.map(r => ({
        ...r,
        problemas: JSON.parse(r.problemas || "[]"),
        rutinaDia: JSON.parse(r.rutinaDia || "[]"),
        rutinaNoche: JSON.parse(r.rutinaNoche || "[]")
      }));

      res.json(limpias);
    }
  );
});
// ===== 🗑️ ELIMINAR RUTINA =====
app.delete("/eliminar-rutina/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM respuestas WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error eliminando rutina" });
    }

    res.json({ mensaje: "Rutina eliminada 🗑️" });
  });
});


app.post("/generar-rutina-ia", async (req, res) => {
  try {
    const { tipoPiel, problemas, presupuesto, catalogo } = req.body;

    const tipo = tipoPiel.toLowerCase();
    const probs = (problemas || [])
  .filter(p => typeof p === "string")
  .map(p => p.toLowerCase());
    const precio = presupuesto.toLowerCase();

    // ===== NORMALIZAR =====
    const productos = Object.entries(catalogo).map(([nombre, p]) => ({
      nombre,
      ...p,
      piel: (p.piel || [])
  .filter(x => typeof x === "string")
  .map(x => x.toLowerCase()),

precio: (p.precio || [])
  .filter(x => typeof x === "string")
  .map(x => x.toLowerCase()),

problemas: (p.problemas || [])
  .filter(x => typeof x === "string")
  .map(x => x.toLowerCase()),
    }));

    // ===== HELPERS =====
    function random(lista) {
  if (!lista || lista.length === 0) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}

    function filtrar(cat) {
      return productos.filter(p => p.categoria === cat);
    }

    // ✅ PICK PRO (respeta presupuesto SIEMPRE)
    function pick(cat) {

  let lista = productos.filter(p =>
    p.categoria === cat &&
    p.precio.includes(precio)
  );

  if (lista.length) {
    const sub = lista.filter(p => p.piel.includes(tipo));
    return random(sub.length ? sub : lista).nombre;
  }

  // 🔴 fallback controlado (NO rompe)
  lista = productos.filter(p => p.categoria === cat);

  if (!lista.length) return null;

  return random(lista).nombre;
}

    // ✅ PICK SUBTIPO PRO
    function pickSubtipo(cat, subtipo) {
      let lista = productos.filter(p =>
        p.categoria === cat &&
        p.subtipo === subtipo &&
        p.precio.includes(precio)
      );

      if (lista.length) return random(lista).nombre;

      lista = productos.filter(p =>
        p.categoria === cat &&
        p.subtipo === subtipo
      );

      return random(lista)?.nombre;
    }

    // ===== 🧼 LIMPIEZA PERFECTA =====
    function limpieza(tipoRutina) {

      const aceite = pickSubtipo("limpiador", "aceite");
      const espuma = pickSubtipo("limpiador", "espuma");
      const balsamo = pickSubtipo("limpiador", "balsamo");

      // 🌞 DÍA
      if (tipoRutina === "dia") {
        if (espuma) return [espuma];
        if (balsamo) return [balsamo];
        return [pickSubtipo("limpiador", "espuma") || pickSubtipo("limpiador", "balsamo")].filter(Boolean);
      }

      // 🌙 NOCHE
      if (aceite) {
        const espumaOK = espuma || pickSubtipo("limpiador", "espuma");
        if (espumaOK) return [aceite, espumaOK];
      }

      if (espuma) return [espuma];
      if (balsamo) return [balsamo];

      return [pick("limpiador")].filter(Boolean);
    }

    // ===== 💧 ESENCIA =====
    function necesitaEsencia() {
      const t = probs.join(" ");
      return (
        tipo.includes("seca") ||
        tipo.includes("sensible") ||
        t.includes("deshidratacion") ||
        t.includes("arrugas") ||
        t.includes("manchas")
      );
    }

    // ===== 🧖‍♀️ MASCARILLA COHERENTE =====
    function pickMascarilla() {
      let lista = filtrar("mascarilla");
      const t = probs.join(" ");

      if (t.includes("acne")) lista = lista.filter(p => p.problemas.includes("acne"));
      else if (t.includes("manchas")) lista = lista.filter(p => p.problemas.includes("manchas"));
      else if (t.includes("arrugas")) lista = lista.filter(p => p.problemas.includes("arrugas"));

      if (!lista.length) lista = filtrar("mascarilla");

      return random(lista)?.nombre;
    }

    function necesitaMascarilla() {
      const t = probs.join(" ");
      return t.includes("acne") || t.includes("manchas") || t.includes("arrugas");
    }

    // ===== 🌞 DÍA =====
    function rutinaDia() {
      let r = [
        ...limpieza("dia"),
        pick("tonico"),
        pick("serum"),
        pick("hidratante"),
        pick("protector solar")
      ];

      if (necesitaEsencia()) {
        r.splice(2, 0, pick("esencia"));
      }

      return r.filter(Boolean);
    }

    // ===== 🌙 NOCHE =====
    function rutinaNoche() {
      let r = [
        ...limpieza("noche"),
        pick("tonico"),
        pick("serum"),
        pick("contorno"),
        pick("hidratante")
      ];

      if (necesitaEsencia()) {
        r.splice(2, 0, pick("esencia"));
      }

      if (necesitaMascarilla() && Math.random() > 0.6) {
  r.splice(3, 0, pickMascarilla()); // 👈 después del serum
}

      return r.filter(Boolean);
    }

    let data = {
      dia: rutinaDia(),
      noche: rutinaNoche(),
      explicacion: ""
    };

    // ===== 🧠 LIMPIAR (SIN ROMPER DOBLE LIMPIEZA) =====
    function limpiar(lista, tipo) {
      const usadas = new Set();

      return lista.filter(nombre => {
        const p = catalogo[nombre];
        if (!p) return false;

        // ❌ reglas
        if (tipo === "dia" && p.categoria === "contorno") return false;
        if (tipo === "dia" && p.subtipo === "aceite") return false;
        if (tipo === "noche" && p.categoria === "protector solar") return false;

        // ✅ permitir doble limpieza
        if (tipo === "noche" && p.categoria === "limpiador") return true;

        if (usadas.has(p.categoria)) return false;
        usadas.add(p.categoria);

        return true;
      });
    }

    // ===== 📊 ORDEN PRO =====
    function ordenar(lista) {
  const orden = [
    "limpiador",
    "tonico",
    "esencia",
    "serum",
    "mascarilla",
    "contorno",
    "hidratante",
    "protector solar"
  ];

  return lista.sort((a, b) => {
    const pa = catalogo[a];
    const pb = catalogo[b];

    if (!pa || !pb) return 0; // 🔴 EVITA CRASH

    return orden.indexOf(pa.categoria) - orden.indexOf(pb.categoria);
  });
}

    data.dia = ordenar(limpiar(data.dia, "dia"));
    data.noche = ordenar(limpiar(data.noche, "noche"));

    // ===== 🤖 IA (SOLO TEXTO) =====
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1100,
      messages: [
        {
          role: "user",
          content: `
Eres dermatóloga experta.

Explica esta rutina de skincare de forma clara.

NO uses markdown, ni **, ni ---.

Formato:

💧 POR QUÉ ESTA RUTINA
texto

🌙 DIFERENCIA DÍA / NOCHE
texto

🧴 CÓMO APLICARLA
texto

🌿 CONSEJOS
texto

Tipo de piel: ${tipoPiel}
Problemas: ${problemas.join(", ")}

Rutina día: ${data.dia.join(", ")}
Rutina noche: ${data.noche.join(", ")}
`
        }
      ]
    });

    data.explicacion = respuesta?.choices?.[0]?.message?.content || "Rutina generada correctamente";
    res.json(data);

  } catch (error) {
    console.error("ERROR IA:", error);

    res.json({
      dia: [],
      noche: [],
      explicacion: "Error generando rutina 😢"
    });
  }
});

// ===== 🧠 ANALIZAR PIEL IA =====
app.post("/analizar-piel-ia", async (req, res) => {

  const { tipoPiel, sensibilidad, brillo, tirantez, problemas } = req.body;

  const prompt = `
Eres dermatóloga experta.

IMPORTANTE:
- NO uses markdown
- NO uses \`\`\`
- NO pongas "html"
- SOLO devuelve HTML limpio

Analiza este perfil:

Tipo de piel: ${tipoPiel}
Sensibilidad: ${sensibilidad}
Brillo: ${brillo}
Tirantez: ${tirantez}
Problemas: ${(problemas || []).join(", ") || "ninguno"}

Responde en HTML bonito con:

<h4> Diagnóstico</h4>
texto

<h4> Explicación</h4>
texto

<h4>🧴 Consejos</h4>
<ul>
<li>Consejo 1</li>
<li>Consejo 2</li>
<li>Consejo 3</li>
</ul>
`;

  try {
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({
      resumen: respuesta.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error IA" });
  }
});

// ===== SERVER =====
app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});