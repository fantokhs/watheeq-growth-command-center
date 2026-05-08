import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number; // 0-100
  label?: string;
  size?: 'sm' | 'md';
  showPercent?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#1F8A5B';
  if (score >= 60) return '#C8A45D';
  if (score >= 40) return '#C88719';
  return '#B42318';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'مطابقة ممتازة';
  if (score >= 60) return 'مطابقة جيدة';
  if (score >= 40) return 'مطابقة متوسطة';
  return 'مطابقة ضعيفة';
}

export function ScoreBar({ score, label, size = 'md', showPercent = true }: ScoreBarProps) {
  const color = scoreColor(score);
  const h = size === 'sm' ? 6 : 8;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {label && <span className="text-[12px] text-ink-muted">{label}</span>}
        <div className="flex items-center gap-2">
          {showPercent && (
            <span className="num text-[13px] font-bold" style={{ color }}>{score}%</span>
          )}
          <span className="text-[11px] font-medium" style={{ color }}>{scoreLabel(score)}</span>
        </div>
      </div>
      <div className="w-full bg-watheeq-bg-cream rounded-full overflow-hidden border border-line/50" style={{ height: h }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
