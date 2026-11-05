import {
  ACADEMY_SUBJECTS,
  COACH_WISHES,
  COMMUTE_OPTIONS,
  CURRENT_STUDY,
  DAY_KEYS,
  DEPARTMENTS,
  DIFFICULTIES,
  GRADES,
  PHONE_HABITS,
  WEAK_SUBJECTS,
  WEEKLY_HOUR_OPTIONS,
  allowedCerts,
  departmentForClass,
  isSlotOpen,
  leaveTimeOptions,
  selectedHours,
} from './domain.js';

export const STEP_FIELDS = [
  ['name', 'grade', 'classNumber', 'department'],
  ['availableDays', 'leaveTime', 'dailyHours', 'weeklyHoursIntent', 'slots'],
  ['commute', 'commuteMinutes'],
  ['attendsAcademy', 'academies'],
  ['careerPath', 'certsHeld', 'certsPlanned', 'certsOtherHeld', 'certsOtherPlanned'],
  ['programInterest'],
  [
    'motivation',
    'weakSubject',
    'weakSubjectNote',
    'currentStudyHours',
    'studyDifficulties',
    'studyDifficultyNote',
    'goals',
    'coachWishes',
    'coachWishNote',
    'phoneHabit',
  ],
];

/**
 * @param {unknown} value
 * @param {number} max
 */
