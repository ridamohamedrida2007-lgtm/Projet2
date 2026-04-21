const express = require('express');
const agentController = require('../controllers/agentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, agentController.getAllAgents);
router.get('/stats', protect, agentController.getAgentStats);
router.get('/:id', protect, agentController.getAgentById);
router.post('/', protect, restrictTo('admin', 'superviseur'), agentController.createAgent);
router.put('/:id', protect, restrictTo('admin', 'superviseur'), agentController.updateAgent);
router.delete('/:id', protect, restrictTo('admin'), agentController.deleteAgent);

module.exports = router;
