// API Configuration
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let clients = [];
let accounts = [];
let transactions = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Modals
const clientModal = document.getElementById('clientModal');
const accountModal = document.getElementById('accountModal');
const transferModal = document.getElementById('transferModal');
const paymentModal = document.getElementById('paymentModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuth();
});

// Event Listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });

    // Buttons
    document.getElementById('addClientBtn')?.addEventListener('click', () => openClientModal());
    document.getElementById('addAccountBtn')?.addEventListener('click', () => openAccountModal());
    document.getElementById('transferBtn')?.addEventListener('click', () => openTransferModal());
    document.getElementById('paymentBtn')?.addEventListener('click', () => openPaymentModal());

    // Forms
    document.getElementById('clientForm')?.addEventListener('submit', handleClientSubmit);
    document.getElementById('accountForm')?.addEventListener('submit', handleAccountSubmit);
    document.getElementById('transferForm')?.addEventListener('submit', handleTransferSubmit);
    document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);

    // Filters
    document.getElementById('clientFilter')?.addEventListener('change', loadAccounts);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Authentication
function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        fetch(`${API_URL}/users/me`, {
            headers: { 'user-id': userId }
        })
        .then(res => res.json())
        .then(user => {
            currentUser = user;
            showApp();
        })
        .catch(() => {
            localStorage.removeItem('userId');
            showLogin();
        });
    } else {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            throw new Error('Identifiants invalides');
        }

        const user = await res.json();
        currentUser = user;
        localStorage.setItem('userId', user.id);
        showApp();
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.add('active');
    }
}

function handleLogout() {
    localStorage.removeItem('userId');
    currentUser = null;
    showLogin();
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    loginForm.reset();
    loginError.classList.remove('active');
}

function showApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userDisplay.textContent = `${currentUser.nom} (${currentUser.role === 'enseignant' ? 'Enseignant' : 'Étudiant'})`;
    
    // Show/hide teacher-only elements
    const teacherElements = document.querySelectorAll('.teacher-only');
    teacherElements.forEach(el => {
        if (currentUser.role === 'enseignant') {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });

    // Load data and show dashboard
    loadData();
    switchView('dashboard');
}

// Navigation
function switchView(viewName) {
    navBtns.forEach(btn => btn.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));

    const targetBtn = document.querySelector(`[data-view="${viewName}"]`);
    const targetView = document.getElementById(`${viewName}View`);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetView) targetView.classList.add('active');

    // Load view-specific data
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'clients':
            loadClients();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'admin':
            loadAdminStats();
            break;
    }
}

