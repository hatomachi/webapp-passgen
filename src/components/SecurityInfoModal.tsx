import React from 'react';
import { ShieldCheck, WifiOff, Cpu, Lock, X } from 'lucide-react';

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInfoModal: React.FC<SecurityInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ゼロ・リスク セキュリティ設計</h3>
            <p className="text-xs text-slate-400">なぜ PassGen は絶対に安全なのか？</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Cpu className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">1. 暗号学的安全な乱数生成</h4>
              <p className="text-xs text-slate-400 mt-1">
                予測可能な <code className="text-slate-200">Math.random()</code> は一切使わず、OS・ブラウザ直結の暗号学的乱数生成器 <code className="text-sky-300">window.crypto.getRandomValues</code> と拒絶サンプリング（Rejection Sampling）を採用。偏りのない真のランダム性を保証します。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <WifiOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">2. CSP による通信物理遮断（connect-src 'none'）</h4>
              <p className="text-xs text-slate-400 mt-1">
                ブラウザのセキュリティ規格である Content Security Policy にて外部通信を物理的に禁止。万が一の悪意あるスクリプトや外部拡張機能の介入があっても、ブラウザが通信を強制ブロックします。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">3. 完全クライアント完結・データ保存ゼロ</h4>
              <p className="text-xs text-slate-400 mt-1">
                サーバーへの送信や保存は一切ありません。生成されたパスワードは端末のメモリ上でのみ処理され、リロードやタブを閉じることで完全に消去されます。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            理解しました
          </button>
        </div>
      </div>
    </div>
  );
};
