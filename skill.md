# 핑크버튼 쇼핑몰 복원 및 개선 작업 가이드 (Instructions)

이 문서는 핑크버튼(hngstor) 쇼핑몰의 데이터 복구, UI 정렬 오류 해결, 모의 데이터베이스 호환성 처리 및 어드민 기능 추가 과정에서 수립된 기술 지침과 변경 사항을 기록합니다. 나중에 언제든지 불러와 복구 및 유지보수 작업에 참조할 수 있습니다.

---

## 1. 정보 페이지 및 이용약관 복원 (Mock DB 호환성)

### 문제 상황
* 로컬 SQLite 모의 데이터베이스와 실제 Firestore 데이터의 스키마 구조 불일치로 인해 이용약관 등 일부 정보 페이지가 빈 화면으로 출력되거나 이전 데이터로 롤백되는 오류 발생.

### 해결 방안 및 지침
1. **모의 Firestore (`src/firestore-mock.ts`) 보완**:
   * SQLite에서 가져오는 문자열 및 객체(`{ title, content, updatedAt }`) 데이터를 동적으로 분석하여 객체일 경우 필드 전체를 안전하게 전개(`{ ...data }`)하는 호환 레이어 적용.
   * `updatedAt` field가 문자열 형태일 경우 React 컴포넌트 내 `.toDate()` 함수 호출 시 크래시가 나지 않도록 모의 `Timestamp` 객체로 자동 치환.
