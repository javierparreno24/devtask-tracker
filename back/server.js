require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importamos el modelo que acabamos de crear
const Task = require('./models/Task');
const Backlog = require('./models/backlog');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- RUTAS DE LA API ---

// 1. GET: Devuelve todas las tareas 
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find(); // Busca todo en MongoDB
        res.json(tasks); // Lo devuelve como JSON
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// 2. POST: Crea una nueva tarea 
app.post('/api/tasks', async (req, res) => {
    try {
        // Creamos la tarea con los datos que vienen del usuario (req.body)
        const newTask = new Task(req.body);
        const savedTask = await newTask.save(); // Guardar en Atlas
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear la tarea' });
    }
});

// 3. DELETE: Elimina una tarea por su ID y la guarda en el historial (Backlog)
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskToDelete = await Task.findById(req.params.id);

        if (!taskToDelete) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        // Crear registro en el Backlog
        const backlogItem = new Backlog({
            titulo: taskToDelete.titulo,
            tecnologia: taskToDelete.tecnologia,
            descripcion: taskToDelete.descripcion,
            estado: taskToDelete.estado,
            fecha: taskToDelete.fecha
        });

        await backlogItem.save();
        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tarea movida al historial y eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar la eliminación' });
    }
});

// --- CONEXIÓN Y ARRANQUE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Base de Datos conectada'))
    .catch(err => console.error(err));

app.listen(PORT, () => console.log(`🚀 Servidor listo en http://localhost:${PORT}`));