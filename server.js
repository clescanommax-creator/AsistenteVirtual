/*const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch'); // necesitas instalarlo
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors()); // habilita CORS para todas las rutas

app.post('/enviar-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxayiyYN357zx6wTV5HGxwEfO3-BhYT1rZ4Fk2PdJETqmbhXpLdb81cDsqVGPuMTVBl/exec';
    const response = await fetch(`${GAS_URL}?email=${encodeURIComponent(email)}`);
    const text = await response.text();
    res.json({ result: text });
  } catch (error) {
    console.error('Error al reenviar:', error);
    res.status(500).json({ error: 'Fallo al reenviar' });
  }
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
*/

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors()); // Habilita CORS
app.use(express.json());

app.post('/enviar-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
       const GAS_URL = 'https://script.google.com/macros/s/AKfycbxayiyYN357zx6wTV5HGxwEfO3-BhYT1rZ4Fk2PdJETqmbhXpLdb81cDsqVGPuMTVBl/exec';
    //const GAS_URL = 'https://script.google.com/macros/s/AKfycbxayiyYN357zx6wTV5HGxwEfO3-BhYT1rZ4Fk2PdJETqmbhXpLdb81cDsqVGPuMTVBl/exec'; // Tu URL APPWeb
	  const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json(); // ← lee JSON

    console.log("Respuesta de GAS:", data);
    res.json(data); // Devuelve al navegador

  } catch (err) {
    console.error('Error al conectar con GAS:', err);
    res.status(500).json({ error: 'Error al enviar el email al servidor' });
  }
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

  app.listen(port, () => {
  console.log(`✅ Backend corriendo en http://localhost:${port}`);
});
