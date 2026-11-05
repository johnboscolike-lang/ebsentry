import { COMMON_CERTS, DEPT_CERTS } from '@shared/domain.js';
import type { CareerPath, Department, FormState } from '../../types';
import { ChipRow, FieldError, TextField, cx } from '../ui';

export function StepCareer({
  form,
  errors,
  patch,
  toggle,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
  toggle: (key: 'certsHeld' | 'certsPlanned', value: string) => void;
}) {
  const department = form.department as Department | '';
  const deptCerts = department ? DEPT_CERTS[department] : [];
  return (
    <div className="step" data-testid="step-career">
      <section className="card">
        <fieldset className="field">
          <legend>
            졸업 후 생각 <i className="req">*</i>
          </legend>
          <p className="field-hint">현재 더 가까운 방향을 선택해 주세요.</p>
          <div className="choice-grid cols-2" role="radiogroup" aria-label="진로">
            <button
              type="button"
              role="radio"
              aria-checked={form.careerPath === '진학'}
              data-testid="career-study"
              className={cx('choice', form.careerPath === '진학' && 'on')}
              onClick={() => patch({ careerPath: '진학' as CareerPath })}
            >
              <span>진학</span>
              <small>대학·전공</small>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.careerPath === '취업'}
              data-testid="career-job"
              className={cx('choice', form.careerPath === '취업' && 'on')}
              onClick={() => patch({ careerPath: '취업' as CareerPath })}
            >
              <span>취업</span>
              <small>자격·현장</small>
            </button>
          </div>
          <FieldError>{errors.careerPath}</FieldError>
        </fieldset>
      </section>
      {form.careerPath === '취업' && (
        <section className="card">
          <h3 className="card-title">{department || '학과'} 자격증</h3>
          <p className="field-hint">없으면 비워 두어도 됩니다. 취득한 자격과 준비 중인 자격을 구분해 주세요.</p>
          <ChipRow
            label="취득한 자격증"
            optional
            error={errors.certsHeld}
            options={[...deptCerts, ...COMMON_CERTS].map((cert) => ({ value: cert, label: cert }))}
            values={form.certsHeld}
            onToggle={(cert) => toggle('certsHeld', cert)}
          />
          <TextField
            label="기타 취득 자격"
            optional
            value={form.certsOtherHeld}
            maxLength={80}
            placeholder="목록에 없으면 여기에"
            onChange={(certsOtherHeld) => patch({ certsOtherHeld })}
          />
          <ChipRow
            label="따고 싶은 자격증"
            optional
            error={errors.certsPlanned}
            options={[...deptCerts, ...COMMON_CERTS].map((cert) => ({ value: cert, label: cert }))}
            values={form.certsPlanned}
            onToggle={(cert) => toggle('certsPlanned', cert)}
          />
          <TextField
            label="기타 계획 자격"
            optional
            value={form.certsOtherPlanned}
            maxLength={80}
            placeholder="준비하고 있는 자격"
            onChange={(certsOtherPlanned) => patch({ certsOtherPlanned })}
          />
        </section>
      )}
      {form.careerPath === '진학' && (
        <section className="card quiet-card">
          <p>진학을 선택했습니다. 목표 학교나 성적은 상담 질문에 적어도 됩니다.</p>
        </section>
      )}
    </div>
  );
}