// Data Loading
async function loadData() {
    try {
        const headers = { 'user-id': currentUser.id };
        
        const [clientsRes, accountsRes, transactionsRes] = await Promise.all([
            fetch(`${API_URL}/clients`, { headers }),
            fetch(`${API_URL}/accounts`, { headers }),
            fetch(`${API_URL}/transactions`, { headers })
        ]);

        clients = await clientsRes.json();
        accounts = await accountsRes.json();
        transactions = await transactionsRes.json();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Dashboard
async function loadDashboard() {
    await loadData();

    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalAccounts').textContent = accounts.length;
    document.getElementById('totalTransactions').textContent = transactions.length;
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.solde, 0);
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);

    // Recent transactions
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const recentContainer = document.getElementById('recentTransactions');
    if (recentTransactions.length === 0) {
        recentContainer.innerHTML = '<div class="empty-state"><p>Aucune transaction récente</p></div>';
    } else {
        recentContainer.innerHTML = recentTransactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-type">${t.type === 'virement' ? '💸 Virement' : '💳 Paiement'}</div>
                    <div class="transaction-desc">${t.description || '-'}</div>
                    <div class="transaction-desc">${formatDate(t.date)}</div>
                </div>
                <div class="transaction-amount amount-negative">${formatCurrency(t.montant)}</div>
            </div>
        `).join('');
    }
}

// Clients
async function loadClients() {
    await loadData();
    
    const clientsList = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        clientsList.innerHTML = '<div class="empty-state"><p>Aucun client enregistré</p></div>';
        return;
    }

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Date de création</th>
                    ${currentUser.role === 'enseignant' ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${clients.map(client => `
                    <tr>
                        <td>${client.nom}</td>
                        <td>${client.prenom}</td>
                        <td>${client.email}</td>
                        <td>${client.telephone || '-'}</td>
                        <td>${formatDate(client.dateCreation)}</td>
                        ${currentUser.role === 'enseignant' ? `
                            <td class="actions">
                                <button class="btn btn-edit" onclick="editClient('${client.id}')">Modifier</button>
                                <button class="btn btn-danger" onclick="deleteClient('${client.id}')">Supprimer</button>
                            </td>
                        ` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    clientsList.innerHTML = tableHtml;
}

// Accounts
async function loadAccounts() {
    await loadData();
    
    const clientFilter = document.getElementById('clientFilter');
    const selectedClient = clientFilter.value;

    // Populate client filter
    clientFilter.innerHTML = '<option value="">Tous les clients</option>' +
        clients.map(c => `<option value="${c.id}" ${c.id === selectedClient ? 'selected' : ''}>${c.nom} ${c.prenom}</option>`).join('');

    // Filter accounts
    let filteredAccounts = accounts;
    if (selectedClient) {
        filteredAccounts = accounts.filter(a => a.clientId === selectedClient);
    }

    const accountsList = document.getElementById('accountsList');
    
    if (filteredAccounts.length === 0) {
        accountsList.innerHTML = '<div class="empty-state"><p>Aucun compte trouvé</p></div>';
        return;
    }

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>N° Compte</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Solde</th>
                    <th>Statut</th>
                    <th>Date de création</th>
                    ${currentUser.role === 'enseignant' ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${filteredAccounts.map(account => {
                    const client = clients.find(c => c.id === account.clientId);
                    return `
                        <tr>
                            <td>${account.numeroCompte}</td>
                            <td>${client ? `${client.nom} ${client.prenom}` : '-'}</td>
                            <td><span class="badge badge-info">${getAccountTypeLabel(account.type)}</span></td>
                            <td style="font-weight: bold; color: ${account.solde >= 0 ? '#28a745' : '#dc3545'}">${formatCurrency(account.solde)}</td>
                            <td><span class="badge ${account.actif ? 'badge-success' : 'badge-danger'}">${account.actif ? 'Actif' : 'Inactif'}</span></td>
                            <td>${formatDate(account.dateCreation)}</td>
                            ${currentUser.role === 'enseignant' ? `
                                <td class="actions">
                                    <button class="btn btn-edit" onclick="toggleAccountStatus('${account.id}', ${!account.actif})">${account.actif ? 'Désactiver' : 'Activer'}</button>
                                    <button class="btn btn-danger" onclick="deleteAccount('${account.id}')">Supprimer</button>
                                </td>
                            ` : ''}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    accountsList.innerHTML = tableHtml;
}

// Transactions
async function loadTransactions() {
    await loadData();
    
    const transactionsList = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="empty-state"><p>Aucune transaction enregistrée</p></div>';
        return;
    }

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                ${transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(trans => `
                        <tr>
                            <td>${formatDate(trans.date)}</td>
                            <td><span class="badge badge-info">${trans.type === 'virement' ? 'Virement' : 'Paiement'}</span></td>
                            <td>${trans.description || '-'}</td>
                            <td style="font-weight: bold; color: #dc3545">${formatCurrency(trans.montant)}</td>
                            <td><span class="badge badge-success">${trans.status === 'complete' ? 'Complété' : trans.status}</span></td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;
    
    transactionsList.innerHTML = tableHtml;
}

// Admin Stats
async function loadAdminStats() {
    try {
        const res = await fetch(`${API_URL}/stats`, {
            headers: { 'user-id': currentUser.id }
        });
        const stats = await res.json();

        const statsHtml = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Comptes Chèques</h3>
                    <p class="stat-value">${stats.accountsByType.cheques}</p>
                </div>
                <div class="stat-card">
                    <h3>Comptes Épargne</h3>
                    <p class="stat-value">${stats.accountsByType.epargne}</p>
                </div>
                <div class="stat-card">
                    <h3>Comptes Crédit</h3>
                    <p class="stat-value">${stats.accountsByType.credit}</p>
                </div>
                <div class="stat-card">
                    <h3>Solde Total Système</h3>
                    <p class="stat-value">${formatCurrency(stats.totalSolde)}</p>
                </div>
            </div>
        `;

        document.getElementById('detailedStats').innerHTML = statsHtml;
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Modal Functions
function openClientModal(clientId = null) {
    const modal = clientModal;
    const form = document.getElementById('clientForm');
    
    if (clientId) {
        const client = clients.find(c => c.id === clientId);
        document.getElementById('clientModalTitle').textContent = 'Modifier Client';
        document.getElementById('clientNom').value = client.nom;
        document.getElementById('clientPrenom').value = client.prenom;
        document.getElementById('clientEmail').value = client.email;
        document.getElementById('clientTelephone').value = client.telephone || '';
        document.getElementById('clientAdresse').value = client.adresse || '';
        form.dataset.clientId = clientId;
    } else {
        document.getElementById('clientModalTitle').textContent = 'Ajouter Client';
        form.reset();
        delete form.dataset.clientId;
    }
    
    modal.classList.add('active');
}

async function openAccountModal() {
    await loadData();
    
    const select = document.getElementById('accountClient');
    select.innerHTML = '<option value="">Sélectionnez un client</option>' +
        clients.map(c => `<option value="${c.id}">${c.nom} ${c.prenom}</option>`).join('');
    
    document.getElementById('accountForm').reset();
    accountModal.classList.add('active');
}

async function openTransferModal() {
    await loadData();
    
    const activeAccounts = accounts.filter(a => a.actif);
    const optionsHtml = '<option value="">Sélectionnez un compte</option>' +
        activeAccounts.map(a => {
            const client = clients.find(c => c.id === a.clientId);
            return `<option value="${a.id}">${a.numeroCompte} - ${client ? client.nom : ''} (${formatCurrency(a.solde)})</option>`;
        }).join('');
    
    document.getElementById('transferSource').innerHTML = optionsHtml;
    document.getElementById('transferDest').innerHTML = optionsHtml;
    document.getElementById('transferForm').reset();
    transferModal.classList.add('active');
}

async function openPaymentModal() {
    await loadData();
    
    const activeAccounts = accounts.filter(a => a.actif);
    const optionsHtml = '<option value="">Sélectionnez un compte</option>' +
        activeAccounts.map(a => {
            const client = clients.find(c => c.id === a.clientId);
            return `<option value="${a.id}">${a.numeroCompte} - ${client ? client.nom : ''} (${formatCurrency(a.solde)})</option>`;
        }).join('');
    
    document.getElementById('paymentSource').innerHTML = optionsHtml;
    document.getElementById('paymentForm').reset();
    paymentModal.classList.add('active');
}

// Form Handlers
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const clientId = form.dataset.clientId;
    
    const data = {
        nom: document.getElementById('clientNom').value,
        prenom: document.getElementById('clientPrenom').value,
        email: document.getElementById('clientEmail').value,
        telephone: document.getElementById('clientTelephone').value,
        adresse: document.getElementById('clientAdresse').value
    };

    try {
        const url = clientId ? `${API_URL}/clients/${clientId}` : `${API_URL}/clients`;
        const method = clientId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');

        clientModal.classList.remove('active');
        await loadClients();
    } catch (error) {
        alert(error.message);
    }
}

async function handleAccountSubmit(e) {
    e.preventDefault();
    
    const data = {
        clientId: document.getElementById('accountClient').value,
        type: document.getElementById('accountType').value,
        soldeInitial: document.getElementById('accountBalance').value
    };

    try {
        const res = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la création');
        }

        accountModal.classList.remove('active');
        await loadAccounts();
    } catch (error) {
        alert(error.message);
    }
}

async function handleTransferSubmit(e) {
    e.preventDefault();
    
    const data = {
        compteSource: document.getElementById('transferSource').value,
        compteDestination: document.getElementById('transferDest').value,
        montant: document.getElementById('transferAmount').value,
        description: document.getElementById('transferDesc').value
    };

    if (data.compteSource === data.compteDestination) {
        alert('Les comptes source et destination doivent être différents');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/transactions/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors du virement');
        }

        transferModal.classList.remove('active');
        await loadTransactions();
        alert('Virement effectué avec succès!');
    } catch (error) {
        alert(error.message);
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const data = {
        compteSource: document.getElementById('paymentSource').value,
        beneficiaire: document.getElementById('paymentBeneficiary').value,
        montant: document.getElementById('paymentAmount').value,
        description: document.getElementById('paymentDesc').value
    };

    try {
        const res = await fetch(`${API_URL}/transactions/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors du paiement');
        }

        paymentModal.classList.remove('active');
        await loadTransactions();
        alert('Paiement effectué avec succès!');
    } catch (error) {
        alert(error.message);
    }
}

// CRUD Operations
async function editClient(clientId) {
    openClientModal(clientId);
}

async function deleteClient(clientId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client?')) return;

    try {
        const res = await fetch(`${API_URL}/clients/${clientId}`, {
            method: 'DELETE',
            headers: { 'user-id': currentUser.id }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la suppression');
        }

        await loadClients();
    } catch (error) {
        alert(error.message);
    }
}

async function toggleAccountStatus(accountId, newStatus) {
    try {
        const res = await fetch(`${API_URL}/accounts/${accountId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id
            },
            body: JSON.stringify({ actif: newStatus })
        });

        if (!res.ok) throw new Error('Erreur lors de la mise à jour');

        await loadAccounts();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteAccount(accountId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte?')) return;

    try {
        const res = await fetch(`${API_URL}/accounts/${accountId}`, {
            method: 'DELETE',
            headers: { 'user-id': currentUser.id }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la suppression');
        }

        await loadAccounts();
    } catch (error) {
        alert(error.message);
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

function getAccountTypeLabel(type) {
    const labels = {
        'cheques': 'Chèques',
        'epargne': 'Épargne',
        'credit': 'Crédit'
    };
    return labels[type] || type;
}
