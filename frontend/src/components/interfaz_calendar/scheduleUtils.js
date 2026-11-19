export const DAY_NAMES = {
  L: 'Lunes',
  M: 'Martes',
  I: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
};

export const DAY_ORDER = ['L', 'M', 'I', 'J', 'V', 'S'];

export function normalizeSubjectCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function normalizeProfessorName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\sñ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractCourseDays(daysStr) {
  if (!daysStr) return [];
  return daysStr.trim().split(/\s+/).filter((d) => DAY_ORDER.includes(d));
}

export function parseScheduleRange(scheduleStr) {
  if (!scheduleStr || !scheduleStr.includes('-')) return null;

  const [rawStart, rawEnd] = scheduleStr.trim().split('-');
  if (rawStart.length < 4 || rawEnd.length < 4) return null;

  const startHour = parseInt(rawStart.slice(0, 2), 10);
  const startMin = parseInt(rawStart.slice(2, 4), 10);
  const endHour = parseInt(rawEnd.slice(0, 2), 10);
  const endMin = parseInt(rawEnd.slice(2, 4), 10);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
    return null;
  }

  return {
    startMinutes,
    endMinutes,
    startRowHour: startHour,
    endRowHour: endMin === 0 ? Math.max(startHour, endHour - 1) : endHour,
    formatted: `${rawStart.slice(0, 2)}:${rawStart.slice(2, 4)} - ${rawEnd.slice(0, 2)}:${rawEnd.slice(2, 4)}`,
  };
}

export function schedulesOverlap(rangeA, rangeB) {
  return rangeA.startMinutes < rangeB.endMinutes && rangeA.endMinutes > rangeB.startMinutes;
}

/* Detecta empalmes de profesor */
export function detectSubjectConflicts(records) {
  const conflictKeys = new Set();
  if (!Array.isArray(records) || records.length < 2) return conflictKeys;

  const prepared = records.map(({ data, professor }, idx) => {
    const professorNorm = normalizeProfessorName(professor);
    return {
      idx,
      code: normalizeSubjectCode(data.code),
      professorNorm,
      hasProfessor: professorNorm !== '' && professorNorm !== 'profesor no asignado',
      days: extractCourseDays(data.days),
      range: parseScheduleRange(data.schedule),
    };
  });

  for (let i = 0; i < prepared.length; i++) {
    const a = prepared[i];
    if (!a.code || !a.hasProfessor || !a.range || a.days.length === 0) continue;

    for (let j = i + 1; j < prepared.length; j++) {
      const b = prepared[j];
      if (!b.code || !b.hasProfessor || !b.range || b.days.length === 0) continue;

      if (a.code !== b.code || a.professorNorm !== b.professorNorm) continue;
      if (!schedulesOverlap(a.range, b.range)) continue;

      a.days.forEach((dayKey) => {
        if (b.days.includes(dayKey)) {
          conflictKeys.add(`${a.idx}-${dayKey}`);
          conflictKeys.add(`${b.idx}-${dayKey}`);
        }
      });
    }
  }

  return conflictKeys;
}