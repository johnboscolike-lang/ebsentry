import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { DAYS, allRowStarts, formatHours, fromMinutes, isKnownSlot, isSlotOpen, parseSlotId, selectedHours, slotId, toMinutes } from '@shared/domain.js';
import { cx } from './ui';

interface TimetableProps {
  slots: string[];
  availableDays: string[];
  leaveTime: string;
  dailyHours: number | null;
  onChange?: (slots: string[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function Timetable({ slots, availableDays, leaveTime, dailyHours, onChange, readOnly = false, compact = false }: TimetableProps) {
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const drag = useRef<{ adding: boolean } | null>(null);
  const [capNote, setCapNote] = useState('');
  const times = allRowStarts();

  function apply(id: string, adding: boolean) {
    const current = slotsRef.current;
    const { day, start } = parseSlotId(id);
    if (!availableDays.includes(day) || !leaveTime || !dailyHours || !isSlotOpen(day, start, leaveTime)) return;
    const has = current.includes(id);
    if (adding && !has) {
      const count = current.filter((item) => item.startsWith(`${day}|`)).length;
      if (count >= dailyHours * 2) {
        setCapNote(`${day}요일은 하루 ${formatHours(dailyHours)}까지 선택할 수 있습니다.`);
        return;
      }
      const next = [...current, id];
      slotsRef.current = next;
      setCapNote('');
      onChange?.(next);
      return;
    }
    if (!adding && has) {
      const next = current.filter((item) => item !== id);
      slotsRef.current = next;
      onChange?.(next);
    }
  }

  function hit(x: number, y: number) {
    const element = document.elementFromPoint(x, y);
    return element?.closest<HTMLElement>('[data-slot]')?.dataset.slot ?? '';
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly || event.button !== 0) return;
    const id = hit(event.clientX, event.clientY);
    if (!id) return;
    event.preventDefault();
    drag.current = { adding: !slotsRef.current.includes(id) };
    event.currentTarget.setPointerCapture(event.pointerId);
    apply(id, drag.current.adding);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const id = hit(event.clientX, event.clientY);
    if (id) apply(id, drag.current.adding);
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div className={cx('tt-wrap', compact && 'compact')}>
      <div className="tt-heading">
        <h3>주간 블록 시간표</h3>
        <p data-testid="selected-hours">
          선택한 시간 <strong>{formatHours(selectedHours(slots))}</strong>
        </p>
      </div>
      {!compact && <p className="field-hint">칸을 누르거나 드래그해 선택하세요. 한 칸은 30분입니다.</p>}
      <div
        className={cx('tt-grid', compact && 'compact')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="tt-corner">시간</div>
        {DAYS.map((day) => {
          const blocks = slots.filter((item) => item.startsWith(`${day.key}|`)).length;
          return (
            <div key={day.key} className={cx('tt-day', availableDays.includes(day.key) && 'open')}>
              <strong>{day.key}</strong>
              <small>{readOnly ? (blocks ? formatHours(blocks * 0.5) : '—') : day.open}</small>
            </div>
          );
        })}
        {times.map((start) => (
          <div key={start} className="tt-row">
            <div className="tt-time">{start}</div>
            {DAYS.map((day) => {
              const known = isKnownSlot(day.key, start);
              const id = slotId(day.key, start);
              const active = slots.includes(id);
              const enabled =
                !readOnly &&
                known &&
                availableDays.includes(day.key) &&
                Boolean(leaveTime) &&
                Boolean(dailyHours) &&
                isSlotOpen(day.key, start, leaveTime);
              const end = fromMinutes(toMinutes(start) + 30);
              if (readOnly) {
                return (
                  <div
                    key={id}
                    className={cx('tt-cell', !known && 'off', known && active && 'on', known && !active && 'ghost')}
                  />
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className={cx('tt-cell', active && 'on', !enabled && 'off')}
                  data-slot={enabled ? id : undefined}
                  disabled={!enabled}
                  aria-pressed={active}
                  aria-label={`${day.key}요일 ${start}부터 ${end}`}
                  onClick={(event) => {
                    if (event.detail !== 0) return;
                    apply(id, !slotsRef.current.includes(id));
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {capNote && (
        <p className="cap-note" role="status">
          {capNote}
        </p>
      )}
    </div>
  );
}
