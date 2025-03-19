const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configurer la connexion à la base de données MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'seimad'
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

app.get('/',(req,res) =>{
  res.send('Bienvenue sur la page accueil')
  // res.write('Hello');
})

// Route pour récupérer les appareils
app.get('/api/devices', (req, res) => {
  const query = 'SELECT * FROM devices';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Erreur lors de la récupération des appareils');
    } else {
      res.json(results);
    }
  });
});

// Démarrer le serveur Express

app.post('/api/devices', (req, res) => {
  const { name, type, purchase_date,current_value} = req.body;
  const query = 'INSERT INTO devices (name, type, purchase_date, warranty_end, depreciation_rate, current_value,status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const maxDateOfDevice = 5;
  const today = new Date();
  let status;
  let warranty_end = new Date(purchase_date);
  let depreciation_rate = 0.1;

  warranty_end.setDate(warranty_end.getDate() + maxDateOfDevice);

   const diffTime = warranty_end - today;
   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Différence en jours

      if (diffDays <= 7 && diffDays >= 0) {  // 7 jours avant expiration
        status = "active";

      }
      else{
        status = "inactive";
      }

    deprecitaion_rate = diffTime;

  db.query(query, [name, type, purchase_date, warranty_end, depreciation_rate, current_value, status], (err, result) => {
    if (err) {
      res.status(500).send('Erreur lors de l\'ajout de l\'appareil');
    } else {
      res.status(201).send('Appareil ajouté avec succès');
    }
  });
});

app.put('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, purchase_date, warranty_end, depreciation_rate, current_value, status } = req.body;
  const query = 'UPDATE devices SET name = ?, type = ?, purchase_date = ?, warranty_end = ?, depreciation_rate = ?, current_value = ?, status = ? WHERE id = ?';
  
  db.query(query, [name, type, purchase_date, warranty_end, depreciation_rate, current_value, status, id], (err, result) => {
    if (err) {
      res.status(500).send('Erreur lors de la mise à jour de l\'appareil');
    } else {
      res.send('Appareil mis à jour avec succès');
    }
  });
});

// 4. Supprimer (Supprimer un appareil)
app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM devices WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send('Erreur lors de la suppression de l\'appareil');
    } else {
      res.send('Appareil supprimé avec succès');
    }
  });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
