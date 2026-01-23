const API_URL = 'http://localhost:3000/api/tasks';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const btnSave = document.getElementById('btn-save');

/**
 * Fetch and display all tasks
 */
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        taskList.innerHTML = '<div class="empty-msg">Error al conectar con el servidor.</div>';
    }
}

/**
 * Render task list to the DOM
 */
function renderTasks(tasks) {
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-msg">No hay tareas pendientes. Empieza creando una arriba.</div>';
        return;
    }

    taskList.innerHTML = '';

    // Sort by date (newest first)
    tasks.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tasks.forEach(task => {
        const taskCard = document.createElement('article');
        taskCard.className = 'task-card';
        taskCard.dataset.id = task._id;

        const statusClass = task.estado === 'done' ? 'badge-done' : 'badge-pending';
        const statusText = task.estado === 'done' ? 'Completada' : 'Pendiente';

        taskCard.innerHTML = `
            <div>
                <h3>${task.titulo}</h3>
                <div class="task-meta">
                    <span class="badge badge-tech">${task.tecnologia}</span>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
                <p>${task.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="task-actions">
                <button class="btn-delete" onclick="deleteTask('${task._id}')">Archivar</button>
            </div>
        `;

        taskList.appendChild(taskCard);
    });
}

/**
 * Handle form submission to create a task
 */
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskData = {
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        tecnologia: document.getElementById('tecnologia').value,
        estado: document.getElementById('estado').value
    };

    btnSave.disabled = true;
    btnSave.textContent = 'Guardando...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            taskForm.reset();
            await fetchTasks();
        } else {
            alert('Error al guardar la tarea');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Tarea';
    }
});

/**
 * Delete a task and move to backlog
 */
async function deleteTask(id) {
    if (!confirm('¿Estás seguro de archivar esta tarea? Se guardará en el historial.')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Animación de salida opcional
            const card = document.querySelector(`.task-card[data-id="${id}"]`);
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';

            setTimeout(async () => {
                await fetchTasks();
            }, 300);
        } else {
            alert('Error al archivar la tarea');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error de conexión');
    }
}

// Initial Load
fetchTasks();
