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

let currentView = 'active'; // 'active' o 'backlog'

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

/**
 * Alias para mostrar alertas con el nuevo diseño
 */
async function showAlert(title, message) {
    await showConfirmModal(title, message, true);
}

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
    document.getElementById('tab-trash').classList.toggle('active', view === 'trash');

    // Mostrar/ocultar secciones
    document.getElementById('active-section').style.display = view === 'active' ? 'block' : 'none';
    document.getElementById('backlog-section').style.display = view === 'backlog' ? 'block' : 'none';
    document.getElementById('trash-section').style.display = view === 'trash' ? 'block' : 'none';

    // Cargar datos según la vista
    if (view === 'active') {
        fetchTasks();
    } else if (view === 'backlog') {
        fetchBacklog();
    } else {
        fetchTrash();
    }
}

/**
 * Obtiene y muestra los elementos eliminados recientemente
 */
async function fetchTrash() {
    try {
        const response = await fetch(TRASH_URL);
        const tasks = await response.json();
        renderTasks(tasks, trashList, false, true); // isBacklog=false, isTrash=true
    } catch (error) {
        console.error('Error al cargar papelera:', error);
        trashList.innerHTML = '<div class="empty-msg">Error al cargar la papelera.</div>';
    }
}

/**
 * Renderiza la lista de tareas en el DOM
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

    // Ordenar: activas por fecha creación, backlog por fecha eliminación, trash por fecha borrado
    tasks.sort((a, b) => {
        let dateA, dateB;
        if (isBacklog) {
            dateA = new Date(b.fechaEliminacion);
            dateB = new Date(a.fechaEliminacion);
        } else if (isTrash) {
            dateA = new Date(b.fechaBorrado);
            dateB = new Date(a.fechaBorrado);
        } else {
            dateA = new Date(b.fecha);
            dateB = new Date(a.fecha);
        }
        return dateA - dateB;
    });

    tasks.forEach(task => {
        const taskCard = document.createElement('article');
        taskCard.className = `task-card ${isBacklog ? 'archived' : ''} ${isTrash ? 'deleted-card' : ''}`;
        taskCard.dataset.id = task._id;

        const statusClass = task.estado === 'done' ? 'badge-done' : 'badge-pending';
        const statusText = task.estado === 'done' ? 'Completada' : 'Pendiente';

        let actionHtml = '';
        if (isBacklog) {
            actionHtml = `
                <span class="task-meta" style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 10px;">
                    Archivado el: ${new Date(task.fechaEliminacion).toLocaleDateString()}
                </span>
                <button class="btn-delete-perm" onclick="deleteBacklogItem('${task._id}')">Eliminar</button>
            `;
        } else if (isTrash) {
            actionHtml = `
                <button class="btn-status btn-done" onclick="restoreTrashItem('${task._id}')">Restaurar</button>
                <button class="btn-delete" onclick="deleteTrashItemPermanently('${task._id}')">Borrar Definitivo</button>
            `;
        } else {
            actionHtml = `
                <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end;">
                    <button class="btn-status ${task.estado === 'done' ? 'btn-pending' : 'btn-done'}" 
                            onclick="toggleTaskStatus('${task._id}', '${task.estado}')">
                        ${task.estado === 'done' ? 'Desmarcar' : 'Completar'}
                    </button>
                    <button class="btn-delete" style="background: rgba(139, 92, 246, 0.1); border-color: var(--primary)" onclick="deleteTask('${task._id}')">Archivar</button>
                    <button class="btn-delete" onclick="deleteTaskDirect('${task._id}')">Eliminar</button>
                </div>
            `;
        }

        taskCard.innerHTML = `
            <div class="${task.estado === 'done' ? 'task-content-done' : ''}">
                <h3>${task.titulo}</h3>
                <div class="task-meta">
                    <span class="badge badge-tech">${task.tecnologia}</span>
                    <span class="badge ${statusClass}">${statusText}</span>
                    ${isTrash ? `<span class="badge" style="background: rgba(244, 63, 94, 0.1); color: var(--danger)">Borrado</span>` : ''}
                </div>
                <p>${task.descripcion || 'Sin descripción'}</p>
                ${isTrash ? `<small style="color: var(--text-muted)">Borrado el: ${new Date(task.fechaBorrado).toLocaleString()}</small>` : ''}
            </div>
            <div class="task-actions">
                ${actionHtml}
            </div>
        `;

        container.appendChild(taskCard);
    });
}

/**
 * Alterna el estado de una tarea entre 'pending' y 'done'
 */
