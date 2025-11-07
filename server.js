const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

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
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxayiyYN357zx6wTV5HGxwEfO3-BhYT1rZ4Fk2PdJETqmbhXpLdb81cDsqVGPuMTVBl/exec'; //cuenta de prueba
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
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxayiyYN357zx6wTV5HGxwEfO3-BhYT1rZ4Fk2PdJETqmbhXpLdb81cDsqVGPuMTVBl/exec'; //cuenta de prueba
    //const GAS_URL = 'https://script.google.com/macros/s/AKfycbx5mDSNJTLjh3yLt6ApzCK9nlEqrk8B4GBlwl85dINKMIskgfPIhnHT7ZTKZfVG18vP/exec'; // cuenta de diario
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "noticia", contenido })//body: JSON.stringify({ noticia })
    });

    const data = await response.json(); // ← lee JSON

    console.log("Respuesta de GAS:", data);
    res.json(data); // Devuelve al navegador

  } catch (err) {
    console.error('Error al conectar con GAS:', err);
    res.status(500).json({ error: 'Error al cargar la noticia en el servidor' });
  }


});

app.get('/ping', (req, res) => {
  res.status(200).send('Activo');
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
