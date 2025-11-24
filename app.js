/**
 * ================================================
 * PERSONAL BLOG SPA - MAIN APPLICATION
 * ================================================
 * 
 * A beautiful, interactive Single Page Application
 * for showcasing a personal journey and portfolio.
 * 
 * Architecture:
 * - Data Layer: API communication with backend
 * - State: Tracks application state
 * - UI Module: Handles all DOM manipulation
 * - Router: Manages view navigation
 * - Auth: Handles authentication and registration
 */

// ================================================
// CONFIGURATION
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

// ================================================
// DATA LAYER - API Communication
// ================================================

const DataManager = {
    /**
     * Storage keys (for local theme only)
     */
    KEYS: {
        THEME: 'blog_theme',
        AUTH_TOKEN: 'blog_auth_token'
    },

    /**
     * Get auth token from localStorage
     */
    getAuthToken() {
        return localStorage.getItem(this.KEYS.AUTH_TOKEN);
    },

    /**
     * Set auth token
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem(this.KEYS.AUTH_TOKEN, token);
        } else {
            localStorage.removeItem(this.KEYS.AUTH_TOKEN);
        }
    },

    /**
     * Get API headers with auth token
     */
    getHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },

    /**
     * Get profile data from API
     */
    async getProfile() {
        try {
            const res = await fetch(`${API_BASE_URL}/profile`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            return await res.json();
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    },

    /**
     * Update profile data
     */
    async setProfile(data) {
        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return await res.json();
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Get all posts from API
     */
    async getContent() {
        try {
            const res = await fetch(`${API_BASE_URL}/posts`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            const posts = await res.json();
            // Format date from MongoDB
            return posts.map(post => ({
                ...post,
                date: new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }));
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    },

    /**
     * Add new post
     */
    async addContent(item) {
        try {
            const res = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(item)
            });
            if (!res.ok) throw new Error('Failed to create post');
            const post = await res.json();
            return {
                ...post,
                date: new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };
        } catch (error) {
            console.error('Error adding post:', error);
            throw error;
        }
    },

    /**
     * Delete post
     */
    async deleteContent(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete post');
            return await res.json();
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    /**
     * Get all skills
     */
    async getSkills() {
        try {
            const res = await fetch(`${API_BASE_URL}/skills`);
            if (!res.ok) throw new Error('Failed to fetch skills');
            return await res.json();
        } catch (error) {
            console.error('Error fetching skills:', error);
            return [];
        }
    },

    /**
     * Add skill
     */
    async addSkill(skill) {
        try {
            const res = await fetch(`${API_BASE_URL}/skills`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(skill)
            });
            if (!res.ok) throw new Error('Failed to add skill');
            return await res.json();
        } catch (error) {
            console.error('Error adding skill:', error);
            throw error;
        }
    },

    /**
     * Delete skill
     */
    async deleteSkill(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/skills/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete skill');
            return await res.json();
        } catch (error) {
            console.error('Error deleting skill:', error);
            throw error;
        }
    },

    /**
     * Get all projects
     */
    async getProjects() {
        try {
            const res = await fetch(`${API_BASE_URL}/projects`);
            if (!res.ok) throw new Error('Failed to fetch projects');
            return await res.json();
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    },

    /**
     * Add project
     */
    async addProject(project) {
        try {
            const res = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(project)
            });
            if (!res.ok) throw new Error('Failed to add project');
            return await res.json();
        } catch (error) {
            console.error('Error adding project:', error);
            throw error;
        }
    },

    /**
     * Delete project
     */
    async deleteProject(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete project');
            return await res.json();
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },

    /**
     * Get theme preference
     */
    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    /**
     * Set theme preference
     */
    setTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    }
};

// ================================================
// STATE MANAGEMENT
// ================================================

