const API_URL = 'http://localhost:3000/api/tasks';
const BACKLOG_URL = 'http://localhost:3000/api/backlog';

// Elementos del DOM
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const backlogList = document.getElementById('backlog-list');
const btnSave = document.getElementById('btn-save');

let currentView = 'active'; // 'active' o 'backlog'

/**
 * Obtiene y muestra todas las tareas
 */
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        renderTasks(tasks, taskList, false);
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        taskList.innerHTML = '<div class="empty-msg">Error al conectar con el servidor.</div>';
    }
}

/**
 * Obtiene y muestra el historial de tareas
 */
async function fetchBacklog() {
    try {
        const response = await fetch(BACKLOG_URL);
        const tasks = await response.json();
        renderTasks(tasks, backlogList, true);
    } catch (error) {
        console.error('Error al cargar historial:', error);
        backlogList.innerHTML = '<div class="empty-msg">Error al cargar el historial.</div>';
    }
}

/**
 * Alterna entre la vista de tareas activas y el historial
 */
function switchView(view) {
    currentView = view;

    // Actualizar botones de pestañas
    document.getElementById('tab-active').classList.toggle('active', view === 'active');
    document.getElementById('tab-backlog').classList.toggle('active', view === 'backlog');

    // Mostrar/ocultar secciones
    document.getElementById('active-section').style.display = view === 'active' ? 'block' : 'none';
    document.getElementById('backlog-section').style.display = view === 'backlog' ? 'block' : 'none';

    // Cargar datos según la vista
    if (view === 'active') {
        fetchTasks();
    } else {
        fetchBacklog();
    }
}

/**
 * Renderiza la lista de tareas en el DOM
 */
function renderTasks(tasks, container, isBacklog) {
    if (tasks.length === 0) {
        container.innerHTML = isBacklog
            ? '<div class="empty-msg">El historial está vacío.</div>'
            : '<div class="empty-msg">No hay tareas pendientes. Empieza creando una arriba.</div>';
        return;
    }

    container.innerHTML = '';

    // Ordenar: activas por fecha creación, backlog por fecha eliminación
    tasks.sort((a, b) => {
        const dateA = new Date(isBacklog ? b.fechaEliminacion : b.fecha);
        const dateB = new Date(isBacklog ? a.fechaEliminacion : a.fecha);
        return dateA - dateB;
    });

    tasks.forEach(task => {
        const taskCard = document.createElement('article');
        taskCard.className = `task-card ${isBacklog ? 'archived' : ''}`;
        taskCard.dataset.id = task._id;

        const statusClass = task.estado === 'done' ? 'badge-done' : 'badge-pending';
        const statusText = task.estado === 'done' ? 'Completada' : 'Pendiente';

        const actionHtml = isBacklog
            ? `<span class="task-meta" style="font-size: 0.7rem; color: var(--text-muted)">Archivado el: ${new Date(task.fechaEliminacion).toLocaleDateString()}</span>`
            : `<button class="btn-delete" onclick="deleteTask('${task._id}')">Archivar</button>`;

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
                ${actionHtml}
            </div>
        `;

        container.appendChild(taskCard);
    });
}

/**
 * Gestiona el envío del formulario para crear una tarea
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
 * Elimina una tarea y la mueve al backlog (archivo)
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

// Carga inicial
fetchTasks();
