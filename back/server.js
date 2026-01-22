require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (para poder recibir JSON del frontend)
app.use(cors());
app.use(express.json());

// 1. Conexión a Base de Datos (RA3)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas con éxito'))
    .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// 2. Rutas Básicas (RA2) - Probaremos que la API respunde
app.get('/api/test', (req, res) => {
    res.json({ mensaje: 'El Backend está funcionando correctamente' });
});

// 3. Arrancar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});