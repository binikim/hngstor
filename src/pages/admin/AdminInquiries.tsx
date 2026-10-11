import React, { useEffect, useState } from 'react';
import { CheckCircle2, Inbox, Pencil, Save, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'resolved';
  createdAt: string;
}

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')), (snapshot) => {
      setItems(snapshot.docs.map((item: any) => ({ id: item.id, ...item.data() })) as Inquiry[]);
    }, (err) => setError(err.message || '문의 목록을 불러오지 못했습니다.'));
    return unsubscribe;
  }, []);

  const setStatus = async (item: Inquiry) => {
    setError('');
    try {
      await updateDoc(doc(db, 'inquiries', item.id), { status: item.status === 'new' ? 'resolved' : 'new' });
    } catch (err: any) {
      setError(err.message || '문의 상태 변경에 실패했습니다.');
    }
  };

  const saveInquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setError('');
    setSaving(true);
    try {
      await updateDoc(doc(db, 'inquiries', editing.id), {
        name: editing.name.trim(),
        email: editing.email.trim(),
        subject: editing.subject.trim(),
        message: editing.message.trim()
      });
      setEditing(null);
    } catch (err: any) {
      setError(err.message || '문의 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const removeInquiry = async (item: Inquiry) => {
    if (!window.confirm('이 문의를 삭제할까요? 삭제한 문의는 복구할 수 없습니다.')) return;
    setError('');
    try {
      await deleteDoc(doc(db, 'inquiries', item.id));
    } catch (err: any) {
      setError(err.message || '문의 삭제에 실패했습니다.');
    }
  };

  return <section className="space-y-6">
    <header className="flex items-center gap-3"><Inbox className="text-primary" /><h2 className="text-2xl font-bold">고객 문의</h2><span className="text-sm text-on-surface-variant">미확인 {items.filter(item => item.status === 'new').length}건</span></header>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {items.length === 0 && !error ? <p className="rounded-2xl bg-surface-container-low p-8 text-center text-on-surface-variant">접수된 문의가 없습니다.</p> : items.length > 0 ? <div className="space-y-4">
      {items.map(item => <article key={item.id} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><span className={`mr-2 rounded-full px-3 py-1 text-xs font-bold ${item.status === 'new' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-800'}`}>{item.status === 'new' ? '미확인' : '확인 완료'}</span><strong>{item.subject}</strong></div><span className="text-xs text-on-surface-variant">{item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : ''}</span></div>
        <p className="text-sm">{item.name} · <a className="text-primary underline" href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a></p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.message}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus(item)} className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-sm font-semibold hover:bg-surface-container-highest"><CheckCircle2 size={16} />{item.status === 'new' ? '확인 처리' : '미확인으로 되돌리기'}</button>
          <button onClick={() => { setError(''); setEditing({ ...item }); }} className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-sm font-semibold hover:bg-surface-container-highest"><Pencil size={16} />수정</button>
          <button onClick={() => removeInquiry(item)} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"><Trash2 size={16} />삭제</button>
        </div>
      </article>)}
    </div> : null}
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditing(null); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="edit-inquiry-title" onSubmit={saveInquiry} className="w-full max-w-xl space-y-5 rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between"><h3 id="edit-inquiry-title" className="text-xl font-bold">문의 수정</h3><button type="button" aria-label="닫기" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg p-2 hover:bg-surface-container-high"><X size={20} /></button></div>
        <label className="block space-y-2 text-sm font-semibold">성함<input required value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-normal" /></label>
        <label className="block space-y-2 text-sm font-semibold">이메일<input required type="email" value={editing.email} onChange={event => setEditing({ ...editing, email: event.target.value })} className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-normal" /></label>
        <label className="block space-y-2 text-sm font-semibold">문의 분류<input required value={editing.subject} onChange={event => setEditing({ ...editing, subject: event.target.value })} className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-normal" /></label>
        <label className="block space-y-2 text-sm font-semibold">문의 내용<textarea required rows={6} value={editing.message} onChange={event => setEditing({ ...editing, message: event.target.value })} className="w-full resize-y rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-normal" /></label>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-xl bg-surface-container-high px-4 py-3 font-semibold">취소</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-on-primary disabled:opacity-50"><Save size={16} />{saving ? '저장 중…' : '변경 사항 저장'}</button></div>
      </form>
    </div>}
  </section>;
}
