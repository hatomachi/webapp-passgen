import React from 'react';

interface PasswordDisplayProps {
  text: string;
  isMasked: boolean;
  mode: 'password' | 'passphrase';
  separator?: string;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  text,
  isMasked,
  mode,
  separator = '-'
}) => {
  if (!text) {
    return <span className="text-slate-500">生成中...</span>;
  }

  if (isMasked) {
    return (
      <span className="tracking-widest font-mono text-slate-400 select-none">
        {'•'.repeat(Math.min(text.length, 32))}
      </span>
    );
  }

  if (mode === 'passphrase') {
    const parts = text.split(separator);
    return (
      <span className="font-mono break-all inline-flex flex-wrap items-center justify-center gap-1">
        {parts.map((word, idx) => (
          <React.Fragment key={idx}>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-indigo-200 border border-slate-700/60 font-medium">
              {word}
            </span>
            {idx < parts.length - 1 && (
              <span className="text-pink-400 font-bold px-0.5">{separator}</span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  }

  // Character-by-character syntax highlighting for password
  return (
    <span className="font-mono break-all tracking-wider text-xl sm:text-2xl font-medium inline-block">
      {text.split('').map((char, index) => {
        let colorClass = 'text-slate-200';
        if (/[0-9]/.test(char)) {
          colorClass = 'text-sky-400 font-bold';
        } else if (/[A-Z]/.test(char)) {
          colorClass = 'text-indigo-300 font-semibold';
        } else if (/[a-z]/.test(char)) {
          colorClass = 'text-slate-100';
        } else {
          // Symbol
          colorClass = 'text-pink-400 font-bold';
        }

        return (
          <span key={index} className={colorClass}>
            {char}
          </span>
        );
      })}
    </span>
  );
};
