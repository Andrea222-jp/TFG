const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

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
      presupuesto TEXT
    )
  `);
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

// ===== LOGIN (COMPARAR HASH) =====
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

// ===== GUARDAR FORMULARIO =====
app.post("/guardar-formulario", (req, res) => {
  const { email, tipoPiel, problemas, presupuesto } = req.body;

  const query = `
    INSERT INTO respuestas (email, tipoPiel, problemas, presupuesto)
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    query,
    [email, tipoPiel, JSON.stringify(problemas), presupuesto],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error guardando datos" });
      }

      res.json({ mensaje: "Formulario guardado correctamente" });
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
      res.json(rows);
    }
  );
});

// ===== INICIAR SERVIDOR =====
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});