const State = {
    isAuthenticated: false,
    currentView: 'public',
    currentFilter: 'all',
    currentSort: 'newest',
    currentUser: null,

    /**
     * Login user
     */
    login(user, token) {
        this.isAuthenticated = true;
        this.currentUser = user;
        DataManager.setAuthToken(token);
    },

    /**
     * Logout user
     */
    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        DataManager.setAuthToken(null);
    },

    /**
     * Set current view
     */
    setView(view) {
        this.currentView = view;
    },

    /**
     * Set content filter
     */
    setFilter(filter) {
        this.currentFilter = filter;
    },

    /**
     * Set content sort
     */
    setSort(sort) {
        this.currentSort = sort;
    }
};

// ================================================
// AUTHENTICATION MODULE
// ================================================

const Auth = {
    /**
     * Register new user
     */
    async register(username, email, password, confirmPassword, accessKey) {
        // Validation
        if (!username || username.length < 3) {
            return { success: false, message: 'Username must be at least 3 characters' };
        }

        if (!email || !email.includes('@')) {
            return { success: false, message: 'Please enter a valid email' };
        }

        if (!password || password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    accessKey
                })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Registration failed' };
            }

            // Login after successful registration
            State.login(data.user, data.token);
            return { success: true, message: 'Account created successfully!' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Error creating account' };
        }
    },

    /**
     * Login user
     */
    async login(username, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Login failed' };
            }

            State.login(data.user, data.token);
            return { success: true, message: 'Logged in successfully!' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Error logging in' };
        }
    },

    /**
     * Logout
     */
    logout() {
        State.logout();
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return State.isAuthenticated;
    }
};

// ================================================
// ROUTER - SPA Navigation
// ================================================

const Router = {
    /**
     * Navigate to a view
     */
    goTo(view) {
        State.setView(view);

        // Hide all views
        document.getElementById('publicView').classList.add('hidden');
        document.getElementById('adminView').classList.add('hidden');

        // Show selected view
        if (view === 'public') {
            document.getElementById('publicView').classList.remove('hidden');
            UI.renderPublicView();
        } else if (view === 'admin' && State.isAuthenticated) {
            document.getElementById('adminView').classList.remove('hidden');
            UI.renderAdminView();
        } else if (!State.isAuthenticated) {
            document.getElementById('publicView').classList.remove('hidden');
            UI.renderPublicView();
        }

        // Update browser history
        window.history.pushState({ view }, '', `#${view}`);
    }
};

// ================================================
// FILE CONVERSION UTILITIES
// ================================================

const FileUtils = {
    /**
     * Convert file to base64
     */
    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    },

    /**
     * Get file extension
     */
    getExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * Get file type icon
     */
    getFileIcon(type) {
        const icons = {
            'image': '🖼️',
            'document': '📄',
            'pdf': '📕',
            'doc': '📘',
            'docx': '📘'
        };
        return icons[type] || '📎';
    },

    /**
     * Get file type from filename
     */
    getFileType(filename) {
        const ext = this.getExtension(filename);
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return 'image';
        } else if (['pdf', 'doc', 'docx'].includes(ext)) {
            return 'document';
        }
        return 'other';
    }
};

// ================================================
// UI MODULE - DOM Manipulation
// ================================================

