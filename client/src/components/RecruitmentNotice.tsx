/** 학생 신청 첫 화면에 보여주는 현재 모집과 겨울방학 계획. */
export function RecruitmentNotice() {
  return (
    <section className="recruit" aria-label="모집 안내">
      <article className="recruit-card now">
        <header className="recruit-head">
          <p className="recruit-kicker">현재 모집</p>
          <p className="recruit-status live">모집 중</p>
        </header>
        <p className="recruit-figure">
          <span className="recruit-grade">
            1학년 <span>학생</span>
          </span>
          <strong>
            10<small>명</small>
          </strong>
        </p>
        <p className="recruit-line">
          <span className="recruit-badge">권장</span>
          겨울방학까지 이어서 학습하기를 원하는 학생일수록 환영합니다.
        </p>
      </article>

      <article className="recruit-card plan">
        <header className="recruit-head">
          <p className="recruit-kicker">겨울방학 학습자 모집 계획</p>
          <p className="recruit-status">예정</p>
        </header>
        <ul className="recruit-quotas">
          <li>
            <span>교내</span>
            <strong>
              25<small>명</small>
            </strong>
          </li>
          <li>
            <span>교외</span>
            <strong>
              20<small>명</small>
            </strong>
          </li>
        </ul>
        <p className="recruit-line">
          <span className="recruit-badge">우선권</span>
          예비 신입생(27&nbsp;신입생)은 교외 인원에 포함되며, 선발 시 우선권이 부여될 예정입니다.
        </p>
        <p className="recruit-follow">겨울방학 학습자 조사는 12월 초에 한 번 더 안내할 예정입니다.</p>
      </article>
    </section>
  );
}
