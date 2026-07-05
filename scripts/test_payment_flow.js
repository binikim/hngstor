import sqlite3 from 'sqlite3';

const apiBase = process.env.TEST_API_BASE || 'http://127.0.0.1:3003/api';
const databasePath = process.env.DATABASE_PATH;

if (!databasePath) {
  console.error('DATABASE_PATH is required so this test never touches the real database.');
  process.exit(1);
}

const marker = `codex_payment_test_${Date.now()}`;
const productId = `${marker}_product`;
const cashOrderId = `${marker}_cash_order`;
const vbankOrderId = `${marker}_vbank_order`;

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${text}`);
  }

  return body;
}

function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath);
    db.get(sql, params, (error, row) => {
      db.close();
      if (error) reject(error);
      else resolve(row);
    });
  });
}

await request('/products', {
  method: 'POST',
  body: JSON.stringify({
    id: productId,
    name: 'Codex 결제 테스트 상품',
    category: '테스트',
    price: 1000,
    stock: 5,
    image: 'https://example.com/test.png',
    description: '자동 테스트용 상품',
    createdAt: new Date().toISOString()
  })
});

const commonOrder = {
  userId: 'codex-test-user',
  userEmail: 'codex-test@example.com',
  items: [{ id: productId, name: 'Codex 결제 테스트 상품', price: 1000, quantity: 1 }],
  totalPrice: 1000,
  totalItems: 1,
  shippingInfo: {
    ordererName: '테스트',
    ordererPhone: '010-0000-0000',
    recipientName: '테스트',
    recipientPhone: '010-0000-0000',
    address: '테스트 주소',
    detailAddress: '1층',
    zipCode: '00000'
  },
  createdAt: new Date().toISOString()
};

await request('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...commonOrder,
    id: cashOrderId,
    paymentMethod: 'cash',
    paymentMethodLabel: '무통장 입금',
    paymentInfo: {},
    status: 'pending'
  })
});

await request('/orders', {
  method: 'POST',
  body: JSON.stringify({
    ...commonOrder,
    id: vbankOrderId,
    paymentMethod: 'vbank',
    paymentMethodLabel: '가상계좌',
    paymentInfo: {
      imp_uid: `${marker}_imp`,
      merchant_uid: `${marker}_merchant`,
      pg_provider: 'html5_inicis',
      pay_method: 'vbank',
      vbank_name: '테스트은행',
      vbank_num: '1234567890',
      vbank_holder: '핑크버튼'
    },
    status: 'pending'
  })
});

await request(`/products/${productId}`, {
  method: 'PUT',
  body: JSON.stringify({ stock: 4 })
});

const product = await queryOne('SELECT stock FROM products WHERE id = ?', [productId]);
const cashOrder = await queryOne('SELECT paymentMethod, paymentMethodLabel, paymentInfo, status FROM orders WHERE id = ?', [cashOrderId]);
const vbankOrder = await queryOne('SELECT paymentMethod, paymentMethodLabel, paymentInfo, status FROM orders WHERE id = ?', [vbankOrderId]);

const cashPaymentInfo = JSON.parse(cashOrder.paymentInfo || '{}');
const vbankPaymentInfo = JSON.parse(vbankOrder.paymentInfo || '{}');

const result = {
  cash: {
    status: cashOrder.status,
    paymentMethod: cashOrder.paymentMethod,
    paymentMethodLabel: cashOrder.paymentMethodLabel,
    paymentInfoObject: typeof cashPaymentInfo === 'object'
  },
  vbank: {
    status: vbankOrder.status,
    paymentMethod: vbankOrder.paymentMethod,
    paymentMethodLabel: vbankOrder.paymentMethodLabel,
    vbankName: vbankPaymentInfo.vbank_name
  },
  stockAfterCheckout: product.stock
};

const pass = result.cash.status === 'pending'
  && result.cash.paymentMethod === 'cash'
  && result.cash.paymentMethodLabel === '무통장 입금'
  && result.cash.paymentInfoObject
  && result.vbank.status === 'pending'
  && result.vbank.paymentMethod === 'vbank'
  && result.vbank.paymentMethodLabel === '가상계좌'
  && result.vbank.vbankName === '테스트은행'
  && result.stockAfterCheckout === 4;

console.log(JSON.stringify({ pass, ...result }, null, 2));

if (!pass) {
  process.exit(1);
}
