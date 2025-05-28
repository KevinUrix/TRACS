const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/:building', ticketController.getTicketsByBuilding);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
