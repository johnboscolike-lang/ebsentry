import { DEPARTMENTS, departmentForClass } from '@shared/domain.js';
import type { Department, FormState, Grade } from '../../types';
import { ChoiceGrid, FieldError, TextField, cx } from '../ui';

const GRADE_OPTIONS: { value: Grade; label: string; hint: string }[] = [
  { value: '27 신입생', label: '27 신입생', hint: '학과 선택' },
  { value: '고1', label: '고1', hint: '1–8반' },
  { value: '고2', label: '고2', hint: '1–8반' },
];

export function StepBasic({
  form,
  errors,
  patch,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
}) {
  const upper = form.grade === '고1' || form.grade === '고2';
  return (
    <div className="step" data-testid="step-basic">
      <section className="card">
        <TextField
          label="이름"
          value={form.name}
          onChange={(name) => patch({ name })}
          placeholder="홍길동"
          maxLength={30}
          autoComplete="name"
          testId="student-name"
          error={errors.name}
        />
      </section>
      <section className="card">
        <ChoiceGrid
          label="학년"
          hint="신입생은 학과를, 재학생은 반을 선택합니다."
          options={GRADE_OPTIONS}
          value={form.grade}
          columns={1}
          error={errors.grade}
          onChange={(grade) => patch({ grade: grade as Grade })}
        />
      </section>
      {form.grade === '27 신입생' && (
        <section className="card">
          <ChoiceGrid
            label="희망 학과"
            options={DEPARTMENTS.map((department) => ({
              value: department,
              label: department,
            }))}
            value={form.department}
            columns={2}
            error={errors.department}
            onChange={(department) => patch({ department: department as Department })}
          />
        </section>
      )}
      {upper && (
        <section className="card">
          <fieldset className="field">
            <legend>
              반 <i className="req">*</i>
            </legend>
            <p className="field-hint">1·2반 기계과, 3·4반 전기과, 5·6반 화공과, 7·8반 전자과.</p>
            <div className="choice-grid cols-2" role="radiogroup" aria-label="반">
              {Array.from({ length: 8 }, (_, index) => index + 1).map((classNumber) => {
                const department = departmentForClass(classNumber);
                const selected = form.classNumber === classNumber;
                return (
                  <button
                    key={classNumber}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`class-${classNumber}`}
                    className={cx('choice', selected && 'on')}
                    onClick={() => patch({ classNumber })}
                  >
                    <strong>{classNumber}반</strong>
                    <small>{department}</small>
                  </button>
                );
              })}
            </div>
            <FieldError>{errors.classNumber}</FieldError>
          </fieldset>
          {form.department && (
            <div className="auto-dept" role="status">
              <p>
                {form.grade} {form.classNumber}반은 <strong>{form.department}</strong>
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
