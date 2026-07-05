import {
  mapOrderToExcelRow,
  mapProductToExcelRow,
  mapUserToExcelRow,
  parseExcelRowToOrder,
  parseExcelRowToProduct,
  parseExcelRowToUser
} from '../src/adminExcel';

const productRow = mapProductToExcelRow({
  id: 'p1',
  name: '테스트 상품',
  category: '남성용품',
  price: 12000,
  stock: 7,
  image: 'https://example.com/p.png',
  description: '설명',
  badge: 'NEW',
  createdAt: '2026-07-05T00:00:00.000Z'
});

if (productRow['제품 ID'] !== 'p1' || productRow['가격'] !== 12000 || productRow['재고'] !== 7) {
  throw new Error('제품 엑셀 행 변환이 올바르지 않습니다.');
}

const parsedProduct = parseExcelRowToProduct({
  '제품 ID': 'p2',
  '제품명': '불러온 상품',
  '가격': '15,000',
  '재고': '3',
  '카테고리': '여성용품'
});

if (parsedProduct.id !== 'p2' || parsedProduct.data.price !== 15000 || parsedProduct.data.stock !== 3) {
  throw new Error('제품 엑셀 불러오기 변환이 올바르지 않습니다.');
}

const orderRow = mapOrderToExcelRow({
  id: 'o1',
  userId: 'u1',
  userEmail: 'buyer@example.com',
  totalPrice: 45000,
  totalItems: 2,
  paymentMethod: 'vbank',
  paymentMethodLabel: '가상계좌',
  status: 'pending',
  shippingInfo: {
    recipientName: '홍길동',
    recipientPhone: '01012345678',
    zipCode: '10000',
    address: '서울',
    detailAddress: '101호',
    deliveryNote: '문앞'
  },
  items: [{ id: 'p1', name: '상품', price: 22500, quantity: 2, image: '' }],
  paymentInfo: { vbank_name: '테스트은행' },
  createdAt: '2026-07-05T00:00:00.000Z'
});

if (orderRow['주문 ID'] !== 'o1' || orderRow['수령인'] !== '홍길동' || !String(orderRow['주문상품 JSON']).includes('상품')) {
  throw new Error('주문 엑셀 행 변환이 올바르지 않습니다.');
}

const parsedOrder = parseExcelRowToOrder({
  '주문 ID': 'o2',
  '회원 ID': 'u2',
  '회원 이메일': 'buyer2@example.com',
  '총 결제금액': '30,000',
  '총 수량': '2',
  '상태': 'ordered',
  '결제수단': 'card',
  '결제수단명': '카드 결제',
  '수령인': '김철수',
  '연락처': '010-1111-2222',
  '우편번호': '20000',
  '주소': '부산',
  '상세주소': '202호',
  '주문상품 JSON': '[{"name":"상품2","price":15000,"quantity":2}]'
});

if (parsedOrder.id !== 'o2' || parsedOrder.data.totalPrice !== 30000 || parsedOrder.data.shippingInfo.recipientName !== '김철수') {
  throw new Error('주문 엑셀 불러오기 변환이 올바르지 않습니다.');
}

const userRow = mapUserToExcelRow({
  id: 'u1',
  email: 'user@example.com',
  displayName: '사용자',
  phoneNumber: '01000000000',
  role: 'user',
  createdAt: '2026-07-05T00:00:00.000Z'
});

if (userRow['회원 UID'] !== 'u1' || userRow['비밀번호'] !== '') {
  throw new Error('회원 엑셀 행 변환이 올바르지 않습니다.');
}

const parsedUser = parseExcelRowToUser({
  '회원 UID': 'u2',
  '이메일': 'new@example.com',
  '이름': '신규회원',
  '전화번호': '01033334444',
  '역할': 'admin',
  '비밀번호': '노출금지'
});

if (parsedUser.id !== 'u2' || parsedUser.data.role !== 'admin' || 'password' in parsedUser.data) {
  throw new Error('회원 엑셀 불러오기 변환이 올바르지 않습니다.');
}

console.log(JSON.stringify({ pass: true }, null, 2));
