import { useEffect, useState } from 'react';
import { departmentForClass, pruneSlots } from '@shared/domain.js';
import { firstInvalidStep, validateApplication, validateStep } from '@shared/validate.js';
import { submitApplication } from '../api';
import { initialForm, type Department, type FormState } from '../types';
import { Success } from './Success';
import { cx } from './ui';
import { StepAcademy } from './steps/StepAcademy';
import { StepBasic } from './steps/StepBasic';
import { StepCareer } from './steps/StepCareer';
import { StepCommute } from './steps/StepCommute';
import { StepCounsel } from './steps/StepCounsel';
import { StepProgram } from './steps/StepProgram';
import { StepReview } from './steps/StepReview';
import { StepSchedule } from './steps/StepSchedule';

const STORAGE_KEY = 'ebs-apply-draft-v1';

const STEPS = [
  { label: '기본', title: '기본 정보', lead: '학년과 반을 선택하면 학과가 정해집니다.' },
  { label: '시간', title: '학습 시간', lead: '참여 가능한 시간과 희망 시간을 표시해 주세요.' },
  { label: '등교', title: '등교', lead: '집에서 학교까지의 수단과 소요 시간을 알려 주세요.' },
  { label: '학원', title: '학원', lead: '방과 후 일정이 있으면 적어 주세요.' },
  { label: '진로', title: '진로', lead: '취업을 선택하면 자격증을 함께 받습니다.' },
  { label: '프로그램', title: '프로그램', lead: 'EBS센터 프로그램 참여 의향을 선택해 주세요.' },
  { label: '상담', title: '상담 질문', lead: '초기 상담에 참고할 내용을 남겨 주세요.' },
  { label: '확인', title: '신청 내용 확인', lead: '수정이 필요하면 각 항목에서 돌아갈 수 있습니다.' },
];

type ListKey = 'availableDays' | 'commute' | 'certsHeld' | 'certsPlanned' | 'studyDifficulties' | 'coachWishes';

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function sanitize(input: unknown): FormState {
  if (!input || typeof input !== 'object') return initialForm;
  const draft = input as Partial<FormState>;
  const academies = Array.isArray(draft.academies)
    ? draft.academies
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' ? item.id : `a${index}`,
          subject: typeof item.subject === 'string' ? item.subject : '',
          name: typeof item.name === 'string' ? item.name : '',
        }))
    : [];
  return {
    ...initialForm,
    ...draft,
    classNumber: typeof draft.classNumber === 'number' ? draft.classNumber : null,
    dailyHours: typeof draft.dailyHours === 'number' ? draft.dailyHours : null,
    weeklyHoursIntent: typeof draft.weeklyHoursIntent === 'number' ? draft.weeklyHoursIntent : null,
    commuteMinutes: typeof draft.commuteMinutes === 'number' ? draft.commuteMinutes : null,
    programInterest: typeof draft.programInterest === 'number' ? draft.programInterest : null,
    attendsAcademy: typeof draft.attendsAcademy === 'boolean' ? draft.attendsAcademy : null,
    availableDays: asStringArray(draft.availableDays),
    slots: asStringArray(draft.slots),
    commute: asStringArray(draft.commute),
    certsHeld: asStringArray(draft.certsHeld),
    certsPlanned: asStringArray(draft.certsPlanned),
    studyDifficulties: asStringArray(draft.studyDifficulties),
    coachWishes: asStringArray(draft.coachWishes),
    academies: academies.length ? academies : initialForm.academies,
  };
}

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 0, form: initialForm };
    const data = JSON.parse(raw) as { step?: unknown; form?: unknown };
    const step = typeof data.step === 'number' && data.step >= 0 && data.step <= 7 ? data.step : 0;
    return { step, form: sanitize(data.form) };
  } catch {
    return { step: 0, form: initialForm };
  }
}

function applyPatch(prev: FormState, partial: Partial<FormState>): FormState {
  const next: FormState = { ...prev, ...partial };
  if (partial.grade && partial.grade !== prev.grade) {
    next.classNumber = null;
    next.department = '';
  }
  if (next.grade === '27 신입생') {
    next.classNumber = null;
  } else if (next.grade) {
    next.department = next.classNumber ? (departmentForClass(next.classNumber) as Department) : '';
  }
  next.slots = pruneSlots(next.slots, {
    availableDays: next.availableDays,
    leaveTime: next.leaveTime,
    dailyHours: next.dailyHours,
  });
  return next;
}

