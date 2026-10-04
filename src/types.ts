import { GeneratorOptions } from './utils/generator';

export type PresetKey = 'secure' | 'daily' | 'alphanumeric' | 'pin' | 'passphrase';

export interface PresetConfig {
  id: PresetKey;
  name: string;
  description: string;
  icon: string;
  options: GeneratorOptions;
}
