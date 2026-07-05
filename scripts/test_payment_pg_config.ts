import {
  getPaymentSetupMessage,
  getPortonePaymentConfig,
  isPaymentMethodUnavailable
} from '../src/paymentConfig';

const emptyEnv = {};

const unconfiguredToss = getPortonePaymentConfig('tosspay', true, emptyEnv);
if (unconfiguredToss !== null) {
  throw new Error('토스페이 테스트 PG 채널이 없으면 결제를 막아야 합니다.');
}

if (!isPaymentMethodUnavailable('tosspay', true, emptyEnv)) {
  throw new Error('토스페이 테스트 PG 채널이 없으면 UI에서 설정 필요 상태여야 합니다.');
}

const configuredToss = getPortonePaymentConfig('tosspay', true, {
  VITE_TOSSPAY_TEST_PG: 'tosspay.test_channel'
});
if (!configuredToss || configuredToss.pgProvider !== 'tosspay.test_channel' || configuredToss.payMethod !== 'card') {
  throw new Error('토스페이 테스트 PG 채널 환경변수를 결제 설정으로 사용해야 합니다.');
}

const card = getPortonePaymentConfig('card', true, emptyEnv);
if (!card || card.pgProvider !== 'html5_inicis.TE_integration' || card.payMethod !== 'card') {
  throw new Error('카드 테스트 결제는 기본 이니시스 테스트 채널을 사용해야 합니다.');
}

const message = getPaymentSetupMessage('tosspay', true);
if (!message.includes('토스페이') || !message.includes('VITE_TOSSPAY_TEST_PG')) {
  throw new Error('토스페이 설정 안내에는 결제수단명과 환경변수명이 포함되어야 합니다.');
}

console.log(JSON.stringify({ pass: true, checked: ['tosspay-unconfigured', 'tosspay-configured', 'card-default'] }, null, 2));
