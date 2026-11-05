export type Grade = '27 신입생' | '고1' | '고2';
export type Department = '기계과' | '전기과' | '화공과' | '전자과';
export type CareerPath = '진학' | '취업';

export interface AcademyEntry {
  id: string;
  subject: string;
  name: string;
}

export interface FormState {
  name: string;
  grade: Grade | '';
  classNumber: number | null;
  department: Department | '';
  availableDays: string[];
  leaveTime: string;
  dailyHours: number | null;
  weeklyHoursIntent: number | null;
  slots: string[];
  commute: string[];
  commuteMinutes: number | null;
  attendsAcademy: boolean | null;
  academies: AcademyEntry[];
  careerPath: CareerPath | '';
  certsHeld: string[];
  certsPlanned: string[];
  certsOtherHeld: string;
  certsOtherPlanned: string;
  programInterest: number | null;
  motivation: string;
  weakSubject: string;
  weakSubjectNote: string;
  currentStudyHours: string;
  studyDifficulties: string[];
  studyDifficultyNote: string;
  goals: string;
  coachWishes: string[];
  coachWishNote: string;
  phoneHabit: string;
}

export interface Submission {
  id: string;
  createdAt: string;
  name: string;
  grade: string;
  classNumber: number | null;
  department: string;
  availableDays: string[];
  leaveTime: string;
  dailyHours: number;
  weeklyHoursIntent: number;
  slots: string[];
  selectedHours: number;
  commute: string[];
  commuteMinutes: number;
  attendsAcademy: boolean;
  academies: { subject: string; name: string }[];
  careerPath: string;
  certsHeld: string[];
  certsPlanned: string[];
  certsOtherHeld: string;
  certsOtherPlanned: string;
  programInterest: number;
  motivation: string;
  weakSubject: string;
  weakSubjectNote: string;
  currentStudyHours: string;
  studyDifficulties: string[];
  studyDifficultyNote: string;
  goals: string;
  coachWishes: string[];
  coachWishNote: string;
  phoneHabit: string;
}

export interface CountItem {
  label: string;
  count: number;
}

export interface Stats {
  total: number;
  avgSelectedHours: number;
  avgIntentHours: number;
  byGrade: CountItem[];
  byDepartment: CountItem[];
  weeklyHours: CountItem[];
  intentHours: CountItem[];
  byCareer: CountItem[];
  programInterest: CountItem[];
  heatmap: {
    days: string[];
    times: string[];
    matrix: (number | null)[][];
  };
}

export const initialForm: FormState = {
  name: '',
  grade: '',
  classNumber: null,
  department: '',
  availableDays: [],
  leaveTime: '',
  dailyHours: null,
  weeklyHoursIntent: null,
  slots: [],
  commute: [],
  commuteMinutes: null,
  attendsAcademy: null,
  academies: [{ id: 'a1', subject: '', name: '' }],
  careerPath: '',
  certsHeld: [],
  certsPlanned: [],
  certsOtherHeld: '',
  certsOtherPlanned: '',
  programInterest: null,
  motivation: '',
  weakSubject: '',
  weakSubjectNote: '',
  currentStudyHours: '',
  studyDifficulties: [],
  studyDifficultyNote: '',
  goals: '',
  coachWishes: [],
  coachWishNote: '',
  phoneHabit: '',
};
