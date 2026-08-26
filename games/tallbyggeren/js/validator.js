/* =========================================================
   VALIDATOR
   Én sentral funksjon eier hele sannheten om en oppgave.
   UI-et leser bare tilstanden den returnerer — ingen komponent
   regner statistikk eller tolker krav på egen hånd.
   ========================================================= */

import { calculateStats, nearlyEqual, countValues } from './stats.js';
import { REQUIREMENT_KEYS, NO_MODE } from './challenge.js';

export function validateDataset(dataset, challenge) {
  const values = [...dataset];
  const stats = calculateStats(values);

  const requirements = {};
  for (const key of REQUIREMENT_KEYS) {
    if (!(key in challenge.requirements)) continue;
    requirements[key] = checkRequirement(key, challenge.requirements[key], stats);
  }

  const constraints = checkConstraints(values, challenge.constraints);
  const locked = checkLocked(values, challenge.lockedValues);

  const requirementsPassed = Object.values(requirements).every((r) => r.passed);
  const constraintsPassed = Object.values(constraints).every((c) => c.passed);

  return {
    values,
    stats,
    requirements,
    constraints,
    locked,
    /* En umulig oppgave er aldri «solved» — det er hele poenget. */
    solved: requirementsPassed && constraintsPassed && locked.passed && !challenge.impossible,
    requirementsPassed,
    constraintsPassed,
  };
}

function checkRequirement(key, target, stats) {
  const actual = stats[key];
  if (key === 'mode' && target === NO_MODE) {
    return { key, target, actual, passed: actual === null };
  }
  return { key, target, actual, passed: nearlyEqual(actual, target) };
}

function checkConstraints(values, constraints) {
  const result = {};
  const counts = countValues(values);

  if (constraints.mustInclude.length) {
    const missing = constraints.mustInclude.filter((v) => !values.some((x) => nearlyEqual(x, v)));
    result.mustInclude = { target: constraints.mustInclude, missing, passed: missing.length === 0 };
  }

  if (constraints.mustNotInclude.length) {
    const present = constraints.mustNotInclude.filter((v) => values.some((x) => nearlyEqual(x, v)));
    result.mustNotInclude = { target: constraints.mustNotInclude, present, passed: present.length === 0 };
  }

  if (constraints.minValue !== null) {
    const offenders = values.filter((v) => v < constraints.minValue - 1e-9);
    result.minValue = {
      target: constraints.minValue, actual: values.length ? Math.min(...values) : null,
      offenders, passed: offenders.length === 0,
    };
  }

  if (constraints.maxValue !== null) {
    const offenders = values.filter((v) => v > constraints.maxValue + 1e-9);
    result.maxValue = {
      target: constraints.maxValue, actual: values.length ? Math.max(...values) : null,
      offenders, passed: offenders.length === 0,
    };
  }

  if (constraints.allUnique) {
    const duplicates = [...counts.entries()].filter(([, c]) => c > 1).map(([v]) => v);
    result.allUnique = { duplicates, passed: duplicates.length === 0 };
  }

  if (constraints.exactDistinctValues !== null) {
    result.exactDistinctValues = {
      target: constraints.exactDistinctValues,
      actual: counts.size,
      passed: counts.size === constraints.exactDistinctValues,
    };
  }

  const occurrenceEntries = Object.entries(constraints.occurrences);
  if (occurrenceEntries.length) {
    const checks = occurrenceEntries.map(([rawValue, wanted]) => {
      const value = Number(rawValue);
      const actual = counts.get(value) || 0;
      return { value, wanted, actual, passed: actual === wanted };
    });
    result.occurrences = { checks, passed: checks.every((c) => c.passed) };
  }

  return result;
}

function checkLocked(values, lockedValues) {
  const broken = lockedValues.filter((lock) => !nearlyEqual(values[lock.position], lock.value));
  return { broken, passed: broken.length === 0 };
}
