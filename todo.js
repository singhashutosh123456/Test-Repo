const storageKey = 'daymark-tasks';
const starterTasks = [
    { id: 'proposal', title: 'Update project proposal', space: 'Work', priority: 'High', due: 'Due today at 4:00 PM', dueToday: true, completed: false },
    { id: 'presentation', title: 'Prepare client presentation', space: 'Work', priority: 'High', due: 'Due today at 6:30 PM', dueToday: true, completed: false },
    { id: 'pages', title: 'Read 20 pages', space: 'Personal', priority: 'Medium', due: 'Due tomorrow', dueToday: false, completed: false },
    { id: 'groceries', title: 'Buy groceries', space: 'Personal', priority: 'Medium', due: 'Completed earlier today', dueToday: false, completed: true }
];

let tasks = loadTasks();
let activeFilter = 'all';
let prioritySort = true;

const taskList = document.querySelector('#task-list');
const composer = document.querySelector('.task-composer');
const taskInput = document.querySelector('#new-task');
const sortButton = document.querySelector('.sort-button');

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(storageKey));
        return Array.isArray(savedTasks) ? savedTasks : starterTasks;
    } catch (error) {
        return starterTasks;
    }
}

function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function createId() {
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#039;',
        '"': '&quot;'
    }[character]));
}

function visibleTasks() {
    const filteredTasks = tasks.filter(task => {
        if (activeFilter === 'active') return !task.completed;
        if (activeFilter === 'completed') return task.completed;
        return true;
    });

    return filteredTasks.sort((firstTask, secondTask) => {
        if (!prioritySort) return firstTask.title.localeCompare(secondTask.title);
        if (firstTask.completed !== secondTask.completed) return Number(firstTask.completed) - Number(secondTask.completed);
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority];
    });
}

function taskMarkup(task) {
    const priorityClass = task.priority.toLowerCase();
    const tagClass = task.space.toLowerCase() === 'work' ? 'work-tag' : 'personal-tag';
    const checkLabel = task.completed ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`;
    const taskClass = task.completed ? 'task-row is-complete' : 'task-row';
    const checkedClass = task.completed ? 'task-check is-checked' : 'task-check';
    const checkedMark = task.completed ? '✓' : '';

    return `<div class="${taskClass}" data-task-id="${escapeHtml(task.id)}">
        <button class="${checkedClass}" type="button" data-action="toggle" aria-label="${escapeHtml(checkLabel)}">${checkedMark}</button>
        <div class="task-details"><strong>${escapeHtml(task.title)}</strong><span><i class="tag ${tagClass}">${escapeHtml(task.space)}</i> ${escapeHtml(task.due)}</span></div>
        <span class="priority-pill ${priorityClass}">${escapeHtml(task.priority)}</span>
        <div class="task-actions"><button class="task-action-button" type="button" data-action="edit">Edit</button><button class="task-action-button delete-action" type="button" data-action="delete">Delete</button></div>
    </div>`;
}

function groupMarkup(title, dotClass, groupedTasks) {
    if (!groupedTasks.length) return '';
    return `<article class="task-group ${title === 'Completed' ? 'completed-group' : ''}">
        <div class="group-label"><span class="group-dot ${dotClass}"></span>${title} <span>${groupedTasks.length}</span></div>
        ${groupedTasks.map(taskMarkup).join('')}
    </article>`;
}

function renderTasks() {
    const filteredTasks = visibleTasks();
    const highPriority = filteredTasks.filter(task => !task.completed && task.priority === 'High');
    const otherTasks = filteredTasks.filter(task => !task.completed && task.priority !== 'High');
    const completedTasks = filteredTasks.filter(task => task.completed);

    taskList.innerHTML = filteredTasks.length
        ? groupMarkup('High priority', 'coral-dot', highPriority) + groupMarkup('Other tasks', 'blue-dot', otherTasks) + groupMarkup('Completed', 'green-dot', completedTasks)
        : '<div class="empty-state"><strong>No tasks here</strong><span>Add a task or choose another filter.</span></div>';

    updateMetrics();
}

function updateMetrics() {
    const completedCount = tasks.filter(task => task.completed).length;
    const activeCount = tasks.length - completedCount;
    const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    const dueToday = tasks.filter(task => task.dueToday && !task.completed).length;

    document.querySelector('#progress-percent').textContent = `${progress}%`;
    document.querySelector('#progress-bar').style.width = `${progress}%`;
    document.querySelector('#progress-label').textContent = `${completedCount} of ${tasks.length} tasks complete`;
    document.querySelector('#progress-message').textContent = progress === 100 ? 'All done' : progress ? 'Keep going' : 'Add a task to begin';
    document.querySelector('#due-count').textContent = dueToday;
    document.querySelector('#week-count').textContent = tasks.length;
    document.querySelector('#task-total').textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
    document.querySelector('.nav-count').textContent = activeCount;

    document.querySelector('[data-filter="all"] span').textContent = tasks.length;
    document.querySelector('[data-filter="active"] span').textContent = activeCount;
    document.querySelector('[data-filter="completed"] span').textContent = completedCount;
}

function addTask(title) {
    tasks.unshift({ id: createId(), title, space: 'Personal', priority: 'Medium', due: 'Added just now', dueToday: true, completed: false });
    saveTasks();
    renderTasks();
}

function toggleTask(taskId) {
    const task = tasks.find(item => item.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    task.due = task.completed ? 'Completed just now' : 'Added just now';
    saveTasks();
    renderTasks();
}

function editTask(taskId) {
    const task = tasks.find(item => item.id === taskId);
    if (!task) return;
    const updatedTitle = window.prompt('Edit task name:', task.title);
    if (updatedTitle === null) return;
    const trimmedTitle = updatedTitle.trim();
    if (!trimmedTitle) return;
    task.title = trimmedTitle;
    saveTasks();
    renderTasks();
}

function deleteTask(taskId) {
    const task = tasks.find(item => item.id === taskId);
    if (!task || !window.confirm(`Delete "${task.title}"?`)) return;
    tasks = tasks.filter(item => item.id !== taskId);
    saveTasks();
    renderTasks();
}

composer.addEventListener('submit', event => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) {
        taskInput.focus();
        return;
    }
    addTask(title);
    composer.reset();
    taskInput.focus();
});

taskList.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const taskRow = actionButton.closest('[data-task-id]');
    if (!taskRow) return;
    const taskId = taskRow.dataset.taskId;
    const action = actionButton.dataset.action;
    if (action === 'toggle') toggleTask(taskId);
    if (action === 'edit') editTask(taskId);
    if (action === 'delete') deleteTask(taskId);
});

document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(filterButton => filterButton.classList.toggle('is-active', filterButton === button));
        renderTasks();
    });
});

sortButton.addEventListener('click', () => {
    prioritySort = !prioritySort;
    sortButton.innerHTML = `<span class="sort-icon">↕</span> Sort: ${prioritySort ? 'Priority' : 'Name'}`;
    renderTasks();
});

renderTasks();
