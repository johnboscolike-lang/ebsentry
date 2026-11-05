import { useState } from 'react';

export function Success({ id, onReset }: { id: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="success" data-testid="success">
      <section className="receipt">
        <p className="eyebrow">접수 완료</p>
        <h2>신청이 접수되었습니다</h2>
        <p>확인 후 상담 안내를 드립니다. 접수번호를 보관해 주세요.</p>
        <p className="receipt-id" data-testid="success-id">
          {id}
        </p>
        <button
          type="button"
          className="btn ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(id);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? '복사됨' : '접수번호 복사'}
        </button>
      </section>
      <button type="button" className="btn primary" onClick={onReset}>
        새 신청서 작성
      </button>
    </div>
  );
}
