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

// 1. GET: Devuelve todas las tareas activas
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find(); // Busca todo en MongoDB
        res.json(tasks); // Lo devuelve como JSON
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// 1.1 GET: Devuelve todas las tareas archivadas (Backlog)
app.get('/api/backlog', async (req, res) => {
    try {
        const backlog = await Backlog.find().sort({ fechaEliminacion: -1 });
        res.json(backlog);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
});

// 1.2 DELETE: Elimina permanentemente una tarea del historial
app.delete('/api/backlog/:id', async (req, res) => {
    try {
        const deletedItem = await Backlog.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json({ message: 'Registro eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar del historial' });
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

// 3. PATCH: Actualiza el estado de una tarea (completada/pendiente)
app.patch('/api/tasks/:id', async (req, res) => {
    try {
        const { estado } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true } // Devuelve el documento actualizado
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar la tarea' });
    }
});

// 4. DELETE: Elimina una tarea por su ID y la guarda en el historial (Backlog)
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskToDelete = await Task.findById(req.params.id);

        if (!taskToDelete) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        // Convertir el documento a objeto plano de JS y quitar el _id original
        const taskData = taskToDelete.toObject();
        delete taskData._id;

        // Crear registro en el Backlog con todos los datos originales
        const backlogItem = new Backlog({
            ...taskData,
            fechaEliminacion: new Date() // Aseguramos la fecha de archivado
        });

        await backlogItem.save();
        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tarea movida al historial y eliminada correctamente' });
    } catch (error) {
        console.error('Error al archivar:', error);
        res.status(500).json({ error: 'Error al procesar la eliminación' });
    }
});

// --- CONEXIÓN Y ARRANQUE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Base de Datos conectada'))
    .catch(err => console.error(err));

app.listen(PORT, () => console.log(`🚀 Servidor listo en http://localhost:${PORT}`));