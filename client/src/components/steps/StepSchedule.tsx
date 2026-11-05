import {
  DAYS,
  DAILY_HOUR_OPTIONS,
  WEEKLY_HOUR_OPTIONS,
  formatHours,
  leaveTimeOptions,
  selectedHours,
} from '@shared/domain.js';
import type { FormState } from '../../types';
import { HoursCompare } from '../HoursCompare';
import { Timetable } from '../Timetable';
import { ChipRow, FieldError } from '../ui';

export function StepSchedule({
  form,
  errors,
  patch,
  toggleDay,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
  toggleDay: (day: string) => void;
}) {
  const ready = form.availableDays.length > 0 && Boolean(form.leaveTime) && Boolean(form.dailyHours);
  return (
    <div className="step" data-testid="step-schedule">
      <section className="card">
        <ChipRow
          label="참여할 수 있는 요일"
          hint="월·수·금은 15:50, 화·목은 16:50에 열려요."
          error={errors.availableDays}
          options={DAYS.map((day) => ({ value: day.key, label: `${day.key}`, hint: day.open }))}
          values={form.availableDays}
          onToggle={toggleDay}
        />
      </section>
      <section className="card">
        <ChipRow
          label="몇 시까지 있을 수 있나요"
          hint="고른 시간까지 끝나는 블록만 칠할 수 있어요."
          error={errors.leaveTime}
          options={leaveTimeOptions().map((time) => ({ value: time, label: `${time}` }))}
          value={form.leaveTime}
          onChange={(leaveTime) => patch({ leaveTime })}
        />
        <ChipRow
          label="하루에 공부할 수 있는 시간"
          error={errors.dailyHours}
          options={DAILY_HOUR_OPTIONS.map((hour) => ({ value: String(hour), label: `${hour}시간` }))}
          value={form.dailyHours == null ? '' : String(form.dailyHours)}
          onChange={(hour) => patch({ dailyHours: Number(hour) })}
        />
      </section>
      <section className="card">
        <ChipRow
          label="한 주에 공부할 시간"
          hint="시간표와 달라도 괜찮아요. 아래에서 차이를 보여 드려요."
          error={errors.weeklyHoursIntent}
          testId="weekly-hours"
          options={WEEKLY_HOUR_OPTIONS.map((hour) => ({ value: String(hour), label: `${hour}시간` }))}
          value={form.weeklyHoursIntent == null ? '' : String(form.weeklyHoursIntent)}
          onChange={(hour) => patch({ weeklyHoursIntent: Number(hour) })}
        />
      </section>
      <section className="card">
        {ready ? (
          <Timetable
            slots={form.slots}
            availableDays={form.availableDays}
            leaveTime={form.leaveTime}
            dailyHours={form.dailyHours}
            onChange={(slots) => patch({ slots })}
          />
        ) : (
          <div className="locked">
            <p>요일, 귀가 시간, 하루 공부 시간을 선택하면 시간표가 열립니다.</p>
          </div>
        )}
        <FieldError>{errors.slots}</FieldError>
        {ready && (
          <ul className="day-sums">
            {DAYS.filter((day) => form.availableDays.includes(day.key)).map((day) => {
              const blocks = form.slots.filter((slot) => slot.startsWith(`${day.key}|`)).length;
              return (
                <li key={day.key}>
                  {day.key} {formatHours(blocks * 0.5)}
                  <small> / {formatHours(form.dailyHours || 0)}</small>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="card">
        <HoursCompare
          selected={selectedHours(form.slots)}
          intent={form.weeklyHoursIntent}
          availableDays={form.availableDays}
          leaveTime={form.leaveTime}
          dailyHours={form.dailyHours}
        />
      </section>
    </div>
  );
}