const UI = {
    /**
     * Render public view with profile and content
     */
    async renderPublicView() {
        const profile = await DataManager.getProfile();
        
        if (!profile) {
            console.error('Failed to load profile');
            return;
        }

        // Update profile section
        document.getElementById('profileImage').src = profile.image || 
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23b0e9e8" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="48" fill="%237dd3c0"%3E👤%3C/text%3E%3C/svg%3E';
        document.getElementById('profileName').textContent = profile.name || 'Your Name Here';
        document.getElementById('profileBio').textContent = profile.bio || 'Welcome to my personal blog.';
        document.getElementById('statusBadge').textContent = profile.status || 'Exploring & Creating';

        // Update about section
        document.getElementById('aboutText').textContent = profile.about || 'Welcome to my personal blog. I\'m a passionate developer creating beautiful web applications and sharing my journey in tech.';

        // Render skills
        this.renderSkills();

        // Render projects
        this.renderProjects();

        // Render content grid
        this.renderContentGrid();
    },

    /**
     * Render skills grid
     */
    async renderSkills() {
        const skills = await DataManager.getSkills();
        const skillsGrid = document.getElementById('skillsGrid');
        
        skillsGrid.innerHTML = '';

        if (skills.length === 0) {
            skillsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No skills added yet.</p>';
            return;
        }

        skills.forEach(skill => {
            const skillCard = document.createElement('div');
            skillCard.className = 'skill-card';
            skillCard.innerHTML = `
                <div class="skill-name">${this.escapeHtml(skill.name)}</div>
                <div class="skill-category">${skill.category.charAt(0).toUpperCase() + skill.category.slice(1)}</div>
                <div class="skill-level ${skill.level}">${skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}</div>
            `;
            skillsGrid.appendChild(skillCard);
        });
    },

    /**
     * Render projects grid
     */
    async renderProjects() {
        const projects = await DataManager.getProjects();
        const projectsGrid = document.getElementById('projectsGrid');
        
        projectsGrid.innerHTML = '';

        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No projects added yet.</p>';
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            const imageHtml = project.image 
                ? `<img src="${project.image}" alt="${project.name}">`
                : '';
            
            const techsHtml = project.technologies && project.technologies.length > 0
                ? project.technologies.map(tech => `<div class="tech-tag">${this.escapeHtml(tech)}</div>`).join('')
                : '';

            let linksHtml = '';
            if (project.liveLink) {
                linksHtml += `<a href="${project.liveLink}" target="_blank" class="project-link">Live Demo</a>`;
            }
            if (project.githubLink) {
                linksHtml += `<a href="${project.githubLink}" target="_blank" class="project-link">GitHub</a>`;
            }

            projectCard.innerHTML = `
                <div class="project-image">${imageHtml}</div>
                <div class="project-info">
                    <div class="project-name">${this.escapeHtml(project.name)}</div>
                    <p class="project-description">${this.escapeHtml(project.description)}</p>
                    <div class="project-techs">${techsHtml}</div>
                    ${linksHtml ? `<div class="project-links">${linksHtml}</div>` : ''}
                </div>
            `;
            projectsGrid.appendChild(projectCard);
        });
    },

    /**
     * Render content grid with filtering and sorting
     */
    async renderContentGrid() {
        const content = await DataManager.getContent();
        const gridContainer = document.getElementById('contentGrid');
        const emptyState = document.getElementById('emptyState');

        // Apply filter
        let filtered = content;
        if (State.currentFilter !== 'all') {
            filtered = content.filter(item => {
                if (State.currentFilter === 'image') return item.type === 'image';
                if (State.currentFilter === 'document') return item.type === 'document';
                return true;
            });
        }

        // Apply sort
        if (State.currentSort === 'oldest') {
            filtered = [...filtered].reverse();
        } else if (State.currentSort === 'title') {
            filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        }

        // Clear grid
        gridContainer.innerHTML = '';

        // Show empty state if no content
        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Render items
        filtered.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';
            
            let thumbnail = '';
            if (item.type === 'image') {
                thumbnail = `<div class="content-thumbnail"><img src="${item.file}" alt="${item.title}"></div>`;
            } else {
                thumbnail = `<div class="content-thumbnail">${FileUtils.getFileIcon(item.type)}</div>`;
            }

            itemElement.innerHTML = `
                ${thumbnail}
                <div class="content-info">
                    <span class="content-type">${FileUtils.getFileIcon(item.type)} ${item.type === 'image' ? 'Photo' : 'Document'}</span>
                    <h3 class="content-title">${this.escapeHtml(item.title)}</h3>
                    <p class="content-date">${item.date}</p>
                    <p class="content-description">${this.escapeHtml(item.description || '')}</p>
                </div>
            `;

            itemElement.addEventListener('click', () => this.openContentModal(item));
            gridContainer.appendChild(itemElement);
        });
    },

    /**
     * Open content modal (lightbox)
     */
    openContentModal(item) {
        const modal = document.getElementById('contentModal');
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDate').textContent = item.date;
        document.getElementById('modalDescription').textContent = item.description || '';

        const modalImage = document.getElementById('modalImage');
        const modalDocument = document.getElementById('modalDocument');
        const downloadLink = document.getElementById('downloadLink');

        // Clear previous content
        modalImage.classList.remove('show');
        modalDocument.classList.remove('show');
        downloadLink.classList.remove('show');

        if (item.type === 'image') {
            modalImage.src = item.file;
            modalImage.classList.add('show');
        } else {
            modalDocument.textContent = FileUtils.getFileIcon(item.type) + ' ' + item.title;
            modalDocument.classList.add('show');
            downloadLink.href = item.file;
            downloadLink.download = item.title;
            downloadLink.classList.add('show');
        }

        modal.classList.remove('hidden');
    },

    /**
     * Render admin view with forms and content management
     */
    async renderAdminView() {
        const profile = await DataManager.getProfile();

        // Load profile data into inputs
        document.getElementById('nameInput').value = profile?.name || '';
        document.getElementById('aboutInput').value = profile?.about || '';
        document.getElementById('bioInput').value = profile?.bio || '';
        document.getElementById('statusInput').value = profile?.status || '';
        document.getElementById('githubInput').value = profile?.github || '';
        document.getElementById('linkedinInput').value = profile?.linkedin || '';
        document.getElementById('twitterInput').value = profile?.twitter || '';
        document.getElementById('emailContactInput').value = profile?.email || '';

        if (profile?.image) {
            const preview = document.getElementById('profilePreview');
            preview.src = profile.image;
            preview.classList.add('show');
        }

        // Render lists
        this.renderContentList();
        this.renderSkillsList();
        this.renderProjectsList();
    },

    /**
     * Render skills list in admin
     */
    async renderSkillsList() {
        const skills = await DataManager.getSkills();
        const skillsList = document.getElementById('skillsList');

        skillsList.innerHTML = '';

        if (skills.length === 0) {
            skillsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No skills added yet.</p>';
            return;
        }

        skills.forEach(skill => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-list-item';
            itemElement.innerHTML = `
                <div class="content-list-item-info">
                    <div class="content-list-item-title">${this.escapeHtml(skill.name)}</div>
                    <div class="content-list-item-date">${skill.category} • ${skill.level}</div>
                </div>
                <div class="content-list-item-actions">
                    <button class="btn-delete" data-skill-id="${skill._id}">Delete</button>
                </div>
            `;

            const deleteBtn = itemElement.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Delete this skill?')) {
                    try {
                        await DataManager.deleteSkill(skill._id);
                        this.renderSkillsList();
                        UI.showToast('Skill deleted', 'success');
                    } catch (error) {
                        UI.showToast('Error deleting skill', 'error');
                    }
                }
            });

            skillsList.appendChild(itemElement);
        });
    },

    /**
     * Render projects list in admin
     */
    async renderProjectsList() {
        const projects = await DataManager.getProjects();
        const projectsList = document.getElementById('projectsList');

        projectsList.innerHTML = '';

        if (projects.length === 0) {
            projectsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No projects added yet.</p>';
            return;
        }

        projects.forEach(project => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-list-item';
            itemElement.innerHTML = `
                <div class="content-list-item-info">
                    <div class="content-list-item-title">${this.escapeHtml(project.name)}</div>
                    <div class="content-list-item-date">${project.technologies?.join(', ') || 'No tech specified'}</div>
                </div>
                <div class="content-list-item-actions">
                    <button class="btn-delete" data-project-id="${project._id}">Delete</button>
                </div>
            `;

            const deleteBtn = itemElement.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Delete this project?')) {
                    try {
                        await DataManager.deleteProject(project._id);
                        this.renderProjectsList();
                        UI.showToast('Project deleted', 'success');
                        UI.renderPublicView();
                    } catch (error) {
                        UI.showToast('Error deleting project', 'error');
                    }
                }
            });

            projectsList.appendChild(itemElement);
        });
    },

    /**
     * Render content management list
     */
    async renderContentList() {
        const content = await DataManager.getContent();
        const listContainer = document.getElementById('contentList');

        listContainer.innerHTML = '';

        if (content.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No content uploaded yet.</p>';
            return;
        }

        content.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-list-item';
            itemElement.innerHTML = `
                <div class="content-list-item-info">
                    <div class="content-list-item-title">${this.escapeHtml(item.title)}</div>
                    <div class="content-list-item-date">${item.date} • ${item.type === 'image' ? 'Photo' : 'Document'}</div>
                </div>
                <div class="content-list-item-actions">
                    <button class="btn-delete" data-id="${item.id}">Delete</button>
                </div>
            `;

            const deleteBtn = itemElement.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this item?')) {
                    try {
                        await DataManager.deleteContent(item.id);
                        this.renderContentList();
                        UI.showToast('Content deleted', 'success');
                        UI.renderPublicView();
                    } catch (error) {
                        UI.showToast('Error deleting content', 'error');
                    }
                }
            });

            listContainer.appendChild(itemElement);
        });
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        DataManager.setTheme(isDarkMode ? 'dark' : 'light');
        this.updateThemeButton();
    },

    /**
     * Update theme button display
     */
    updateThemeButton() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const buttons = document.querySelectorAll('[id^="themToggle"]');
        buttons.forEach(btn => {
            btn.textContent = isDarkMode ? '☀️' : '🌙';
        });
    },

    /**
     * Apply saved theme on page load
     */
    applyTheme() {
        const theme = DataManager.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        this.updateThemeButton();
    }
};

