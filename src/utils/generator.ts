import { PASSPHRASE_WORDS } from './wordlist';

export interface GeneratorOptions {
  mode: 'password' | 'passphrase';
  // Password mode options
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  symbolSet: 'full' | 'safe' | 'custom';
  customSymbols: string;
  avoidAmbiguous: boolean;

  // Passphrase mode options
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export const CHARSETS = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  SYMBOLS_FULL: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  SYMBOLS_SAFE: '!@#$%^&*+-=',
  AMBIGUOUS: '0O1lI|'
};

/**
 * Bias-free cryptographically secure random integer in range [0, max - 1]
 * Uses rejection sampling to eliminate modulo bias.
 */
export function getRandomInt(max: number): number {
  if (max <= 1) return 0;
  const uint32Max = 0x100000000;
  const limit = Math.floor(uint32Max / max) * max;
  const buffer = new Uint32Array(1);

  let rand: number;
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  do {
    cryptoObj.getRandomValues(buffer);
    rand = buffer[0];
  } while (rand >= limit);

  return rand % max;
}

/**
 * Cryptographically secure Fisher-Yates array shuffle
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Filter out ambiguous characters from a string
 */
function filterAmbiguous(str: string): string {
  const ambiguousSet = new Set(CHARSETS.AMBIGUOUS);
  return str.split('').filter((c) => !ambiguousSet.has(c)).join('');
}

/**
 * Generate a random password adhering to specified options
 */
export function generatePassword(options: GeneratorOptions): string {
  let upper = CHARSETS.UPPERCASE;
  let lower = CHARSETS.LOWERCASE;
  let num = CHARSETS.NUMBERS;
  let sym =
    options.symbolSet === 'safe'
      ? CHARSETS.SYMBOLS_SAFE
      : options.symbolSet === 'custom'
      ? options.customSymbols || CHARSETS.SYMBOLS_SAFE
      : CHARSETS.SYMBOLS_FULL;

  if (options.avoidAmbiguous) {
    upper = filterAmbiguous(upper);
    lower = filterAmbiguous(lower);
    num = filterAmbiguous(num);
    sym = filterAmbiguous(sym);
  }

  const enabledSets: string[] = [];
  if (options.uppercase && upper.length > 0) enabledSets.push(upper);
  if (options.lowercase && lower.length > 0) enabledSets.push(lower);
  if (options.numbers && num.length > 0) enabledSets.push(num);
  if (options.symbols && sym.length > 0) enabledSets.push(sym);

  if (enabledSets.length === 0) {
    // Fallback: at least lowercase
    enabledSets.push(lower);
  }

  const allChars = enabledSets.join('');
  const passwordChars: string[] = [];

  // Guarantee at least 1 character from each enabled charset
  for (const set of enabledSets) {
    if (passwordChars.length < options.length) {
      const idx = getRandomInt(set.length);
      passwordChars.push(set[idx]);
    }
  }

  // Fill the remaining length with characters from the combined pool
  while (passwordChars.length < options.length) {
    const idx = getRandomInt(allChars.length);
    passwordChars.push(allChars[idx]);
  }

  // Shuffle to randomize positions
  return secureShuffle(passwordChars).join('');
}

/**
 * Generate a memorable passphrase using EFF-style offline words
 */
export function generatePassphrase(options: GeneratorOptions): string {
  const words: string[] = [];
  const count = Math.max(2, Math.min(options.wordCount, 10));

  for (let i = 0; i < count; i++) {
    const idx = getRandomInt(PASSPHRASE_WORDS.length);
    let word = PASSPHRASE_WORDS[idx];
    if (options.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  if (options.includeNumber) {
    const randomNum = getRandomInt(100);
    // Put number at the end of a random word or end of passphrase
    const wordIdx = getRandomInt(words.length);
    words[wordIdx] += randomNum.toString();
  }

  return words.join(options.separator);
}

export interface StrengthInfo {
  entropy: number;
  label: string;
  color: string;
  barColor: string;
  percentage: number;
  crackTime: string;
}

/**
 * Calculate password strength and entropy in bits
 */
export function evaluateStrength(text: string, options: GeneratorOptions): StrengthInfo {
  if (!text) {
    return {
      entropy: 0,
      label: 'なし',
      color: 'text-slate-400',
      barColor: 'bg-slate-700',
      percentage: 0,
      crackTime: '即時'
    };
  }

  let entropy = 0;

  if (options.mode === 'passphrase') {
    // Each word from 1000 words list gives ~log2(1000) = 9.96 bits
    const words = text.split(options.separator).filter(Boolean);
    entropy = words.length * Math.log2(PASSPHRASE_WORDS.length);
    if (options.includeNumber) {
      entropy += Math.log2(100);
    }
  } else {
    let poolSize = 0;
    if (/[a-z]/.test(text)) poolSize += 26;
    if (/[A-Z]/.test(text)) poolSize += 26;
    if (/[0-9]/.test(text)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(text)) poolSize += 32;

    if (poolSize === 0) poolSize = 1;
    entropy = Math.round(text.length * Math.log2(poolSize));
  }

  // Cap display percentage at 128 bits
  const percentage = Math.min(100, Math.round((entropy / 128) * 100));

  if (entropy < 40) {
    return {
      entropy,
      label: '非常に弱い',
      color: 'text-rose-400',
      barColor: 'bg-rose-500',
      percentage,
      crackTime: '数秒以内'
    };
  } else if (entropy < 60) {
    return {
      entropy,
      label: '弱い',
      color: 'text-amber-400',
      barColor: 'bg-amber-500',
      percentage,
      crackTime: '数分〜数時間'
    };
  } else if (entropy < 80) {
    return {
      entropy,
      label: '普通（実用的）',
      color: 'text-yellow-400',
      barColor: 'bg-yellow-500',
      percentage,
      crackTime: '数ヶ月〜数年'
    };
  } else if (entropy < 100) {
    return {
      entropy,
      label: '強固',
      color: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      percentage,
      crackTime: '数千年以上'
    };
  } else {
    return {
      entropy,
      label: '極めて強固',
      color: 'text-cyan-400',
      barColor: 'bg-cyan-500',
      percentage,
      crackTime: '数億年（解読不可）'
    };
  }
}
