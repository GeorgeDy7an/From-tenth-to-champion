/* A small, local teaching example. Supply a durable write function. */
function createSaveQueue(write) {
  const tails = new Map();
  return function save(slot, value) {
    const snapshot = structuredClone(value);
    const previous = tails.get(slot) || Promise.resolve();
    const pending = previous.catch(() => {}).then(() => write(slot, snapshot));
    tails.set(slot, pending);
    function release() {
      if (tails.get(slot) === pending) tails.delete(slot);
    }
    pending.then(release, release);
    return pending;
  };
}

if (typeof module === 'object') module.exports = { createSaveQueue };
