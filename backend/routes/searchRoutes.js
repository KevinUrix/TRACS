/*
  EL ARCHIVO YA NO SE USA, SE CAMBIÓ POR BÚSQUEDA EN MEMORIA LOCAL DEL CLIENTE.
  LO DEJO POR SI SE REQUIERE SU USO EN EL FUTURO. RECUERDEN QUE PUEDEN REGRESAR A LA VERSIÓN ANTERIOR CON GIT SI ES NECESARIO.
*/


const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.get('/search', searchController.getSearch);

module.exports = router;
