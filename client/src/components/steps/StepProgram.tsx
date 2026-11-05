import { PROGRAM_LEVELS } from '@shared/domain.js';
import type { FormState } from '../../types';
import { FieldError, cx } from '../ui';

export function StepProgram({
  form,
  errors,
  patch,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
}) {
  return (
    <div className="step" data-testid="step-program">
      <section className="card">
        <fieldset className="field">
          <legend>
            프로그램 참여 의향 <i className="req">*</i>
          </legend>
          <p className="field-hint">특강, 멘토링, 자격증 스터디 등 EBS센터 프로그램입니다.</p>
          <div className="scale" role="radiogroup" aria-label="프로그램 참여 의향">
            {PROGRAM_LEVELS.map((level) => {
              const selected = form.programInterest === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={`program-${level.value}`}
                  className={cx('scale-btn', selected && 'on')}
                  onClick={() => patch({ programInterest: level.value })}
                >
                  <strong>{level.value}</strong>
                  <em>{level.label}</em>
                </button>
              );
            })}
          </div>
          <FieldError>{errors.programInterest}</FieldError>
        </fieldset>
      </section>
    </div>
  );
}
