import { describe, it, expect } from 'vitest';
import {
  getRandomInt,
  secureShuffle,
  generatePassword,
  generatePassphrase,
  evaluateStrength,
  CHARSETS
} from './generator';
import { DEFAULT_OPTIONS } from '../constants/presets';

describe('Web Crypto Generator Utility', () => {
  describe('getRandomInt', () => {
    it('returns integers within [0, max - 1]', () => {
      for (let i = 0; i < 100; i++) {
        const val = getRandomInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('handles edge case of max = 1 or 0', () => {
      expect(getRandomInt(1)).toBe(0);
      expect(getRandomInt(0)).toBe(0);
    });
  });

  describe('secureShuffle', () => {
    it('shuffles elements while preserving count and contents', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = secureShuffle(arr);
      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled.slice().sort((a, b) => a - b)).toEqual(arr);
    });
  });

  describe('generatePassword', () => {
    it('generates password with exact requested length', () => {
      for (const len of [4, 8, 16, 24, 32, 64]) {
        const pwd = generatePassword({ ...DEFAULT_OPTIONS, length: len });
        expect(pwd).toHaveLength(len);
      }
    });

    it('guarantees at least 1 char of each enabled charset', () => {
      for (let i = 0; i < 20; i++) {
        const pwd = generatePassword({
          ...DEFAULT_OPTIONS,
          length: 16,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          avoidAmbiguous: false
        });
        expect(/[A-Z]/.test(pwd)).toBe(true);
        expect(/[a-z]/.test(pwd)).toBe(true);
        expect(/[0-9]/.test(pwd)).toBe(true);
        expect(/[^a-zA-Z0-9]/.test(pwd)).toBe(true);
      }
    });

    it('excludes ambiguous characters when avoidAmbiguous is true', () => {
      const ambiguousChars = CHARSETS.AMBIGUOUS.split('');
      for (let i = 0; i < 30; i++) {
        const pwd = generatePassword({
          ...DEFAULT_OPTIONS,
          length: 32,
          avoidAmbiguous: true
        });
        for (const amb of ambiguousChars) {
          expect(pwd).not.toContain(amb);
        }
      }
    });

    it('generates numeric-only passwords for PIN mode', () => {
      const pwd = generatePassword({
        ...DEFAULT_OPTIONS,
        length: 6,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        avoidAmbiguous: false
      });
      expect(pwd).toHaveLength(6);
      expect(/^\d+$/.test(pwd)).toBe(true);
    });

    it('generates alphanumeric-only passwords when symbols are disabled', () => {
      const pwd = generatePassword({
        ...DEFAULT_OPTIONS,
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        avoidAmbiguous: false
      });
      expect(pwd).toHaveLength(16);
      expect(/^[a-zA-Z0-9]+$/.test(pwd)).toBe(true);
    });

    it('supports custom symbol set', () => {
      const custom = '!#$';
      const pwd = generatePassword({
        ...DEFAULT_OPTIONS,
        length: 12,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
        symbolSet: 'custom',
        customSymbols: custom,
        avoidAmbiguous: false
      });
      expect(pwd).toHaveLength(12);
      expect(pwd.split('').every((c) => custom.includes(c))).toBe(true);
    });
  });

  describe('generatePassphrase', () => {
    it('generates exact word count with custom separator', () => {
      const phrase = generatePassphrase({
        ...DEFAULT_OPTIONS,
        mode: 'passphrase',
        wordCount: 5,
        separator: '-',
        capitalize: false,
        includeNumber: false
      });
      const words = phrase.split('-');
      expect(words).toHaveLength(5);
      expect(words.every((w) => /^[a-z]+$/.test(w))).toBe(true);
    });

    it('capitalizes words when capitalize is enabled', () => {
      const phrase = generatePassphrase({
        ...DEFAULT_OPTIONS,
        mode: 'passphrase',
        wordCount: 4,
        separator: '_',
        capitalize: true,
        includeNumber: false
      });
      const words = phrase.split('_');
      expect(words).toHaveLength(4);
      expect(words.every((w) => /^[A-Z][a-z]+$/.test(w))).toBe(true);
    });

    it('includes a number when includeNumber is true', () => {
      const phrase = generatePassphrase({
        ...DEFAULT_OPTIONS,
        mode: 'passphrase',
        wordCount: 4,
        separator: '.',
        capitalize: false,
        includeNumber: true
      });
      expect(/\d+/.test(phrase)).toBe(true);
    });
  });

  describe('evaluateStrength', () => {
    it('evaluates strong password accurately', () => {
      const info = evaluateStrength('K9#mQ!2vXz$9Lw@1', {
        ...DEFAULT_OPTIONS,
        mode: 'password'
      });
      expect(info.entropy).toBeGreaterThan(80);
      expect(['強固', '極めて強固']).toContain(info.label);
    });

    it('evaluates weak PIN accurately', () => {
      const info = evaluateStrength('1234', {
        ...DEFAULT_OPTIONS,
        mode: 'password'
      });
      expect(info.entropy).toBeLessThan(40);
      expect(info.label).toBe('非常に弱い');
    });

    it('handles passphrase entropy calculation', () => {
      const info = evaluateStrength('Apple-Banana-Orange-Cherry', {
        ...DEFAULT_OPTIONS,
        mode: 'passphrase',
        separator: '-'
      });
      expect(info.entropy).toBeGreaterThan(35);
    });
  });
});
