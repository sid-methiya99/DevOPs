// Global variables
let currentUser = null;
let currentEditingNote = null;
let currentEditingTask = null;

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginModal();
    } else {
        verifyToken();
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserInfo();
            loadDashboard();
        } else {
            localStorage.removeItem('token');
            showLoginModal();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        showLoginModal();
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = `Welcome, ${currentUser.firstName}`;
        document.getElementById('profileFirstName').value = currentUser.firstName;
        document.getElementById('profileLastName').value = currentUser.lastName;
        document.getElementById('profileEmail').value = currentUser.email;
    }
}

// Event listeners setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('updateProfileBtn').addEventListener('click', updateProfile);

    // Add buttons
    document.getElementById('addNoteBtn').addEventListener('click', () => openNoteModal());
    document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());

    // Search and filters
    document.getElementById('noteSearch').addEventListener('input', debounce(loadNotes, 300));
    document.getElementById('noteCategory').addEventListener('change', loadNotes);
    document.getElementById('taskSearch').addEventListener('input', debounce(loadTasks, 300));
    document.getElementById('taskStatus').addEventListener('change', loadTasks);
    document.getElementById('taskPriority').addEventListener('change', loadTasks);
}

// Navigation
function switchPage(pageName) {
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Show/hide pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    // Load page content
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'notes':
            loadNotes();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'profile':
            // Profile is already loaded
            break;
    }
}

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUserInfo();
            closeModal('loginModal');
            showMessage('Login successful!', 'success');
            loadDashboard();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        firstName: document.getElementById('registerFirstName').value,
        lastName: document.getElementById('registerLastName').value
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUserInfo();
            closeModal('registerModal');
            showMessage('Registration successful!', 'success');
            loadDashboard();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showLoginModal();
    showMessage('Logged out successfully', 'success');
}

// Dashboard functions
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/overview`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboardStats(data.overview);
            updateRecentNotes(data.recentNotes);
            updateUpcomingTasks(data.upcomingTasks);
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalNotes').textContent = stats.totalNotes;
    document.getElementById('totalTasks').textContent = stats.totalTasks;
    document.getElementById('completedTasks').textContent = stats.completedTasks;
    document.getElementById('overdueTasks').textContent = stats.overdueTasks;
}

function updateRecentNotes(notes) {
    const container = document.getElementById('recentNotes');
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes yet</p></div>';
        return;
    }
    
    notes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'content-item';
        item.innerHTML = `
            <h4>${note.title}</h4>
            <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
        `;
        container.appendChild(item);
    });
}

function updateUpcomingTasks(tasks) {
    const container = document.getElementById('upcomingTasks');
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><p>No upcoming tasks</p></div>';
        return;
    }
    
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'content-item';
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        item.innerHTML = `
            <h4>${task.title}</h4>
            <p>Due: ${dueDate} | Priority: ${task.priority}</p>
        `;
        container.appendChild(item);
    });
}

// Notes functions
async function loadNotes() {
    try {
        const search = document.getElementById('noteSearch').value;
        const category = document.getElementById('noteCategory').value;
        
        let url = `${API_BASE}/notes?limit=20`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (category) url += `&category=${category}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayNotes(data.notes);
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

function displayNotes(notes) {
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes found</p></div>';
        return;
    }
    
    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</p>
            <div class="note-meta">
                <span>${note.category} • ${new Date(note.createdAt).toLocaleDateString()}</span>
                <div class="note-actions">
                    <button onclick="editNote('${note._id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteNote('${note._id}')" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Tasks functions
async function loadTasks() {
    try {
        const search = document.getElementById('taskSearch').value;
        const status = document.getElementById('taskStatus').value;
        const priority = document.getElementById('taskPriority').value;
        
        let url = `${API_BASE}/tasks?limit=20`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayTasks(data.tasks);
        }
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

function displayTasks(tasks) {
    const container = document.getElementById('tasksList');
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><p>No tasks found</p></div>';
        return;
    }
    
    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        item.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
            <div class="task-description">${task.description || 'No description'}</div>
            <div class="task-meta">
                <span>Due: ${dueDate}</span>
                <span class="task-priority ${task.priority}">${task.priority}</span>
                <div class="note-actions">
                    <button onclick="editTask('${task._id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteTask('${task._id}')" class="btn-danger">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('registerModal').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'noteModal') {
        document.getElementById('noteForm').reset();
        currentEditingNote = null;
    }
    if (modalId === 'taskModal') {
        document.getElementById('taskForm').reset();
        currentEditingTask = null;
    }
}

function openNoteModal(note = null) {
    currentEditingNote = note;
    const modal = document.getElementById('noteModal');
    const title = document.getElementById('noteModalTitle');
    
    if (note) {
        title.textContent = 'Edit Note';
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategorySelect').value = note.category;
        document.getElementById('noteTags').value = note.tags.join(', ');
    } else {
        title.textContent = 'Add Note';
        document.getElementById('noteForm').reset();
    }
    
    modal.style.display = 'block';
}

function openTaskModal(task = null) {
    currentEditingTask = task;
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('taskModalTitle');
    
    if (task) {
        title.textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskStatusSelect').value = task.status;
        document.getElementById('taskPrioritySelect').value = task.priority;
        if (task.dueDate) {
            document.getElementById('taskDueDate').value = task.dueDate.slice(0, 16);
        }
    } else {
        title.textContent = 'Add Task';
        document.getElementById('taskForm').reset();
    }
    
    modal.style.display = 'block';
}

// Form handlers
async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('noteTitle').value,
        content: document.getElementById('noteContent').value,
        category: document.getElementById('noteCategorySelect').value,
        tags: document.getElementById('noteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    try {
        const url = currentEditingNote 
            ? `${API_BASE}/notes/${currentEditingNote._id}`
            : `${API_BASE}/notes`;
        
        const response = await fetch(url, {
            method: currentEditingNote ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            closeModal('noteModal');
            showMessage(currentEditingNote ? 'Note updated successfully!' : 'Note created successfully!', 'success');
            loadNotes();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to save note', 'error');
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatusSelect').value,
        priority: document.getElementById('taskPrioritySelect').value,
        dueDate: document.getElementById('taskDueDate').value
    };
    
    try {
        const url = currentEditingTask 
            ? `${API_BASE}/tasks/${currentEditingTask._id}`
            : `${API_BASE}/tasks`;
        
        const response = await fetch(url, {
            method: currentEditingTask ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            closeModal('taskModal');
            showMessage(currentEditingTask ? 'Task updated successfully!' : 'Task created successfully!', 'success');
            loadTasks();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to save task', 'error');
    }
}

async function updateProfile() {
    const formData = {
        firstName: document.getElementById('profileFirstName').value,
        lastName: document.getElementById('profileLastName').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserInfo();
            showMessage('Profile updated successfully!', 'success');
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to update profile', 'error');
    }
}

// CRUD operations
async function editNote(noteId) {
    try {
        const response = await fetch(`${API_BASE}/notes/${noteId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const note = await response.json();
            openNoteModal(note.note);
        }
    } catch (error) {
        showMessage('Failed to load note', 'error');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            showMessage('Note deleted successfully!', 'success');
            loadNotes();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to delete note', 'error');
    }
}

async function editTask(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const task = await response.json();
            openTaskModal(task.task);
        }
    } catch (error) {
        showMessage('Failed to load task', 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            showMessage('Task deleted successfully!', 'success');
            loadTasks();
            loadDashboard();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to delete task', 'error');
    }
}

// Utility functions
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});
