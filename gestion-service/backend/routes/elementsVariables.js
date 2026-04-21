const express = require('express');
const elementVariableController = require('../controllers/elementVariableController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, elementVariableController.getAllElementsVariables);
router.get('/recap/:mois/:annee', protect, elementVariableController.getRecapMensuel);
router.get('/agent/:id', protect, elementVariableController.getElementsVariablesByAgent);
router.post('/', protect, restrictTo('admin', 'superviseur'), elementVariableController.createElementVariable);
router.put('/:id', protect, restrictTo('admin', 'superviseur'), elementVariableController.updateElementVariable);
router.delete('/:id', protect, restrictTo('admin'), elementVariableController.deleteElementVariable);
router.put('/:id/valider', protect, restrictTo('admin', 'superviseur'), elementVariableController.validerElementVariable);

module.exports = router;
