import * as XLSX from 'xlsx';

export type ExcelKind = 'products' | 'orders' | 'users';

type AnyRecord = Record<string, any>;
type ParsedExcelEntry = { id: string; data: AnyRecord };

const kindLabels: Record<ExcelKind, string> = {
  products: '제품',
  orders: '주문',
  users: '회원'
};

const sheetNames: Record<ExcelKind, string> = {
  products: '제품관리',
  orders: '주문관리',
  users: '회원관리'
};

const toDateString = (value: any) => {
  if (!value) return '';
  if (value.toDate) return value.toDate().toLocaleString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const toNumber = (value: any, fallback = 0) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (!cleaned) return fallback;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: any) => String(value ?? '').trim();

const readJson = (value: any, fallback: any) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  const text = toText(value);
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

export const buildExcelFileName = (kind: ExcelKind) => {
  const date = new Date().toISOString().slice(0, 10);
  return `${kindLabels[kind]}관리_${date}.xlsx`;
};

export function mapProductToExcelRow(product: AnyRecord) {
  return {
    '제품 ID': product.id || '',
    '제품명': product.name || '',
    '카테고리': product.category || '',
    '가격': toNumber(product.price),
    '재고': toNumber(product.stock),
    '이미지': product.image || '',
    '설명': product.description || '',
    '배지': product.badge || '',
    '등록일': toDateString(product.createdAt)
  };
}

export function parseExcelRowToProduct(row: AnyRecord) {
  const id = toText(row['제품 ID'] || row.id);
  return {
    id,
    data: {
      name: toText(row['제품명'] || row.name),
      category: toText(row['카테고리'] || row.category),
      price: toNumber(row['가격'] || row.price),
      stock: toNumber(row['재고'] || row.stock),
      image: toText(row['이미지'] || row.image),
      description: toText(row['설명'] || row.description),
      badge: toText(row['배지'] || row.badge),
      createdAt: toText(row['등록일'] || row.createdAt) || new Date().toISOString()
    }
  };
}

export function mapOrderToExcelRow(order: AnyRecord) {
  const shippingInfo = order.shippingInfo || {};
  return {
    '주문 ID': order.id || '',
    '회원 ID': order.userId || '',
    '회원 이메일': order.userEmail || '',
    '총 결제금액': toNumber(order.totalPrice ?? order.totalAmount),
    '총 수량': toNumber(order.totalItems),
    '상태': order.status || '',
    '결제수단': order.paymentMethod || '',
    '결제수단명': order.paymentMethodLabel || '',
    '수령인': shippingInfo.recipientName || '',
    '연락처': shippingInfo.recipientPhone || '',
    '우편번호': shippingInfo.zipCode || '',
    '주소': shippingInfo.address || '',
    '상세주소': shippingInfo.detailAddress || '',
    '배송요청': shippingInfo.deliveryNote || '',
    '택배사': order.deliveryCompany || '',
    '운송장번호': order.trackingNumber || '',
    '주문상품 JSON': JSON.stringify(order.items || []),
    '결제정보 JSON': JSON.stringify(order.paymentInfo || {}),
    '등록일': toDateString(order.createdAt)
  };
}

export function parseExcelRowToOrder(row: AnyRecord) {
  const id = toText(row['주문 ID'] || row.id);
  const items = readJson(row['주문상품 JSON'] || row.items, []);
  const paymentInfo = readJson(row['결제정보 JSON'] || row.paymentInfo, {});
  return {
    id,
    data: {
      userId: toText(row['회원 ID'] || row.userId),
      userEmail: toText(row['회원 이메일'] || row.userEmail),
      totalPrice: toNumber(row['총 결제금액'] || row.totalPrice || row.totalAmount),
      totalItems: toNumber(row['총 수량'] || row.totalItems || (Array.isArray(items) ? items.length : 0)),
      status: toText(row['상태'] || row.status) || 'ordered',
      paymentMethod: toText(row['결제수단'] || row.paymentMethod),
      paymentMethodLabel: toText(row['결제수단명'] || row.paymentMethodLabel),
      shippingInfo: {
        recipientName: toText(row['수령인']),
        recipientPhone: toText(row['연락처']),
        zipCode: toText(row['우편번호']),
        address: toText(row['주소']),
        detailAddress: toText(row['상세주소']),
        deliveryNote: toText(row['배송요청'])
      },
      deliveryCompany: toText(row['택배사'] || row.deliveryCompany),
      trackingNumber: toText(row['운송장번호'] || row.trackingNumber),
      items,
      paymentInfo,
      createdAt: toText(row['등록일'] || row.createdAt) || new Date().toISOString()
    }
  };
}

