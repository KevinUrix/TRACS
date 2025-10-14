const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');


router.post('/', authMiddleware, authRole(['user', 'tecnico', 'superuser']), ticketController.createTicket);
router.get('/', authMiddleware, authRole(['user', 'tecnico', 'superuser']), ticketController.getAllTickets);
router.get('/:building', authMiddleware, authRole(['user', 'tecnico', 'superuser']), ticketController.getTicketsByBuilding);
router.put('/:id', authMiddleware, authRole(['user', 'tecnico', 'superuser']), ticketController.updateTicket);
router.delete('/:id', authMiddleware, authRole(['user', 'tecnico', 'superuser']), ticketController.deleteTicket);

module.exports = router;
