import React from 'react';

const dayNames = {
  L: 'Lunes',
  M: 'Martes',
  I: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
  D: 'Domingo',
};

// Orden correcto de los días para presentación
const dayOrder = ['L', 'M', 'I', 'J', 'V', 'S', 'D'];

export default function ProfessorSchedule({ professorSchedule, selectedCycle }) {
  if (!professorSchedule || professorSchedule.length === 0) {
    return <p>No se encontraron horarios para este profesor {selectedCycle}.</p>;
  }

  const groupedSchedules = professorSchedule.reduce((acc, course) => {
    const professor = course.professor;
    if (!acc[professor]) {
      acc[professor] = [];
    }
    acc[professor].push(course);
    return acc;
  }, {});

  const professors = Object.keys(groupedSchedules);

  const translateDays = (daysString) => {
    const letters = daysString
      .toUpperCase()
      .replace(/[^LMIJVSD]/g, '') // elimina caracteres no válidos
      .split('');

    // Ordenar por día de la semana y traducir
    const sorted = [...new Set(letters)].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );

    return sorted.map((char) => dayNames[char]).join(', ');
  };

  return (
    <div className="professor-schedule-popup">
      <strong>
        <h3>Horarios encontrados:</h3>
      </strong>
      <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #666' }} />

      {professors.map((professor, idx) => (
        <div key={idx} className="professor-section">
          <strong>
            <h4>{professor}</h4>
          </strong>
          <ul>
            {groupedSchedules[professor].map((course, index, arr) => (
              <li key={index}>
                <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
                  <strong>Materia:</strong> {course.data.course}
                  <br />
                  <strong>Día:</strong> {translateDays(course.data.days)}
                  <br />
                  <strong>Horario:</strong> {course.data.schedule.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1:$2-$3:$4")}
                  <br />
                  <strong>Edificio:</strong> {course.data.building}
                  <br />
                  <strong>Salón:</strong> {course.data.classroom}
                <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
              </li>
            ))}
          </ul>
          {idx < professors.length - 1 && (
            <hr style={{ margin: '20px 0', borderTop: '2px solid #888' }} />
          )}
        </div>
      ))}
    </div>
  );
}
