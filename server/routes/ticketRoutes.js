const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/:building', ticketController.getTicketsByBuilding);
router.put('/:id', authMiddleware, ticketController.updateTicket);
router.delete('/:id', authMiddleware, ticketController.deleteTicket);

module.exports = router;
