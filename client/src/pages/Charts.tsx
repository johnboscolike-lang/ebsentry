import { formatHours } from '@shared/domain.js';
import type { CountItem, Stats } from '../types';

const GOLD = '#c6a36a';
const STONE = '#8d8678';

export function Charts({ stats }: { stats: Stats }) {
  const maxHeat = Math.max(
    1,
    ...stats.heatmap.matrix.flatMap((row) => row.map((value) => value ?? 0)),
  );
  return (
    <div className="chart-grid">
      <article className="card">
        <h3>학년</h3>
        <Bars items={stats.byGrade} colorFor={() => GOLD} />
      </article>
      <article className="card">
        <h3>학과</h3>
        <Bars items={stats.byDepartment} colorFor={() => GOLD} />
      </article>
      <article className="card span-2">
        <h3>한 주 공부 시간</h3>
        <div className="split-charts">
          <div>
            <p className="field-hint">시간표에서 고른 시간 · 평균 {formatHours(stats.avgSelectedHours)}</p>
            <VBars items={stats.weeklyHours} color={GOLD} />
          </div>
          <div>
            <p className="field-hint">희망한 시간 · 평균 {formatHours(stats.avgIntentHours)}</p>
            <VBars items={stats.intentHours} color={STONE} />
          </div>
        </div>
      </article>
      <article className="card span-2">
        <h3>시간대 히트맵</h3>
        <p className="field-hint">숫자는 해당 시간을 선택한 학생 수입니다. 빗금은 운영하지 않는 시간입니다.</p>
        <div className="heat-scroll">
          <div className="heat-grid" role="img" aria-label="요일과 시간대별 신청 수">
            <div className="tt-corner">시간</div>
            {stats.heatmap.days.map((day) => (
              <div key={day} className="tt-day">
                <strong>{day}</strong>
              </div>
            ))}
            {stats.heatmap.times.map((time, timeIndex) => (
              <div key={time} className="tt-row">
                <div className="tt-time">{time}</div>
                {stats.heatmap.days.map((day, dayIndex) => {
                  const value = stats.heatmap.matrix[timeIndex]?.[dayIndex];
                  if (value == null) return <div key={day} className="heat-cell off" title={`${day} ${time} 운영 안 함`} />;
                  const mix = value === 0 ? 0 : Math.max(22, Math.round((value / maxHeat) * 100));
                  return (
                    <div
                      key={day}
                      className="heat-cell"
                      style={{
                        background: `color-mix(in srgb, #c6a36a ${mix}%, #12151c)`,
                        color: mix > 58 ? '#1a140c' : '#f4f0e6',
                      }}
                      title={`${day} ${time} · ${value}명`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

function Bars({ items, colorFor }: { items: CountItem[]; colorFor: (label: string) => string }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <span>{item.label}</span>
          <div className="bar-track">
            <div style={{ width: `${(item.count / max) * 100}%`, background: colorFor(item.label) }} />
          </div>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

function VBars({ items, color }: { items: CountItem[]; color: string }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="vbars">
      {items.map((item) => (
        <div key={item.label} className="vbar">
          <strong>{item.count}</strong>
          <div className="vbar-track">
            <div style={{ height: `${(item.count / max) * 100}%`, background: color }} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