export function Wizard() {
  const [draft] = useState(loadDraft);
  const [step, setStep] = useState(draft.step);
  const [form, setForm] = useState<FormState>(draft.form);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState('');

  useEffect(() => {
    if (receipt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form }));
  }, [step, form, receipt]);

  function patch(partial: Partial<FormState>) {
    setForm((prev) => applyPatch(prev, partial));
    setErrors({});
  }

  function toggle(key: ListKey, value: string) {
    setForm((prev) => {
      const list = prev[key];
      const nextList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return applyPatch(prev, { [key]: nextList } as Partial<FormState>);
    });
    setErrors({});
  }

  function go(nextStep: number) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      document.getElementById('step-title')?.focus();
    });
  }

  function revealErrors() {
    requestAnimationFrame(() => {
      document.querySelector('.field-error, .banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async function submit() {
    const checked = validateApplication(form);
    if (!checked.ok) {
      setErrors(checked.errors);
      go(firstInvalidStep(checked.errors));
      revealErrors();
      return;
    }
    setBusy(true);
    const result = await submitApplication(form);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.errors);
      const keys = Object.keys(result.errors).filter((key) => key !== 'form');
      if (keys.length) go(firstInvalidStep(result.errors));
      revealErrors();
      return;
    }
    setReceipt(result.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (receipt) {
    return (
      <Success
        id={receipt}
        onReset={() => {
          sessionStorage.removeItem(STORAGE_KEY);
          setForm(initialForm);
          setStep(0);
          setErrors({});
          setReceipt('');
        }}
      />
    );
  }

  const meta = STEPS[step];
  return (
    <form
      className="wizard"
      data-testid="wizard"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        if (step < 7) {
          const found = validateStep(step, form);
          if (Object.keys(found).length) {
            setErrors(found);
            revealErrors();
            return;
          }
          setErrors({});
          go(step + 1);
          return;
        }
        void submit();
      }}
    >
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={8}
        aria-valuenow={step + 1}
        aria-label="신청 진행"
      >
        {STEPS.map((item, index) => (
          <span key={item.label} className={index <= step ? 'on' : ''} />
        ))}
      </div>
      <p className="progress-label">
        <span>{String(step + 1).padStart(2, '0')}</span>
        <span>{meta.label}</span>
        <span>/ 08</span>
      </p>
      <section className="card intro-card">
        <h2 id="step-title" tabIndex={-1}>
          {meta.title}
        </h2>
        <p className="lead">{meta.lead}</p>
      </section>
      {errors.form && (
        <p className="banner" role="alert">
          {errors.form}
        </p>
      )}
      {step === 0 && <StepBasic form={form} errors={errors} patch={patch} />}
      {step === 1 && <StepSchedule form={form} errors={errors} patch={patch} toggleDay={(day) => toggle('availableDays', day)} />}
      {step === 2 && <StepCommute form={form} errors={errors} patch={patch} toggleCommute={(item) => toggle('commute', item)} />}
      {step === 3 && <StepAcademy form={form} errors={errors} patch={patch} />}
      {step === 4 && (
        <StepCareer form={form} errors={errors} patch={patch} toggle={(key, value) => toggle(key, value)} />
      )}
      {step === 5 && <StepProgram form={form} errors={errors} patch={patch} />}
      {step === 6 && (
        <StepCounsel form={form} errors={errors} patch={patch} toggle={(key, value) => toggle(key, value)} />
      )}
      {step === 7 && <StepReview form={form} onEdit={go} />}
      <div className={cx('wizard-nav', step === 0 && 'only-next')}>
        {step > 0 && (
          <button type="button" className="btn ghost" data-testid="back-step" onClick={() => go(step - 1)}>
            이전
          </button>
        )}
        <button type="submit" className={cx('btn', step === 7 ? 'mint' : 'primary')} disabled={busy} data-testid="next-step">
          {busy ? '보내는 중…' : step === 7 ? '신청서 제출' : '다음'}
        </button>
      </div>
      <p className="draft-note">작성 중인 내용은 이 브라우저 탭에만 임시 저장됩니다.</p>
    </form>
  );
}
