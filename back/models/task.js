// backend/models/Task.js
const mongoose = require('mongoose');

// Definimos el esquema 
const TaskSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true // Obligatorio
    },
    tecnologia: {
        type: String,
        required: true 
    },
    descripcion: {
        type: String,
        required: false
    },
    estado: {
        type: String,
        enum: ['pending', 'done'], // Limitamos los valores permitidos
        default: 'pending' // Por defecto está pendiente
    },
    fecha: {
        type: Date,
        default: Date.now // Se pone la fecha actual automáticamente
    }
});

module.exports = mongoose.model('Task', TaskSchema);