async function toggleTaskStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'pending' ? 'done' : 'pending';

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nextStatus })
        });

        if (response.ok) {
            await fetchTasks();
        } else {
            await showAlert('Error', 'No se pudo actualizar el estado de la tarea.');
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        await showAlert('Error de Conexión', 'Hubo un problema al actualizar la tarea.');
    }
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
            await showAlert('Error', 'No se pudo guardar la tarea en el servidor.');
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlert('Error de Conexión', 'No se pudo establecer comunicación con el backend.');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Tarea';
    }
});

/**
 * Elimina una tarea y la mueve al backlog (archivo)
 */
async function deleteTask(id) {
    const confirmed = await showConfirmModal('Archivar Tarea', '¿Deseas mover esta tarea al historial (Backlog)?');
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Animación de salida opcional
            const card = document.querySelector(`.task-card[data-id="${id}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
            }

            setTimeout(async () => {
                await fetchTasks();
            }, 300);
        } else {
            await showAlert('Error', 'No se pudo archivar la tarea.');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        await showAlert('Error de Conexión', 'Hubo un problema al intentar archivar.');
    }
}

async function deleteBacklogItem(id) {
    const confirmed = await showConfirmModal('Mover a Papelera', '¿Quieres mover esta tarea del historial a Eliminados Recientemente?');
    if (!confirmed) return;

    try {
        const response = await fetch(`${BACKLOG_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const card = document.querySelector(`.task-card[data-id="${id}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(async () => {
                    await fetchBacklog();
                }, 300);
            } else {
                await fetchBacklog();
            }
        } else {
            await showAlert('Error', 'No se pudo mover a la papelera.');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        await showAlert('Error de Conexión', 'Problema al conectar con el servidor.');
    }
}

/**
 * Mueve una tarea a la papelera (Recently Deleted)
 */
async function deleteTaskDirect(id) {
    const confirmed = await showConfirmModal('Eliminar Tarea', '¿Mover esta tarea a eliminados recientemente?');
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/${id}/trash`, {
            method: 'POST'
        });

        if (response.ok) {
            await fetchTasks();
        } else {
            await showAlert('Error', 'No se pudo mover a la papelera.');
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlert('Error de Conexión', 'Servidor no disponible.');
    }
}

/**
 * Restaura una tarea desde la papelera
 */
async function restoreTrashItem(id) {
    try {
        const response = await fetch(`${TRASH_URL}/${id}/restore`, {
            method: 'POST'
        });

        if (response.ok) {
            await fetchTrash();
        } else {
            await showAlert('Error', 'No se pudo restaurar la tarea.');
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlert('Error de Conexión', 'Problema al conectar con el servidor.');
    }
}

/**
 * Elimina permanentemente de la papelera
 */
async function deleteTrashItemPermanently(id) {
    const confirmed = await showConfirmModal('Borrado Definitivo', '¿Estás seguro de eliminar esto de forma irreversible?');
    if (!confirmed) return;

    try {
        const response = await fetch(`${TRASH_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchTrash();
        } else {
            await showAlert('Error', 'No se pudo eliminar permanentemente.');
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlert('Error de Conexión', 'Hubo un problema al comunicar con el servidor.');
    }
}

// Carga inicial
fetchTasks();
