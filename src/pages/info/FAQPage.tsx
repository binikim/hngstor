/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_FAQS = [
  {
    question: "배송은 어떻게 되나요? 상표가 표기되나요?",
    answer: "H&G스토아는 고객님의 프라이버시를 위해 송장에 '생활잡화' 또는 '의류' 등으로 모호하게 표기하며, 내용물을 알 수 없도록 검은색 비닐이나 박스로 이중/삼중 포장하여 발송합니다."
  },
  {
    question: "주문 후 언제쯤 받을 수 있나요?",
    answer: "평일 오후 4시 이전 주문 건은 당일 발송을 원칙으로 합니다. 대부분의 경우 발송 다음 날 수령 가능하나, 택배사 사정에 따라 1~2일 정도 더 소요될 수 있습니다."
  },
  {
    question: "제품이 고장 난 것 같아요. AS가 가능한가요?",
    answer: "브랜드별 규정에 따라 구매 후 일정 기간 내 발생한 기기 결함에 대해서는 교환 또는 무상 수리를 지원합니다. 고객센터로 주문번호와 증상 영상을 보내주시면 신속히 안내해 드리겠습니다."
  },
  {
    question: "비밀번호를 잊어버렸어요.",
    answer: "로그인 페이지 하단의 '비밀번호를 잊으셨나요?' 링크를 통해 가입하신 이메일로 비밀번호 재설정 링크를 받으실 수 있습니다."
  },
  {
    question: "이미 주문했는데 주소를 바꿀 수 있나요?",
    answer: "상품 준비 중 단계에서는 변경이 가능합니다. 단, 이미 발송 처리된 이후에는 주소 변경이 불가능하며 반품 비용이 발생할 수 있으니 고객센터로 즉시 문의해 주세요."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, 'siteContent', 'faq');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFaqs(data.content || []);
          setTitle(data.title || '');
        } else {
          setFaqs(DEFAULT_FAQS);
        }
      } catch (error) {
        console.error("Error fetching faq content:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const items = Array.isArray(faqs) && faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl font-headline font-bold uppercase tracking-tight">
            {title || '자주 묻는 질문'}
          </h1>
          <p className="text-on-surface-variant font-light">가장 많이 문의하시는 내용들을 모았습니다.</p>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => (
            <div 
              key={index}
              className="bg-surface-container-low border border-outline-variant/10 rounded-2xl overflow-hidden"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between group"
              >
                <span className="font-bold text-lg group-hover:text-primary transition-colors">{faq.question}</span>
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="px-6 pb-6 text-on-surface-variant leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-low rounded-3xl p-10 text-center border border-dashed border-outline-variant/30">
          <p className="text-on-surface-variant mb-6 text-sm">원하시는 답변을 찾지 못하셨나요?</p>
          <Link to="/inquiry" className="inline-flex items-center gap-2 bg-on-surface text-surface px-8 py-3 rounded-xl font-bold hover:bg-on-surface/80 transition-all">
            1:1 문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
