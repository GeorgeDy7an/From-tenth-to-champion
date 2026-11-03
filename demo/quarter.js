/* Showcase model. Fictional ratings and illustrative rules. */
(function (root) {
  const lineup = Object.freeze([81, 78, 83, 76, 80]);
  const tactics = Object.freeze({
    drive: { fit: 3, lift: .048 },
    pick: { fit: 4, lift: .068 },
    perimeter: { fit: 2, lift: .088 }
  });
  function simulate(tactic, seed) {
    if (!Object.hasOwn(tactics, tactic)) throw new RangeError('Unknown tactic');
    const { fit, lift } = tactics[tactic];
    const base = lineup.reduce((sum, rating) => sum + rating, 0) / lineup.length;
    const chemistry = fit >= 3 ? .025 : 0;
    const chance = .40 + (base - 78) / 100 + lift + chemistry;
    let state = seed >>> 0;
    function sample() {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    }
    const plays = Array.from({length: 20}, () => {
      const attack = sample();
      const defense = sample();
      return {
        home: attack < chance ? (tactic === 'perimeter' ? 3 : 2) : 0,
        away: defense < .47 ? 2 : 0
      };
    });
    return { fit, chance, chemistry, plays,
      home: plays.reduce((sum, play) => sum + play.home, 0),
      away: plays.reduce((sum, play) => sum + play.away, 0) };
  }
  const api = { lineup, tactics, simulate };
  if (typeof module === 'object') module.exports = api;
  else root.QuarterDemo = api;
})(globalThis);
