export type PaymentMethod = 'card' | 'kakaopay' | 'tosspay' | 'trans' | 'vbank' | 'cash';

export type PaymentEnv = Record<string, string | boolean | undefined>;

export type PortonePaymentConfig = {
  pgProvider: string;
  payMethod: 'card' | 'trans' | 'vbank';
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: '카드 결제',
  kakaopay: '카카오페이',
  tosspay: '토스페이',
  trans: '실시간 계좌이체',
  vbank: '가상계좌',
  cash: '무통장 입금'
};

export const PAYMENT_METHODS: Array<{ id: string; value: PaymentMethod; label: string }> = [
  { id: 'addr_paymethod0', value: 'card', label: PAYMENT_METHOD_LABELS.card },
  { id: 'addr_paymethod1', value: 'kakaopay', label: PAYMENT_METHOD_LABELS.kakaopay },
  { id: 'addr_paymethod2', value: 'tosspay', label: PAYMENT_METHOD_LABELS.tosspay },
  { id: 'addr_paymethod3', value: 'trans', label: PAYMENT_METHOD_LABELS.trans },
  { id: 'addr_paymethod4', value: 'vbank', label: PAYMENT_METHOD_LABELS.vbank },
  { id: 'addr_paymethod5', value: 'cash', label: PAYMENT_METHOD_LABELS.cash }
];

const TEST_DEFAULTS: Partial<Record<PaymentMethod, PortonePaymentConfig>> = {
  card: { pgProvider: 'html5_inicis.TE_integration', payMethod: 'card' },
  trans: { pgProvider: 'html5_inicis.TE_integration', payMethod: 'trans' },
  vbank: { pgProvider: 'html5_inicis.TE_integration', payMethod: 'vbank' }
};

const REAL_DEFAULTS: Partial<Record<PaymentMethod, PortonePaymentConfig>> = {
  card: { pgProvider: 'html5_inicis', payMethod: 'card' },
  trans: { pgProvider: 'html5_inicis', payMethod: 'trans' },
  vbank: { pgProvider: 'html5_inicis', payMethod: 'vbank' }
};

const ENV_KEYS: Partial<Record<PaymentMethod, { test: string; real: string }>> = {
  kakaopay: { test: 'VITE_KAKAOPAY_TEST_PG', real: 'VITE_KAKAOPAY_REAL_PG' },
  tosspay: { test: 'VITE_TOSSPAY_TEST_PG', real: 'VITE_TOSSPAY_REAL_PG' }
};

const envString = (env: PaymentEnv, key: string) => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export function getPortonePaymentConfig(
  method: PaymentMethod | string,
  isTestMode: boolean,
  env: PaymentEnv
): PortonePaymentConfig | null {
  if (method === 'cash') return null;

  const typedMethod = method as PaymentMethod;
  const envKeys = ENV_KEYS[typedMethod];
  if (envKeys) {
    const pgProvider = envString(env, isTestMode ? envKeys.test : envKeys.real);
    return pgProvider ? { pgProvider, payMethod: 'card' } : null;
  }

  const defaults = isTestMode ? TEST_DEFAULTS : REAL_DEFAULTS;
  return defaults[typedMethod] || null;
}

export function isPaymentMethodUnavailable(
  method: PaymentMethod | string,
  isTestMode: boolean,
  env: PaymentEnv
) {
  return method !== 'cash' && getPortonePaymentConfig(method, isTestMode, env) === null;
}

export function getPaymentSetupMessage(method: PaymentMethod | string, isTestMode: boolean) {
  const typedMethod = method as PaymentMethod;
  const label = PAYMENT_METHOD_LABELS[typedMethod] || method;
  const envKeys = ENV_KEYS[typedMethod];
  const envKey = envKeys ? (isTestMode ? envKeys.test : envKeys.real) : 'PG 환경변수';

  return `${label} 결제 채널이 아직 설정되지 않았습니다.\n\n포트원 관리자에서 ${label} PG 채널을 등록한 뒤 .env.local에 ${envKey} 값을 넣어 주세요.\n지금은 카드 결제, 가상계좌, 실시간 계좌이체 또는 무통장 입금으로 테스트해 주세요.`;
}
