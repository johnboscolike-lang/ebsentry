import { formatHours, hoursCompareMessage, maxSelectableHours } from '@shared/domain.js';
import { Note } from './ui';

export function HoursCompare({
  selected,
  intent,
  availableDays,
  leaveTime,
  dailyHours,
}: {
  selected: number;
  intent: number | null;
  availableDays: string[];
  leaveTime: string;
  dailyHours: number | null;
}) {
  const possible = maxSelectableHours({ availableDays, leaveTime, dailyHours });
  const max = Math.max(possible, intent || 0, selected, 1);
  const message = hoursCompareMessage(selected, intent);
  const matched = intent != null && selected === intent;
  return (
    <div className="compare" data-testid="hours-compare">
      <div className="compare-score">
        <div>
          <span>시간표</span>
          <strong>{formatHours(selected)}</strong>
        </div>
        <span className="vs" aria-hidden="true">
          {matched ? '=' : '↔'}
        </span>
        <div>
          <span>희망</span>
          <strong>{intent == null ? '—' : formatHours(intent)}</strong>
        </div>
      </div>
      <div className="meter" aria-hidden="true">
        <span className="meter-selected" style={{ width: `${(selected / max) * 100}%` }} />
        {intent != null && <i className="meter-intent" style={{ left: `${(intent / max) * 100}%` }} />}
      </div>
      <Note kind={matched ? 'good' : intent == null ? 'info' : 'warn'}>{message}</Note>
      <p className="field-hint">
        {possible > 0
          ? `현재 조건에서 선택할 수 있는 최대는 ${formatHours(possible)}입니다. `
          : '요일과 하루 시간을 선택하면 최대 시간이 계산됩니다. '}
        금색 막대는 시간표, 세로 눈금은 희망 시간입니다.
      </p>
    </div>
  );
}
