const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createLeadSchema,
  updateLeadSchema,
  noteSchema,
  listLeadsQuerySchema,
} = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard/stats', leadController.dashboard);
router.get('/', validate(listLeadsQuerySchema, 'query'), leadController.list);
router.post('/', validate(createLeadSchema), leadController.create);
router.get('/:id', leadController.getById);
router.patch('/:id', validate(updateLeadSchema), leadController.update);
router.delete('/:id', authorize('admin'), leadController.remove);
router.get('/:id/notes', leadController.listNotes);
router.post('/:id/notes', validate(noteSchema), leadController.addNote);
router.get('/:id/activities', leadController.listActivities);

module.exports = router;
