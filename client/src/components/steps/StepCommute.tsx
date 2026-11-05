import { COMMUTE_OPTIONS } from '@shared/domain.js';
import type { FormState } from '../../types';
import { ChipRow, FieldError, Note } from '../ui';

const MINUTE_PRESETS = [10, 15, 20, 30, 40, 60, 90];

export function StepCommute({
  form,
  errors,
  patch,
  toggleCommute,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
  toggleCommute: (value: string) => void;
}) {
  return (
    <div className="step" data-testid="step-commute">
      <section className="card">
        <ChipRow
          label="등교 수단"
          hint="여러 수단을 함께 선택할 수 있습니다."
          error={errors.commute}
          options={COMMUTE_OPTIONS.map((item) => ({
            value: item,
            label: item,
          }))}
          values={form.commute}
          onToggle={toggleCommute}
        />
      </section>
      <section className="card">
        <fieldset className="field">
          <legend>
            집 → 학교 편도 시간 <i className="req">*</i>
          </legend>
          <p className="field-hint">분 단위입니다. 환승 대기를 포함해 주세요.</p>
          <div className="wrap-chips" role="radiogroup" aria-label="편도 소요 시간">
            {MINUTE_PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={form.commuteMinutes === minutes ? 'chip on' : 'chip'}
                aria-checked={form.commuteMinutes === minutes}
                role="radio"
                onClick={() => patch({ commuteMinutes: minutes })}
              >
                {minutes}분
              </button>
            ))}
          </div>
          <label className="minute-custom">
            <span>직접 입력</span>
            <input
              className="text-input"
              inputMode="numeric"
              data-testid="commute-minutes"
              placeholder="예: 25"
              value={form.commuteMinutes ?? ''}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d]/g, '').slice(0, 3);
                patch({ commuteMinutes: digits ? Number(digits) : null });
              }}
            />
            <span>분</span>
          </label>
          <FieldError>{errors.commuteMinutes}</FieldError>
          {form.commuteMinutes != null && form.commuteMinutes > 0 && (
            <Note>편도 {form.commuteMinutes}분이면 왕복은 약 {form.commuteMinutes * 2}분이에요.</Note>
          )}
        </fieldset>
      </section>
    </div>
  );
}
