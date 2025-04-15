const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configurer la connexion à la base de données MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "seimad",
});

db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    return;
  }
  console.log("Connecté à la base de données MySQL");
});

app.get("/", (req, res) => {
  res.send("Bienvenue sur la page accueil");
  // res.write('Hello');
});

// Route pour récupérer les appareils
app.get("/api/devices", (_, res) => {
  const query = "SELECT * FROM devices";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send("Erreur lors de la récupération des appareils");
    } else {
      res.json(results);
    }
  });
});

app.get("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM devices WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) res.status(500).send("Erreur lors de get");
    res.json(result);
  });
});

app.post("/api/insertUser", async (req, res) => {
  const { Nom, Prenom, email, password } = req.body;

  if (!Nom || !Prenom || !email || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    // Vérifier si l'email existe déjà
    const checkEmailSql = "SELECT * FROM personnels WHERE email = ?";
    db.query(checkEmailSql, [email], async (err, result) => {
      if (err) {
        console.error("Erreur SQL :", err);
        return res.status(500).send("Erreur interne du serveur");
      }

      if (result.length > 0) {
        return res.status(409).json({ error: "Email déjà utilisé" }); // 409 = conflit
      }

      // Si email pas encore utilisé, on insère l'utilisateur
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql = "INSERT INTO personnels (Nom, Prenom, email, password) VALUES (?, ?, ?, ?)";
      db.query(insertSql, [Nom, Prenom, email, hashedPassword], (err2, result2) => {
        if (err2) {
          console.error("Erreur SQL :", err2);
          return res.status(500).send("Erreur lors de l'ajout de l'utilisateur");
        }

        // Retourne les infos sans mot de passe
        const selectSql = "SELECT id, Nom, Prenom, email FROM personnels WHERE id = ?";
        db.query(selectSql, [result2.insertId], (err3, rows) => {
          if (err3) {
            console.error("Erreur récupération :", err3);
            return res.status(500).send("Utilisateur ajouté, mais récupération échouée");
          }
          res.json({ user: rows[0] });
        });
      });
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});


app.post("/api/checkConnection", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM personnels WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Erreur DB :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "email ou mot de passe incorrect" });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(passwordMatch);

    // const passwordMatch = true;
    if (!passwordMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    } else return res.json({ user: user });
  });
});

app.post("/api/devices", (req, res) => {
  const { name, type, purchase_date, current_value, warranty_end, component } =
    req.body;
  console.log("Received body:", req.body);

  const query =
    "INSERT INTO devices (name, type, purchase_date, warranty_end, depreciation_rate, current_value, devises, status, component) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const maxDateOfDevice = 5;
  const today = new Date();
  let status;
  let typed = type;
  let warrantyEnd;

  try {
    // Ensure warranty_end is a valid date or calculate it based on purchase_date
    if (!warranty_end || new Date(warranty_end) < new Date(purchase_date)) {
      warrantyEnd = new Date(purchase_date);
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + maxDateOfDevice);
    } else {
      warrantyEnd = new Date(warranty_end);
    }

    if (!typed) typed = "Aucun type";

    let depreciation_rate = 0.1;
    const diffTime = warrantyEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    status = diffDays > 0 ? "active" : "inactive";

    const componentString =
      typeof component === "object" ? JSON.stringify(component) : component;

    console.log("Preparing to insert:", {
      name,
      typed,
      purchase_date,
      warrantyEnd,
      depreciation_rate,
      current_value,
      status,
      componentString,
    });

    db.query(
      query,
      [
        name,
        typed,
        purchase_date,
        warrantyEnd,
        depreciation_rate,
        current_value.value,
        current_value.unit,
        status,
        componentString,
      ],
      (err, result) => {
        if (err) {
          console.error("Error during query execution:", err);
          res.status(500).send("Erreur lors de l'ajout de l'appareil");
        } else {
          res.status(201).send(result);
        }
      }
    );
  } catch (error) {
    console.error("Error in POST request:", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

app.put("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    type,
    purchase_date,
    warranty_end,
    component,
    depreciation_rate,
    current_value,
    devises,
  } = req.body;
  const query =
    "UPDATE devices SET name = ?, type = ?, purchase_date = ?, warranty_end = ?, depreciation_rate = ?, status = ?, current_value = ?,component = ?, devises = ? WHERE id = ?";
  const maxDateOfDevice = 5;
  const today = new Date();
  let status;
  let typed = type;
  let warrantyEnd;

  try {
    // Ensure warranty_end is a valid date or calculate it based on purchase_date
    if (!warranty_end || new Date(warranty_end) < new Date(purchase_date)) {
      warrantyEnd = new Date(purchase_date);
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + maxDateOfDevice);
    } else {
      warrantyEnd = new Date(warranty_end);
    }

    if (!typed) typed = "Aucun type"; // Default type if none is provided

    // Set depreciation_rate based on warranty period, for example 0.1 per year
    let depreciation_rate = 0.1;
    const diffTime = warrantyEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Difference in days

    status = diffDays > 0 ? "active" : "inactive"; // Check if the warranty is still valid

    // Ensure component is a valid JSON string if it's an object
    const componentString =
      typeof component === "object" ? JSON.stringify(component) : component;

    db.query(
      query,
      [
        name,
        type,
        purchase_date,
        warrantyEnd,
        depreciation_rate,
        status,
        current_value,
        componentString,
        devises,
        id,
      ],
      (err, result) => {
        if (err) {
          res.status(500).send("Erreur lors de la mise à jour de l'appareil");
        } else {
          res.send("Appareil mis à jour avec succès");
        }
      }
    );
  } catch (error) {
    console.error("Error in POST request:", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

app.delete("/api/devices/all", (req, res) => {
  const sql = "DELETE FROM devices"; // Supprime tous les appareils
  try {
    db.query(sql);
    db.query("ALTER TABLE devices AUTO_INCREMENT = 1");
    res.json({ message: "Toutes le donne sont reinitialisé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la reinitialisation" });
  }
});

// 4. Supprimer (Supprimer un appareil)
app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM devices WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send("Erreur lors de la suppression de l'appareil");
    }

    if (result.affectedRows == 0) {
      res.status(404).json({ message: "Utitlisateur non trouvée" });
    } else {
      res.json({ message: "Appareil supprimé avec succès" });
    }
  });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
