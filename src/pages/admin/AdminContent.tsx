/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Save, Info, Plus, Trash2, HelpCircle, FileText, Shield, FileCheck, MessageCircle, LayoutDashboard, Building2, Grid, MoveUp, MoveDown, Upload, CreditCard } from 'lucide-react';

interface SiteContent {
  id: string;
  title: string;
  content: any;
  updatedAt: any;
}

const PAGE_KEYS = [
  { id: 'home', label: '메인 페이지', icon: LayoutDashboard },
  { id: 'categories', label: '카테고리 관리', icon: Grid },
  { id: 'footer', label: '하단 정보 (푸터)', icon: Building2 },
  { id: 'bank', label: '무통장 정보 변경', icon: CreditCard },
  { id: 'info', label: '정보 페이지 (회사/약관)', icon: Info },
  { id: 'support', label: '고객센터 (FAQ/문의)', icon: HelpCircle },
];

export default function AdminContent() {
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>('');
  const [title, setTitle] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Reset content type immediately based on new activePage to prevent map errors
    if (activePage === 'support') {
      setContent({ faq: [], inquiry: '' });
    } else if (activePage === 'info') {
      setContent({ about: '', terms: '', privacy: '' });
    } else if (activePage === 'home') {
      setContent({
        heroTitle: '',
        heroSubtitle: '',
        heroImage: '',
        philosophyTitle: '',
        philosophySubtitle: '',
        philosophyImage: '',
        categoriesTitle: '',
        categoriesSubtitle: '',
        productsTitle: '',
        featuredProductIds: []
      });
    } else if (activePage === 'categories') {
      setContent([]);
    } else if (activePage === 'footer') {
      setContent({
        logoText: '',
        copyrightText: '',
        businessNumber: '',
        ceo: '',
        phone: '',
        address: '',
        extraFields: []
      });
    } else if (activePage === 'bank') {
      setContent({
        bankName: '',
        accountNumber: '',
        accountHolder: ''
      });
    } else {
      setContent('');
    }
    fetchContent();
  }, [activePage]);

  async function fetchContent() {
    setLoading(true);
    try {
      if (activePage === 'info') {
        const [aboutSnap, termsSnap, privacySnap] = await Promise.all([
          getDoc(doc(db, 'siteContent', 'about')),
          getDoc(doc(db, 'siteContent', 'terms')),
          getDoc(doc(db, 'siteContent', 'privacy'))
        ]);
        setContent({
          about: aboutSnap.exists() ? aboutSnap.data().content : `핑크버튼는 성에 대한 건강하고 당당한 담론을 지향합니다. \n단순히 제품을 판매하는 것을 넘어, 성적 취향의 다양성을 존중하고 모든 개인이 자신의 감각에 집중할 수 있는 환경을 만듭니다.`,
          terms: termsSnap.exists() ? termsSnap.data().content : `이 약관은 핑크버튼가 운영하는 쇼핑몰 서비스를 이용함에 있어 몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
          privacy: privacySnap.exists() ? privacySnap.data().content : `핑크버튼는 귀하의 프라이버시를 소중히 여깁니다. 수집된 정보는 배송 및 고객 응대 목적으로만 활용됩니다.`,
        });
        setTitle('정보 페이지 관리');
      } else if (activePage === 'support') {
        const [faqSnap, inquirySnap] = await Promise.all([
          getDoc(doc(db, 'siteContent', 'faq')),
          getDoc(doc(db, 'siteContent', 'inquiry'))
        ]);
        setContent({
          faq: faqSnap.exists() ? faqSnap.data().content : [{ question: '배송 기간은 얼마나 걸리나요?', answer: '보통 전 지역 1~2일 이내 배송됩니다.' }],
          inquiry: inquirySnap.exists() ? inquirySnap.data().content : `평일: 10:00 - 18:00\n점심: 12:00 - 13:00\n이메일: support@hng.com`
        });
        setTitle('고객센터 관리');
      } else {
        const docRef = doc(db, 'siteContent', activePage);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          let mergedContent = data.content;
          
          if (activePage === 'footer') {
            mergedContent = {
              logoText: '핑크버튼',
              copyrightText: '© 2024 핑크버튼. 본 사이트는 만 19세 미만의 청소년의 출입을 금합니다. 성인 인증 후 모든 콘텐츠 이용이 가능합니다.',
              businessNumber: '000-00-00000',
              ceo: '핑크버튼 팀',
              phone: '00-000-0000',
              address: '서울특별시',
              extraFields: [],
              ...data.content
            };
          } else if (activePage === 'home') {
            mergedContent = {
              heroTitle: '감각의 <br />\n<span class="text-primary italic">예술.</span>',
              heroSubtitle: '당신의 가장 사적인 순간을 위한 큐레이션. <br />\n핑크버튼에서 엄선한 프리미엄 감각을 경험하세요.',
              heroImage: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1920',
              philosophyTitle: '우리는 단순한 상점이 아닌, <br />\n당신의 <span class="text-primary italic">가장 아름다운 순간</span>을 디자인합니다.',
              philosophySubtitle: '핑크버튼는 엄선된 품질과 세련된 디자인을 통해 성인용품에 대한 새로운 기준을 제시합니다. \n모든 제품은 당신의 프라이버시를 최우선으로 생각하며 안전하게 배송됩니다.',
              philosophyImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920',
              categoriesTitle: '베스트 카테고리',
              categoriesSubtitle: '큐레이션 컬렉션',
              productsTitle: '인기 제품',
              featuredProductIds: [],
              ...data.content
            };
          } else if (activePage === 'bank') {
            mergedContent = {
              bankName: '신한은행',
              accountNumber: '110-523-123456',
              accountHolder: 'H&G Stoa',
              ...data.content
            };
          }
          
          setContent(mergedContent);
          setTitle(data.title || '무통장 정보 변경');
        } else {
          // Provide defaults if not exists
          let defaultContent: any = '';
        if (activePage === 'home') {
          defaultContent = {
            heroTitle: '감각의 <br />\n<span class="text-primary italic">예술.</span>',
            heroSubtitle: '당신의 가장 사적인 순간을 위한 큐레이션. <br />\n핑크버튼에서 엄선한 프리미엄 감각을 경험하세요.',
            heroImage: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1920',
            philosophyTitle: '우리는 단순한 상점이 아닌, <br />\n당신의 <span class="text-primary italic">가장 아름다운 순간</span>을 디자인합니다.',
            philosophySubtitle: '핑크버튼는 엄선된 품질과 세련된 디자인을 통해 성인용품에 대한 새로운 기준을 제시합니다. \n모든 제품은 당신의 프라이버시를 최우선으로 생각하며 안전하게 배송됩니다.',
            philosophyImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920',
            categoriesTitle: '베스트 카테고리',
            categoriesSubtitle: '큐레이션 컬렉션',
            productsTitle: '인기 제품',
            featuredProductIds: []
          };
        } else if (activePage === 'categories') {
          defaultContent = [
            { id: 'women', title: '여성 전용 라인', description: '섬세한 감각을 깨우는 프리미엄 컬렉션', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800', path: '/category/women', span: 'md:col-span-2' },
            { id: 'lubes', title: '러브젤', description: '부드러운 경험의 완성', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800', path: '/category/lubes', span: '' },
            { id: 'men', title: '남성 기구', description: '강렬한 퍼포먼스 테크놀로지', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=800', path: '/category/men', span: '' },
            { id: 'condoms', title: '콘돔', description: '안전하고 건강한 사랑을 위한 필수 선택', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800', path: '/category/condoms', span: '' },
            { id: 'others', title: '기타 성인용품', description: '더욱 다채로운 즐거움을 위한 액세서리', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800', path: '/category/others', span: '' },
            { id: 'lingerie', title: '섹시속옷', description: '당신의 매력을 더욱 돋보이게 할 미드나잇 컬렉션', image: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=800', path: '/category/lingerie', span: '' },
          ];
        } else if (activePage === 'footer') {
          defaultContent = {
            logoText: '핑크버튼',
            copyrightText: '© 2024 핑크버튼. 본 사이트는 만 19세 미만의 청소년의 출입을 금합니다. 성인 인증 후 모든 콘텐츠 이용이 가능합니다.',
            businessNumber: '000-00-00000',
            ceo: '핑크버튼 팀',
            phone: '00-000-0000',
            address: '서울특별시',
            extraFields: []
          };
        } else if (activePage === 'bank') {
          defaultContent = {
            bankName: '신한은행',
            accountNumber: '110-523-123456',
            accountHolder: 'H&G Stoa'
          };
        }
        
        setContent(defaultContent);
        const pageInfo = PAGE_KEYS.find(p => p.id === activePage);
        setTitle(pageInfo?.label || '');
      }
      }
    } catch (error) {
      console.error("Fetch Content Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (activePage === 'info') {
        await Promise.all([
          setDoc(doc(db, 'siteContent', 'about'), { title: '회사소개', content: content.about, updatedAt: serverTimestamp() }),
          setDoc(doc(db, 'siteContent', 'terms'), { title: '이용약관', content: content.terms, updatedAt: serverTimestamp() }),
          setDoc(doc(db, 'siteContent', 'privacy'), { title: '개인정보처리방침', content: content.privacy, updatedAt: serverTimestamp() })
        ]);
      } else if (activePage === 'support') {
        await Promise.all([
          setDoc(doc(db, 'siteContent', 'faq'), { title: '자주 묻는 질문 (FAQ)', content: content.faq, updatedAt: serverTimestamp() }),
          setDoc(doc(db, 'siteContent', 'inquiry'), { title: '문의하기 안내', content: content.inquiry, updatedAt: serverTimestamp() })
        ]);
      } else {
        await setDoc(doc(db, 'siteContent', activePage), {
          title,
          content,
          updatedAt: serverTimestamp()
        });
      }
      alert('성공적으로 저장되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `siteContent/${activePage}`);
    } finally {
      setSaving(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('이미지 크기가 너무 큽니다. 500KB 이하의 이미지를 사용해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaq = [...content.faq];
    newFaq[index][field] = value;
    setContent({ ...content, faq: newFaq });
  };

  const addFaqItem = () => {
    const newFaq = content.faq || [];
    setContent({ ...content, faq: [...newFaq, { question: '', answer: '' }] });
  };

  const removeFaqItem = (index: number) => {
    const newFaq = content.faq.filter((_: any, i: number) => i !== index);
    setContent({ ...content, faq: newFaq });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-headline font-bold mb-2">컨텐츠 관리</h2>
          <p className="text-on-surface-variant font-light">푸터 정보 및 고객센터 페이지 내용을 수정할 수 있습니다.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-all disabled:opacity-50"
        >
          {saving ? '저장 중...' : <><Save size={18} /> 변경사항 저장</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {PAGE_KEYS.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${
                activePage === page.id 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <page.icon size={18} /> {page.label}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          <motion.div 
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-sm space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant ml-1">페이지 제목</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary font-bold text-lg"
              />
            </div>

            {activePage === 'home' ? (
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">메인 배너 (Hero)</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">메인 타이틀 (HTML 사용 가능)</label>
                    <textarea 
                      value={content?.heroTitle || ''}
                      onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                      rows={2}
                      className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">서브 텍스트 (HTML 사용 가능)</label>
                    <textarea 
                      value={content?.heroSubtitle || ''}
                      onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                      rows={3}
                      className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">배경 이미지 (URL 또는 업로드)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={content?.heroImage || ''}
                        onChange={(e) => setContent({ ...content, heroImage: e.target.value })}
                        className="flex-1 bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                        placeholder="https://..."
                      />
                      <label className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest cursor-pointer rounded-lg text-sm font-medium transition-all">
                        <Upload size={16} /> 업로드
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (base64) => {
                            setContent({ ...content, heroImage: base64 });
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">섹션 타이틀 (카테고리 & 상품)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">베스트 카테고리 메인 타이틀</label>
                      <input 
                        value={content?.categoriesTitle || ''}
                        onChange={(e) => setContent({ ...content, categoriesTitle: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">베스트 카테고리 서브 타이틀</label>
                      <input 
                        value={content?.categoriesSubtitle || ''}
                        onChange={(e) => setContent({ ...content, categoriesSubtitle: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium text-on-surface-variant">인기 제품 타이틀</label>
                      <input 
                        value={content?.productsTitle || ''}
                        onChange={(e) => setContent({ ...content, productsTitle: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Featured Products Editor */}
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">메인 진열 상품 선택 및 순서 변경</h3>
                      <p className="text-xs text-on-surface-variant mt-1">이곳에 추가된 상품 ID 순서대로 메인 페이지에 노출됩니다.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newFeatured = content?.featuredProductIds || [];
                        setContent({ ...content, featuredProductIds: [...newFeatured, ''] });
                      }}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline px-3 py-2 bg-primary/10 rounded-lg"
                    >
                      <Plus size={14} /> 노출 상품 추가
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {content?.featuredProductIds?.map((pid: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-bold text-on-surface-variant w-6 text-center">{index + 1}</span>
                        <input 
                          placeholder="상품 ID 입력"
                          value={pid}
                          onChange={(e) => {
                            const newFeatured = [...content.featuredProductIds];
                            newFeatured[index] = e.target.value;
                            setContent({ ...content, featuredProductIds: newFeatured });
                          }}
                          className="flex-1 bg-transparent border border-outline-variant/10 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                        />
                        <button 
                          onClick={() => {
                            if (index > 0) {
                              const newFeatured = [...content.featuredProductIds];
                              const temp = newFeatured[index - 1];
                              newFeatured[index - 1] = newFeatured[index];
                              newFeatured[index] = temp;
                              setContent({ ...content, featuredProductIds: newFeatured });
                            }
                          }}
                          className="p-2 text-on-surface-variant/40 hover:text-primary transition-all disabled:opacity-20"
                          disabled={index === 0}
                        >
                          <MoveUp size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (index < content.featuredProductIds.length - 1) {
                              const newFeatured = [...content.featuredProductIds];
                              const temp = newFeatured[index + 1];
                              newFeatured[index + 1] = newFeatured[index];
                              newFeatured[index] = temp;
                              setContent({ ...content, featuredProductIds: newFeatured });
                            }
                          }}
                          className="p-2 text-on-surface-variant/40 hover:text-primary transition-all disabled:opacity-20"
                          disabled={index === content.featuredProductIds.length - 1}
                        >
                          <MoveDown size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            const newFeatured = content.featuredProductIds.filter((_: any, i: number) => i !== index);
                            setContent({ ...content, featuredProductIds: newFeatured });
                          }}
                          className="p-2 text-on-surface-variant/40 hover:text-error transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!content?.featuredProductIds || content.featuredProductIds.length === 0) && (
                      <p className="text-sm text-on-surface-variant/50 py-4 text-center">지정된 상품이 없으면 기본 최신순으로 자동 노출됩니다.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">브랜드 철학 (Brand Philosophy)</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">메인 타이틀 (HTML 사용 가능)</label>
                    <textarea 
                      value={content?.philosophyTitle || ''}
                      onChange={(e) => setContent({ ...content, philosophyTitle: e.target.value })}
                      rows={2}
                      className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">상세 설명</label>
                    <textarea 
                      value={content?.philosophySubtitle || ''}
                      onChange={(e) => setContent({ ...content, philosophySubtitle: e.target.value })}
                      rows={4}
                      className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface-variant">배경 이미지 URL</label>
                    <input 
                      type="text"
                      value={content?.philosophyImage || ''}
                      onChange={(e) => setContent({ ...content, philosophyImage: e.target.value })}
                      className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : activePage === 'categories' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="font-bold text-on-surface">카테고리 및 배너 설정</h3>
                    <p className="text-xs text-on-surface-variant mt-1">메인 페이지 노출 및 카테고리 상세 페이지의 배너 정보를 관리합니다.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newContent = Array.isArray(content) ? content : [];
                      setContent([...newContent, { id: '', title: '', description: '', image: '', path: '', span: '' }]);
                    }}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline px-3 py-2 bg-primary/10 rounded-lg"
                  >
                    <Plus size={14} /> 카테고리 추가
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {Array.isArray(content) && content.map((item: any, index: number) => (
                    <motion.div 
                      layout
                      key={index} 
                      className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/5 relative group space-y-4"
                    >
                      <div className="flex justify-between items-center pb-4 border-b border-outline-variant/5">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant">
                            {index + 1}
                          </div>
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-lg shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-xs text-on-surface-variant text-center leading-tight">
                              이미지<br/>없음
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">{item.title || '(제목 없음)'}</span>
                            <span className="text-xs text-on-surface-variant">{item.id || '(ID 없음)'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (index > 0) {
                                const newContent = [...content];
                                const temp = newContent[index - 1];
                                newContent[index - 1] = newContent[index];
                                newContent[index] = temp;
                                setContent(newContent);
                              }
                            }}
                            className="p-2 bg-surface-container-low rounded-lg hover:text-primary transition-all disabled:opacity-20"
                            disabled={index === 0}
                          >
                            <MoveUp size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (index < content.length - 1) {
                                const newContent = [...content];
                                const temp = newContent[index + 1];
                                newContent[index + 1] = newContent[index];
                                newContent[index] = temp;
                                setContent(newContent);
                              }
                            }}
                            className="p-2 bg-surface-container-low rounded-lg hover:text-primary transition-all disabled:opacity-20"
                            disabled={index === content.length - 1}
                          >
                            <MoveDown size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              const newContent = content.filter((_: any, i: number) => i !== index);
                              setContent(newContent);
                            }}
                            className="p-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-white transition-all ml-4"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-on-surface-variant">고유 ID <span className="text-[10px] opacity-60">(예: women, men)</span></label>
                          <input 
                            value={item.id}
                            onChange={(e) => {
                              const newContent = [...content];
                              newContent[index].id = e.target.value;
                              setContent(newContent);
                            }}
                            className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-on-surface-variant">타이틀 <span className="text-[10px] opacity-60">(표시될 이름)</span></label>
                          <input 
                            value={item.title}
                            onChange={(e) => {
                              const newContent = [...content];
                              newContent[index].title = e.target.value;
                              setContent(newContent);
                            }}
                            className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-on-surface-variant">상세 설명</label>
                          <input 
                            value={item.description}
                            onChange={(e) => {
                              const newContent = [...content];
                              newContent[index].description = e.target.value;
                              setContent(newContent);
                            }}
                            className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-on-surface-variant">이미지 (URL 또는 업로드)</label>
                          <div className="flex gap-2">
                            <input 
                              value={item.image}
                              onChange={(e) => {
                                const newContent = [...content];
                                newContent[index].image = e.target.value;
                                setContent(newContent);
                              }}
                              className="flex-1 bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                              placeholder="https://..."
                            />
                            <label className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest cursor-pointer rounded-lg text-sm font-medium transition-all shrink-0">
                              <Upload size={16} /> <span className="hidden sm:inline">업로드</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, (base64) => {
                                  const newContent = [...content];
                                  newContent[index].image = base64;
                                  setContent(newContent);
                                })}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-on-surface-variant">링크 경로 <span className="text-[10px] opacity-60">(예: /category/women)</span></label>
                          <input 
                            value={item.path}
                            onChange={(e) => {
                              const newContent = [...content];
                              newContent[index].path = e.target.value;
                              setContent(newContent);
                            }}
                            className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-on-surface-variant">그리드 크기 <span className="text-[10px] opacity-60">(예: md:col-span-2)</span></label>
                          <input 
                            value={item.span || ''}
                            onChange={(e) => {
                              const newContent = [...content];
                              newContent[index].span = e.target.value;
                              setContent(newContent);
                            }}
                            className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : activePage === 'footer' ? (
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">좌측 텍스트 (로고 및 경고문구)</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">로고 텍스트</label>
                      <input 
                        type="text"
                        value={content?.logoText || ''}
                        onChange={(e) => setContent({ ...content, logoText: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">로고 이미지 업로드 (업로드 시 텍스트 대신 이미지가 출력됩니다)</label>
                      <div className="flex gap-4 items-center">
                        {content?.logoImage && (
                          <div className="w-16 h-16 bg-surface-container-high rounded-lg p-2 flex items-center justify-center">
                            <img src={content.logoImage} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest cursor-pointer rounded-lg text-sm font-medium transition-all">
                          <Upload size={16} /> 업로드
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (base64) => {
                              setContent({ ...content, logoImage: base64 });
                            })}
                          />
                        </label>
                        {content?.logoImage && (
                          <button 
                            onClick={() => setContent({ ...content, logoImage: null })}
                            className="text-xs text-error hover:underline px-2"
                          >
                            이미지 삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">카피라이트 및 안내문 (HTML 지원)</label>
                      <textarea 
                        value={content?.copyrightText || ''}
                        onChange={(e) => setContent({ ...content, copyrightText: e.target.value })}
                        rows={3}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">기본 사업자 및 연락처 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">사업자등록번호</label>
                      <input 
                        type="text"
                        value={content?.businessNumber || ''}
                        onChange={(e) => setContent({ ...content, businessNumber: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">대표자명</label>
                      <input 
                        type="text"
                        value={content?.ceo || ''}
                        onChange={(e) => setContent({ ...content, ceo: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">전화번호</label>
                      <input 
                        type="text"
                        value={content?.phone || ''}
                        onChange={(e) => setContent({ ...content, phone: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-on-surface-variant">주소</label>
                      <input 
                        type="text"
                        value={content?.address || ''}
                        onChange={(e) => setContent({ ...content, address: e.target.value })}
                        className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">추가 정보 (선택사항)</h3>
                      <p className="text-xs text-on-surface-variant mt-1">통신판매업신고번호, 이메일 등 추가 항목을 자유롭게 넣으세요.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newExtra = content?.extraFields || [];
                        setContent({ ...content, extraFields: [...newExtra, { label: '', value: '' }] });
                      }}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline px-3 py-2 bg-primary/10 rounded-lg"
                    >
                      <Plus size={14} /> 정보 추가
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {content?.extraFields?.map((item: any, index: number) => (
                      <motion.div 
                        layout
                        key={index} 
                        className="flex items-center gap-4 p-4 bg-background rounded-xl border border-outline-variant/5 relative group"
                      >
                        <input 
                          placeholder="항목명 (예: 통신판매업)"
                          value={item.label}
                          onChange={(e) => {
                            const newExtra = [...content.extraFields];
                            newExtra[index].label = e.target.value;
                            setContent({ ...content, extraFields: newExtra });
                          }}
                          className="w-1/3 bg-transparent border border-outline-variant/10 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                        />
                        <input 
                          placeholder="내용 (예: 2024-서울강남-0000)"
                          value={item.value}
                          onChange={(e) => {
                            const newExtra = [...content.extraFields];
                            newExtra[index].value = e.target.value;
                            setContent({ ...content, extraFields: newExtra });
                          }}
                          className="w-full bg-transparent border border-outline-variant/10 rounded-lg p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <button 
                          onClick={() => {
                            const newExtra = content.extraFields.filter((_: any, i: number) => i !== index);
                            setContent({ ...content, extraFields: newExtra });
                          }}
                          className="p-2 text-on-surface-variant/40 hover:text-error transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activePage === 'support' ? (
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">문의하기 안내 내용</h3>
                  <textarea 
                    value={content?.inquiry || ''}
                    onChange={(e) => setContent({ ...content, inquiry: e.target.value })}
                    rows={4}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-on-surface">자주 묻는 질문 (FAQ)</h3>
                    <button 
                      onClick={addFaqItem}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> 질문 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.isArray(content?.faq) && content.faq.map((faq: { question: string, answer: string }, index: number) => (
                      <motion.div 
                        layout
                        key={index} 
                        className="p-6 bg-background rounded-2xl border border-outline-variant/5 relative group"
                      >
                        <button 
                          onClick={() => removeFaqItem(index)}
                          className="absolute top-4 right-4 p-2 text-on-surface-variant/40 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="space-y-4 pr-8">
                          <div>
                            <input 
                              placeholder="질문 (Question)"
                              value={faq.question}
                              onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-lg placeholder:text-on-surface-variant/20"
                            />
                          </div>
                          <div>
                            <textarea 
                              placeholder="답변 (HTML 사용 가능)"
                              value={faq.answer}
                              rows={3}
                              onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm leading-relaxed text-on-surface-variant placeholder:text-on-surface-variant/20 resize-none font-mono"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activePage === 'bank' ? (
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">입금 은행</h3>
                  <input 
                    type="text"
                    value={content?.bankName || ''}
                    onChange={(e) => setContent({ ...content, bankName: e.target.value })}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed"
                    placeholder="신한은행"
                  />
                </div>
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">계좌 번호</h3>
                  <input 
                    type="text"
                    value={content?.accountNumber || ''}
                    onChange={(e) => setContent({ ...content, accountNumber: e.target.value })}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed font-mono"
                    placeholder="110-523-123456"
                  />
                </div>
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">예금주</h3>
                  <input 
                    type="text"
                    value={content?.accountHolder || ''}
                    onChange={(e) => setContent({ ...content, accountHolder: e.target.value })}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed"
                    placeholder="H&G Stoa"
                  />
                </div>
              </div>
            ) : activePage === 'info' ? (
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">회사소개</h3>
                  <textarea 
                    value={content?.about || ''}
                    onChange={(e) => setContent({ ...content, about: e.target.value })}
                    rows={6}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed resize-none font-mono"
                  />
                </div>
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">이용약관</h3>
                  <textarea 
                    value={content?.terms || ''}
                    onChange={(e) => setContent({ ...content, terms: e.target.value })}
                    rows={6}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed resize-none font-mono"
                  />
                </div>
                <div className="space-y-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <h3 className="font-bold text-on-surface">개인정보처리방침</h3>
                  <textarea 
                    value={content?.privacy || ''}
                    onChange={(e) => setContent({ ...content, privacy: e.target.value })}
                    rows={6}
                    className="w-full bg-transparent border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed resize-none font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-on-surface-variant ml-1">내용 (HTML 작성 가능)</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${!previewMode ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
                    >
                      에디터
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${previewMode ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
                    >
                      미리보기
                    </button>
                  </div>
                </div>
                
                {previewMode ? (
                  <div 
                    className="w-full min-h-[500px] bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-4 px-4 prose prose-sm max-w-none prose-on-surface"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary text-sm leading-relaxed resize-none font-mono"
                    placeholder="<p>페이지의 내용을 HTML로 입력하세요...</p>"
                  />
                )}
              </div>
            )}
            
            <div className="pt-6 border-t border-outline-variant/5">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <FileCheck size={16} /> 팁: 줄바꿈을 통해 가독성을 높여주세요.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
