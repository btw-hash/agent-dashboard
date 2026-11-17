// What happened today, kept in this browser: feeds the newspaper, the "days OK" board
// and the achievements. Nothing here ever leaves the page.
const DAY = 'agent_office_day',
  INCIDENT = 'agent_office_incident',
  BADGES = 'agent_office_badges';
const today = () => new Date().toLocaleDateString('en-CA');
const read = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // a private window: the numbers live for this visit only
  }
};
const blank = () => ({ date: today(), done: 0, errors: 0, joins: 0, games: 0, pets: 0, by: {} });

export function createStats(office) {
  let day = read(DAY, null);
  if (!day || day.date !== today()) day = blank();
  let incident = read(INCIDENT, 0) || Date.now();
  const badges = new Set(read(BADGES, []));
  const save = () => write(DAY, day);
  const roll = () => {
    if (day.date === today()) return;
    day = blank();
    save();
    office.emit('midnight');
  };
  write(INCIDENT, incident);
  setInterval(roll, 30000);

  office.on('event', (type, p) => {
    roll();
    if (type === 'cheer') {
      day.done++;
      day.by[p.name] = (day.by[p.name] || 0) + 1;
    } else if (type === 'palm') {
      day.errors++;
      incident = Date.now();
      write(INCIDENT, incident);
    } else if (type === 'join') day.joins++;
    else return;
    save();
  });
  office.on('game', () => {
    day.games++;
    save();
  });
  return {
    day: () => day,
    daysOk: () => Math.floor((Date.now() - incident) / 86400000),
    pet() {
      day.pets++;
      save();
      return day.pets;
    },
    has: (id) => badges.has(id),
    award(id) {
      if (badges.has(id)) return false;
      badges.add(id);
      write(BADGES, [...badges]);
      return true;
    },
  };
}
