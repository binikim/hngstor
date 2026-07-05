/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { auth, db } from '../../firebase';
import { verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Settings, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, Info, Download, Database, Trash2, RefreshCw, Upload, Printer } from 'lucide-react';
import {
  type ExcelKind,
  openPrintWindow,
  parseExcelRows,
  readExcelFile,
  writeExcelFile
} from '../../adminExcel';

const termsHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>핑크버튼 - 이용약관</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    body {
      font-family: 'Noto Sans KR', sans-serif;
      line-height: 1.8;
      background-color: #0f0f10;
      color: #d1d1d1;
      margin: 0;
      padding: 40px 20px;
    }
    .policy-container {
      max-width: 900px;
      margin: 0 auto;
      background: #1a1a1c;
      padding: 50px;
      border-radius: 12px;
      border: 1px solid #2a2a2c;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    }
    h1 {
      color: #ffffff;
      font-size: 1.9rem;
      text-align: center;
      margin-bottom: 16px;
      font-weight: 700;
      letter-spacing: 0;
    }
    .subtitle {
      text-align: center;
      color: #9b9b9b;
      font-size: 0.95rem;
      margin-bottom: 36px;
    }
    .highlight-statement {
      background-color: #252527;
      border-left: 4px solid #d4af37;
      padding: 22px;
      margin-bottom: 40px;
      color: #ffffff;
      font-size: 1.05rem;
      text-align: center;
      border-radius: 6px;
    }
    .policy-content {
      height: 560px;
      overflow-y: auto;
      padding-right: 20px;
      font-size: 0.95rem;
      color: #b8b8b8;
    }
    .policy-content::-webkit-scrollbar {
      width: 6px;
    }
    .policy-content::-webkit-scrollbar-track {
      background: #1f1f21;
    }
    .policy-content::-webkit-scrollbar-thumb {
      background: #4a4a4d;
      border-radius: 10px;
    }
    h2 {
      font-size: 1.12rem;
      color: #d4af37;
      margin-top: 34px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    p {
      margin-bottom: 15px;
    }
    ul {
      margin-bottom: 20px;
      padding-left: 22px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      color: #ffffff;
      font-weight: 500;
    }
    .footer-note {
      margin-top: 40px;
      text-align: center;
      font-size: 0.85rem;
      color: #777;
    }
    @media (max-width: 640px) {
      body {
        padding: 24px 14px;
      }
      .policy-container {
        padding: 30px 22px;
      }
      h1 {
        font-size: 1.55rem;
      }
      .policy-content {
        height: 600px;
        padding-right: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="policy-container">
    <h1>이용약관</h1>
    <p class="subtitle">핑크버튼 쇼핑몰 서비스 이용 약관</p>
    <div class="highlight-statement">
      본 약관은 만 19세 이상의 성인을 위한 서비스 제공 및 관련 권리와 책임 의무 규정을 담고 있습니다.<br>
      청소년의 이용은 엄격히 제한됩니다.
    </div>
    <div class="policy-content">
      <h2>제 1 조 (목적)</h2>
      <p>본 약관은 핑크버튼(이하 "회사")이 운영하는 온라인 쇼핑몰(이하 "몰")에서 제공하는 전자상거래 관련 서비스(이하 "서비스")를 이용함에 있어 몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      <h2>제 2 조 (정의)</h2>
      <p>1. "몰"이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 온라인 쇼핑몰을 운영하는 사업자의 의미로도 사용합니다.</p>
      <p>2. "이용자"란 몰에 접속하여 본 약관에 따라 몰이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
      <p>3. "회원"이라 함은 몰에 개인정보를 제공하여 회원등록을 한 자로서, 몰의 정보를 지속적으로 제공받으며 몰이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
      <p>4. "비회원"이라 함은 회원에 가입하지 않고 몰이 제공하는 서비스를 이용하는 자를 말합니다.</p>
      <h2>제 3 조 (약관의 명시와 설명 및 개정)</h2>
      <p>1. 몰은 본 약관의 내용과 상호, 영업소 소재지 주소, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 쉽게 알 수 있도록 쇼핑몰의 초기 서비스화면에 게시합니다.</p>
      <p>2. 몰은 약관의규제에관한법률, 전자거래기본법, 전자서명법, 정보통신망이용촉진등에관한법률, 방문판매등에관한법률, 소비자보호법 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
      <h2>제 4 조 (이용자의 자격 및 제한 - 만 19세 미만 청소년 보호)</h2>
      <p><strong>1. 몰은 관련 법령(청소년 보호법 등)에 따라 만 19세 미만의 청소년의 이용을 엄격히 제한합니다.</strong></p>
      <p>2. 회원은 가입 시 본인인증(휴대전화 인증 또는 공동인증서 등)을 통해 성인 여부를 확인받아야 하며, 본인인증을 완료하지 않거나 만 19세 미만으로 확인된 경우 회원 가입이 불가능하며 서비스 이용이 전면 차단됩니다.</p>
      <p>3. 비회원이 재화 등을 구매할 때에도 본인인증을 통한 성인 인증 절차가 필요합니다.</p>
      <h2>제 5 조 (서비스의 제공 및 변경)</h2>
      <p>1. 몰은 다음과 같은 업무를 수행합니다.</p>
      <ul>
        <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
        <li>구매계약이 체결된 재화 또는 용역의 배송</li>
        <li>기타 몰이 정하는 업무</li>
      </ul>
      <p>2. 몰은 재화의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화·용역의 내용을 변경할 수 있습니다.</p>
      <h2>제 6 조 (서비스의 중단)</h2>
      <p>1. 몰은 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
      <p>2. 제1항에 의한 서비스 중단의 경우에는 몰은 제8조에 정한 방법으로 이용자에게 통지합니다.</p>
      <h2>제 7 조 (회원가입)</h2>
      <p>이용자는 몰이 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다. 단, 성인인증을 통과하지 못한 신청은 거부됩니다.</p>
      <h2>제 8 조 (회원 탈퇴 및 자격 상실 등)</h2>
      <p>1. 회원은 몰에 언제든지 탈퇴를 요청할 수 있으며 몰은 지체없이 회원탈퇴를 처리합니다.</p>
      <p>2. 회원이 다음 각 호의 사유에 해당하는 경우, 몰은 회원자격을 제한 및 정지시킬 수 있습니다.</p>
      <ul>
        <li>가입 신청 시에 허위 내용을 등록한 경우</li>
        <li>몰을 이용하여 구입한 재화 등의 대금, 기타 몰 이용에 관련하여 회원이 부담하는 채무를 기일에 지급하지 않는 경우</li>
        <li>타인의 명의를 도용하여 가입하거나 성인인증을 부정하게 우회한 경우</li>
        <li>다른 사람의 몰 이용을 방해하거나 그 정보를 도용하는 등 전자거래질서를 위협하는 경우</li>
      </ul>
      <h2>제 9 조 (구매신청 및 개인정보 제공 동의 등)</h2>
      <p>몰 이용자는 몰 상에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 몰은 이용자가 구매신청을 함에 있어서 다음의 내용을 알기 쉽게 제공하여야 합니다.</p>
      <ul>
        <li>재화 등의 검색 및 선택</li>
        <li>받는 사람의 성명, 주소, 전화번호, 휴대전화번호, 이메일 주소 등의 입력</li>
        <li>약관내용, 청약철회권이 제한되는 서비스, 배송료·설치비 등의 비용부담과 관련한 내용에 대한 확인 및 동의</li>
        <li>결제방법의 선택</li>
      </ul>
      <h2>제 10 조 (계약의 성립)</h2>
      <p>몰은 제9조와 같은 구매신청에 대하여 다음 각 호에 해당하지 않는 한 승낙합니다.</p>
      <ul>
        <li>신청 내용에 허위, 기재누락, 오기가 있는 경우</li>
        <li>만 19세 미만의 청소년이 구매를 신청한 경우</li>
        <li>기타 구매신청에 승낙하는 것이 몰 기술상 현저히 지장이 있다고 판단하는 경우</li>
      </ul>
      <h2>제 11 조 (지급방법)</h2>
      <p>몰에서 구매한 재화 또는 용역에 대한 대금지급방법은 신용카드 결제, 무통장 입금 등 몰에서 제공하는 결제 방식으로 할 수 있습니다.</p>
      <h2>제 12 조 (배송 및 프라이버시 보호 배송)</h2>
      <p>1. 몰은 이용자와 재화 등의 공급시기에 관하여 별도의 약정이 없는 한, 이용자가 청약을 한 날부터 영업일 기준 지체 없이 재화 등을 배송할 수 있도록 필요한 조치를 취합니다.</p>
      <p><strong>2. 몰은 성인용품 배송의 프라이버시 보호를 중요하게 생각하며, 배송 시 상자 외관에 성인용품 관련 내용이나 브랜드 로고가 노출되지 않도록 하며, 송장의 품명은 '의류', '잡화' 등 일반적인 명칭으로 우회 표기하여 배송합니다.</strong></p>
      <h2>제 13 조 (환급, 반품 및 교환)</h2>
      <p>1. 몰은 이용자가 구매신청한 재화 등이 품절 등의 사유로 인도 또는 제공을 할 수 없을 때에는 지체 없이 그 사유를 이용자에게 통지하고 환급 절차를 취합니다.</p>
      <p>2. 이용자는 재화 등을 배송받은 날부터 7일 이내에 청약의 철회(반품 및 교환)를 할 수 있습니다. <strong>단, 제품의 포장이 훼손되거나밀봉이 해제된 성인용품, 위생용품의 경우 상품 가치가 현저히 감소하므로 단순 변심에 의한 반품 및 교환이 불가능합니다.</strong></p>
      <p>3. 제품 자체의 결함이나 오배송의 경우에는 관련 법령에 따라 지체 없이 교환 또는 환불이 진행되며, 이에 필요한 모든 왕복 배송비는 몰이 부담합니다.</p>
      <h2>제 14 조 (개인정보보호 및 프라이버시 의무)</h2>
      <p>1. 몰은 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 최소한의 개인정보를 수집합니다.</p>
      <p>2. 몰은 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</p>
      <p>3. 수집된 개인정보는 이용자의 동의 없이 목적 외의 용도로 이용할 수 없으며, 상세한 내용은 개인정보처리방침을 따릅니다.</p>
      <h2>제 15 조 (분쟁해결 및 관할법원)</h2>
      <p>1. 몰은 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</p>
      <p>2. 몰과 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소지에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 단, 제소 당시 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</p>
    </div>
    <div class="footer-note">
      <p>시행일자: 2026년 6월 6일</p>
      <p>&copy; PINK BUTTON. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`;

export default function AdminSettings() {
  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRefs = {
    products: useRef<HTMLInputElement>(null),
    orders: useRef<HTMLInputElement>(null),
    users: useRef<HTMLInputElement>(null)
  };

  const handleRestoreSiteContent = async () => {
    const confirmRestore = window.confirm("회사소개, 이용약관, 개인정보처리방침, FAQ, 문의안내의 데이터 복원 및 브랜드명(핑크버튼) 일괄 정리를 실행하시겠습니까?");
    if (!confirmRestore) return;

    setIsRestoring(true);
    setMessage(null);

    const cleanHtml = (text: string) => {
      if (typeof text !== 'string') return text;
      text = text.trim();
      const match = text.match(/```html\s*([\s\S]*?)\s*```/i);
      if (match) {
        return match[1].trim();
      }
      const genericMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (genericMatch) {
        return genericMatch[1].trim();
      }
      return text;
    };

    const replaceBrandName = (text: string) => {
      if (typeof text !== 'string') return text;
      return text
        .replace(/H&G스토아/g, '핑크버튼')
        .replace(/HnG스토아/g, '핑크버튼')
        .replace(/H&G스토어/g, '핑크버튼')
        .replace(/HnG스토어/g, '핑크버튼')
        .replace(/H&G STORE/g, 'PINK BUTTON')
        .replace(/HnG STORE/g, 'PINK BUTTON')
        .replace(/H&G/g, '핑크버튼');
    };

    try {
      // 1. Restore 'about' (회사소개)
      const aboutRef = doc(db, 'siteContent', 'about');
      const aboutSnap = await getDoc(aboutRef);
      let aboutContent = '';
      if (aboutSnap.exists()) {
        aboutContent = cleanHtml(aboutSnap.data().content);
      } else {
        aboutContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>회사소개</title>
</head>
<body>
  <h1>핑크버튼 회사 소개</h1>
  <p>핑크버튼은 고객의 프라이버시와 라이프스타일을 존중하는 프리미엄 스토어입니다.</p>
</body>
</html>`;
      }
      aboutContent = replaceBrandName(aboutContent);
      await setDoc(aboutRef, { title: '회사소개', content: aboutContent, updatedAt: serverTimestamp() });

      // Synchronize SQLite
      try {
        await fetch(`http://${window.location.hostname}:3001/api/content/about`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: aboutContent })
        });
      } catch (e) {
        console.warn('SQLite sync failed for about page (expected in production):', e);
      }

      // 2. Restore 'terms' (이용약관)
      const termsRef = doc(db, 'siteContent', 'terms');
      await setDoc(termsRef, { title: '이용약관', content: termsHtml, updatedAt: serverTimestamp() });

      try {
        await fetch(`http://${window.location.hostname}:3001/api/content/terms`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: termsHtml })
        });
      } catch (e) {
        console.warn('SQLite sync failed for terms page (expected in production):', e);
      }

      // 3. Restore 'privacy' (개인정보처리방침)
      const privacyRef = doc(db, 'siteContent', 'privacy');
      const privacySnap = await getDoc(privacyRef);
      let privacyContent = '';
      if (privacySnap.exists()) {
        privacyContent = cleanHtml(privacySnap.data().content);
      } else {
        privacyContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>개인정보처리방침</title>
</head>
<body>
  <h1>개인정보처리방침</h1>
  <p>핑크버튼은 고객님의 개인정보를 소중히 취급합니다.</p>
</body>
</html>`;
      }
      privacyContent = replaceBrandName(privacyContent);
      await setDoc(privacyRef, { title: '개인정보처리방침', content: privacyContent, updatedAt: serverTimestamp() });

      try {
        await fetch(`http://${window.location.hostname}:3001/api/content/privacy`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: privacyContent })
        });
      } catch (e) {
        console.warn('SQLite sync failed for privacy page (expected in production):', e);
      }

      // 4. Restore 'faq' (자주 묻는 질문)
      const faqRef = doc(db, 'siteContent', 'faq');
      const faqSnap = await getDoc(faqRef);
      let faqContent = [];
      if (faqSnap.exists()) {
        const rawFaq = faqSnap.data().content;
        faqContent = Array.isArray(rawFaq) ? rawFaq : [];
      }
      faqContent = faqContent.map((item: any) => ({
        question: replaceBrandName(item.question || ''),
        answer: replaceBrandName(item.answer || '')
      }));

      if (faqContent.length === 0) {
        faqContent = [
          {
            question: "Q. 배송 시 택배 박스에 상품명이 기재되나요?",
            answer: "A. 저희 핑크버튼은 고객님의 프라이버시를 최우선으로 합니다. 송장 출력 시 상품명은 '의류' 또는 '잡화' 등 일반적인 명칭으로 우회하여 표기되며, 박스 외관 어디에도 성인용품임을 알 수 있는 문구나 로고를 사용하지 않습니다."
          },
          {
            question: "Q. 취급하는 제품들은 안전한가요?",
            answer: "A. 핑크버튼에서 판매되는 모든 제품은 국내외 안전 기준을 통과한 100% 정품입니다. 인체에 무해한 의료용 실리콘 등 고품질 소재를 사용한 브랜드만을 엄선하여 큐레이션하고 있으니 안심하고 사용하셔도 됩니다."
          },
          {
            question: "Q. 카드 결제 시 명세서에는 어떻게 표시되나요?",
            answer: "A. 카드 명세서상에는 고객님의 사생활 보호를 위해 쇼핑몰명(핑크버튼) 대신 승인 대행업체(PG사) 명의의 일반 상호로 안심 표기되어 청구됩니다."
          }
        ];
      }
      await setDoc(faqRef, { title: '자주 묻는 질문 (FAQ)', content: faqContent, updatedAt: serverTimestamp() });

      try {
        await fetch(`http://${window.location.hostname}:3001/api/content/faq`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: faqContent })
        });
      } catch (e) {
        console.warn('SQLite sync failed for faq page (expected in production):', e);
      }

      // 5. Restore 'inquiry' (문의안내)
      const inquiryRef = doc(db, 'siteContent', 'inquiry');
      const inquirySnap = await getDoc(inquiryRef);
      let inquiryContent = '';
      if (inquirySnap.exists()) {
        inquiryContent = cleanHtml(inquirySnap.data().content);
      } else {
        inquiryContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>고객 지원</title>
</head>
<body>
  <h1>고객 지원 안내</h1>
</body>
</html>`;
      }
      inquiryContent = replaceBrandName(inquiryContent);
      await setDoc(inquiryRef, { title: '문의하기 안내', content: inquiryContent, updatedAt: serverTimestamp() });

      try {
        await fetch(`http://${window.location.hostname}:3001/api/content/inquiry`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: inquiryContent })
        });
      } catch (e) {
        console.warn('SQLite sync failed for inquiry page (expected in production):', e);
      }

      setMessage({
        type: 'success',
        text: '기본 정보 페이지 복원 및 핑크버튼 브랜드명 일괄 정리가 성공적으로 완료되었습니다!'
      });
    } catch (error: any) {
      console.error('Restoration Error:', error);
      setMessage({
        type: 'error',
        text: `복원 작업 중 오류가 발생했습니다: ${error.message || error}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const excelConfigs: Array<{ kind: ExcelKind; title: string; description: string }> = [
    { kind: 'products', title: '제품 관리', description: '제품명, 카테고리, 가격, 재고, 이미지, 설명' },
    { kind: 'orders', title: '주문 관리', description: '주문자, 배송지, 결제수단, 주문상품, 운송장' },
    { kind: 'users', title: '회원 관리', description: '이메일, 이름, 전화번호, 역할. 비밀번호 제외' }
  ];

  const getCollectionName = (kind: ExcelKind) => {
    if (kind === 'products') return 'products';
    if (kind === 'orders') return 'orders';
    return 'users';
  };

  const getKindLabel = (kind: ExcelKind) => {
    if (kind === 'products') return '제품';
    if (kind === 'orders') return '주문';
    return '회원';
  };

  const loadAdminRecords = async (kind: ExcelKind) => {
    const snapshot = await getDocs(collection(db, getCollectionName(kind)));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const downloadExcel = async (kind: ExcelKind) => {
    try {
      const records = await loadAdminRecords(kind);
      if (records.length === 0) {
        alert(`내보낼 ${getKindLabel(kind)} 데이터가 없습니다.`);
        return;
      }
      writeExcelFile(kind, records);
    } catch (error) {
      console.error(`${kind} Excel Download Error:`, error);
      alert(`${getKindLabel(kind)} 데이터를 엑셀로 저장하는 동안 오류가 발생했습니다.`);
    }
  };

  const printRecords = async (kind: ExcelKind) => {
    try {
      const records = await loadAdminRecords(kind);
      if (records.length === 0) {
        alert(`출력할 ${getKindLabel(kind)} 데이터가 없습니다.`);
        return;
      }
      openPrintWindow(kind, records);
    } catch (error) {
      console.error(`${kind} Print Error:`, error);
      alert(`${getKindLabel(kind)} 데이터를 출력하는 동안 오류가 발생했습니다.`);
    }
  };

  const saveImportedEntry = async (kind: ExcelKind, entry: { id: string; data: Record<string, any> }) => {
    const collectionName = getCollectionName(kind);
    const id = entry.id || crypto.randomUUID();
    const data = { ...entry.data };
    const targetRef = doc(db, collectionName, id);
    const existingDoc = await getDoc(targetRef);

    if (existingDoc.exists()) {
      await updateDoc(targetRef, data);
      return 'updated';
    }

    if (kind === 'users') {
      await addDoc(collection(db, collectionName), { ...data, uid: id });
    } else {
      await addDoc(collection(db, collectionName), { ...data, id });
    }
    return 'created';
  };

  const importExcel = async (kind: ExcelKind, file: File) => {
    try {
      const rows = await readExcelFile(file);
      const entries = parseExcelRows(kind, rows);
      if (entries.length === 0) {
        alert('불러올 수 있는 데이터가 없습니다. 엑셀 컬럼명을 확인해 주세요.');
        return;
      }

      const confirmImport = window.confirm(
        `${getKindLabel(kind)} 데이터 ${entries.length}건을 불러옵니다.\nID가 있으면 기존 데이터를 수정하고, ID가 없거나 존재하지 않으면 새로 추가합니다.\n엑셀에 없는 기존 데이터는 삭제하지 않습니다. 계속할까요?`
      );
      if (!confirmImport) return;

      let created = 0;
      let updated = 0;
      for (const entry of entries) {
        const result = await saveImportedEntry(kind, entry);
        if (result === 'created') created += 1;
        if (result === 'updated') updated += 1;
      }

      setMessage({
        type: 'success',
        text: `${getKindLabel(kind)} 엑셀 불러오기 완료: 신규 ${created}건, 수정 ${updated}건`
      });
    } catch (error: any) {
      console.error(`${kind} Excel Import Error:`, error);
      alert(`${getKindLabel(kind)} 엑셀을 불러오는 동안 오류가 발생했습니다: ${error.message || error}`);
    }
  };

  // 관리자 제외 전체 데이터베이스 초기화
  const handleInitializeDatabase = async () => {
    if (resetConfirmInput !== '초기화') {
      alert("안전을 위해 입력창에 '초기화'를 정확히 입력해 주세요.");
      return;
    }

    const doubleConfirm = window.confirm("정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 복구할 수 없으며 관리자를 제외한 모든 회원, 주문, 제품 정보가 영구히 소실됩니다.");
    if (!doubleConfirm) return;

    setIsResetting(true);
    setMessage(null);

    try {
      // 1. orders 삭제
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orderDeletePromises = ordersSnapshot.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(orderDeletePromises);

      // 2. products 삭제
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productDeletePromises = productsSnapshot.docs.map(d => deleteDoc(doc(db, 'products', d.id)));
      await Promise.all(productDeletePromises);

      // 3. content 삭제
      const contentSnapshot = await getDocs(collection(db, 'content'));
      const contentDeletePromises = contentSnapshot.docs.map(d => deleteDoc(doc(db, 'content', d.id)));
      await Promise.all(contentDeletePromises);

      // 4. users 삭제 (관리자 제외)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDeletePromises = usersSnapshot.docs
        .filter(d => {
          const userData = d.data();
          const isCurrentAdmin = d.id === auth.currentUser?.uid;
          const isAdminRole = userData.role === 'admin';
          const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
          const isProtectedEmail = userData.email?.toLowerCase() === defaultAdminEmail;
          
          return !(isCurrentAdmin || isAdminRole || isProtectedEmail);
        })
        .map(d => deleteDoc(doc(db, 'users', d.id)));
        
      await Promise.all(userDeletePromises);

      setMessage({
        type: 'success',
        text: '데이터베이스 초기화가 성공적으로 완료되었습니다. (관리자 정보 유지됨)'
      });
      setResetConfirmInput('');
    } catch (error: any) {
      console.error("Database Reset Error:", error);
      setMessage({
        type: 'error',
        text: `초기화 작업 중 오류가 발생했습니다: ${error.message || error}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Check if user is logged in with Google
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      
      if (isGoogleUser) {
        // Limited updates for Google users
        if (newEmail !== user.email) {
          throw new Error('Google 계정으로 로그인한 경우 이메일 직접 변경은 불가능합니다. Google 계정 설정에서 변경하시거나, 새로운 계정으로 회원가입 후 관리자 권한을 부여받으세요.');
        }
        if (newPassword) {
          throw new Error('Google 계정으로 로그인한 경우 이곳에서는 비밀번호를 변경할 수 없습니다. Google 보안 설정에서 진행해 주세요.');
        }
        
        setMessage({ type: 'info', text: 'Google 계정 사용자는 관리자 설정에서 이메일/비밀번호를 직접 수정할 수 없습니다. 회원 관리 탭을 이용해 주세요.' });
        setLoading(false);
        return;
      }

      // Re-authenticate user first (required for sensitive operations)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      let emailUpdateStarted = false;

      // Update Email if changed
      if (newEmail !== user.email) {
        try {
          await verifyBeforeUpdateEmail(user, newEmail);
          emailUpdateStarted = true;
        } catch (emailError: any) {
          console.error("Email Update Error:", emailError);
          if (emailError.code === 'auth/operation-not-allowed') {
            throw new Error('이메일 변경 기능이 비활성화되어 있습니다. 관리자 계정을 변경하려면 [회원 관리] 탭에서 다른 사용자의 역할을 ADMIN으로 변경하는 방법을 권장합니다.');
          }
          throw emailError;
        }
      }

      // Update Password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      if (emailUpdateStarted) {
        setMessage({ 
          type: 'success', 
          text: '비밀번호가 변경되었으며, 새 이메일로 인증 링크가 발송되었습니다. 이메일함의 링크를 클릭해야 최종적으로 이메일 주소가 변경됩니다.' 
        });
      } else {
        setMessage({ type: 'success', text: '계정 정보가 성공적으로 변경되었습니다.' });
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Update Error:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다.' });
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: '보안을 위해 다시 로그인 후 시도해주세요.' });
      } else {
        setMessage({ type: 'error', text: error.message || '정보 변경 중 오류가 발생했습니다.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Settings size={24} /> 관리자 계정 설정
        </h2>
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <div className="mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
          <Info className="text-primary shrink-0" size={20} />
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <p className="font-bold text-primary mb-1">관리자 계정을 다른 사람으로 바꾸고 싶으신가요?</p>
            현재 계정의 이메일을 바꾸는 대신, **[회원 관리]** 탭에서 새로운 관리자가 될 분의 역할을 **ADMIN**으로 변경해 주세요. 그 후 현재 계정의 역할을 USER로 바꾸거나 삭제하는 것이 더 안전하고 확실한 방법입니다.
          </div>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-success/10 text-success' : 
              message.type === 'info' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">관리자 이메일 (ID)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="email" 
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/5">
            <p className="text-xs text-on-surface-variant mb-4 font-medium uppercase tracking-widest">보안 확인</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant ml-1">현재 비밀번호 (필수)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/5 space-y-4">
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">비밀번호 변경 (선택)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">새 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="변경할 경우에만 입력"
                    minLength={6}
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">새 비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? '변경 사항 저장 중...' : '계정 정보 업데이트'}
          </button>
        </form>
      </div>

      {/* 데이터 관리 및 백업 섹션 */}
      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
        <h3 className="text-xl font-headline font-bold flex items-center gap-2 text-on-surface">
          <Database size={22} className="text-primary" /> 데이터 관리 및 백업
        </h3>
        
        <p className="text-xs text-on-surface-variant/80 leading-relaxed">
          제품, 주문, 회원 데이터를 엑셀(*.xlsx) 파일로 저장하거나 다시 불러올 수 있고, 필요할 때 인쇄용 화면으로 출력할 수 있습니다. 불러오기는 기존 데이터를 삭제하지 않고 ID 기준으로 수정/추가합니다.
        </p>

        {/* 엑셀 저장/불러오기/출력 영역 */}
        <div className="space-y-3 pt-2">
          {excelConfigs.map((config) => (
            <div
              key={config.kind}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10"
            >
              <div>
                <p className="font-bold text-sm text-on-surface">{config.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{config.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => downloadExcel(config.kind)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold transition-all active:scale-[0.98] text-xs text-on-surface cursor-pointer"
                >
                  <Download size={16} className="text-primary" />
                  엑셀 저장
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRefs[config.kind].current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold transition-all active:scale-[0.98] text-xs text-on-surface cursor-pointer"
                >
                  <Upload size={16} className="text-primary" />
                  엑셀 불러오기
                </button>
                <input
                  ref={fileInputRefs[config.kind]}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) importExcel(config.kind, file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => printRecords(config.kind)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest hover:bg-surface-container-highest border border-outline-variant/20 rounded-xl font-bold transition-all active:scale-[0.98] text-xs text-on-surface cursor-pointer"
                >
                  <Printer size={16} className="text-primary" />
                  출력
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 데이터베이스 초기화 영역 */}
        <div className="pt-6 border-t border-outline-variant/10 space-y-4">
          <div className="p-4 bg-error/5 rounded-2xl border border-error/20 flex gap-3">
            <ShieldAlert className="text-error shrink-0" size={20} />
            <div className="text-xs text-error font-medium leading-relaxed">
              <p className="font-extrabold mb-1">⚠️ 위험: 데이터베이스 초기화</p>
              이 작업은 되돌릴 수 없습니다. 클릭 시 등록된 모든 제품, 주문 정보, 일반 회원 데이터가 완전히 삭제됩니다. 단, 사이트 접속 및 관리를 위한 **관리자(ADMIN) 정보는 유지**됩니다.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">초기화 진행을 확인하기 위해 '초기화'를 입력하세요.</label>
              <input
                type="text"
                placeholder="초기화"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-3 px-4 focus:ring-1 focus:ring-error text-sm font-bold text-error placeholder:text-on-surface-variant/20"
              />
            </div>
            
            <button
              type="button"
              disabled={isResetting || resetConfirmInput !== '초기화'}
              onClick={handleInitializeDatabase}
              className="px-6 py-3 bg-error text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error/90 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all text-sm shrink-0 cursor-pointer"
            >
              <Trash2 size={18} />
              {isResetting ? '초기화 중...' : '모든 데이터 초기화'}
            </button>
          </div>
        </div>

        {/* 사이트 기본 정보 복원 및 브랜드 정리 영역 */}
        <div className="pt-6 border-t border-outline-variant/10 space-y-4">
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex gap-3">
            <Info className="text-primary shrink-0" size={20} />
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <p className="font-extrabold mb-1 text-primary">기본 정보 페이지 복원 및 브랜드 정리</p>
              회사소개, 이용약관, 개인정보처리방침, FAQ, 문의안내 페이지의 데이터를 복원하고 브랜드명을 **핑크버튼 / PINK BUTTON**으로 일괄 변경합니다. 이용약관은 최신 다크 프리미엄 스타일의 전용 문서로 복원되며, 개인정보처리방침의 마크다운 오류 코드가 수정됩니다.
            </div>
          </div>

          <button
            type="button"
            disabled={isRestoring}
            onClick={handleRestoreSiteContent}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98] disabled:opacity-50 transition-all text-sm cursor-pointer"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="animate-spin text-on-primary" size={18} />
                복원 및 정리 진행 중...
              </>
            ) : (
              '기본 정보 페이지 복원 및 브랜드 정리 실행'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
