const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Data file paths
const DATA_DIR = path.join(__dirname, '../data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions to read/write data
function readData(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
}

function writeData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
        return false;
    }
}

// Authentication middleware (simple role-based)
function authenticate(req, res, next) {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Authentification requise' });
    }
    
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    req.user = user;
    next();
}

function isTeacher(req, res, next) {
    if (req.user.role !== 'enseignant') {
        return res.status(403).json({ error: 'Accès réservé aux enseignants' });
    }
    next();
}

// ============ ROUTES: USERS ============

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readData(USERS_FILE);
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role,
        nom: user.nom
    });
});

// Get current user
app.get('/api/users/me', authenticate, (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        nom: req.user.nom
    });
});

// ============ ROUTES: CLIENTS ============

// Get all clients
app.get('/api/clients', authenticate, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    res.json(clients);
});

// Get client by ID
app.get('/api/clients/:id', authenticate, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    const client = clients.find(c => c.id === req.params.id);
    
    if (!client) {
        return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    res.json(client);
});

// Create client
app.post('/api/clients', authenticate, isTeacher, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    const { nom, prenom, email, telephone, adresse } = req.body;
    
    if (!nom || !prenom || !email) {
        return res.status(400).json({ error: 'Nom, prénom et email requis' });
    }
    
    const newClient = {
        id: uuidv4(),
        nom,
        prenom,
        email,
        telephone: telephone || '',
        adresse: adresse || '',
        dateCreation: new Date().toISOString()
    };
    
    clients.push(newClient);
    writeData(CLIENTS_FILE, clients);
    
    res.status(201).json(newClient);
});

// Update client
app.put('/api/clients/:id', authenticate, isTeacher, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    const index = clients.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const { nom, prenom, email, telephone, adresse } = req.body;
    
    clients[index] = {
        ...clients[index],
        nom: nom || clients[index].nom,
        prenom: prenom || clients[index].prenom,
        email: email || clients[index].email,
        telephone: telephone !== undefined ? telephone : clients[index].telephone,
        adresse: adresse !== undefined ? adresse : clients[index].adresse
    };
    
    writeData(CLIENTS_FILE, clients);
    res.json(clients[index]);
});

// Delete client
app.delete('/api/clients/:id', authenticate, isTeacher, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    const accounts = readData(ACCOUNTS_FILE);
    
    // Check if client has accounts
    const hasAccounts = accounts.some(a => a.clientId === req.params.id);
    if (hasAccounts) {
        return res.status(400).json({ error: 'Impossible de supprimer un client avec des comptes actifs' });
    }
    
    const newClients = clients.filter(c => c.id !== req.params.id);
    
    if (newClients.length === clients.length) {
        return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    writeData(CLIENTS_FILE, newClients);
    res.json({ message: 'Client supprimé avec succès' });
});

// ============ ROUTES: ACCOUNTS ============

// Get all accounts
app.get('/api/accounts', authenticate, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const clientId = req.query.clientId;
    
    if (clientId) {
        const filtered = accounts.filter(a => a.clientId === clientId);
        return res.json(filtered);
    }
    
    res.json(accounts);
});

// Get account by ID
app.get('/api/accounts/:id', authenticate, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const account = accounts.find(a => a.id === req.params.id);
    
    if (!account) {
        return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    res.json(account);
});

// Create account
app.post('/api/accounts', authenticate, isTeacher, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const clients = readData(CLIENTS_FILE);
    const { clientId, type, soldeInitial } = req.body;
    
    if (!clientId || !type) {
        return res.status(400).json({ error: 'Client ID et type requis' });
    }
    
    const client = clients.find(c => c.id === clientId);
    if (!client) {
        return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const validTypes = ['cheques', 'epargne', 'credit'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type de compte invalide (cheques, epargne, credit)' });
    }
    
    const numeroCompte = 'CA' + Date.now() + Math.floor(Math.random() * 1000);
    
    const newAccount = {
        id: uuidv4(),
        numeroCompte,
        clientId,
        type,
        solde: parseFloat(soldeInitial) || 0,
        dateCreation: new Date().toISOString(),
        actif: true
    };
    
    accounts.push(newAccount);
    writeData(ACCOUNTS_FILE, accounts);
    
    res.status(201).json(newAccount);
});

// Update account status
app.put('/api/accounts/:id', authenticate, isTeacher, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const index = accounts.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    const { actif } = req.body;
    
    if (actif !== undefined) {
        accounts[index].actif = actif;
    }
    
    writeData(ACCOUNTS_FILE, accounts);
    res.json(accounts[index]);
});

// Delete account
app.delete('/api/accounts/:id', authenticate, isTeacher, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const index = accounts.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    if (accounts[index].solde !== 0) {
        return res.status(400).json({ error: 'Impossible de supprimer un compte avec un solde non nul' });
    }
    
    accounts.splice(index, 1);
    writeData(ACCOUNTS_FILE, accounts);
    
    res.json({ message: 'Compte supprimé avec succès' });
});

