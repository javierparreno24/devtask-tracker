const mongoose = require('mongoose');

const BacklogSchema = new mongoose.Schema({
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
    fechaEliminacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Backlog', BacklogSchema);
