// The simulation clock. Tour content never reads the real time; steps set this.
// Times are written without a zone offset (2026-10-20T18:24:00), so they parse
// as local time and format the same on every machine.

export function createClock(iso) {
  let current = new Date(iso);
  return {
    now() {
      return new Date(current);
    },
    set(next) {
      current = new Date(next);
    },
    format(style) {
      if (style === 'time') {
        return current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      return current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    },
  };
}
