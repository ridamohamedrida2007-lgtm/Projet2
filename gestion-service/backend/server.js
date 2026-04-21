require('dotenv').config();

const cors = require('cors');
const express = require('express');
require('./config/db');

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const planningRoutes = require('./routes/planning');
const elementVariableRoutes = require('./routes/elementsVariables');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/elements-variables', elementVariableRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route introuvable'
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur'
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