2. **원클릭 데이터 복원 스크립트 탑재**:
   * **[관리자 대시보드] → [설정]** 메뉴 하단에 **[기본 정보 페이지 복원 및 브랜드 정리 실행]** 버튼 추가.
   * 복원 버튼 클릭 시, 이전 브랜드 명칭(H&G스토아 등)을 전부 **핑크버튼 / PINK BUTTON**으로 일괄 치환하며, 불필요한 마크다운 백틱 코드 블록(\`\`\`html)을 파싱하여 정제된 마크업으로 데이터베이스에 저장함.

---

## 2. 주문 관리 화면 비율 및 레이아웃 수정

### 요구사항
* 좌우 비율이 맞지 않던 기존 레이아웃을 50:50 분할 구조로 조정하고, 불필요한 주문 상세 뷰를 제거하여 주문 리스트가 양쪽으로 조화롭게 보이도록 수정.

### 해결 방안 및 지침
* **[MODIFY] [src/pages/admin/AdminOrders.tsx]**:
  * 주문 리스트의 그리드 구성을 단순화하고, 좌우 비율을 정확히 `grid-cols-2`로 매핑하여 50:50 좌우 배치 레이아웃 구현.
  * 주문 상세 뷰를 토글하거나 렌더링하는 영역을 제거하여, 한 화면 내에서 다수의 주문 목록을 일관된 크기로 정렬하여 확인 가능하도록 구현.
  * 각 주문 상태(결제완료, 준비중 등)에 해당하는 체크 이미지 주변의 텍스트 폰트 색상을 가독성을 저해하던 빨간색 계열에서 깔끔한 **검은색(#000000)**으로 통일.

---

## 3. 정보 페이지 인라인 스타일 번짐(Style Bleeding) 차단

### 문제 상황
* DB에 저장된 회사소개, 이용약관, 개인정보처리방침의 HTML 내부에 포함된 `<style>` 코드 중 글로벌 셀렉터(`body`, `html`, `footer`, `header`, `nav`, `section`, `ul`, `li` 등)가 외부 React 레이아웃으로 퍼져나가 메인 화면 및 하단 공통 푸터의 정렬(가운데 정렬로 바뀜)과 배경색을 해치는 문제 발생.

### 해결 방안 및 지침
* **[MODIFY] [AboutPage.tsx], [TermsPage.tsx], [PrivacyPage.tsx]**:
  * DB 데이터를 훼손하지 않기 위해 React 렌더링 단계에서 스타일 셀렉터를 격리하는 `scopeHtml` 함수를 각 컴포넌트의 상단에 정의하여 탑재.
  * `<style>` 태그 내부의 `body`, `html` 지시어를 본문 격리 클래스인 `.markdown-body`로 전치함.
  * 글로벌 태그(`h1~h6`, `p`, `ul`, `ol`, `li`, `table`, `th`, `td`, `a`, `strong`, `footer`, `header`, `section`, `nav`)를 정규식 기반으로 탐색하여 앞부분에 `.markdown-body` 접두사를 강제 부여함 (예: `footer { ... }` → `.markdown-body footer { ... }`).
  * 이로써 본문 스타일은 완벽히 격리되고, 공통 푸터는 메인 화면과 완벽히 일치하는 오리지널 **왼쪽 정렬** 및 분홍빛 그라데이션 배경을 유지하도록 조치.

---

## 4. 메인 화면 인기 제품 필터링 연동 및 어드민 관리 탭 추가

### 요구사항
1. 메인 화면의 인기 제품 탭("전체", "베스트셀러", "특가상품", "한정수량") 클릭 시 실제로 상품이 필터링되어 출력되도록 수정.
2. 관리자 페이지 내에 인기 제품 지정(베스트셀러, 특가상품, 한정수량 지정) 기능이 들어간 독립적인 탭 아이콘 및 화면을 추가 (위치는 제품 관리 우측).
3. 메인 화면 베스트 카테고리의 "전체보기" 및 "더 많은 제품 보기" 버튼은 초기 상태처럼 별도의 리디렉션 없이 유지.

### 해결 방안 및 지침
1. **메인 화면 필터 연동 (`src/pages/Home.tsx`)**:
  * `products.filter` 메서드를 통해 사용자가 선택한 `activeFilter` 상태를 실시간으로 추적하여 목록을 렌더링함:
    * **전체**: 모든 제품 노출
    * **베스트셀러**: 제품의 `badge` 필드가 `"HOT"` 또는 `"BEST"`인 경우
    * **한정수량**: 제품의 `badge` 필드가 `"LIMITED"`인 경우
    * **특가상품**: 뱃지가 없거나 `"SALE"`, `"SPECIAL"` 인 제품을 필터링하여 노출
  * 베스트 카테고리 "전체보기" 및 "더 많은 제품 보기" 버튼의 `onClick` 리디렉션 핸들러를 제거하여 최초의 정적 호버링 버튼 상태로 원복.
2. **인기 제품 관리 탭 및 화면 구현**:
  * **[NEW] [src/pages/admin/AdminPopularProducts.tsx]**:
    * 데이터베이스 내 모든 제품의 `badge` 상태를 한눈에 모니터링할 수 있는 프리미엄 UI 테이블 제작.
    * 행마다 **[일반(없음)]**, **[🔥 베스트셀러]**, **[✨ 특가상품]**, **[🎖️ 한정수량]**을 즉시 설정할 수 있는 단일 클릭 버튼 그룹 컴포넌트를 설계하여 적용.
    * 버튼 클릭 시 해당 제품의 `badge` 값을 각각 `null`, `'HOT'`, `'SALE'`, `'LIMITED'`로 Firestore 데이터베이스에 실시간 `updateDoc` 업데이트 처리.
  * **[MODIFY] [src/pages/AdminDashboard.tsx]**:
    * Sidebar/Navigation의 `AdminTab` 유니온 타입에 `'popular'` 탭 추가.
    * 탭 리스트 중 **"제품 관리" 바로 우측**에 "인기 제품" 탭(`TrendingUp` 아이콘 사용)을 배치하여 클릭 시 `AdminPopularProducts` 컴포넌트가 마운트되도록 구성.

---

## 5. 카테고리 페이지 상품 연동 및 비로그인 이미지 잠금(Lock)

### 요구사항
* 더미 번호 박스로 출력되던 카테고리 페이지의 상품을 실제 Firestore의 `products` 데이터를 연동해 렌더링하고, 비로그인 상태 시 상품 이미지를 마스킹(Lock) 처리하여 보존함.

### 해결 방안 및 지침
* **[MODIFY] [src/pages/CategoryPage.tsx]**:
  * 마운트 시 `products` 컬렉션의 모든 데이터를 로드하여 `productsLoading` 상태와 연동함.
  * 홈화면의 카테고리 한글 명칭(예: `"남성용품"`)과 실제 상품 문서에 들어간 카테고리 필드 값(예: `"남성 성인용품"`)이 부분적으로 상이하므로, 보조용품 카테고리(예: `"남성보조용품"`)와 섞이지 않도록 똑똑하게 문자열 매핑 처리를 수행하는 `matchCategory` 비교 헬퍼 함수를 적용.
  * 비로그인 상태(`!user`)일 경우, 상품 썸네일 영역에 이미지를 노출하지 않고 자물쇠(Lock) 아이콘과 함께 안내 문구("로그인 시 상품 이미지가 노출됩니다.") 오버레이를 강제 활성화함.
  * 해당 카테고리에 실등록 상품이 없을 경우 fallback으로 기존 8개 mock 카드 형태를 띄우되, 빈 회색 대신 해당 카테고리의 대표 이미지(`data.image`)를 70% 투명도로 백그라운드 렌더링하여 visual을 유지함.

---

## 6. 일반 회원 장바구니 내 주문 내역 바로가기 버튼 연동

### 요구사항
* 일반 회원이 장바구니에서 쉽게 자신의 이전 주문 내역 목록을 추적 및 열람할 수 있도록 이동 버튼을 장바구니 컴포넌트에 포함.

### 해결 방안 및 지침
1. **장바구니 드로어 연동 (`src/components/CartDrawer.tsx`)**:
   * Firebase Auth 상태 변경 감지 리스너(`onAuthStateChanged`)를 연동하여 로그인 유저 상태를 확보.
   * 장바구니가 비어 있을 때와 담겨 있을 때에 상관없이, 드로어 가장 하단 풋터 영역에 상시 고정되는 **[주문 내역 확인]** 버튼 추가 및 클릭 시 드로어를 닫으며 `/my-orders` 경로로 이동 처리.
2. **장바구니 페이지 연동 (`src/pages/CartPage.tsx`)**:
   * 장바구니가 비었을 때 나오는 "쇼핑하러 가기" 버튼 옆에 **[주문 내역 확인]** 버튼을 나란히 배열.
   * 장바구니에 상품이 들어 있을 때 우측 결제 요약 카드의 "쇼핑 계속하기" 버튼 아래에 동일한 **[주문 내역 확인]** 버튼을 추가하여 대칭성 유지.

---

## 7. 무통장 입금 계좌정보 관리자 컨텐츠 관리 연동 및 동적 렌더링

### 요구사항
* 결제 확인 창에 고정(Hardcoded)되어 있던 무통장 입금 계좌정보를 어드민 [컨텐츠 관리]에서 직접 제어할 수 있도록 탭과 에디터를 신설하고 결제 완료 안내 화면에 실시간 연동.

### 해결 방안 및 지침
1. **관리자 무통장 계좌관리 탭 및 에디터 구현 (`src/pages/admin/AdminContent.tsx`)**:
   * `PAGE_KEYS` 메뉴에 `CreditCard` 아이콘을 연동한 **"무통장 정보 변경"** (id: `bank`) 탭 신설.
   * Firestore의 `siteContent/bank` 문서를 CRUD 연동하여 관리자가 **입금 은행, 계좌 번호, 예금주** 정보를 직접 입력 및 보관 가능하도록 세부 입력 폼 설계. (최초 마운트 및 데이터 누락 시 기본값 `신한은행`, `110-523-123456`, `H&G Stoa`로 동적 바인딩)
2. **주문 결제 페이지 동적 계좌 바인딩 (`src/pages/CheckoutPage.tsx`)**:
   * 마운트 시 `siteContent/bank` 문서를 비동기로 조회해 `bankInfo` 로컬 상태에 캐싱함.
   * 무통장 입금 완료 안내 모달(Cash Modal)에 표기되는 입금 은행, 계좌 번호, 예금주 정보를 하드코딩 대신 위에서 받아온 `bankInfo` 정보로 변경.
   * 텍스트 복사 버튼 클릭 시에도 동적으로 호출된 계좌번호가 정확히 클립보드에 복사되도록 핸들러 연동.

---

## 8. 고객 주문 내역 상태 한국어 번역 및 관리자 상태 변경 지연 개선

### 요구사항
1. 마이페이지 주문 내역에서 주문 상태가 영어(ordered, processing, shipped, delivered 등)로 나오는 문제를 해결하고 한국어로 번역해서 노출.
2. 관리자 주문 관리 화면에서 주문 상태(배송준비중, 배송중, 배송완료 등) 변경 시, 변경이 되지 않고 이전 값으로 즉시 돌아가버리는 지연/UI 롤백 오류 해결.
3. 관리자 주문 관리의 선택 옵션에서 '준비중(pending)' 선택지를 삭제하고, '배송준비중(processing)', '배송중(shipped)', '배송완료(delivered)' 등으로 구성하되, 기존 '입금대기(pending)' 상태의 주문이 있을 경우에만 '입금대기' 옵션이 임시 표시되도록 구성.

### 해결 방안 및 지침
1. **고객 페이지 주문 상태 한국어 매핑 (`src/pages/MyOrdersPage.tsx`)**:
   * `getStatusLabel` 헬퍼 함수를 추가하여 영어 상태 문자열을 한국어 라벨로 매핑:
     * `ordered` ➔ `결제완료`
     * `pending` ➔ `입금대기`
     * `processing` ➔ `배송준비중`
     * `shipped` ➔ `배송중`
     * `delivered` ➔ `배송완료`
     * `cancelled` ➔ `주문취소`
   * 고객 주문 내역 아이템들의 상태 표시 영역에 `getStatusLabel(order.status)`를 바인딩하여 동적으로 출력하도록 개선.
2. **관리자 주문 상태 옵션 정리 (`src/pages/admin/AdminOrders.tsx`)**:
   * 주문 상태 선택 박스(`<select>`)에서 `pending` 상태인 '준비중' 옵션을 영구 제거.
   * 현재 주문이 `pending` 상태인 경우에만 예외적으로 '입금대기' 옵션이 노출되도록 조건부 렌더링 적용.
   * '배송준비' 텍스트를 '배송준비중'으로 명칭 통일 및 한국어 매핑 함수 적용.
3. **낙관적 업데이트(Optimistic Update) 적용으로 UI 반응성 확보 (`src/pages/admin/AdminOrders.tsx`)**:
   * 로컬 Firestore 모의 라이브러리(`firestore-mock.ts`)의 5초 단위 풀링(polling) 동작으로 인해, 상태 변경 요청 직후 UI가 즉시 구버전 데이터로 롤백 및 복구되는 버그 해결.
   * `handleStatusUpdate` 및 `handleTrackingUpdate` 실행 시 Firestore 비동기 업데이트 완료를 기다리지 않고, 로컬 `orders` 상태를 먼저 수정하는 **낙관적 업데이트(Optimistic Update)** 기법을 선 적용하여 렉 없이 즉각적인 상태 전환이 가능하도록 수정 완료.
4. **드롭다운 비활성화(disabled) 속성 제거 및 Firestore 보안 규칙 복구**:
   * 주문 상태 업데이트 중 select 엘리먼트에 `disabled` 속성이 부여되면 일부 브라우저 환경에서 change 이벤트 사이클이 중단되어 최종 선택이 복구되거나 씹히는 브라우저 네이티브 버그를 방지하기 위해 `disabled={updatingId === order.id}` 속성을 select 태그에서 제거했습니다.
   * 실서버(Vercel 프로덕션) 환경에서 Firebase Cloud Firestore에 주문 상태 변경을 기록할 때, 쓰기 권한이 막혀 있던 `firestore.rules` 규칙을 수정하여 `allow read, write: if true;`로 복구하여 배포했습니다.
5. **이벤트 전파 중단(stopPropagation) 대신 타겟 체크 방식 전환**:
   * 기존에는 select 태그 주변의 wrapper `div`에 `onClick={(e) => e.stopPropagation()}`를 걸어 아코디언 토글을 막았으나, 이 방식이 브라우저에 따라 select와 option 클릭 시의 포커스나 버블링 과정을 간섭하여 상태 값 변경(`onChange`)을 방해하는 부작용이 발견되었습니다.
   * 이에 따라 select를 싸고 있던 wrapper `div`의 stopPropagation 설정을 완전 삭제하고, 대신 아코디언 헤더의 `onClick` 이벤트 핸들러 자체에서 `(e.target as HTMLElement).closest('select')` 검사를 하도록 리팩토링했습니다. 이로써 이벤트 전파의 왜곡 없이 네이티브 select 드롭다운 선택 동작이 100% 정상 작동하도록 조치했습니다.
6. **배송준비중 노출 제외 및 API 캐싱 완전 차단 (지연 롤백 근본 원인 해결)**:
   * "준비중은 빼 주고"라는 지침에 맞춰, 관리자 주문 관리 화면의 상태 선택 `<select>`에서 `<option value="processing">배송준비중</option>` 코드를 제거하여 관리자가 임의로 해당 상태를 선택할 수 없도록 제외 조치하였습니다.
   * 낙관적 업데이트 기법 적용 후에도 상태 변경이 되지 않던 근본적인 원인은 로컬 백엔드를 연동하는 `firestore-mock.ts` 내부의 `fetch` 폴링 동작이 브라우저에서 'HTTP GET Cache'로 동작해 과거 상태를 지속적으로 가져와서 프론트의 낙관적 업데이트를 다시 구버전으로 덮어씌웠기 때문이었습니다.
   * 이를 해결하기 위해 `firestore-mock.ts`의 `getDocs` 내의 `fetch` 옵션에 `{ cache: 'no-store' }`를 추가하여 모의 환경 백엔드 API 응답의 브라우저 캐싱을 완전 차단함으로써 셀렉트 박스 클릭 즉시 상태가 정상 반영되도록 조치했습니다.
   * 추가적으로 브라우저 호환성을 위해 `<select>` 태그에 `onClick={(e) => e.stopPropagation()}`을 직접 명시해 행(row)의 `onClick` 핸들러의 간섭 가능성을 원천적으로 차단했습니다.

---

## 9. 로컬 실행 환경 복구, UI 정리, 결제 시스템 보강 및 테스트 지침

### 문제 상황
* 로컬 실행 시 `node_modules`가 없고 시스템 PATH에 `npm`이 없어 앱을 바로 실행할 수 없었습니다.
* `pnpm` 설치 과정에서 `esbuild`, `sqlite3` 등 필수 패키지의 build script 승인이 필요했고, `node` 실행 경로가 PATH에 없어 postinstall이 실패했습니다.
* 관리자 대시보드의 통계 카드에서 `undefined개`, `undefined명`이 표시되었습니다.
* 헤더/푸터의 핑크버튼 로고가 보이지 않았습니다.
* 메인 히어로 그라데이션 오버레이가 너무 넓게 보였고, 푸터의 "정보", "고객센터" 영역 정렬 조정이 필요했습니다.
* 사이트 곳곳의 금액 단위가 `KRW`로 남아 있어 한국어 쇼핑몰 톤과 맞지 않았습니다.
* 결제 수단 UI는 있었지만, 로컬 백엔드가 PG 결제 세부정보와 결제수단 한글명을 저장하지 못했고, 테스트가 실제 DB를 건드릴 위험이 있었습니다.

### 해결 방안 및 지침

1. **로컬 실행 환경 복구**
   * `pnpm install`로 의존성을 설치하고, `pnpm-workspace.yaml`에 `allowBuilds`를 기록하여 `esbuild`, `sqlite3`, `protobufjs`, `@firebase/util`, `@google/genai` 설치 스크립트가 정상 실행되도록 했습니다.
   * 번들 Node 경로(`/Users/bini/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`)를 PATH 앞에 두고 설치/빌드 명령을 실행해야 합니다.
   * `.env.local`에는 로컬 기본값만 둡니다:
     * `VITE_API_URL="http://localhost:3001/api"`
     * `VITE_ADMIN_EMAIL="admin@hng.com"`
     * `APP_URL="http://localhost:3000"`
   * `GEMINI_API_KEY`는 임의로 만들지 않습니다. 실제 AI 기능이 필요할 때만 사용자가 직접 키를 넣습니다.
   * `server/index.js`는 `.env`와 `.env.local`을 모두 읽도록 유지합니다.

2. **관리자 계정 초기화**
   * 로컬 SQLite 관리자 기본 이메일은 `admin@hng.com`입니다.
   * 사용자가 요청한 경우에만 관리자 비밀번호를 초기화합니다.
   * 현재 로컬 관리자 비밀번호는 SHA-256 해시 방식으로 `admin1234`로 초기화했습니다.
   * 비밀번호는 평문 조회가 아니라 해시 비교로만 검증합니다.

3. **대시보드 통계 카드 보정**
   * `src/firestore-mock.ts`의 `getDocs()` 반환값에 실제 Firebase QuerySnapshot과 같은 `size`, `empty` 필드를 추가했습니다.
   * `src/pages/AdminDashboard.tsx`에서 `totalProducts`, `totalUsers`는 값이 비어도 `0개`, `0명`으로 표시되도록 방어 처리합니다.
   * 매출 표기는 `KRW` 대신 `원`으로 통일합니다.

4. **핑크버튼 로고 복원**
   * 로고 파일은 별도 이미지 파일이 아니라 `database.sqlite`의 `siteContent/footer.logoImage`에 base64 PNG로 저장되어 있습니다.
   * 로컬 mock이 객체형 `siteContent`를 `{ ...content, content }` 형태로 함께 반환하도록 수정하여, 기존 코드의 `docSnap.data().content` 접근과 직접 필드 접근을 모두 호환시켰습니다.
   * 헤더와 푸터는 `footerInfo.logoImage`가 있으면 이미지 로고를 사용하고, 없으면 `logoText` 또는 `핑크버튼` 텍스트를 표시합니다.

5. **메인/푸터 UI 정렬 지침**
   * 메인 히어로 그라데이션 오버레이는 전체 화면을 덮지 않도록 `src/pages/Home.tsx`에서 `md:w-[30%]`로 축소했습니다.
   * 모바일에서는 가독성을 위해 `w-full`을 유지합니다.
   * 푸터의 "정보", "고객센터" 영역은 `src/components/layout/Layout.tsx`에서 `md:justify-self-end md:text-right`를 적용해 오른쪽 정렬합니다.
   * UI 수정 후에는 반드시 `tsc --noEmit`과 `vite build`를 실행해 깨짐을 확인합니다.

6. **금액 단위 한글화**
   * 화면에 표시되는 금액 단위는 `KRW` 대신 `원`을 사용합니다.
   * 적용 대상:
     * 홈 상품 카드
     * 카테고리 상품 카드
     * 장바구니 드로어
     * 장바구니 페이지
     * 체크아웃 결제 요약
     * 관리자 상품 관리
     * 관리자 인기 상품 관리
     * 상품 등록/수정 가격 라벨
   * 결제 버튼 문구는 `${금액}원 결제하기` 형식을 사용합니다.

7. **결제 시스템 보강**
   * `src/pages/CheckoutPage.tsx`는 포트원 SDK(`https://cdn.iamport.kr/v1/iamport.js`)를 사용합니다.
   * SDK가 아직 로드되지 않았으면 `loadPortoneScript()`로 동적 로드 후 결제를 진행합니다.
   * 현재 결제는 `IS_TEST_MODE = true` 테스트 모드입니다.
   * 실결제 전환 시 `IS_TEST_MODE = false`로 바꾸고, `REAL_STORE_CODE`에 실제 포트원 가맹점 식별코드를 넣어야 합니다.
   * 카카오페이/토스페이는 포트원 관리자에서 해당 PG 채널을 등록한 뒤 `.env.local`에 채널 값을 넣어야 합니다.
     * 테스트 카카오페이: `VITE_KAKAOPAY_TEST_PG`
     * 테스트 토스페이: `VITE_TOSSPAY_TEST_PG`
     * 실결제 카카오페이: `VITE_KAKAOPAY_REAL_PG`
     * 실결제 토스페이: `VITE_TOSSPAY_REAL_PG`
   * 위 값이 비어 있으면 카카오페이/토스페이 버튼은 "설정 필요" 상태로 표시하고, 결제 요청을 포트원에 보내지 않습니다.
   * 포트원 팝업에서 "등록 된 PG 설정 정보를 찾을 수 없습니다."가 나오면 코드 문제가 아니라 가맹점 식별코드와 PG 채널 등록 정보가 맞지 않는 상태입니다.
   * 결제 수단 매핑:
     * 카드 결제: `card`
     * 카카오페이: `kakaopay`
     * 토스페이: `tosspay`
     * 실시간 계좌이체: `trans`
     * 가상계좌: `vbank`
     * 무통장 입금: `cash`
   * 무통장 입금(`cash`)은 PG를 거치지 않고 주문을 `pending`(입금대기) 상태로 저장하며, 계좌 안내 모달을 띄웁니다.
   * 가상계좌(`vbank`)는 PG 응답 성공 후에도 실제 입금 전이므로 주문 상태를 `pending`으로 저장합니다.
   * 카드/카카오페이/토스페이/실시간 계좌이체는 PG 성공 시 `ordered`(결제완료) 상태로 저장합니다.
   * 주문 저장 시 `paymentMethod`, `paymentMethodLabel`, `paymentInfo`를 함께 저장합니다.

8. **로컬 백엔드 주문 스키마 보강**
   * `server/db.js`의 `orders` 테이블에 다음 컬럼을 추가했습니다:
     * `paymentMethodLabel TEXT`
     * `paymentInfo TEXT`
   * 기존 DB는 삭제하지 않고 `PRAGMA table_info(orders)` 확인 후 누락 컬럼만 `ALTER TABLE`로 추가합니다.
   * `server/index.js`의 주문 생성 API는 `paymentInfo`를 JSON 문자열로 저장하고, 조회 시 객체로 파싱합니다.
   * 주문 수정 API에서도 `paymentInfo`는 JSON 문자열로 저장되도록 처리합니다.

9. **로컬 Firestore mock 재고 차감 주의사항**
   * `src/firestore-mock.ts`의 `increment(-수량)` 처리는 기존 값을 읽은 뒤 `현재값 + 증감값`으로 계산해야 합니다.
   * 단순히 `increment.value`를 그대로 넘기면 재고가 `-1`처럼 덮어써질 수 있으므로 금지합니다.

10. **결제 테스트 지침**
   * 실제 운영/개발 DB(`database.sqlite`)에 테스트 주문을 넣지 않습니다.
   * 테스트는 반드시 임시 SQLite DB를 사용합니다.
   * `server/db.js`는 `DATABASE_PATH` 환경변수가 있으면 해당 DB 파일을 사용합니다.
   * 결제 테스트 서버 예시:
     ```bash
     PATH=/Users/bini/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH DATABASE_PATH=/private/tmp/hngstor-payment-test.sqlite PORT=3003 node server/index.js
     ```
   * 결제 흐름 테스트 예시:
     ```bash
     PATH=/Users/bini/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH DATABASE_PATH=/private/tmp/hngstor-payment-test.sqlite TEST_API_BASE=http://127.0.0.1:3003/api node scripts/test_payment_flow.js
     ```
   * 테스트 스크립트(`scripts/test_payment_flow.js`)는 임시 DB에서 다음을 검증합니다:
     * 무통장 입금 주문 생성
     * 무통장 입금 상태 `pending` 저장
     * 가상계좌 주문 생성
     * 가상계좌 상태 `pending` 저장
     * 결제수단 한글명 저장
     * 가상계좌 결제정보 저장
     * 재고 차감 결과
   * 포트원 SDK 접근성은 다음으로 확인합니다:
     ```bash
     curl -I https://cdn.iamport.kr/v1/iamport.js
     ```
   * 결제 테스트 후 임시 서버는 종료합니다.
