// Heat, witness memory and recovery govern the Solara Police response.
export function createWanted(onRecover = () => {}) {
  let heat = 0;
  let unseen = 0;
  let visible = false;
  let arrest = 0;
  let ending = '';
  let remaining = 0;
  let lastCrime = '';

  function report(reason, amount) {
    if (ending) return;
    heat = Math.min(5, heat + amount);
    unseen = 0;
    lastCrime = reason;
  }

  function finish(reason) {
    ending = reason;
    remaining = 3.5;
  }

  function update(dt, { seen = false, detained = false, health = 100 } = {}) {
    if (ending) {
      remaining -= dt;
      if (remaining <= 0) {
        const reason = ending;
        heat = unseen = arrest = 0;
        visible = false;
        ending = lastCrime = '';
        onRecover(reason);
      }
      return;
    }
    visible = heat > 0 && seen;
    unseen = visible ? 0 : unseen + dt;
    if (heat > 0 && unseen > 9 + Math.ceil(heat) * 3) {
      heat = Math.max(0, Math.ceil(heat) - 1);
      unseen = 0;
    }
    arrest = detained ? arrest + dt : Math.max(0, arrest - dt * 2);
    if (health <= 0) finish('WASTED');
    else if (arrest >= 2.25) finish('BUSTED');
  }

  return {
    report, update,
    clear() {
      heat = unseen = arrest = 0;
      visible = false;
      ending = lastCrime = '';
    },
    get stars() { return Math.ceil(heat); },
    get status() { return heat <= 0 ? 'CLEAR' : visible ? 'IN SIGHT' : 'SEARCHING'; },
    get lastCrime() { return lastCrime; },
    get ending() { return ending; },
    get arrest() { return Math.min(1, arrest / 2.25); }
  };
}
