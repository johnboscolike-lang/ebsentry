/** Shared schedule, department, and form option data. */

export const SCHOOL = {
  short: '김포과기고',
  room: 'EBS 자기주도학습실',
  title: '입반 신청',
};

export const BLOCK_MINUTES = 30;
export const DAY_END = '20:50';

/** @type {readonly ['27 신입생', '고1', '고2']} */
export const GRADES = ['27 신입생', '고1', '고2'];

/** @type {readonly ['기계과', '전기과', '화공과', '전자과']} */
export const DEPARTMENTS = ['기계과', '전기과', '화공과', '전자과'];

export const DEPARTMENT_COLOR = {
  기계과: '#ff9b73',
  전기과: '#ffd23f',
  화공과: '#3dce9a',
  전자과: '#6aabff',
};

export const DAYS = [
  { key: '월', open: '15:50' },
  { key: '화', open: '16:50' },
  { key: '수', open: '15:50' },
  { key: '목', open: '16:50' },
  { key: '금', open: '15:50' },
];

export const DAY_KEYS = DAYS.map((day) => day.key);

export const WEEKLY_HOUR_OPTIONS = [2, 4, 6, 8, 10, 12, 15, 18, 20];
export const DAILY_HOUR_OPTIONS = [1, 2, 3, 4];
export const COMMUTE_OPTIONS = ['도보', '버스', '지하철'];
export const ACADEMY_SUBJECTS = ['국어', '영어', '수학', '전공', '과학', '기타'];

export const COMMON_CERTS = [
  '컴퓨터활용능력 2급',
  '컴퓨터활용능력 1급',
  '한국사능력검정',
  '워드프로세서',
];

export const DEPT_CERTS = {
  기계과: [
    '전산응용기계제도기능사',
    '컴퓨터응용선반기능사',
    '컴퓨터응용밀링기능사',
    '기계가공조립기능사',
    '용접기능사',
    '공유압기능사',
    '생산자동화기능사',
    '기계정비기능사',
  ],
  전기과: [
    '전기기능사',
    '승강기기능사',
    '신재생에너지발전설비기능사(태양광)',
    '공조냉동기계기능사',
    '에너지관리기능사',
  ],
  화공과: [
    '화학분석기능사',
    '위험물기능사',
    '위험물산업기사',
    '환경기능사',
    '가스기능사',
  ],
  전자과: [
    '전자기능사',
    '전자캐드기능사',
    '전자기기기능사',
    '정보처리기능사',
    '전자계산기기능사',
    '정보기기운용기능사',
  ],
};

export const WEAK_SUBJECTS = ['국어', '영어', '수학', '전공 이론', '전공 실습', '아직 잘 모르겠어요'];
export const CURRENT_STUDY = ['거의 없어요', '30분 미만', '30분–1시간', '1–2시간', '2시간 이상'];
export const DIFFICULTIES = [
  '집중이 오래 안 돼요',
  '계획을 세우기 어려워요',
  '모르는 문제를 그냥 넘겨요',
  '휴대폰이 자꾸 보여요',
  '어디서부터 할지 모르겠어요',
  '졸리거나 쉽게 지쳐요',
  '질문하기가 부끄러워요',
];
export const COACH_WISHES = [
  '공부 계획을 같이 짜 주세요',
  '모르는 문제를 질문하고 싶어요',
  '집중할 수 있게 도와 주세요',
  '진로·자격증 상담을 원해요',
  '조용히 스스로 하고 싶어요',
  '친구와 함께 배우고 싶어요',
];
export const PHONE_HABITS = [
  '공부 중에는 거의 안 봐요',
  '쉬는 시간에만 봐요',
  '알림이 오면 확인해요',
  '자주 보게 돼요',
  '가방에 넣어 두고 싶어요',
];

export const PROGRAM_LEVELS = [
  { value: 1, label: '소식만 들을래요', emoji: '👀' },
  { value: 2, label: '관심 있는 것만', emoji: '🌱' },
  { value: 3, label: '종종 참여할래요', emoji: '🌿' },
  { value: 4, label: '적극적으로 할래요', emoji: '🔥' },
  { value: 5, label: '빠짐없이 함께할래요', emoji: '🌟' },
];

/** @type {Map<string, { start: string, end: string }[]>} */
const blockCache = new Map();

/**
 * @param {string} hhmm
 * @returns {number}
 */
