const mongoose = require('mongoose');

const TrashSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
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
        enum: ['pending', 'done'],
        default: 'pending'
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    fechaBorrado: {
        type: Date,
        default: Date.now
    },
    origen: {
        type: String,
        default: 'tasks' // Para saber si venía de tareas o backlog (opcional)
    }
});

module.exports = mongoose.model('Trash', TrashSchema);
