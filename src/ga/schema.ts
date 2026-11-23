import type { SimulationEvent } from './simulation.ts';

export function describeSchema(pattern: string, length: number) {
  if (pattern.length !== length || !/^[01*]+$/.test(pattern)) return null;

  const fixed = Array.from(pattern).flatMap((bit, index) => bit === '*' ? [] : [index]);
  return {
    pattern,
    order: fixed.length,
    definingLength: fixed.length > 1 ? fixed[fixed.length - 1] - fixed[0] : 0,
    matchingStrings: 2n ** BigInt(length - fixed.length),
  };
}

export function matchesSchema(chromosome: string, pattern: string) {
  return chromosome.length === pattern.length && Array.from(pattern).every(
    (bit, index) => bit === '*' || bit === chromosome[index],
  );
}

type Entry = { label: string; before: readonly string[]; after: readonly string[]; note?: string };

export function schemaStage(event: SimulationEvent, population: readonly string[], pattern: string) {
  const matchCount = (chromosomes: readonly string[]) => chromosomes.filter(bits => matchesSchema(bits, pattern)).length;
  let entries: Entry[];
  let before: readonly string[] | null = null;
  let after: readonly string[];
  let caption: string;

  switch (event.type) {
    case 'evaluate':
    case 'stop':
      after = population;
      caption = 'Population';
      entries = population.map((bits, index) => ({ label: `Slot ${index + 1}`, before: [], after: [bits] }));
      break;
    case 'select':
      before = population;
      after = event.selection.picks.map(pick => pick.chromosome);
      caption = 'Mating pool';
      entries = event.selection.picks.map((pick, index) => ({
        label: `Parent ${index + 1}`, before: [], after: [pick.chromosome],
        note: `Copied from population slot ${pick.winner + 1}.`,
      }));
      break;
    case 'crossover':
      before = event.pairs.flatMap(pair => pair.parents);
      if (event.unpaired !== null) before = [...before, event.children[event.unpaired]];
      after = event.children;
      caption = 'Children after crossover';
      entries = event.pairs.map((pair, index) => ({
        label: `Pair ${index + 1}`, before: pair.parents, after: pair.children,
        note: pair.cut === null ? 'Copied without a cut.' : `Tails swapped after bit ${pair.cut}.`,
      }));
      if (event.unpaired !== null) {
        const chromosome = event.children[event.unpaired];
        entries.push({ label: 'Unpaired parent', before: [chromosome], after: [chromosome], note: 'Copied directly.' });
      }
      break;
    case 'mutate':
      before = event.children.map(child => child.before);
      after = event.children.map(child => child.after);
      caption = 'Children after mutation';
      entries = event.children.map((child, index) => {
        const wasMatch = matchesSchema(child.before, pattern);
        const isMatch = matchesSchema(child.after, pattern);
        const fixedFlips = child.bits.filter(bit => bit.flipped && pattern[bit.index] !== '*').map(bit => bit.index + 1);
        const note = fixedFlips.length
          ? `Fixed positions flipped: ${fixedFlips.join(', ')}. ${wasMatch ? 'Match lost.' : isMatch ? 'Match created.' : 'Still differs at a fixed position.'}`
          : child.before === child.after ? 'No bits flipped.' : 'Only wildcard positions flipped.';
        return { label: `Child ${index + 1}`, before: [child.before], after: [child.after], note };
      });
      break;
    case 'replace': {
      after = event.population.map(candidate => candidate.chromosome);
      const children = after.map((bits, index) => index === event.elite?.slot ? event.elite.removed.chromosome : bits);
      before = children;
      caption = 'Next population';
      entries = after.map((bits, index) => ({
        label: `Slot ${index + 1}`, before: [children[index]], after: [bits],
        note: index === event.elite?.slot ? 'Elitism copied the best old candidate into this slot.' : undefined,
      }));
      break;
    }
  }

  return {
    caption,
    total: after.length,
    count: matchCount(after),
    previous: before === null ? null : { count: matchCount(before), total: before.length },
    entries,
  };
}