export function mapUserToExcelRow(user: AnyRecord) {
  return {
    '회원 UID': user.id || user.uid || '',
    '이메일': user.email || '',
    '이름': user.displayName || '',
    '전화번호': user.phoneNumber || '',
    '역할': user.role || 'user',
    '가입일': toDateString(user.createdAt),
    '비밀번호': ''
  };
}

export function parseExcelRowToUser(row: AnyRecord) {
  const id = toText(row['회원 UID'] || row.uid || row.id);
  return {
    id,
    data: {
      email: toText(row['이메일'] || row.email),
      displayName: toText(row['이름'] || row.displayName),
      phoneNumber: toText(row['전화번호'] || row.phoneNumber),
      role: toText(row['역할'] || row.role) || 'user',
      createdAt: toText(row['가입일'] || row.createdAt) || new Date().toISOString()
    }
  };
}

export function mapRecordsToExcelRows(kind: ExcelKind, records: AnyRecord[]) {
  if (kind === 'products') return records.map(mapProductToExcelRow);
  if (kind === 'orders') return records.map(mapOrderToExcelRow);
  return records.map(mapUserToExcelRow);
}

export function parseExcelRows(kind: ExcelKind, rows: AnyRecord[]) {
  const parser: (row: AnyRecord) => ParsedExcelEntry = kind === 'products'
    ? parseExcelRowToProduct
    : kind === 'orders'
      ? parseExcelRowToOrder
      : parseExcelRowToUser;

  return rows
    .map(parser)
    .filter(entry => {
      if (kind === 'orders') return entry.id || entry.data.userEmail || entry.data.shippingInfo.recipientName;
      if (kind === 'users') return entry.id || entry.data.email;
      return entry.id || entry.data.name;
    });
}

export function writeExcelFile(kind: ExcelKind, records: AnyRecord[]) {
  const rows = mapRecordsToExcelRows(kind, records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetNames[kind]);
  XLSX.writeFile(workbook, buildExcelFileName(kind));
}

export function readExcelFile(file: File): Promise<AnyRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        resolve(XLSX.utils.sheet_to_json<AnyRecord>(worksheet, { defval: '' }));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('엑셀 파일을 읽지 못했습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

export function buildPrintHtml(kind: ExcelKind, rows: AnyRecord[]) {
  const label = kindLabels[kind];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const cells = rows.map(row => `
    <tr>
      ${headers.map(header => `<td>${String(row[header] ?? '').replace(/[<>&]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] || ch))}</td>`).join('')}
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${label}관리 출력</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif; padding: 24px; color: #111827; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p { margin: 0 0 18px; color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; word-break: break-all; }
    th { background: #f3f4f6; font-weight: 700; }
    @media print { body { padding: 12px; } button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="margin-bottom:16px;padding:10px 14px;">출력하기</button>
  <h1>${label}관리 출력</h1>
  <p>출력일: ${new Date().toLocaleString()} / 총 ${rows.length}건</p>
  <table>
    <thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
    <tbody>${cells}</tbody>
  </table>
  <script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;
}

export function openPrintWindow(kind: ExcelKind, records: AnyRecord[]) {
  const rows = mapRecordsToExcelRows(kind, records);
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    alert('팝업이 차단되어 출력 창을 열 수 없습니다. 브라우저 팝업 허용 후 다시 시도해 주세요.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintHtml(kind, rows));
  printWindow.document.close();
}
