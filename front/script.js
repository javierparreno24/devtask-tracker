const API_URL = 'http://localhost:3000/api/tasks';
const BACKLOG_URL = 'http://localhost:3000/api/backlog';
const TRASH_URL = 'http://localhost:3000/api/trash';

// Elementos del DOM
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const backlogList = document.getElementById('backlog-list');
const trashList = document.getElementById('trash-list');
const btnSave = document.getElementById('btn-save');

// Modal Elements
const modalOverlay = document.getElementById('modal-system');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');
const modalBtnCancel = document.getElementById('modal-btn-cancel');

let currentView = 'active';

/**
 * Muestra un modal de confirmación profesional
 */
function showConfirmModal(title, message, isAlert = false) {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalOverlay.style.display = 'flex';

        modalBtnCancel.style.display = isAlert ? 'none' : 'block';
        modalBtnConfirm.textContent = isAlert ? 'Entendido' : 'Confirmar';

        const handleConfirm = () => {
            closeModal();
            resolve(true);
        };

        const handleCancel = () => {
            closeModal();
            resolve(false);
        };

        modalBtnConfirm.onclick = handleConfirm;
        modalBtnCancel.onclick = handleCancel;
    });
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

async function showAlert(title, message) {
    await showConfirmModal(title, message, true);
}

/**
 * Gestiona la carga de tareas y refresca iconos
 */
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        renderTasks(tasks, taskList, false);
        lucide.createIcons();
    } catch (error) {
        console.error('Error:', error);
        taskList.innerHTML = '<div class="empty-msg">Error al conectar con el servidor.</div>';
    }
}

async function fetchBacklog() {
    try {
        const response = await fetch(BACKLOG_URL);
        const tasks = await response.json();
        renderTasks(tasks, backlogList, true);
        lucide.createIcons();
    } catch (error) {
        console.error('Error:', error);
        backlogList.innerHTML = '<div class="empty-msg">Error al cargar el historial.</div>';
    }
}

async function fetchTrash() {
    try {
        const response = await fetch(TRASH_URL);
        const tasks = await response.json();
        renderTasks(tasks, trashList, false, true);
        lucide.createIcons();
    } catch (error) {
        console.error('Error:', error);
        trashList.innerHTML = '<div class="empty-msg">Error al cargar la papelera.</div>';
    }
}

/**
 * Cambia la vista y actualiza la UI de navegación
 */
