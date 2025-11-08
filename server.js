const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
import multer from "multer";
import fetch from "node-fetch";

const upload = multer();
const app = express();
const port = 3000;

app.use(cors({
  origin: '*'
})); // Habilita CORS
app.use(express.json());

app.post('/enviar-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwh6KxsrpipSJRmsIvA2mwDnmAMfdABpB1Hom-NYP-wgal-3bHu5b6fLD4LbFpG3VgO/exec'; //cuenta de prueba
    //const GAS_URL = 'https://script.google.com/macros/s/AKfycbx5mDSNJTLjh3yLt6ApzCK9nlEqrk8B4GBlwl85dINKMIskgfPIhnHT7ZTKZfVG18vP/exec'; //cuenta de diario
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "suscripcion", email })//body: JSON.stringify({ email })
    });

    const data = await response.json(); // ← lee JSON

    console.log("Respuesta de GAS:", data);
    res.json(data); // Devuelve al navegador

  } catch (err) {
    console.error('Error al conectar con GAS:', err);
    res.status(500).json({ error: 'Error al enviar el email al servidor' });
  }
});

app.post('/enviarNoticia', async (req, res) => {
  const { noticia: contenido } = req.body;

  if (!contenido) {
    return res.status(400).json({ error: 'Debe cargar una noticia...' });
  }

  try {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwh6KxsrpipSJRmsIvA2mwDnmAMfdABpB1Hom-NYP-wgal-3bHu5b6fLD4LbFpG3VgO/exec'; //cuenta de prueba                     
    //const GAS_URL = 'https://script.google.com/macros/s/AKfycbx5mDSNJTLjh3yLt6ApzCK9nlEqrk8B4GBlwl85dINKMIskgfPIhnHT7ZTKZfVG18vP/exec'; // cuenta de diario
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "noticia", contenido })//body: JSON.stringify({ noticia })
    });

    const data = await response.json(); // ← lee JSON

    console.log("Respuesta de GAS:", data);
    res.json({ status: 'OK', message: 'Noticia enviada correctamente', data: data });//res.json(data); // Devuelve al navegador

  } catch (err) {
    console.error('Error al conectar con GAS:', err);
    //res.status(500).json({ error: 'Error al cargar la noticia en el servidor' });
  }


});


app.post("/enviarPDF", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "ERROR", message: "No se recibió archivo." });
    }

    const base64PDF = req.file.buffer.toString("base64");

    const GAS_URL = "https://script.google.com/macros/s/AKfycbwh6KxsrpipSJRmsIvA2mwDnmAMfdABpB1Hom-NYP-wgal-3bHu5b6fLD4LbFpG3VgO/exec";

    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pdf",
        archivo: base64PDF,
        nombre: req.file.originalname
      })
    });

    const data = await response.json();
    console.log("Respuesta de GAS:", data);

    res.json(data);
  } catch (err) {
    console.error("Error al enviar PDF:", err);
    res.status(500).json({ status: "ERROR", message: "Fallo al enviar PDF al GAS." });
  }
});

app.get('/ping', (req, res) => {
  res.status(200).send('Activo');
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
