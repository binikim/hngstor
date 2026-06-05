/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Markdown from 'react-markdown';

const scopeHtml = (html: string) => {
  if (!html) return html;
  return html.replace(/<style>([\s\S]*?)<\/style>/gi, (match, css) => {
    let scopedCss = css;
    scopedCss = scopedCss.replace(/\bbody\b/g, '.markdown-body');
    scopedCss = scopedCss.replace(/\bhtml\b/g, '.markdown-body');
    const tags = [
      'h1', 'h2', 'p', 'ul', 'ol', 'li', 'table', 'th', 'td', 'a', 'strong',
      'footer', 'header', 'section', 'nav'
    ];
    tags.forEach(tag => {
      const regex = new RegExp(`(^|\\s|\\,|\\{)(${tag})([\\s\\,\\{])`, 'g');
      scopedCss = scopedCss.replace(regex, `$1.markdown-body $2$3`);
    });
    return `<style>${scopedCss}</style>`;
  });
};

export default function PrivacyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, 'siteContent', 'privacy');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching privacy content:", error);
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

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-8">
          <div className="w-16 h-16 bg-success/10 text-success rounded-2xl flex items-center justify-center">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">
              {data?.title || '개인정보처리방침'}
            </h1>
            <p className="text-on-surface-variant text-sm">귀하의 프라이버시는 우리의 최우선 가치입니다.</p>
          </div>
        </div>

        <div className="space-y-10 text-on-surface-variant leading-relaxed">
          {data ? (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: scopeHtml(data.content) }} />
          ) : (
            <>
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex gap-4">
                 <EyeOff className="text-primary shrink-0" size={24} />
                 <div>
                   <h3 className="font-bold text-on-surface mb-2">프라이버시 중심 정책</h3>
                   <p className="text-sm">핑크버튼는 불필요한 개인정보를 수집하지 않으며, 수집된 정보는 주문 및 배송 목적 외에 절대 사용하지 않습니다.</p>
                 </div>
              </div>

              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">1. 수집하는 개인정보 항목</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>필수항목: 이름, 이메일, 휴대전화번호, 배송지 주소</li>
                  <li>자동수집: IP주소, 쿠키, 서비스 이용기록</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">2. 개인정보의 이용목적</h2>
                <p>수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</li>
                  <li>회원 관리 (본인인증, 고지사항 전달 등)</li>
                  <li>주문 결제 및 상품 배송</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">3. 개인정보의 보유 및 이용기간</h2>
                <p>원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령에 의해 보존할 필요가 있는 경우 일정 기간 보존합니다.</p>
              </section>

              <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h3 className="font-bold text-primary mb-2">데이터 보안 조치</h3>
                <p className="text-sm">모든 정보 전송은 SSL 암호화 통신을 통해 관리되며, 데이터베이스 접근 권한은 최소한의 관리자로 엄격히 제한됩니다.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
