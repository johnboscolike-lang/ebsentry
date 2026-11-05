import { COACH_WISHES, CURRENT_STUDY, DIFFICULTIES, PHONE_HABITS, WEAK_SUBJECTS } from '@shared/domain.js';
import type { FormState } from '../../types';
import { ChipRow, TextField } from '../ui';

export function StepCounsel({
  form,
  errors,
  patch,
  toggle,
}: {
  form: FormState;
  errors: Record<string, string>;
  patch: (partial: Partial<FormState>) => void;
  toggle: (key: 'studyDifficulties' | 'coachWishes', value: string) => void;
}) {
  return (
    <div className="step" data-testid="step-counsel">
      <section className="card">
        <TextField
          label="입반 동기"
          hint="왜 이 학습실에서 공부하고 싶은지 짧게 적어 주세요."
          multiline
          maxLength={500}
          testId="motivation"
          placeholder="예: 집에서는 집중이 잘 안 되어서, 계획을 지키며 공부하고 싶어요."
          value={form.motivation}
          error={errors.motivation}
          onChange={(motivation) => patch({ motivation })}
        />
      </section>
      <section className="card">
        <ChipRow
          label="가장 보완하고 싶은 과목"
          error={errors.weakSubject}
          options={WEAK_SUBJECTS.map((subject) => ({ value: subject, label: subject }))}
          value={form.weakSubject}
          onChange={(weakSubject) => patch({ weakSubject })}
        />
        <TextField
          label="과목 메모"
          optional
          maxLength={80}
          placeholder="예: 수학 함수, 영어 단어"
          value={form.weakSubjectNote}
          onChange={(weakSubjectNote) => patch({ weakSubjectNote })}
        />
        <ChipRow
          label="지금 하루 평균 자습 시간"
          error={errors.currentStudyHours}
          options={CURRENT_STUDY.map((item) => ({ value: item, label: item }))}
          value={form.currentStudyHours}
          onChange={(currentStudyHours) => patch({ currentStudyHours })}
        />
      </section>
      <section className="card">
        <ChipRow
          label="공부할 때 어려운 점"
          hint="여러 항목을 선택할 수 있습니다."
          error={errors.studyDifficulties}
          options={DIFFICULTIES.map((item) => ({ value: item, label: item }))}
          values={form.studyDifficulties}
          onToggle={(value) => toggle('studyDifficulties', value)}
        />
        <TextField
          label="어려운 점 메모"
          optional
          multiline
          maxLength={120}
          value={form.studyDifficultyNote}
          onChange={(studyDifficultyNote) => patch({ studyDifficultyNote })}
        />
      </section>
      <section className="card">
        <TextField
          label="목표"
          hint="성적, 자격증, 진학 중 떠오르는 것을 적어 주세요."
          multiline
          maxLength={500}
          testId="goals"
          placeholder="예: 이번 학기 수학 80점, 전기기능사 필기 합격"
          value={form.goals}
          error={errors.goals}
          onChange={(goals) => patch({ goals })}
        />
      </section>
      <section className="card">
        <ChipRow
          label="코치님께 바라는 점"
          error={errors.coachWishes}
          options={COACH_WISHES.map((item) => ({ value: item, label: item }))}
          values={form.coachWishes}
          onToggle={(value) => toggle('coachWishes', value)}
        />
        <TextField
          label="바라는 점 메모"
          optional
          multiline
          maxLength={120}
          value={form.coachWishNote}
          onChange={(coachWishNote) => patch({ coachWishNote })}
        />
        <ChipRow
          label="휴대폰 사용 습관"
          error={errors.phoneHabit}
          options={PHONE_HABITS.map((item) => ({ value: item, label: item }))}
          value={form.phoneHabit}
          onChange={(phoneHabit) => patch({ phoneHabit })}
        />
      </section>
    </div>
  );
}
