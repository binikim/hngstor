import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// 1. Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 2. Connect to SQLite
const sqliteDb = new sqlite3.Database('./database.sqlite');

// 3. Helper functions for cleaning and replacing
function cleanHtml(text) {
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
}

function replaceBrandName(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/H&G스토아/g, '핑크버튼')
    .replace(/HnG스토아/g, '핑크버튼')
    .replace(/H&G스토어/g, '핑크버튼')
    .replace(/HnG스토어/g, '핑크버튼')
    .replace(/H&G STORE/g, 'PINK BUTTON')
    .replace(/HnG STORE/g, 'PINK BUTTON')
    .replace(/H&G/g, '핑크버튼');
}

// 4. Define premium Terms of Use HTML
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
      <p>2. 이용자는 재화 등을 배송받은 날부터 7일 이내에 청약의 철회(반품 및 교환)를 할 수 있습니다. <strong>단, 제품의 포장이 훼손되거나 밀봉이 해제된 성인용품, 위생용품의 경우 상품 가치가 현저히 감소하므로 단순 변심에 의한 반품 및 교환이 불가능합니다.</strong></p>
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

async function restoreAndFix() {
  console.log('Starting siteContent restore & branding cleanup...');
  
  try {
    // ----------------------------------------------------
    // A. RESTORE 'about' (회사소개)
    // ----------------------------------------------------
    console.log('\n--- Restoring about page ---');
    const aboutRef = doc(firestore, 'siteContent', 'about');
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
    console.log('Uploaded about to Firestore.');
    
    // Save to SQLite
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['about', JSON.stringify(aboutContent)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Saved about to SQLite.');

    // ----------------------------------------------------
    // B. RESTORE 'terms' (이용약관)
    // ----------------------------------------------------
    console.log('\n--- Restoring terms page ---');
    const termsRef = doc(firestore, 'siteContent', 'terms');
    
    await setDoc(termsRef, { title: '이용약관', content: termsHtml, updatedAt: serverTimestamp() });
    console.log('Uploaded terms to Firestore.');
    
    // Save to SQLite
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['terms', JSON.stringify(termsHtml)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Saved terms to SQLite.');

    // ----------------------------------------------------
    // C. RESTORE 'privacy' (개인정보처리방침)
    // ----------------------------------------------------
    console.log('\n--- Restoring privacy page ---');
    const privacyRef = doc(firestore, 'siteContent', 'privacy');
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
    console.log('Uploaded privacy to Firestore.');
    
    // Save to SQLite
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['privacy', JSON.stringify(privacyContent)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Saved privacy to SQLite.');

    // ----------------------------------------------------
    // D. RESTORE 'faq' (자주 묻는 질문)
    // ----------------------------------------------------
    console.log('\n--- Restoring faq ---');
    const faqRef = doc(firestore, 'siteContent', 'faq');
    const faqSnap = await getDoc(faqRef);
    let faqContent = [];
    
    if (faqSnap.exists()) {
      const rawFaq = faqSnap.data().content;
      faqContent = Array.isArray(rawFaq) ? rawFaq : [];
    }
    
    // Clean H&G references inside faq
    faqContent = faqContent.map(item => ({
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
    console.log('Uploaded faq to Firestore.');
    
    // Save to SQLite
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['faq', JSON.stringify(faqContent)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Saved faq to SQLite.');

    // ----------------------------------------------------
    // E. RESTORE 'inquiry' (문의안내)
    // ----------------------------------------------------
    console.log('\n--- Restoring inquiry ---');
    const inquiryRef = doc(firestore, 'siteContent', 'inquiry');
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
    console.log('Uploaded inquiry to Firestore.');
    
    // Save to SQLite
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ['inquiry', JSON.stringify(inquiryContent)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Saved inquiry to SQLite.');

    console.log('\nAll content processed and synchronized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during restoration:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
  }
}

restoreAndFix();
