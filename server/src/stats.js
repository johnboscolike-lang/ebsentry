import { DAYS, DEPARTMENTS, GRADES, allRowStarts, isKnownSlot, parseSlotId } from '../../shared/domain.js';

const HOUR_BUCKETS = [
  { label: '0–4시간', test: (hours) => hours <= 4 },
  { label: '5–8시간', test: (hours) => hours > 4 && hours <= 8 },
  { label: '9–12시간', test: (hours) => hours > 8 && hours <= 12 },
  { label: '13–16시간', test: (hours) => hours > 12 && hours <= 16 },
  { label: '17시간+', test: (hours) => hours > 16 },
];

/**
 * @param {number[]} values
 * @param {(hours: number) => boolean} test
 */
function bucketCount(values, test) {
  return values.filter((value) => test(Number(value) || 0)).length;
}

/**
 * @param {number[]} values
 */
function average(values) {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  return Math.round((total / values.length) * 10) / 10;
}

/**
 * @param {Record<string, any>[]} applications
 */
export function summarize(applications) {
  const selected = applications.map((item) => Number(item.selectedHours) || 0);
  const intent = applications.map((item) => Number(item.weeklyHoursIntent) || 0);
  const times = allRowStarts();
  const days = DAYS.map((day) => day.key);
  const matrix = times.map((start) => days.map((day) => (isKnownSlot(day, start) ? 0 : null)));
  const timeIndex = new Map(times.map((time, index) => [time, index]));
  const dayIndex = new Map(days.map((day, index) => [day, index]));

  for (const application of applications) {
    for (const id of application.slots || []) {
      const { day, start } = parseSlotId(id);
      const row = timeIndex.get(start);
      const column = dayIndex.get(day);
      if (row == null || column == null || matrix[row][column] == null) continue;
      matrix[row][column] += 1;
    }
  }

  const countBy = (key, labels) =>
    labels.map((label) => ({
      label,
      count: applications.filter((item) => item[key] === label).length,
    }));

  return {
    total: applications.length,
    avgSelectedHours: average(selected),
    avgIntentHours: average(intent),
    byGrade: countBy('grade', GRADES),
    byDepartment: countBy('department', DEPARTMENTS),
    weeklyHours: HOUR_BUCKETS.map((bucket) => ({ label: bucket.label, count: bucketCount(selected, bucket.test) })),
    intentHours: HOUR_BUCKETS.map((bucket) => ({ label: bucket.label, count: bucketCount(intent, bucket.test) })),
    byCareer: countBy('careerPath', ['진학', '취업']),
    programInterest: [1, 2, 3, 4, 5].map((level) => ({
      label: `${level}점`,
      count: applications.filter((item) => Number(item.programInterest) === level).length,
    })),
    heatmap: { days, times, matrix },
  };
}
