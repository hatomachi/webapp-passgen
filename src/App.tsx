import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  History,
  Trash2,
  Lock,
  CaseSensitive,
  Hash,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  GeneratorOptions,
  generatePassword,
  generatePassphrase,
  evaluateStrength
} from './utils/generator';
import { PRESETS, DEFAULT_OPTIONS } from './constants/presets';
import { PresetKey } from './types';
import { PasswordDisplay } from './components/PasswordDisplay';
import { SecurityInfoModal } from './components/SecurityInfoModal';

const STORAGE_KEY_OPTIONS = 'passgen_custom_options';
const STORAGE_KEY_CLIPBOARD_TIMER = 'passgen_clipboard_timer';

export const App: React.FC = () => {
  // Saved options in localStorage or defaults
  const [options, setOptions] = useState<GeneratorOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OPTIONS);
      if (saved) {
        return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_OPTIONS;
  });

  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('daily');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [isMasked, setIsMasked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // Clipboard auto-clear settings: 0 (disabled), 30, 60 seconds
  const [clearTimerSeconds, setClearTimerSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIPBOARD_TIMER);
      return saved !== null ? Number(saved) : 30;
    } catch {
      return 30;
    }
  });

  // Countdown state for clipboard clear
  const [clearCountdown, setClearCountdown] = useState<number | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // In-memory history (up to 5 recent items, wiped on page reload)
  const [history, setHistory] = useState<Array<{ password: string; time: string }>>([]);

  // Generate password function
  const handleGenerate = useCallback(
    (opts: GeneratorOptions = options, recordHistory: boolean = true) => {
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 300);

      const generated =
        opts.mode === 'passphrase'
          ? generatePassphrase(opts)
          : generatePassword(opts);

      if (currentPassword && recordHistory && currentPassword !== generated) {
        setHistory((prev) => [
          {
            password: currentPassword,
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev.slice(0, 4)
        ]);
      }

      setCurrentPassword(generated);
      setCopied(false);
    },
    [options, currentPassword]
  );

  // Initial 0-second instant generation on mount
  useEffect(() => {
    handleGenerate(options, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update options and persist
  const updateOptions = (newOpts: Partial<GeneratorOptions>) => {
    const updated = { ...options, ...newOpts };
    setOptions(updated);
    setActivePreset('custom');
    try {
      localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    handleGenerate(updated, true);
  };

  // Apply preset
  const applyPreset = (presetKey: PresetKey) => {
    const preset = PRESETS.find((p) => p.id === presetKey);
    if (!preset) return;
    setActivePreset(presetKey);
    const updated = { ...preset.options };
    setOptions(updated);
    try {
      localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    handleGenerate(updated, true);
  };

  // Copy to clipboard with auto-clear handling
  const handleCopy = async (targetPassword?: string) => {
    const textToCopy = targetPassword || currentPassword;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (navigator.vibrate) {
        navigator.vibrate([25]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Setup clipboard auto-clear
      if (clearTimerSeconds > 0) {
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        setClearCountdown(clearTimerSeconds);

        countdownIntervalRef.current = setInterval(() => {
          setClearCountdown((prev) => {
            if (prev === null || prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              return null;
            }
            return prev - 1;
          });
        }, 1000);

        clearTimerRef.current = setTimeout(async () => {
          try {
            await navigator.clipboard.writeText('');
            // eslint-disable-next-line no-empty
          } catch {}
          setClearCountdown(null);
        }, clearTimerSeconds * 1000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCancelClear = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setClearCountdown(null);
  };

  const handleImmediateClear = async () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setClearCountdown(null);
    try {
      await navigator.clipboard.writeText('');
      // eslint-disable-next-line no-empty
    } catch {}
  };

  const changeClearTimerSetting = (seconds: number) => {
    setClearTimerSeconds(seconds);
    try {
      localStorage.setItem(STORAGE_KEY_CLIPBOARD_TIMER, String(seconds));
    } catch {
      // ignore
    }
  };

  const strength = evaluateStrength(currentPassword, options);

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Lock':
        return <Lock className="w-4 h-4" />;
      case 'CaseSensitive':
        return <CaseSensitive className="w-4 h-4" />;
      case 'Hash':
        return <Hash className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20 text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg tracking-tight text-white">PassGen</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">開いて0秒・完全オフライン完結</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-medium"
              title="ゼロ傍受セキュリティ仕様を表示"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">通信ゼロ / 暗号学的安全</span>
              <span className="sm:hidden">安全仕様</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* Clipboard Clear Countdown Banner */}
        {clearCountdown !== null && (
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-indigo-300">
              <Clock className="w-4 h-4 animate-spin text-indigo-400" />
              <span>
                クリップボードを <strong className="text-white font-mono">{clearCountdown}秒後</strong> に自動消去します
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleImmediateClear}
                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors font-medium text-[11px]"
              >
                今すぐ消去
              </button>
              <button
                onClick={handleCancelClear}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
              >
                解除
              </button>
            </div>
          </div>
        )}

        {/* Primary Password Display Card */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Mask toggle & length indicator */}
          <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/50">
                {options.mode === 'passphrase' ? `${options.wordCount} 単語` : `${currentPassword.length} 文字`}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 font-medium">
                {options.mode === 'passphrase' ? 'パスフレーズ' : 'ランダムパスワード'}
              </span>
            </div>

            <button
              onClick={() => setIsMasked(!isMasked)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isMasked ? 'パスワードを表示' : 'パスワードを隠す（覗き見防止）'}
            >
              {isMasked ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>表示する</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>隠す</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Text Presentation */}
          <div className="min-h-[96px] sm:min-h-[112px] flex items-center justify-center p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center relative group select-all">
            <PasswordDisplay
              text={currentPassword}
              isMasked={isMasked}
              mode={options.mode}
              separator={options.separator}
            />
          </div>

          {/* Strength Meter */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">強度:</span>
                <span className={`font-bold ${strength.color}`}>{strength.label}</span>
                <span className="text-slate-500 text-[11px]">({strength.entropy} bits)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                推定解読時間: <span className="text-slate-300 font-medium">{strength.crackTime}</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.barColor}`}
                style={{ width: `${strength.percentage}%` }}
              />
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-6 grid grid-cols-5 gap-3">
            <button
              onClick={() => handleCopy()}
              className={`col-span-4 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 active:scale-[0.98] ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-white animate-in zoom-in" />
                  <span>コピー完了！</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>ワンタップでコピー</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleGenerate(options, true)}
              className="col-span-1 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 text-slate-200 hover:text-white rounded-2xl flex items-center justify-center border border-slate-700/60 shadow-lg transition-all active:scale-[0.95]"
              title="新しいパスワードを再生成 (Space / Enter)"
            >
              <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </section>

        {/* Quick Presets Selection */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              ワンタップ・プリセット
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium hover:underline"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? '詳細設定を閉じる' : '詳細カスタマイズ'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={isSelected ? 'text-indigo-400' : 'text-slate-400'}>
                      {getPresetIcon(p.icon)}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-indigo-400/30" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {p.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Detailed Options Drawer / Accordion */}
        {showAdvanced && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-5 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                詳細カスタマイズ
              </h3>
              {/* Mode switch */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => updateOptions({ mode: 'password' })}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    options.mode === 'password'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  パスワード
                </button>
                <button
                  onClick={() => updateOptions({ mode: 'passphrase' })}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    options.mode === 'passphrase'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  パスフレーズ
                </button>
              </div>
            </div>

            {options.mode === 'password' ? (
              <div className="space-y-5">
                {/* Length slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">文字数 (長さ)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateOptions({ length: Math.max(4, options.length - 1) })}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm font-bold text-indigo-400 w-8 text-center">
                        {options.length}
                      </span>
                      <button
                        onClick={() => updateOptions({ length: Math.min(64, options.length + 1) })}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="64"
                    value={options.length}
                    onChange={(e) => updateOptions({ length: Number(e.target.value) })}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>4文字</span>
                    <span>16 (標準)</span>
                    <span>32</span>
                    <span>64文字</span>
                  </div>
                </div>

                {/* Character type toggles */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-300 font-medium">使用する文字種</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'uppercase', label: '英大文字', example: 'A-Z' },
                      { key: 'lowercase', label: '英小文字', example: 'a-z' },
                      { key: 'numbers', label: '数字', example: '0-9' },
                      { key: 'symbols', label: '記号', example: '!@#$' }
                    ].map(({ key, label, example }) => {
                      const enabled = options[key as keyof GeneratorOptions] as boolean;
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            updateOptions({ [key]: !enabled } as Partial<GeneratorOptions>)
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            enabled
                              ? 'bg-indigo-600/20 border-indigo-500/70 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{label}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                enabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">{example}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ambiguous characters toggle */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={options.avoidAmbiguous}
                      onChange={(e) => updateOptions({ avoidAmbiguous: e.target.checked })}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <div>
                      <div className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                        紛らわしい文字を除外する (推奨)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        見分けにくい文字（<code className="text-pink-300">0, O, o, 1, l, I, |</code> など）の混入を防ぎます。
                      </div>
                    </div>
                  </label>
                </div>

                {/* Symbols set customization */}
                {options.symbols && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-300 font-medium">記号セットの選択</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'full', label: '全記号', desc: 'あらゆる記号' },
                        { id: 'safe', label: '安全記号のみ', desc: '!@#$%^&*+-=' },
                        { id: 'custom', label: 'カスタム指定', desc: '独自に入力' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            updateOptions({ symbolSet: item.id as 'full' | 'safe' | 'custom' })
                          }
                          className={`p-2 rounded-xl border text-left transition-all ${
                            options.symbolSet === item.id
                              ? 'bg-indigo-600/20 border-indigo-500/70 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{item.desc}</div>
                        </button>
                      ))}
                    </div>

                    {options.symbolSet === 'custom' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={options.customSymbols}
                          onChange={(e) => updateOptions({ customSymbols: e.target.value })}
                          placeholder="許可する記号を入力 (例: !@#$)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Passphrase mode options */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">単語数</span>
                    <span className="font-mono text-sm font-bold text-indigo-400">
                      {options.wordCount} 単語
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={options.wordCount}
                    onChange={(e) => updateOptions({ wordCount: Number(e.target.value) })}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>3語</span>
                    <span>4語 (標準)</span>
                    <span>6語</span>
                    <span>8語</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-slate-300 font-medium">区切り記号</span>
                  <div className="flex gap-2">
                    {[
                      { sep: '-', label: 'ハイフン (-)' },
                      { sep: '_', label: 'アンダーバー (_)' },
                      { sep: '.', label: 'ドット (.)' },
                      { sep: ' ', label: 'スペース ( )' }
                    ].map((item) => (
                      <button
                        key={item.sep}
                        onClick={() => updateOptions({ separator: item.sep })}
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                          options.separator === item.sep
                            ? 'bg-indigo-600/20 border-indigo-500/70 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={options.capitalize}
                      onChange={(e) => updateOptions({ capitalize: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">各単語の先頭を大文字</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={options.includeNumber}
                      onChange={(e) => updateOptions({ includeNumber: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-950"
                    />
                    <span className="text-xs text-slate-300">末尾にランダム数字追加</span>
                  </label>
                </div>
              </div>
            )}

            {/* Security settings: Clipboard auto clear */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  クリップボード自動消去タイマー
                </span>
                <span className="text-[11px] text-slate-500">コピー後の履歴残存防止</span>
              </div>
              <div className="flex gap-2">
                {[
                  { sec: 30, label: '30秒 (推奨)' },
                  { sec: 60, label: '60秒' },
                  { sec: 0, label: 'オフ (手動)' }
                ].map((item) => (
                  <button
                    key={item.sec}
                    onClick={() => changeClearTimerSetting(item.sec)}
                    className={`flex-1 py-1.5 px-2 text-xs rounded-xl border transition-all ${
                      clearTimerSeconds === item.sec
                        ? 'bg-indigo-600/20 border-indigo-500/70 text-white font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Temporary In-Memory History (Restores accidental regenerations) */}
        {history.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                直近の履歴（直近5件・一時保持）
              </span>
              <button
                onClick={() => setHistory([])}
                className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
                title="履歴を全消去"
              >
                <Trash2 className="w-3 h-3" />
                消去
              </button>
            </div>

            <div className="space-y-1.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.time}</span>
                    <span className="font-mono text-slate-300 truncate select-all">
                      {item.password}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.password)}
                    className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-colors shrink-0"
                    title="このパスワードをコピー"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
              <span>※ 履歴はブラウザのメモリ内のみに保持され、リロードで完全に消滅します。</span>
            </p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span>Web Crypto API 準拠</span>
          <span>•</span>
          <span>CSP 通信物理遮断</span>
          <span>•</span>
          <span>完全オフライン PWA</span>
        </div>
        <p className="text-[11px] text-slate-600">
          PassGen — サーバーへの送信や追跡タグは一切含まれていません。
        </p>
      </footer>

      {/* Security Specification Details Modal */}
      <SecurityInfoModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </div>
  );
};
