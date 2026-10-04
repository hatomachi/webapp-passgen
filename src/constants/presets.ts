import { PresetConfig } from '../types';

export const DEFAULT_OPTIONS = {
  mode: 'password' as const,
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  symbolSet: 'full' as const,
  customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  avoidAmbiguous: true,
  wordCount: 4,
  separator: '-',
  capitalize: true,
  includeNumber: true
};

export const PRESETS: PresetConfig[] = [
  {
    id: 'daily',
    name: '標準（推奨）',
    description: '16文字・英数記号・紛らわしい文字除外',
    icon: 'ShieldCheck',
    options: {
      ...DEFAULT_OPTIONS,
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      symbolSet: 'full',
      avoidAmbiguous: true
    }
  },
  {
    id: 'secure',
    name: '最高強度',
    description: '20文字・全文字種フル活用',
    icon: 'Lock',
    options: {
      ...DEFAULT_OPTIONS,
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      symbolSet: 'full',
      avoidAmbiguous: false
    }
  },
  {
    id: 'alphanumeric',
    name: '英数字のみ',
    description: '16文字・記号不可のWebサイト用',
    icon: 'CaseSensitive',
    options: {
      ...DEFAULT_OPTIONS,
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      avoidAmbiguous: true
    }
  },
  {
    id: 'pin',
    name: 'PINコード',
    description: '6桁・数字のみ',
    icon: 'Hash',
    options: {
      ...DEFAULT_OPTIONS,
      length: 6,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      avoidAmbiguous: false
    }
  },
  {
    id: 'passphrase',
    name: 'パスフレーズ',
    description: '覚えやすい英単語4語の連結',
    icon: 'BookOpen',
    options: {
      ...DEFAULT_OPTIONS,
      mode: 'passphrase',
      wordCount: 4,
      separator: '-',
      capitalize: true,
      includeNumber: true
    }
  }
];
