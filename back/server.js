const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importamos el modelo que acabamos de crear
const Task = require('./models/task');
const Backlog = require('./models/backlog');
const Trash = require('./models/trash');

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

// 1.2 DELETE: Mueve una tarea del historial a la papelera (Recently Deleted)
app.delete('/api/backlog/:id', async (req, res) => {
    try {
        const backlogItem = await Backlog.findById(req.params.id);

        if (!backlogItem) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        // Convertir a objeto y quitar campos específicos del backlog
        const taskData = backlogItem.toObject();
        delete taskData._id;
        delete taskData.fechaEliminacion;

        // Crear registro en la papelera
        const trashItem = new Trash({
            ...taskData,
            fechaBorrado: new Date(),
            origen: 'backlog'
        });

        await trashItem.save();
        await Backlog.findByIdAndDelete(req.params.id);

        res.json({ message: 'Movido a eliminados recientemente' });
    } catch (error) {
        console.error('Error al mover a papelera:', error);
        res.status(500).json({ error: 'Error al procesar la eliminación' });
    }
});

// 1.3 Trash Routes
app.get('/api/trash', async (req, res) => {
    try {
        const trashItems = await Trash.find().sort({ fechaBorrado: -1 });
        res.json(trashItems);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la papelera' });
    }
});

app.delete('/api/trash/:id', async (req, res) => {
    try {
        await Trash.findByIdAndDelete(req.params.id);
        res.json({ message: 'Eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar permanentemente' });
    }
});

app.post('/api/trash/:id/restore', async (req, res) => {
    try {
        const itemToRestore = await Trash.findById(req.params.id);
        if (!itemToRestore) return res.status(404).json({ error: 'No encontrado' });

        const taskData = itemToRestore.toObject();
        delete taskData._id;
        delete taskData.fechaBorrado;
        delete taskData.origen;

        const newTask = new Task(taskData);
        await newTask.save();
        await Trash.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tarea restaurada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar' });
    }
});

// Enviar tarea a la papelera (Eliminar sin historial)
app.post('/api/tasks/:id/trash', async (req, res) => {
    try {
        const taskToDelete = await Task.findById(req.params.id);
        if (!taskToDelete) return res.status(404).json({ error: 'No encontrada' });

        const taskData = taskToDelete.toObject();
        delete taskData._id;

        const trashItem = new Trash({ ...taskData, fechaBorrado: new Date(), origen: 'tasks' });
        await trashItem.save();
        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Movido a eliminados recientemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al mover a eliminados' });
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