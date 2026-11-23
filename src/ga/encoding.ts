export interface Variable {
  name: string;
  min: number;
  max: number;
  bits: number;
}

export const MAX_BITS_PER_VARIABLE = 52;

function validateBounds(min: number, max: number): void {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(max - min) || max <= min) {
    throw new RangeError('The variable needs finite, increasing bounds.');
  }
}

function validateBits(bits: number): void {
  if (!Number.isInteger(bits) || bits < 1 || bits > MAX_BITS_PER_VARIABLE) {
    throw new RangeError(`Use 1–${MAX_BITS_PER_VARIABLE} bits per variable.`);
  }
}

export function stepSize({ min, max, bits }: Variable): number {
  validateBounds(min, max);
  validateBits(bits);
  const step = (max - min) / (2 ** bits - 1);
  if (step === 0) throw new RangeError('The step is too small to represent.');
  return step;
}

export function bitsForPrecision(min: number, max: number, tolerance: number): number {
  validateBounds(min, max);
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new RangeError('Tolerance must be finite and positive.');
  }
  const bits = Math.max(1, Math.ceil(Math.log2((max - min) / tolerance / 2 + 1)));
  validateBits(bits);
  return bits;
}

export function searchSpaceSize(variables: readonly Variable[]): bigint {
  if (!variables.length) throw new RangeError('At least one variable is required.');
  const length = variables.reduce((sum, variable) => {
    stepSize(variable);
    return sum + variable.bits;
  }, 0);
  return 2n ** BigInt(length);
}

export function decodeChromosome(chromosome: string, variables: readonly Variable[]) {
  const length = variables.reduce((sum, variable) => sum + variable.bits, 0);
  if (!variables.length || chromosome.length !== length || /[^01]/.test(chromosome)) {
    throw new RangeError('The chromosome must contain exactly one binary segment per variable.');
  }

  let start = 0;
  return variables.map(variable => {
    const step = stepSize(variable);
    const bits = chromosome.slice(start, start + variable.bits);
    start += variable.bits;
    const position = Number.parseInt(bits, 2);
    const lastPosition = 2 ** variable.bits - 1;
    const value = position === lastPosition ? variable.max : variable.min + position * step;
    return { variable, bits, position, step, value };
  });
}

export function encodeChromosome(values: readonly number[], variables: readonly Variable[]): string {
  if (!variables.length || values.length !== variables.length) {
    throw new RangeError('Provide one value per variable.');
  }

  return variables.map((variable, index) => {
    const step = stepSize(variable);
    const value = values[index];
    if (!Number.isFinite(value) || value < variable.min || value > variable.max) {
      throw new RangeError(`${variable.name} is outside its allowed range.`);
    }
    const lastPosition = 2 ** variable.bits - 1;
    const position = Math.min(lastPosition, Math.round((value - variable.min) / step));
    return position.toString(2).padStart(variable.bits, '0');
  }).join('');
}
