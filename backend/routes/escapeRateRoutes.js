const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  listEscapeRates,
  createEscapeRate,
  updateEscapeRate,
  recomputeEscapeRate,
  recomputeAllEscapeRates,
  deleteEscapeRate,
  getEscapeRateIssues,
} = require('../controllers/escapeRateController');

router.get('/', requireAuth, listEscapeRates);
router.post('/', requireAuth, createEscapeRate);
router.post('/recompute-all', requireAuth, recomputeAllEscapeRates);
router.put('/:id', requireAuth, updateEscapeRate);
router.post('/:id/recompute', requireAuth, recomputeEscapeRate);
router.delete('/:id', requireAuth, deleteEscapeRate);
router.get('/:id/issues', requireAuth, getEscapeRateIssues);

module.exports = router;