// ================================================
// EVENT LISTENERS & INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme
    UI.applyTheme();

    // Render initial view
    Router.goTo('public');

    // ========== LOGIN & AUTH EVENTS ==========
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    // Open modals
    loginBtn.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
        registerModal.classList.add('hidden');
    });

    registerBtn.addEventListener('click', () => {
        registerModal.classList.remove('hidden');
        loginModal.classList.add('hidden');
    });

    // Switch between login and register
    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.add('hidden');
        registerModal.classList.remove('hidden');
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await Auth.login(username, password);
        if (result.success) {
            UI.showToast(result.message, 'success');
            loginModal.classList.add('hidden');
            loginForm.reset();
            Router.goTo('admin');
        } else {
            UI.showToast(result.message, 'error');
        }
    });

    // Handle registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerPasswordConfirm').value;
        const accessKey = document.getElementById('registerAccessKey')?.value || '';
        const email = document.getElementById('registerEmail')?.value || username + '@blog.local';
        
        const result = await Auth.register(username, email, password, confirmPassword, accessKey);
        if (result.success) {
            UI.showToast(result.message, 'success');
            registerModal.classList.add('hidden');
            registerForm.reset();
            Router.goTo('admin');
        } else {
            UI.showToast(result.message, 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        Auth.logout();
        Router.goTo('public');
        UI.showToast('Logged out successfully', 'success');
    });

    // Close modals
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Close modal on overlay click
    document.getElementById('contentModal').addEventListener('click', (e) => {
        if (e.target.id === 'contentModal' || e.target.classList.contains('modal-overlay')) {
            document.getElementById('contentModal').classList.add('hidden');
        }
    });

    // ========== THEME TOGGLE ==========
    document.querySelectorAll('[id^="themToggle"]').forEach(btn => {
        btn.addEventListener('click', () => UI.toggleDarkMode());
    });

    // ========== FILTER & SORT CONTROLS ==========
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            State.setFilter(e.target.dataset.filter);
            UI.renderContentGrid();
        });
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
        State.setSort(e.target.value);
        UI.renderContentGrid();
    });

    // ========== ADMIN PROFILE SETTINGS ==========
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePreview = document.getElementById('profilePreview');
    const profileUploadArea = document.getElementById('profileUploadArea');
    let profileImageChanged = false;
    let newProfileImage = null;

    profileUploadArea.addEventListener('click', () => profilePicInput.click());

    profileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        profileUploadArea.style.borderColor = 'var(--secondary)';
        profileUploadArea.style.backgroundColor = 'var(--secondary-light)';
    });

    profileUploadArea.addEventListener('dragleave', () => {
        profileUploadArea.style.borderColor = '';
        profileUploadArea.style.backgroundColor = '';
    });

    profileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        profileUploadArea.style.borderColor = '';
        profileUploadArea.style.backgroundColor = '';
        if (e.dataTransfer.files.length > 0) {
            profilePicInput.files = e.dataTransfer.files;
            handleProfilePicChange();
        }
    });

    profilePicInput.addEventListener('change', handleProfilePicChange);

    async function handleProfilePicChange() {
        const file = profilePicInput.files[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await FileUtils.toBase64(file);
            profilePreview.src = base64;
            profilePreview.classList.add('show');
            profileImageChanged = true;
            newProfileImage = base64;
        }
    }

    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        try {
            const profile = await DataManager.getProfile();
            const updated = {
                ...profile,
                name: document.getElementById('nameInput').value || profile.name,
                about: document.getElementById('aboutInput').value || profile.about,
                bio: document.getElementById('bioInput').value || profile.bio,
                status: document.getElementById('statusInput').value || profile.status,
                github: document.getElementById('githubInput').value || '',
                linkedin: document.getElementById('linkedinInput').value || '',
                twitter: document.getElementById('twitterInput').value || '',
                email: document.getElementById('emailContactInput').value || ''
            };
            
            if (profileImageChanged && newProfileImage) {
                updated.image = newProfileImage;
                profileImageChanged = false;
                newProfileImage = null;
            }

            await DataManager.setProfile(updated);
            UI.showToast('Profile saved successfully!', 'success');
            UI.renderPublicView();
        } catch (error) {
            UI.showToast('Error saving profile', 'error');
        }
    });

    // ========== FILE UPLOAD ==========
    const contentFile = document.getElementById('contentFile');
    const uploadArea = document.getElementById('uploadArea');
    const contentTypeSelect = document.getElementById('contentTypeSelect');
    const contentPreview = document.getElementById('contentPreview');
    const documentPreview = document.getElementById('documentPreview');
    const fileName = document.getElementById('fileName');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'var(--primary-light)';
        uploadArea.style.borderColor = 'var(--primary)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) {
            contentFile.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    uploadArea.addEventListener('click', () => contentFile.click());
    contentFile.addEventListener('change', handleFileSelect);

    async function handleFileSelect() {
        const file = contentFile.files[0];
        if (!file) return;

        const fileType = FileUtils.getFileType(file.name);
        contentTypeSelect.value = fileType;

        fileName.textContent = `Selected: ${file.name}`;

        contentPreview.classList.remove('show');
        documentPreview.classList.remove('show');

        if (fileType === 'image') {
            const base64 = await FileUtils.toBase64(file);
            contentPreview.src = base64;
            contentPreview.classList.add('show');
        } else {
            documentPreview.textContent = FileUtils.getFileIcon(fileType) + ' ' + file.name;
            documentPreview.classList.add('show');
        }
    }

    document.getElementById('uploadBtn').addEventListener('click', async () => {
        const file = contentFile.files[0];
        const title = document.getElementById('contentTitle').value.trim();
        const description = document.getElementById('contentDescription').value.trim();
        const type = document.getElementById('contentTypeSelect').value;

        if (!file || !title) {
            UI.showToast('Please select a file and enter a title', 'error');
            return;
        }

        try {
            const base64 = await FileUtils.toBase64(file);
            
            await DataManager.addContent({
                type: type,
                title: title,
                description: description,
                file: base64,
                originalFilename: file.name
            });

            contentFile.value = '';
            document.getElementById('contentTitle').value = '';
            document.getElementById('contentDescription').value = '';
            fileName.textContent = '';
            contentPreview.classList.remove('show');
            documentPreview.classList.remove('show');

            UI.showToast('Content uploaded successfully!', 'success');
            UI.renderContentList();
            UI.renderPublicView();
        } catch (error) {
            UI.showToast('Error uploading file', 'error');
            console.error(error);
        }
    });

    // ========== SKILLS MANAGEMENT ==========
    const skillNameInput = document.getElementById('skillName');
    const skillCategorySelect = document.getElementById('skillCategory');
    const skillLevelSelect = document.getElementById('skillLevel');
    const addSkillBtn = document.getElementById('addSkillBtn');

    addSkillBtn.addEventListener('click', async () => {
        const name = skillNameInput.value.trim();
        const category = skillCategorySelect.value;
        const level = skillLevelSelect.value;

        if (!name) {
            UI.showToast('Please enter a skill name', 'error');
            return;
        }

        try {
            await DataManager.addSkill({ name, category, level });
            skillNameInput.value = '';
            UI.showToast('Skill added successfully!', 'success');
            UI.renderSkillsList();
            UI.renderPublicView();
        } catch (error) {
            UI.showToast('Error adding skill', 'error');
        }
    });

    // ========== PROJECTS MANAGEMENT ==========
    const projectNameInput = document.getElementById('projectName');
    const projectDescriptionInput = document.getElementById('projectDescription');
    const projectTechsInput = document.getElementById('projectTechs');
    const projectLinkInput = document.getElementById('projectLink');
    const projectGithubInput = document.getElementById('projectGithub');
    const projectImageInput = document.getElementById('projectImage');
    const projectImageArea = document.getElementById('projectImageArea');
    const projectImagePreview = document.getElementById('projectImagePreview');
    const addProjectBtn = document.getElementById('addProjectBtn');
    let projectImageData = null;

    projectImageArea.addEventListener('click', () => projectImageInput.click());

    projectImageArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        projectImageArea.style.borderColor = 'var(--primary)';
        projectImageArea.style.backgroundColor = 'var(--primary-light)';
    });

    projectImageArea.addEventListener('dragleave', () => {
        projectImageArea.style.borderColor = '';
        projectImageArea.style.backgroundColor = '';
    });

    projectImageArea.addEventListener('drop', (e) => {
        e.preventDefault();
        projectImageArea.style.borderColor = '';
        projectImageArea.style.backgroundColor = '';
        if (e.dataTransfer.files.length > 0) {
            projectImageInput.files = e.dataTransfer.files;
            handleProjectImageSelect();
        }
    });

    projectImageInput.addEventListener('change', handleProjectImageSelect);

    async function handleProjectImageSelect() {
        const file = projectImageInput.files[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await FileUtils.toBase64(file);
            projectImagePreview.src = base64;
            projectImagePreview.classList.add('show');
            projectImageData = base64;
        }
    }

    addProjectBtn.addEventListener('click', async () => {
        const name = projectNameInput.value.trim();
        const description = projectDescriptionInput.value.trim();
        const techsStr = projectTechsInput.value.trim();
        const liveLink = projectLinkInput.value.trim();
        const githubLink = projectGithubInput.value.trim();

        if (!name || !description) {
            UI.showToast('Please fill in project name and description', 'error');
            return;
        }

        try {
            const technologies = techsStr ? techsStr.split(',').map(t => t.trim()) : [];
            
            await DataManager.addProject({
                name,
                description,
                technologies,
                liveLink,
                githubLink,
                image: projectImageData
            });

            projectNameInput.value = '';
            projectDescriptionInput.value = '';
            projectTechsInput.value = '';
            projectLinkInput.value = '';
            projectGithubInput.value = '';
            projectImageInput.value = '';
            projectImagePreview.classList.remove('show');
            projectImageData = null;

            UI.showToast('Project added successfully!', 'success');
            UI.renderProjectsList();
            UI.renderPublicView();
        } catch (error) {
            UI.showToast('Error adding project', 'error');
        }
    });

    // ========== BROWSER HISTORY HANDLING ==========
    window.addEventListener('popstate', (e) => {
        const view = e.state?.view || 'public';
        if (view === 'admin' && !State.isAuthenticated) {
            Router.goTo('public');
        } else {
            Router.goTo(view);
        }
    });
});

/**
 * ================================================
 * END OF APPLICATION
 * ================================================
 */
