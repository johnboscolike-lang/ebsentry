import type { ReactNode } from 'react';
import { PROGRAM_LEVELS, formatHours, scheduleSummary, selectedHours } from '@shared/domain.js';
import type { FormState } from '../../types';
import { HoursCompare } from '../HoursCompare';
import { Timetable } from '../Timetable';

export function StepReview({ form, onEdit }: { form: FormState; onEdit: (step: number) => void }) {
  const program = PROGRAM_LEVELS.find((level) => level.value === form.programInterest);
  const who =
    form.grade === '27 신입생'
      ? `${form.grade} · ${form.department}`
      : `${form.grade} ${form.classNumber}반 · ${form.department}`;
  const ranges = scheduleSummary(form.slots);
  return (
    <div className="step" data-testid="step-review">
      <section className="card review-hero">
        <p className="eyebrow">제출 전 확인</p>
        <h2>{form.name || '이름'} 학생</h2>
        <p className="who">{who}</p>
      </section>
      <ReviewBlock title="기본" onEdit={() => onEdit(0)}>
        <p>{who}</p>
      </ReviewBlock>
      <ReviewBlock title="공부 시간" onEdit={() => onEdit(1)}>
        <p>
          가능 요일 {form.availableDays.join(' · ') || '없음'} · {form.leaveTime || '—'}까지 · 하루{' '}
          {form.dailyHours ?? '—'}시간
        </p>
        <ul className="range-list">
          {ranges.map((day) => (
            <li key={day.day}>
              <strong>{day.day}</strong>
              <span>
                {day.ranges.map((range) => `${range.start}–${range.end}`).join(', ')} ({formatHours(day.hours)})
              </span>
            </li>
          ))}
        </ul>
        <Timetable
          compact
          readOnly
          slots={form.slots}
          availableDays={form.availableDays}
          leaveTime={form.leaveTime}
          dailyHours={form.dailyHours}
        />
        <HoursCompare
          selected={selectedHours(form.slots)}
          intent={form.weeklyHoursIntent}
          availableDays={form.availableDays}
          leaveTime={form.leaveTime}
          dailyHours={form.dailyHours}
        />
      </ReviewBlock>
      <ReviewBlock title="등교" onEdit={() => onEdit(2)}>
        <p>
          {(form.commute || []).join(' · ') || '미선택'} · 편도 {form.commuteMinutes ?? '—'}분
        </p>
      </ReviewBlock>
      <ReviewBlock title="학원" onEdit={() => onEdit(3)}>
        {form.attendsAcademy ? (
          <ul>
            {form.academies
              .filter((academy) => academy.subject || academy.name)
              .map((academy) => (
                <li key={academy.id}>
                  {academy.subject} · {academy.name}
                </li>
              ))}
          </ul>
        ) : (
          <p>학원에 다니지 않아요</p>
        )}
      </ReviewBlock>
      <ReviewBlock title="진로" onEdit={() => onEdit(4)}>
        <p>{form.careerPath || '미선택'}</p>
        {form.careerPath === '취업' && (
          <>
            <p>취득: {joinOrEmpty(form.certsHeld, form.certsOtherHeld)}</p>
            <p>계획: {joinOrEmpty(form.certsPlanned, form.certsOtherPlanned)}</p>
          </>
        )}
      </ReviewBlock>
      <ReviewBlock title="프로그램" onEdit={() => onEdit(5)}>
        <p>
          {program ? `${program.value}. ${program.label}` : '미선택'}
        </p>
      </ReviewBlock>
      <ReviewBlock title="상담 메모" onEdit={() => onEdit(6)}>
        <p>
          <strong>동기</strong> {form.motivation}
        </p>
        <p>
          <strong>보완</strong> {form.weakSubject}
          {form.weakSubjectNote ? ` (${form.weakSubjectNote})` : ''} · 현재 자습 {form.currentStudyHours}
        </p>
        <p>
          <strong>어려운 점</strong> {form.studyDifficulties.join(', ')}
          {form.studyDifficultyNote ? ` · ${form.studyDifficultyNote}` : ''}
        </p>
        <p>
          <strong>목표</strong> {form.goals}
        </p>
        <p>
          <strong>코치님께</strong> {form.coachWishes.join(', ')}
          {form.coachWishNote ? ` · ${form.coachWishNote}` : ''}
        </p>
        <p>
          <strong>휴대폰</strong> {form.phoneHabit}
        </p>
      </ReviewBlock>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="card review-item">
      <header>
        <h3>{title}</h3>
        <button type="button" className="text-button" onClick={onEdit}>
          수정
        </button>
      </header>
      {children}
    </section>
  );
}

function joinOrEmpty(list: string[], extra: string) {
  const parts = [...list];
  if (extra.trim()) parts.push(extra.trim());
  return parts.length ? parts.join(', ') : '아직 없어요';
}
