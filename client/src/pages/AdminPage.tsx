import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { DEPARTMENTS, GRADES, formatHours, scheduleSummary } from '@shared/domain.js';
import { adminLogin, adminLogout, adminMe, downloadCsv, fetchAdminData } from '../api';
import { Backdrop, Footer, Header } from '../components/Chrome';
import type { Stats, Submission } from '../types';
import { Charts } from './Charts';

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [shake, setShake] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('전체');
  const [department, setDepartment] = useState('전체');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoadError('');
    try {
      const data = await fetchAdminData();
      if (!data) {
        setAuthed(false);
        return;
      }
      setSubmissions(data.submissions);
      setStats(data.stats);
      setAuthed(true);
    } catch {
      setLoadError('신청 목록을 불러오지 못했어요.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          setAuthed(false);
          return;
        }
        return load();
      })
      .catch(() => {
        if (!cancelled) {
          setAuthed(false);
          setLoadError('서버에 연결하지 못했어요.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () =>
      submissions.filter((item) => {
        const matchesQuery = item.name.includes(query.trim());
        const matchesGrade = grade === '전체' || item.grade === grade;
        const matchesDept = department === '전체' || item.department === department;
        return matchesQuery && matchesGrade && matchesDept;
      }),
    [submissions, query, grade, department],
  );

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLoginError('');
    try {
      const result = await adminLogin(password);
      if (!result.ok) {
        setLoginError(result.error || '비밀번호가 맞지 않아요.');
        setShake((count) => count + 1);
        setBusy(false);
        return;
      }
      setPassword('');
      await load();
    } catch {
      setLoginError('서버에 연결하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Backdrop />
      <div className="shell shell-wide">
        <Header wide />
        {authed === null && <p className="card">명단을 확인하고 있어요…</p>}
        {authed === false && (
          <form className={shake ? 'card login-card shake' : 'card login-card'} onSubmit={onLogin} key={shake} data-testid="admin-login">
            <h2>관리자</h2>
            <p className="lead">신청 명단은 비밀번호로 보호됩니다.</p>
            <label className="field">
              <span className="legend-like">비밀번호</span>
              <input
                className="text-input"
                type="password"
                autoComplete="current-password"
                value={password}
                data-testid="admin-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {loginError && (
              <p className="field-error" role="alert">
                {loginError}
              </p>
            )}
            <button type="submit" className="btn primary" disabled={busy} data-testid="admin-submit">
              {busy ? '확인 중…' : '들어가기'}
            </button>
          </form>
        )}
        {authed && stats && (
          <>
            <div className="admin-bar">
              <button type="button" className="btn ghost" onClick={() => void load()}>
                새로고침
              </button>
              <button
                type="button"
                className="btn primary"
                data-testid="csv-download"
                onClick={() => {
                  void downloadCsv().then((ok) => {
                    if (!ok) setAuthed(false);
                  });
                }}
              >
                CSV 내려받기
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  void adminLogout().then(() => {
                    setAuthed(false);
                    setStats(null);
                    setSubmissions([]);
                  });
                }}
              >
                로그아웃
              </button>
            </div>
            <div className="stat-grid">
              <article className="stat">
                <span>총 신청</span>
                <strong data-testid="stat-total">{stats.total}</strong>
              </article>
              <article className="stat">
                <span>평균 선택</span>
                <strong>{formatHours(stats.avgSelectedHours)}</strong>
              </article>
              <article className="stat">
                <span>평균 희망</span>
                <strong>{formatHours(stats.avgIntentHours)}</strong>
              </article>
              <article className="stat">
                <span>진학 / 취업</span>
                <strong>
                  {stats.byCareer.find((item) => item.label === '진학')?.count ?? 0} /{' '}
                  {stats.byCareer.find((item) => item.label === '취업')?.count ?? 0}
                </strong>
              </article>
            </div>
            <Charts stats={stats} />
            <section className="card">
              <div className="filters">
                <h3>신청 명단</h3>
                <input
                  className="text-input"
                  placeholder="이름 검색"
                  value={query}
                  data-testid="admin-search"
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select className="text-input" value={grade} onChange={(event) => setGrade(event.target.value)}>
                  <option>전체</option>
                  {GRADES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select className="text-input" value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option>전체</option>
                  {DEPARTMENTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              {shown.length === 0 ? (
                <div className="empty-state">
                  <p>조건에 맞는 신청이 없습니다.</p>
                </div>
              ) : (
                <ul className="sub-list">
                  {shown.map((item) => {
                    const open = openId === item.id;
                    const when = new Date(item.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
                    return (
                      <li key={item.id} className={open ? 'sub-card open' : 'sub-card'} data-testid="submission-card">
                        <button type="button" className="sub-summary" onClick={() => setOpenId(open ? null : item.id)}>
                          <span className="receipt-pill">{item.id}</span>
                          <strong>{item.name}</strong>
                          <span>
                            {item.grade}
                            {item.classNumber ? ` ${item.classNumber}반` : ''} · {item.department}
                          </span>
                          <span>{formatHours(item.selectedHours)}</span>
                          <span>{when}</span>
                        </button>
                        {open && <SubmissionDetail item={item} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
        {loadError && (
          <p className="banner" role="alert">
            {loadError}
          </p>
        )}
        <Footer />
      </div>
    </>
  );
}

function SubmissionDetail({ item }: { item: Submission }) {
  const ranges = scheduleSummary(item.slots || []);
  return (
    <div className="sub-detail">
      <p>
        귀가 {item.leaveTime} · 하루 {item.dailyHours}시간 · 희망 {item.weeklyHoursIntent}시간 · 참여{' '}
        {(item.availableDays || []).join(' ')}
      </p>
      <p>{ranges.map((day) => `${day.day} ${day.ranges.map((range) => `${range.start}-${range.end}`).join(', ')}`).join(' · ')}</p>
      <p>
        등교 {(item.commute || []).join(', ')} · {item.commuteMinutes}분 · {item.attendsAcademy ? '학원 다님' : '학원 안 다님'}
      </p>
      {item.attendsAcademy && <p>{(item.academies || []).map((academy) => `${academy.subject} ${academy.name}`).join(' / ')}</p>}
      <p>
        진로 {item.careerPath}
        {item.careerPath === '취업' &&
          ` · 취득 ${[...(item.certsHeld || []), item.certsOtherHeld].filter(Boolean).join(', ') || '없음'} · 계획 ${
            [...(item.certsPlanned || []), item.certsOtherPlanned].filter(Boolean).join(', ') || '없음'
          }`}
      </p>
      <p>프로그램 참여 {item.programInterest}점</p>
      <p>동기: {item.motivation}</p>
      <p>
        보완: {item.weakSubject} {item.weakSubjectNote} · 현재 자습 {item.currentStudyHours}
      </p>
      <p>
        어려운 점: {(item.studyDifficulties || []).join(', ')} {item.studyDifficultyNote}
      </p>
      <p>목표: {item.goals}</p>
      <p>
        코치님께: {(item.coachWishes || []).join(', ')} {item.coachWishNote}
      </p>
      <p>휴대폰: {item.phoneHabit}</p>
    </div>
  );
}
