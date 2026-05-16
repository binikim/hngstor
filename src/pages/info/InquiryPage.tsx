/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Markdown from 'react-markdown';

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, 'siteContent', 'inquiry');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching inquiry content:", error);
      } finally {
        setPageLoading(false);
      }
    }
    fetchContent();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-tight">
            {data?.title || '문의하기'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-lg mx-auto leading-relaxed">
            제품, 배송, 대량 구매 등 궁금하신 사항을 남겨주시면 <br />
            담당자가 확인 후 빠르게 답변해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* 왼쪽 이미지 */}
          <div className="w-full h-full min-h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80"
              alt="Inquiry"
              className="w-full h-full object-cover rounded-2xl shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* 오른쪽 컨텐츠 */}
          <div className="space-y-8">
            {/* 안내 문구 (Admin에서 작성한 내용) - 잘못된 HTML 코드가 있으면 숨김 */}
            {data?.content && typeof data.content === 'string' && !data.content.toLowerCase().includes('<style') && !data.content.toLowerCase().includes('<!doctype') && (
              <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 text-sm text-on-surface-variant leading-relaxed shadow-sm">
                {data.content.split('\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 group cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Mail size={24} />
                </div>
                <h3 className="font-bold text-on-surface mb-1">이메일 문의</h3>
                <p className="text-sm font-medium text-on-surface-variant">support@hng.com</p>
                <p className="text-xs text-on-surface-variant/60 mt-2">24시간 접수 가능<br/>운영 시간 내 순차적 답변</p>
              </div>

              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 group cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={24} />
                </div>
                <h3 className="font-bold text-on-surface mb-1">고객 센터</h3>
                <p className="text-sm font-medium text-on-surface-variant">010-0000-0000</p>
                <p className="text-xs text-on-surface-variant/60 mt-2">평일 10:00 - 18:00<br/>점심 12:00 - 13:00</p>
              </div>
            </div>

            {/* 문의 폼 */}
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-12 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-bold">전송 완료</h3>
                    <p className="text-on-surface-variant">문의하신 내용이 성공적으로 접수되었습니다. <br /> 평일 24시간 이내에 답변드리겠습니다.</p>
                  </div>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-primary font-bold hover:underline"
                  >
                    추가 문의하기
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold px-1">성함</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold px-1">연락처</label>
                      <input 
                        required
                        type="tel" 
                        className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold px-1">이메일</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold px-1">문의 내용</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                      placeholder="문의하실 내용을 상세히 적어주세요."
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} /> 문의 보내기
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
