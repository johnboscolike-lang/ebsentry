import { ACADEMY_SUBJECTS } from '@shared/domain.js';
import type { AcademyEntry, FormState } from '../../types';
import { FieldError, cx } from '../ui';

export function StepAcademy({
  form,
  errors,
  patch,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
}) {
  function updateAcademy(id: string, partial: Partial<AcademyEntry>) {
    patch({
      academies: form.academies.map((academy) => (academy.id === id ? { ...academy, ...partial } : academy)),
    });
  }

  return (
    <div className="step" data-testid="step-academy">
      <section className="card">
        <fieldset className="field">
          <legend>
            학원에 다니나요 <i className="req">*</i>
          </legend>
          <div className="choice-grid cols-2" role="radiogroup" aria-label="학원 여부">
            <button
              type="button"
              role="radio"
              aria-checked={form.attendsAcademy === true}
              data-testid="academy-yes"
              className={cx('choice', form.attendsAcademy === true && 'on')}
              onClick={() => patch({ attendsAcademy: true })}
            >
              <span>예</span>
              <small>학원에 다님</small>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.attendsAcademy === false}
              data-testid="academy-no"
              className={cx('choice', form.attendsAcademy === false && 'on')}
              onClick={() => patch({ attendsAcademy: false })}
            >
              <span>아니오</span>
              <small>해당 없음</small>
            </button>
          </div>
          <FieldError>{errors.attendsAcademy}</FieldError>
        </fieldset>
      </section>
      {form.attendsAcademy === true && (
        <section className="card">
          <h3 className="card-title">어떤 학원인가요</h3>
          <p className="field-hint">과목과 학원 이름을 적어 주세요. 여러 곳이면 추가할 수 있습니다.</p>
          <ul className="academy-list">
            {form.academies.map((academy, index) => (
              <li key={academy.id} className="academy-row">
                <label>
                  <span>과목</span>
                  <select
                    className="text-input"
                    value={academy.subject}
                    data-testid={`academy-subject-${index}`}
                    onChange={(event) => updateAcademy(academy.id, { subject: event.target.value })}
                  >
                    <option value="">선택</option>
                    {ACADEMY_SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>학원 이름</span>
                  <input
                    className="text-input"
                    value={academy.name}
                    maxLength={40}
                    placeholder="예: 중앙수학"
                    data-testid={`academy-name-${index}`}
                    onChange={(event) => updateAcademy(academy.id, { name: event.target.value })}
                  />
                </label>
                {form.academies.length > 1 && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => patch({ academies: form.academies.filter((item) => item.id !== academy.id) })}
                  >
                    빼기
                  </button>
                )}
              </li>
            ))}
          </ul>
          <FieldError>{errors.academies}</FieldError>
          {form.academies.length < 8 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                patch({
                  academies: [...form.academies, { id: `a${Date.now().toString(36)}`, subject: '', name: '' }],
                })
              }
            >
              학원 추가
            </button>
          )}
        </section>
      )}
      {form.attendsAcademy === false && (
        <section className="card quiet-card">
          <p>학원 일정은 없습니다.</p>
        </section>
      )}
    </div>
  );
}
