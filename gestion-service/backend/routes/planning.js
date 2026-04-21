const express = require('express');
const planningController = require('../controllers/planningController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, planningController.getAllPlanning);
router.get('/stats', protect, planningController.getPlanningStats);
router.get('/semaine/:date', protect, planningController.getPlanningByWeek);
router.get('/agent/:id', protect, planningController.getPlanningByAgent);
router.get('/:id', protect, planningController.getPlanningById);
router.post('/', protect, restrictTo('admin', 'superviseur'), planningController.createPlanning);
router.put('/:id', protect, restrictTo('admin', 'superviseur'), planningController.updatePlanning);
router.delete('/:id', protect, restrictTo('admin', 'superviseur'), planningController.deletePlanning);

module.exports = router;
