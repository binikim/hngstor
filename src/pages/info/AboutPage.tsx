/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Info, Target, Heart, Shield } from 'lucide-react';
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

export default function AboutPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const docRef = doc(db, 'siteContent', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching about content:", error);
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
      <div className="max-w-4xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-headline font-bold">
            {data?.title || 'About 핑크버튼'}
          </h1>
          {!data && (
            <p className="text-xl text-on-surface-variant font-light">
              우리는 당신의 가장 아름답고 사적인 순간을 디자인합니다.
            </p>
          )}
        </motion.div>

        {data ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-on-surface max-w-none prose-p:text-on-surface-variant prose-headings:font-headline prose-headings:font-bold"
          >
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: scopeHtml(data.content) }} />
          </motion.div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <h2 className="text-2xl font-headline font-bold">우리의 미션</h2>
                <p className="text-on-surface-variant leading-relaxed">
                  핑크버튼는 성에 대한 건강하고 당당한 담론을 지향합니다. 
                  단순히 제품을 판매하는 것을 넘어, 성적 취향의 다양성을 존중하고 
                  모든 개인이 자신의 감각에 집중할 수 있는 환경을 만듭니다.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center">
                  <Heart size={24} />
                </div>
                <h2 className="text-2xl font-headline font-bold">우리의 가치</h2>
                <p className="text-on-surface-variant leading-relaxed">
                  고객의 경험(User Experience)을 최우선으로 생각합니다. 
                  엄선된 품질의 브랜드만을 큐레이션하여 
                  안전하고 세련된 라이프스타일을 제안합니다.
                </p>
              </div>
            </section>

            <section className="bg-surface-container-low p-8 md:p-12 rounded-3xl border border-outline-variant/10">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-3">
                  <Shield className="text-primary" /> 철저한 프라이버시 보호
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  성인용품 구매 시 걱정되는 프라이버시 문제를 완벽하게 해결합니다. 
                  송장에는 '생활잡화' 또는 '의류'로 표기되며, 
                  외부에서 내용을 전혀 알 수 없도록 3중 안전 포장을 원칙으로 합니다.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-bold">
                  <div className="p-4 bg-surface-container-high rounded-xl text-center">3중 비밀 포장</div>
                  <div className="p-4 bg-surface-container-high rounded-xl text-center">안심 송장 표기</div>
                  <div className="p-4 bg-surface-container-high rounded-xl text-center">당일 안심 배송</div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
