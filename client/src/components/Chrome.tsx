import { Link, useLocation } from 'react-router-dom';
import { SCHOOL } from '@shared/domain.js';

export function Backdrop() {
  return <div className="backdrop" aria-hidden="true" />;
}

export function Header({ wide = false }: { wide?: boolean }) {
  return (
    <header className="topbar">
      <p className="eyebrow">{SCHOOL.short}</p>
      <h1 className="brand-title" tabIndex={-1}>
        {wide ? '신청 현황' : '입반 신청'}
      </h1>
      <p className="brand-sub">{SCHOOL.room}</p>
    </header>
  );
}

export function Footer() {
  const location = useLocation();
  const onAdmin = location.pathname.startsWith('/admin');
  return (
    <footer className="site-footer">
      <p>제출한 내용은 입반 상담과 학습실 운영에만 사용합니다.</p>
      {onAdmin ? <Link to="/">신청서로 돌아가기</Link> : <Link to="/admin">관리자</Link>}
    </footer>
  );
}
