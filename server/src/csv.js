import { scheduleSummary } from '../../shared/domain.js';

const HEADERS = [
  '접수번호',
  '접수시각(KST)',
  '이름',
  '학년',
  '반',
  '학과',
  '참여요일',
  '귀가가능',
  '하루가능시간',
  '주간희망시간',
  '선택시간',
  '선택시간대',
  '등교수단',
  '편도분',
  '학원여부',
  '학원',
  '진로',
  '취득자격증',
  '계획자격증',
  '기타취득',
  '기타계획',
  '프로그램참여',
  '입반동기',
  '보완과목',
  '보완과목메모',
  '현재자습',
  '어려운점',
  '어려운점메모',
  '목표',
  '코치바람',
  '코치메모',
  '휴대폰습관',
];

/**
 * @param {unknown} value
 */
function cell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : value == null ? '' : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/**
 * @param {string} iso
 */
function toKst(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replace('T', ' ');
}

/**
 * @param {Record<string, any>} application
 */
function slotText(application) {
  return scheduleSummary(application.slots || [])
    .map((day) => `${day.day} ${day.ranges.map((range) => `${range.start}-${range.end}`).join(', ')}`)
    .join(' | ');
}

/**
 * @param {Record<string, any>} application
 */
function academyText(application) {
  if (!application.attendsAcademy) return '';
  return (application.academies || []).map((academy) => `${academy.subject} ${academy.name}`).join(' | ');
}

/**
 * @param {Record<string, any>[]} applications
 */
export function applicationsToCsv(applications) {
  const lines = [HEADERS.map(cell).join(',')];
  for (const application of applications) {
    lines.push(
      [
        application.id,
        toKst(application.createdAt),
        application.name,
        application.grade,
        application.classNumber ?? '',
        application.department,
        (application.availableDays || []).join(' | '),
        application.leaveTime,
        application.dailyHours,
        application.weeklyHoursIntent,
        application.selectedHours,
        slotText(application),
        (application.commute || []).join(' | '),
        application.commuteMinutes,
        application.attendsAcademy ? '예' : '아니오',
        academyText(application),
        application.careerPath,
        application.certsHeld,
        application.certsPlanned,
        application.certsOtherHeld,
        application.certsOtherPlanned,
        application.programInterest,
        application.motivation,
        application.weakSubject,
        application.weakSubjectNote,
        application.currentStudyHours,
        application.studyDifficulties,
        application.studyDifficultyNote,
        application.goals,
        application.coachWishes,
        application.coachWishNote,
        application.phoneHabit,
      ]
        .map(cell)
        .join(','),
    );
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