export function toMinutes(hhmm) {
  const [hour, minute] = String(hhmm).split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * @param {number} mins
 * @returns {string}
 */
export function fromMinutes(mins) {
  const hour = Math.floor(mins / 60);
  const minute = mins % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/**
 * @param {string} open
 * @returns {readonly { start: string, end: string }[]}
 */
export function blocksForDay(open) {
  const cached = blockCache.get(open);
  if (cached) return cached;
  const blocks = [];
  for (let cursor = toMinutes(open); cursor < toMinutes(DAY_END); cursor += BLOCK_MINUTES) {
    blocks.push(Object.freeze({ start: fromMinutes(cursor), end: fromMinutes(cursor + BLOCK_MINUTES) }));
  }
  const frozen = Object.freeze(blocks);
  blockCache.set(open, frozen);
  return frozen;
}

/** @returns {string[]} */
export function allRowStarts() {
  return blocksForDay('15:50').map((block) => block.start);
}

/** @returns {string[]} */
export function leaveTimeOptions() {
  return blocksForDay('15:50').map((block) => block.end);
}

/**
 * @param {string} day
 * @param {string} start
 */
export function slotId(day, start) {
  return `${day}|${start}`;
}

/**
 * @param {string} id
 * @returns {{ day: string, start: string }}
 */
export function parseSlotId(id) {
  const [day = '', start = ''] = String(id).split('|');
  return { day, start };
}

/**
 * @param {number | string | null | undefined} classNumber
 * @returns {string}
 */
export function departmentForClass(classNumber) {
  const n = Number(classNumber);
  if (n === 1 || n === 2) return '기계과';
  if (n === 3 || n === 4) return '전기과';
  if (n === 5 || n === 6) return '화공과';
  if (n === 7 || n === 8) return '전자과';
  return '';
}

/**
 * @param {string} dayKey
 * @param {string} start
 */
export function isKnownSlot(dayKey, start) {
  const day = DAYS.find((item) => item.key === dayKey);
  if (!day) return false;
  return blocksForDay(day.open).some((block) => block.start === start);
}

/**
 * A block is open when it belongs to that weekday and ends at or before leaveTime.
 * @param {string} dayKey
 * @param {string} start
 * @param {string} leaveTime
 */
export function isSlotOpen(dayKey, start, leaveTime) {
  const day = DAYS.find((item) => item.key === dayKey);
  if (!day || !leaveTime) return false;
  const block = blocksForDay(day.open).find((item) => item.start === start);
  if (!block) return false;
  return toMinutes(block.end) <= toMinutes(leaveTime);
}

/**
 * @param {string[] | unknown} slots
 */
export function selectedHours(slots) {
  return (Array.isArray(slots) ? slots.length : 0) * 0.5;
}

/**
 * @param {number} hours
 */
export function formatHours(hours) {
  const sign = hours < 0 ? '-' : '';
  const totalMin = Math.round(Math.abs(hours) * 60);
  const hour = Math.floor(totalMin / 60);
  const minute = totalMin % 60;
  if (hour === 0 && minute === 0) return '0시간';
  if (hour === 0) return `${sign}${minute}분`;
  if (minute === 0) return `${sign}${hour}시간`;
  return `${sign}${hour}시간 ${minute}분`;
}

/**
 * @param {number} selected
 * @param {number | null | undefined} intent
 */
export function hoursCompareMessage(selected, intent) {
  if (intent == null || Number.isNaN(Number(intent))) {
    return '한 주 희망 시간을 선택하면 시간표와 비교합니다.';
  }
  const diff = Math.round((selected - Number(intent)) * 2) / 2;
  if (diff === 0) return '시간표와 희망 시간이 같습니다.';
  if (diff < 0) return `희망보다 ${formatHours(Math.abs(diff))} 적습니다.`;
  return `희망보다 ${formatHours(diff)} 많습니다.`;
}

/**
 * @param {{ availableDays?: string[], leaveTime?: string, dailyHours?: number | null }} limits
 */
export function maxSelectableHours(limits) {
  const dailyHours = Number(limits.dailyHours);
  if (!dailyHours || !limits.leaveTime || !Array.isArray(limits.availableDays)) return 0;
  let blocks = 0;
  for (const day of DAYS) {
    if (!limits.availableDays.includes(day.key)) continue;
    const openBlocks = blocksForDay(day.open).filter(
      (block) => toMinutes(block.end) <= toMinutes(limits.leaveTime || ''),
    ).length;
    blocks += Math.min(openBlocks, dailyHours * 2);
  }
  return blocks * 0.5;
}

/**
 * Drop slots the student can no longer keep after changing days, leave time, or daily hours.
 * Earlier blocks on each day are kept.
 * @param {string[]} slots
 * @param {{ availableDays?: string[], leaveTime?: string, dailyHours?: number | null }} limits
 */
export function pruneSlots(slots, limits) {
  const maxBlocks = Number(limits.dailyHours) > 0 ? Number(limits.dailyHours) * 2 : 0;
  const available = new Set(limits.availableDays || []);
  /** @type {Record<string, number>} */
  const perDay = {};
  const sorted = [...(slots || [])].sort((a, b) => {
    const left = parseSlotId(a);
    const right = parseSlotId(b);
    const dayDelta = DAY_KEYS.indexOf(left.day) - DAY_KEYS.indexOf(right.day);
    if (dayDelta !== 0) return dayDelta;
    return toMinutes(left.start) - toMinutes(right.start);
  });
  /** @type {string[]} */
  const kept = [];
  for (const id of sorted) {
    const { day, start } = parseSlotId(id);
    if (!available.has(day)) continue;
    if (!isSlotOpen(day, start, limits.leaveTime || '')) continue;
    perDay[day] = perDay[day] || 0;
    if (perDay[day] >= maxBlocks) continue;
    perDay[day] += 1;
    kept.push(id);
  }
  return kept;
}

/**
 * @param {string} department
 * @returns {string[]}
 */
export function allowedCerts(department) {
  return [...(DEPT_CERTS[department] || []), ...COMMON_CERTS];
}

/**
 * Merge contiguous 30-minute blocks into ranges.
 * @param {string[]} slots
 */
export function scheduleSummary(slots) {
  return DAYS.map((day) => {
    const starts = (slots || [])
      .map(parseSlotId)
      .filter((slot) => slot.day === day.key && isKnownSlot(day.key, slot.start))
      .map((slot) => slot.start)
      .sort((a, b) => toMinutes(a) - toMinutes(b));
    /** @type {{ start: string, end: string }[]} */
    const ranges = [];
    for (const start of starts) {
      const end = fromMinutes(toMinutes(start) + BLOCK_MINUTES);
      const last = ranges[ranges.length - 1];
      if (last && last.end === start) last.end = end;
      else ranges.push({ start, end });
    }
    return { day: day.key, ranges, hours: starts.length * 0.5 };
  }).filter((day) => day.ranges.length > 0);
}
