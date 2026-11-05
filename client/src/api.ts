import type { FormState, Stats, Submission } from './types';

async function readBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function submitApplication(form: FormState) {
  let res: Response;
  try {
    res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
  } catch {
    return { ok: false as const, errors: { form: '네트워크에 연결하지 못했어요. 잠시 후 다시 눌러 주세요.' } };
  }
  const data = await readBody(res);
  if (!res.ok) {
    const errors =
      data.errors && typeof data.errors === 'object'
        ? (data.errors as Record<string, string>)
        : { form: typeof data.error === 'string' ? data.error : '제출에 실패했어요.' };
    return { ok: false as const, errors };
  }
  return { ok: true as const, id: String(data.id), createdAt: String(data.createdAt) };
}

export async function adminLogin(password: string) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await readBody(res);
  return { ok: res.ok, status: res.status, error: typeof data.error === 'string' ? data.error : '' };
}

export async function adminLogout() {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
}

export async function adminMe() {
  const res = await fetch('/api/admin/me', { credentials: 'include' });
  return res.ok;
}

export async function fetchAdminData(): Promise<{ submissions: Submission[]; stats: Stats } | null> {
  const [subRes, statsRes] = await Promise.all([
    fetch('/api/admin/submissions', { credentials: 'include' }),
    fetch('/api/admin/stats', { credentials: 'include' }),
  ]);
  if (subRes.status === 401 || statsRes.status === 401) return null;
  if (!subRes.ok || !statsRes.ok) throw new Error('load failed');
  const submissions = (await subRes.json()) as { submissions: Submission[] };
  const stats = (await statsRes.json()) as Stats;
  return { submissions: submissions.submissions, stats };
}

export async function downloadCsv() {
  const res = await fetch('/api/admin/export.csv', { credentials: 'include' });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error('csv failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ebs-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
