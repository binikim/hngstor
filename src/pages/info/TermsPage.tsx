/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldAlert } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Markdown from 'react-markdown';

const scopeHtml = (html: string) => {
  if (!html) return html;
  return html.replace(/<style>([\s\S]*?)<\/style>/gi, (match, css) => {
    let scopedCss = css;
    scopedCss = scopedCss.replace(/\bbody\b/g, '.markdown-body');
    scopedCss = scopedCss.replace(/\bhtml\b/g, '.markdown-body');
    const tags = ['h1', 'h2', 'p', 'ul', 'li', 'table', 'th', 'td', 'a', 'strong'];
    tags.forEach(tag => {
      const regex = new RegExp(`(^|\\s|\\,|\\{)(${tag})([\\s\\,\\{])`, 'g');
      scopedCss = scopedCss.replace(regex, `$1.markdown-body $2$3`);
    });
    return `<style>${scopedCss}</style>`;
  });
};

export default function TermsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, 'siteContent', 'terms');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching terms content:", error);
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
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">
              {data?.title || '이용약관'}
            </h1>
            <p className="text-on-surface-variant text-sm">
              {data?.updatedAt ? `최종 수정일: ${data.updatedAt.toDate().toLocaleDateString()}` : '최종 수정일: 2024년 4월 17일'}
            </p>
          </div>
        </div>

        <div className="space-y-10 text-on-surface-variant leading-relaxed">
          {data ? (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: scopeHtml(data.content) }} />
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">제1조 (목적)</h2>
                <p>이 약관은 핑크버튼가 운영하는 인터넷 쇼핑몰(이하 '몰')에서 제공하는 관련 서비스(이하 '서비스')를 이용함에 있어 몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">제2조 (이용자의 자격 및 제한)</h2>
                <div className="bg-error/5 p-4 rounded-xl border border-error/10 flex gap-3 mb-4">
                  <ShieldAlert className="text-error shrink-0" size={20} />
                  <p className="text-sm font-bold text-error">핑크버튼는 만 19세 이상의 성인만을 대상으로 서비스를 제공합니다. 청소년의 이용은 엄격히 제한됩니다.</p>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>회원가입 시 본인인증을 통한 성인 여부 확인이 필수적입니다.</li>
                  <li>타인의 명의를 도용하거나 허위 정보를 입력한 경우 서비스 이용이 즉시 정지됩니다.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-on-surface mb-4">제3조 (서비스의 제공 및 변경)</h2>
                <p>몰은 다음의 업무를 수행합니다.</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
                  <li>구매계약이 체결된 재화 또는 용역의 배송</li>
                  <li>기타 몰이 정하는 업무</li>
                </ol>
              </section>

              <section className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-xs">※ 본 내용은 요약된 전문의 일부입니다. 상세한 법적 권리에 대해서는 고객센터로 문의해 주시기 바랍니다.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