function switchView(view) {
    currentView = view;

    // Actualizar Sidebar
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${view}`).classList.add('active');

    // Mostrar/ocultar secciones
    document.getElementById('active-section').style.display = view === 'active' ? 'block' : 'none';
    document.getElementById('backlog-section').style.display = view === 'backlog' ? 'block' : 'none';
    document.getElementById('trash-section').style.display = view === 'trash' ? 'block' : 'none';

    // Cargar datos
    if (view === 'active') fetchTasks();
    else if (view === 'backlog') fetchBacklog();
    else fetchTrash();
}

/**
 * Renderiza tareas con el nuevo diseño premium
 */
function renderTasks(tasks, container, isBacklog, isTrash = false) {
    if (tasks.length === 0) {
        let msg = 'No hay tareas pendientes.';
        if (isBacklog) msg = 'El historial está vacío.';
        if (isTrash) msg = 'La papelera está vacía.';
        container.innerHTML = `<div class="empty-msg">${msg}</div>`;
        return;
    }

    container.innerHTML = '';

    // Ordenar por fecha
    tasks.sort((a, b) => {
        const dateA = new Date(isBacklog ? b.fechaEliminacion : (isTrash ? b.fechaBorrado : b.fecha));
        const dateB = new Date(isBacklog ? a.fechaEliminacion : (isTrash ? a.fechaBorrado : a.fecha));
        return dateA - dateB;
    });

    tasks.forEach(task => {
        const taskCard = document.createElement('article');
        taskCard.className = `task-card glass-card ${isBacklog ? 'archived' : ''} ${isTrash ? 'deleted-card' : ''}`;
        taskCard.dataset.id = task._id;

        const isDone = task.estado === 'done';

        let actionButtons = '';
        if (isBacklog) {
            actionButtons = `<button class="card-btn danger" onclick="deleteBacklogItem('${task._id}')" title="Mover a papelera"><i data-lucide="trash-2"></i></button>`;
        } else if (isTrash) {
            actionButtons = `
                <button class="card-btn success" onclick="restoreTrashItem('${task._id}')" title="Restaurar"><i data-lucide="rotate-ccw"></i></button>
                <button class="card-btn danger" onclick="deleteTrashItemPermanently('${task._id}')" title="Borrar definitivo"><i data-lucide="x-circle"></i></button>
            `;
        } else {
            actionButtons = `
                <button class="card-btn ${isDone ? 'warning' : 'success'}" onclick="toggleTaskStatus('${task._id}', '${task.estado}')" title="${isDone ? 'Desmarcar' : 'Completar'}">
                    <i data-lucide="${isDone ? 'undo' : 'check'}"></i>
                </button>
                <button class="card-btn" style="border-color: var(--primary)" onclick="deleteTask('${task._id}')" title="Archivar"><i data-lucide="archive"></i></button>
                <button class="card-btn danger" onclick="deleteTaskDirect('${task._id}')" title="Eliminar"><i data-lucide="trash-2"></i></button>
            `;
        }

        taskCard.innerHTML = `
            <span class="tech-badge">${task.tecnologia}</span>
            <div class="${isDone ? 'task-content-done' : ''}">
                <h3>${task.titulo}</h3>
                <p>${task.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="task-card-footer">
                <div class="status-indicator">
                    <span class="status-dot ${isDone ? 'dot-done' : 'dot-pending'}"></span>
                    <span>${isDone ? 'Completada' : 'Pendiente'}</span>
                </div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </div>
        `;

        container.appendChild(taskCard);
    });
}

// Lógica de acciones (Sin cambios, solo actualización de UI)
async function toggleTaskStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'pending' ? 'done' : 'pending';
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nextStatus })
        });
        if (response.ok) await fetchTasks();
        else await showAlert('Error', 'No se pudo actualizar la tarea.');
    } catch (error) {
        await showAlert('Error de Conexión', 'Hubo un problema con el servidor.');
    }
}

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
            await showAlert('Error', 'No se pudo guardar la tarea.');
        }
    } catch (error) {
        await showAlert('Error de Conexión', 'Problema con el servidor.');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Tarea';
    }
});

async function deleteTask(id) {
    const confirmed = await showConfirmModal('Archivar Tarea', '¿Deseas mover esta tarea al historial?');
    if (!confirmed) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) await fetchTasks();
        else await showAlert('Error', 'No se pudo archivar.');
    } catch (error) {
        await showAlert('Error de Conexión', 'Servidor caído.');
    }
}

async function deleteBacklogItem(id) {
    const confirmed = await showConfirmModal('Mover a Papelera', '¿Quieres mover esta tarea a eliminados recientemente?');
    if (!confirmed) return;
    try {
        const response = await fetch(`${BACKLOG_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) await fetchBacklog();
        else await showAlert('Error', 'No se pudo mover a papelera.');
    } catch (error) {
        await showAlert('Error de Conexión', 'Problema con el servidor.');
    }
}

async function deleteTaskDirect(id) {
    const confirmed = await showConfirmModal('Eliminar Tarea', '¿Mover esta tarea a eliminados recientemente?');
    if (!confirmed) return;
    try {
        const response = await fetch(`${API_URL}/${id}/trash`, { method: 'POST' });
        if (response.ok) await fetchTasks();
        else await showAlert('Error', 'No se pudo mover a papelera.');
    } catch (error) {
        await showAlert('Error de Conexión', 'Servidor no disponible.');
    }
}

async function restoreTrashItem(id) {
    try {
        const response = await fetch(`${TRASH_URL}/${id}/restore`, { method: 'POST' });
        if (response.ok) await fetchTrash();
    } catch (error) {
        await showAlert('Error de Conexión', 'Problema con el servidor.');
    }
}

async function deleteTrashItemPermanently(id) {
    const confirmed = await showConfirmModal('Borrado Definitivo', '¿Estás seguro de eliminar esto permanentemente?');
    if (!confirmed) return;
    try {
        const response = await fetch(`${TRASH_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) await fetchTrash();
    } catch (error) {
        await showAlert('Error de Conexión', 'Problema con el servidor.');
    }
}

// Carga Inicial
fetchTasks();
// Inicializar iconos de la sidebar
lucide.createIcons();
