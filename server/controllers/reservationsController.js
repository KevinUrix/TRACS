const fs = require('fs');
const path = require('path');

const saveReservation = (req, res) => {
  const { cycle, buildingName } = req.query;
  const reservationData = req.body;
  const filePath = path.join(__dirname, `../../public/data/${cycle}/${buildingName}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      // Si el archivo no existe, crear uno con un objeto vacío
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ data: [] }, null, 2));
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let currentData = { data: [] };

    // Si el archivo tiene contenido, intenta parsearlo, si no, mantén el objeto vacío
    if (fileContent.trim() !== '') {
      try {
        currentData = JSON.parse(fileContent);
      } catch (error) {
        console.error("Error al parsear el archivo JSON:", error);
        currentData = { data: [] }; // Si el archivo tiene un formato incorrecto, inicializamos con datos vacíos
      }
    }

    // Agrega la nueva reserva a los datos existentes
    currentData.data.push(reservationData);

    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));

    // Responde con éxito
    res.status(201).json({ message: 'Reserva guardada con éxito' });
  } catch (error) {
    console.error("Error al guardar la reserva:", error);
    res.status(500).json({ error: 'Hubo un error al guardar la reserva' });
  }
};

module.exports = {
  saveReservation,
};