// ============ ROUTES: TRANSACTIONS ============

// Get all transactions
app.get('/api/transactions', authenticate, (req, res) => {
    const transactions = readData(TRANSACTIONS_FILE);
    const accountId = req.query.accountId;
    
    if (accountId) {
        const filtered = transactions.filter(t => 
            t.compteSource === accountId || t.compteDestination === accountId
        );
        return res.json(filtered);
    }
    
    res.json(transactions);
});

// Create transfer
app.post('/api/transactions/transfer', authenticate, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const transactions = readData(TRANSACTIONS_FILE);
    const { compteSource, compteDestination, montant, description } = req.body;
    
    if (!compteSource || !compteDestination || !montant) {
        return res.status(400).json({ error: 'Compte source, destination et montant requis' });
    }
    
    const amount = parseFloat(montant);
    if (amount <= 0) {
        return res.status(400).json({ error: 'Le montant doit être positif' });
    }
    
    const sourceAccount = accounts.find(a => a.id === compteSource);
    const destAccount = accounts.find(a => a.id === compteDestination);
    
    if (!sourceAccount || !destAccount) {
        return res.status(404).json({ error: 'Compte source ou destination non trouvé' });
    }
    
    if (!sourceAccount.actif || !destAccount.actif) {
        return res.status(400).json({ error: 'Les comptes doivent être actifs' });
    }
    
    if (sourceAccount.solde < amount) {
        return res.status(400).json({ error: 'Solde insuffisant' });
    }
    
    // Update account balances
    sourceAccount.solde -= amount;
    destAccount.solde += amount;
    
    writeData(ACCOUNTS_FILE, accounts);
    
    // Create transaction record
    const transaction = {
        id: uuidv4(),
        type: 'virement',
        compteSource,
        compteDestination,
        montant: amount,
        description: description || 'Virement',
        date: new Date().toISOString(),
        status: 'complete'
    };
    
    transactions.push(transaction);
    writeData(TRANSACTIONS_FILE, transactions);
    
    res.status(201).json(transaction);
});

// Create payment
app.post('/api/transactions/payment', authenticate, (req, res) => {
    const accounts = readData(ACCOUNTS_FILE);
    const transactions = readData(TRANSACTIONS_FILE);
    const { compteSource, montant, description, beneficiaire } = req.body;
    
    if (!compteSource || !montant || !beneficiaire) {
        return res.status(400).json({ error: 'Compte source, montant et bénéficiaire requis' });
    }
    
    const amount = parseFloat(montant);
    if (amount <= 0) {
        return res.status(400).json({ error: 'Le montant doit être positif' });
    }
    
    const sourceAccount = accounts.find(a => a.id === compteSource);
    
    if (!sourceAccount) {
        return res.status(404).json({ error: 'Compte non trouvé' });
    }
    
    if (!sourceAccount.actif) {
        return res.status(400).json({ error: 'Le compte doit être actif' });
    }
    
    if (sourceAccount.solde < amount) {
        return res.status(400).json({ error: 'Solde insuffisant' });
    }
    
    // Update account balance
    sourceAccount.solde -= amount;
    writeData(ACCOUNTS_FILE, accounts);
    
    // Create transaction record
    const transaction = {
        id: uuidv4(),
        type: 'paiement',
        compteSource,
        montant: amount,
        beneficiaire,
        description: description || 'Paiement',
        date: new Date().toISOString(),
        status: 'complete'
    };
    
    transactions.push(transaction);
    writeData(TRANSACTIONS_FILE, transactions);
    
    res.status(201).json(transaction);
});

// Get transaction history for an account
app.get('/api/transactions/history/:accountId', authenticate, (req, res) => {
    const transactions = readData(TRANSACTIONS_FILE);
    const accountId = req.params.accountId;
    
    const history = transactions
        .filter(t => t.compteSource === accountId || t.compteDestination === accountId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(history);
});

// ============ STATISTICS (for teachers) ============

app.get('/api/stats', authenticate, isTeacher, (req, res) => {
    const clients = readData(CLIENTS_FILE);
    const accounts = readData(ACCOUNTS_FILE);
    const transactions = readData(TRANSACTIONS_FILE);
    
    const stats = {
        totalClients: clients.length,
        totalAccounts: accounts.length,
        totalTransactions: transactions.length,
        totalSolde: accounts.reduce((sum, acc) => sum + acc.solde, 0),
        accountsByType: {
            cheques: accounts.filter(a => a.type === 'cheques').length,
            epargne: accounts.filter(a => a.type === 'epargne').length,
            credit: accounts.filter(a => a.type === 'credit').length
        }
    };
    
    res.json(stats);
});

// Start server
app.listen(PORT, () => {
    console.log(`Serveur bancaire démarré sur le port ${PORT}`);
    console.log(`Interface: http://localhost:${PORT}`);
});