function cleanText(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function asInt(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function asStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string');
}

/**
 * @param {string[]} list
 * @param {readonly string[]} allowed
 */
function canonical(list, allowed) {
  return allowed.filter((item) => list.includes(item));
}

/**
 * @param {string} name
 */
function validName(name) {
  return /^[0-9A-Za-z가-힣][0-9A-Za-z가-힣\s·.'-]{0,29}$/.test(name) && name.replace(/\s/g, '').length >= 2;
}

/**
 * @param {unknown} body
 * @returns {{ errors: Record<string, string>, value: Record<string, unknown> }}
 */
export function collectErrors(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? /** @type {Record<string, unknown>} */ (body) : {};
  /** @type {Record<string, string>} */
  const errors = {};

  const name = cleanText(source.name, 30).replace(/\s+/g, ' ');
  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (!validName(name)) errors.name = '이름은 2글자 이상으로, 한글이나 영문으로 적어 주세요.';

  const grade = typeof source.grade === 'string' ? source.grade : '';
  const rawClass = asInt(source.classNumber);
  const rawDepartment = typeof source.department === 'string' ? source.department : '';
  let classNumber = null;
  let department = '';

  if (!GRADES.includes(grade)) {
    errors.grade = '학년을 선택해 주세요.';
  } else if (grade === '27 신입생') {
    if (!DEPARTMENTS.includes(rawDepartment)) errors.department = '희망 학과를 선택해 주세요.';
    else department = rawDepartment;
  } else if (rawClass == null || rawClass < 1 || rawClass > 8) {
    errors.classNumber = '반을 선택해 주세요.';
  } else {
    classNumber = rawClass;
    department = departmentForClass(rawClass);
  }

  const availableRaw = asStringList(source.availableDays);
  let availableDays = [];
  if (availableRaw.length === 0) errors.availableDays = '참여할 수 있는 요일을 골라 주세요.';
  else if (availableRaw.some((day) => !DAY_KEYS.includes(day))) errors.availableDays = '요일을 다시 선택해 주세요.';
  else availableDays = canonical(availableRaw, DAY_KEYS);

  const leaveTime = typeof source.leaveTime === 'string' ? source.leaveTime : '';
  const knownLeave = new Set(leaveTimeOptions());
  if (!knownLeave.has(leaveTime)) errors.leaveTime = '몇 시까지 있을 수 있는지 골라 주세요.';

  const dailyHours = asInt(source.dailyHours);
  if (dailyHours == null || ![1, 2, 3, 4].includes(dailyHours)) {
    errors.dailyHours = '하루에 공부할 수 있는 시간을 골라 주세요.';
  }

  const weeklyHoursIntent = asInt(source.weeklyHoursIntent);
  if (weeklyHoursIntent == null || !WEEKLY_HOUR_OPTIONS.includes(weeklyHoursIntent)) {
    errors.weeklyHoursIntent = '한 주에 공부할 시간을 선택해 주세요.';
  }

  const slotRaw = asStringList(source.slots);
  /** @type {string[]} */
  const slots = [];
  /** @type {Record<string, number>} */
  const perDay = {};
  let slotsInvalid = false;
  for (const id of slotRaw) {
    const [day, start] = id.split('|');
    if (!day || !start || slots.includes(id)) {
      if (day && start && slots.includes(id)) continue;
      slotsInvalid = true;
      continue;
    }
    if (!availableDays.includes(day) || !isSlotOpen(day, start, leaveTime)) {
      slotsInvalid = true;
      continue;
    }
    perDay[day] = (perDay[day] || 0) + 1;
    if (dailyHours && perDay[day] > dailyHours * 2) {
      slotsInvalid = true;
      continue;
    }
    slots.push(id);
  }
  if (slotRaw.length === 0 || slots.length === 0) errors.slots = '공부할 시간을 시간표에서 칠해 주세요.';
  else if (slotsInvalid) errors.slots = '선택할 수 없는 시간이 포함되어 있어요. 시간표를 다시 확인해 주세요.';

  const commuteRaw = asStringList(source.commute);
  let commute = [];
  if (commuteRaw.length === 0) errors.commute = '등교 수단을 한 가지 이상 골라 주세요.';
  else if (commuteRaw.some((item) => !COMMUTE_OPTIONS.includes(item))) errors.commute = '등교 수단을 다시 선택해 주세요.';
  else commute = canonical(commuteRaw, COMMUTE_OPTIONS);

  const commuteMinutes = asInt(source.commuteMinutes);
  if (commuteMinutes == null || commuteMinutes < 1 || commuteMinutes > 180) {
    errors.commuteMinutes = '편도 시간을 1분에서 180분 사이로 입력해 주세요.';
  }

  const attendsAcademy = source.attendsAcademy;
  /** @type {{ subject: string, name: string }[]} */
  let academies = [];
  if (attendsAcademy !== true && attendsAcademy !== false) {
    errors.attendsAcademy = '학원에 다니는지를 선택해 주세요.';
  } else if (attendsAcademy === true) {
    const rows = Array.isArray(source.academies) ? source.academies : [];
    const filled = [];
    let partial = false;
    let badSubject = false;
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const subject = cleanText(/** @type {{ subject?: unknown }} */ (row).subject, 20);
      const academyName = cleanText(/** @type {{ name?: unknown }} */ (row).name, 40);
      if (!subject && !academyName) continue;
      if (!subject || !academyName) partial = true;
      if (subject && !ACADEMY_SUBJECTS.includes(subject)) badSubject = true;
      filled.push({ subject, name: academyName });
    }
    if (filled.length === 0) errors.academies = '다니는 학원의 과목과 이름을 적어 주세요.';
    else if (partial) errors.academies = '학원 과목과 이름을 모두 적어 주세요.';
    else if (badSubject) errors.academies = '학원 과목을 다시 선택해 주세요.';
    else if (filled.length > 8) errors.academies = '학원은 8개까지 적을 수 있어요.';
    else academies = filled;
  }

  const careerPath = source.careerPath === '진학' || source.careerPath === '취업' ? source.careerPath : '';
  if (!careerPath) errors.careerPath = '진학 또는 취업을 선택해 주세요.';

  const certSource = department || rawDepartment;
  const certAllowed = allowedCerts(DEPARTMENTS.includes(certSource) ? certSource : '');
  const certsHeldRaw = asStringList(source.certsHeld);
  const certsPlannedRaw = asStringList(source.certsPlanned);
  const certsOtherHeld = cleanText(source.certsOtherHeld, 80);
  const certsOtherPlanned = cleanText(source.certsOtherPlanned, 80);
  let certsHeld = [];
  let certsPlanned = [];
  if (careerPath === '취업') {
    if (certsHeldRaw.some((item) => !certAllowed.includes(item))) {
      errors.certsHeld = '자격증 목록을 다시 선택해 주세요.';
    } else certsHeld = certAllowed.filter((item) => certsHeldRaw.includes(item));
    if (certsPlannedRaw.some((item) => !certAllowed.includes(item))) {
      errors.certsPlanned = '따고 싶은 자격증을 다시 선택해 주세요.';
    } else certsPlanned = certAllowed.filter((item) => certsPlannedRaw.includes(item));
  }

  const programInterest = asInt(source.programInterest);
  if (programInterest == null || programInterest < 1 || programInterest > 5) {
    errors.programInterest = '프로그램 참여 의향을 선택해 주세요.';
  }

  const motivation = cleanText(source.motivation, 500);
  if (motivation.length < 5) errors.motivation = '입반 동기를 한 문장 이상 적어 주세요.';

  const weakSubject = typeof source.weakSubject === 'string' ? source.weakSubject : '';
  if (!WEAK_SUBJECTS.includes(weakSubject)) errors.weakSubject = '보완하고 싶은 과목을 골라 주세요.';
  const weakSubjectNote = cleanText(source.weakSubjectNote, 80);

  const currentStudyHours = typeof source.currentStudyHours === 'string' ? source.currentStudyHours : '';
  if (!CURRENT_STUDY.includes(currentStudyHours)) errors.currentStudyHours = '지금 하루 자습 시간을 골라 주세요.';

  const difficultyRaw = asStringList(source.studyDifficulties);
  let studyDifficulties = [];
  if (difficultyRaw.length === 0) errors.studyDifficulties = '공부할 때 어려운 점을 한 가지 이상 골라 주세요.';
  else if (difficultyRaw.some((item) => !DIFFICULTIES.includes(item))) {
    errors.studyDifficulties = '어려운 점을 다시 선택해 주세요.';
  } else studyDifficulties = canonical(difficultyRaw, DIFFICULTIES);
  const studyDifficultyNote = cleanText(source.studyDifficultyNote, 120);

  const goals = cleanText(source.goals, 500);
  if (goals.length < 5) errors.goals = '성적, 자격증, 진학 목표를 조금만 더 적어 주세요.';

  const wishRaw = asStringList(source.coachWishes);
  let coachWishes = [];
  if (wishRaw.length === 0) errors.coachWishes = '코치님께 바라는 점을 한 가지 이상 골라 주세요.';
  else if (wishRaw.some((item) => !COACH_WISHES.includes(item))) errors.coachWishes = '바라는 점을 다시 선택해 주세요.';
  else coachWishes = canonical(wishRaw, COACH_WISHES);
  const coachWishNote = cleanText(source.coachWishNote, 120);

  const phoneHabit = typeof source.phoneHabit === 'string' ? source.phoneHabit : '';
  if (!PHONE_HABITS.includes(phoneHabit)) errors.phoneHabit = '휴대폰 사용 습관을 골라 주세요.';

  const value = {
    name,
    grade,
    classNumber,
    department,
    availableDays,
    leaveTime,
    dailyHours,
    weeklyHoursIntent,
    slots,
    selectedHours: selectedHours(slots),
    commute,
    commuteMinutes,
    attendsAcademy: attendsAcademy === true,
    academies,
    careerPath,
    certsHeld,
    certsPlanned,
    certsOtherHeld: careerPath === '취업' ? certsOtherHeld : '',
    certsOtherPlanned: careerPath === '취업' ? certsOtherPlanned : '',
    programInterest,
    motivation,
    weakSubject,
    weakSubjectNote,
    currentStudyHours,
    studyDifficulties,
    studyDifficultyNote,
    goals,
    coachWishes,
    coachWishNote,
    phoneHabit,
  };

  return { errors, value };
}

/**
 * @param {unknown} body
 */
export function validateStep(step, body) {
  const { errors } = collectErrors(body);
  const fields = STEP_FIELDS[step] || [];
  /** @type {Record<string, string>} */
  const picked = {};
  for (const field of fields) {
    if (errors[field]) picked[field] = errors[field];
  }
  return picked;
}

/**
 * @param {Record<string, string>} errors
 */
export function firstInvalidStep(errors) {
  const keys = new Set(Object.keys(errors));
  for (let index = 0; index < STEP_FIELDS.length; index += 1) {
    if (STEP_FIELDS[index].some((field) => keys.has(field))) return index;
  }
  return 0;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, value: Record<string, any> } | { ok: false, errors: Record<string, string> }}
 */
export function validateApplication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { form: '신청 내용을 확인해 주세요.' } };
  }
  const { errors, value } = collectErrors(body);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value };
}
