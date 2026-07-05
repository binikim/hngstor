/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  CreditCard, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  MessageSquare,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
    IMP: any;
  }
}

import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  getPaymentSetupMessage,
  getPortonePaymentConfig,
  isPaymentMethodUnavailable,
  type PaymentMethod
} from '../paymentConfig';

// ==========================================
// 결제 시스템 테스트 모드 설정 (스위치)
// ==========================================
const IS_TEST_MODE = true; // 실결제 전환 시 false로 변경하세요.
const TEST_STORE_CODE = 'imp19407491'; // 포트원 공용 테스트 가맹점 식별코드
const REAL_STORE_CODE = 'YOUR_REAL_STORE_CODE'; // 실 결제 가맹점 식별코드 (예: impXXXXXXX)
const PORTONE_SCRIPT_SRC = 'https://cdn.iamport.kr/v1/iamport.js';
const PAYMENT_ENV = import.meta.env;

const formatWon = (amount: number) => `${amount.toLocaleString()}원`;

const loadPortoneScript = () => new Promise<void>((resolve, reject) => {
  if (window.IMP) {
    resolve();
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PORTONE_SCRIPT_SRC}"]`);
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('결제 모듈 로드 실패')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = PORTONE_SCRIPT_SRC;
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('결제 모듈 로드 실패'));
  document.head.appendChild(script);
});

export default function CheckoutPage() {
  const { cart, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [isOrdered, setIsOrdered] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const [orderedTotalPrice, setOrderedTotalPrice] = useState(0);

  // Cash Modal State for Bank Transfer
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    ordererName: auth.currentUser?.displayName || '',
    ordererPhone: '',
    recipientName: '',
    recipientPhone: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    deliveryNote: '',
    paymentMethod: 'card' as PaymentMethod
  });

  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);
  
  // Bank Info state
  const [bankInfo, setBankInfo] = useState({
    bankName: '신한은행',
    accountNumber: '110-523-123456',
    accountHolder: 'H&G Stoa'
  });

  // Auto-fill orderer info and fetch bank info when auth state changes
  React.useEffect(() => {
    async function fetchUserInfoAndBank() {
      if (auth.currentUser) {
        let phone = '';
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().phoneNumber) {
            phone = userDoc.data().phoneNumber;
          }
        } catch (e) {
          console.error("Error fetching user phone", e);
        }
        
        setFormData(prev => ({
          ...prev,
          ordererName: prev.ordererName || auth.currentUser?.displayName || '',
          ordererPhone: prev.ordererPhone || phone || ''
        }));
      }

      try {
        const bankDoc = await getDoc(doc(db, 'siteContent', 'bank'));
        if (bankDoc.exists() && bankDoc.data().content) {
          setBankInfo({
            bankName: bankDoc.data().content.bankName || '신한은행',
            accountNumber: bankDoc.data().content.accountNumber || '110-523-123456',
            accountHolder: bankDoc.data().content.accountHolder || 'H&G Stoa'
          });
        }
      } catch (e) {
        console.error("Error fetching bank info", e);
      }
    }
    fetchUserInfoAndBank();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-format phone numbers
    if (name === 'ordererPhone' || name === 'recipientPhone') {
      let phoneValue = value.replace(/[^0-9]/g, '');
      let formattedPhone = '';
      
      if (phoneValue.length <= 3) {
        formattedPhone = phoneValue;
      } else if (phoneValue.length <= 7) {
        formattedPhone = `${phoneValue.slice(0, 3)}-${phoneValue.slice(3)}`;
      } else if (phoneValue.length <= 11) {
        formattedPhone = `${phoneValue.slice(0, 3)}-${phoneValue.slice(3, 7)}-${phoneValue.slice(7)}`;
      } else {
        formattedPhone = `${phoneValue.slice(0, 3)}-${phoneValue.slice(3, 7)}-${phoneValue.slice(7, 11)}`;
      }
      
      setFormData(prev => {
        const next = { ...prev, [name]: formattedPhone };
        if (isSameAsOrderer && name === 'ordererPhone') {
          next.recipientPhone = formattedPhone;
        }
        return next;
      });
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        if (isSameAsOrderer && name === 'ordererName') {
          next.recipientName = value;
        }
        return next;
      });
    }
  };

  const handleSameAsOrdererChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsSameAsOrderer(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipientName: prev.ordererName,
        recipientPhone: prev.ordererPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipientName: '',
        recipientPhone: ''
      }));
    }
  };

  const openPostcode = () => {
    setIsPostcodeOpen(true);
    setTimeout(() => {
      const element_layer = document.getElementById('kakaoSearchLayer');
      if (!element_layer) return;

      new window.daum.Postcode({
        oncomplete: (data: any) => {
          let addr = '';
          if (data.userSelectedType === 'R') {
            addr = data.roadAddress;
          } else {
            addr = data.jibunAddress;
          }

          setFormData(prev => ({
            ...prev,
            zipCode: data.zonecode,
            address: addr
          }));
          setIsPostcodeOpen(false);
        },
        width: '100%',
        height: '100%',
        maxSuggestItems: 5
      }).embed(element_layer);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (cart.length === 0) {
        alert('장바구니가 비어있습니다.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.address || !formData.recipientName || !formData.recipientPhone) {
        alert('배송 정보를 모두 입력해 주세요.');
        setIsSubmitting(false);
        return;
      }

      // 1. Check stock for all items first
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            alert(`죄송합니다. [${item.name}] 제품의 재고가 부족합니다. (현재 재고: ${currentStock}개)`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 2. Process Bank Transfer (무통장 입금) immediately without PG
      if (formData.paymentMethod === 'cash') {
        const orderData = {
          userId: auth.currentUser?.uid || 'anonymous',
          userEmail: auth.currentUser?.email || 'anonymous',
          items: cart,
          totalPrice,
          totalItems,
          shippingInfo: {
            ordererName: formData.ordererName,
            ordererPhone: formData.ordererPhone,
            recipientName: formData.recipientName,
            recipientPhone: formData.recipientPhone,
            zipCode: formData.zipCode,
            address: formData.address,
            detailAddress: formData.detailAddress,
            deliveryNote: formData.deliveryNote
          },
          paymentMethod: 'cash',
          paymentMethodLabel: PAYMENT_METHOD_LABELS.cash,
          status: 'pending', // Pending payment
          createdAt: serverTimestamp()
        };

        const orderRef = await addDoc(collection(db, 'orders'), orderData);

        // Update stock
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }

        setCreatedOrderId(orderRef.id);
        setIsCashModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      // 3. Process PG Payments (Card, KakaoPay, TossPay, Trans, VBank) via Portone
      try {
        await loadPortoneScript();
      } catch (error) {
        alert('결제 모듈을 로드하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
        setIsSubmitting(false);
        return;
      }

      const { IMP } = window;
      if (!IMP) {
        alert('결제 모듈을 로드하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
        setIsSubmitting(false);
        return;
      }

      if (!IS_TEST_MODE && REAL_STORE_CODE === 'YOUR_REAL_STORE_CODE') {
        alert('실결제 가맹점 식별코드가 설정되지 않았습니다. 관리자에게 문의해 주세요.');
        setIsSubmitting(false);
        return;
      }

      // Initialize Portone with store ID (Switch between Test and Real)
      IMP.init(IS_TEST_MODE ? TEST_STORE_CODE : REAL_STORE_CODE);

      const tempMerchantUid = `mid_${new Date().getTime()}`;

      const paymentConfig = getPortonePaymentConfig(formData.paymentMethod, IS_TEST_MODE, PAYMENT_ENV);
      if (!paymentConfig) {
        alert(getPaymentSetupMessage(formData.paymentMethod, IS_TEST_MODE));
        setIsSubmitting(false);
        return;
      }

      IMP.request_pay({
        pg: paymentConfig.pgProvider,
        pay_method: paymentConfig.payMethod,
        merchant_uid: tempMerchantUid,
        name: cart.length > 1 ? `${cart[0].name} 외 ${cart.length - 1}건` : cart[0].name,
        amount: totalPrice,
        buyer_email: auth.currentUser?.email || 'anonymous',
        buyer_name: formData.recipientName,
        buyer_tel: formData.recipientPhone,
        buyer_addr: `${formData.address} ${formData.detailAddress}`,
        buyer_postcode: formData.zipCode,
      }, async (rsp: any) => {
        if (rsp.success) {
          try {
            const isVirtualAccount = formData.paymentMethod === 'vbank';
            // Save order to Firestore with payment info
            const orderData = {
              userId: auth.currentUser?.uid || 'anonymous',
              userEmail: auth.currentUser?.email || 'anonymous',
              items: cart,
              totalPrice,
              totalItems,
              shippingInfo: {
                ordererName: formData.ordererName,
                ordererPhone: formData.ordererPhone,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                zipCode: formData.zipCode,
                address: formData.address,
                detailAddress: formData.detailAddress,
                deliveryNote: formData.deliveryNote
              },
              paymentMethod: formData.paymentMethod,
              paymentMethodLabel: PAYMENT_METHOD_LABELS[formData.paymentMethod] || formData.paymentMethod,
              paymentInfo: {
                imp_uid: rsp.imp_uid,
                merchant_uid: rsp.merchant_uid,
                pg_provider: rsp.pg_provider,
                pay_method: rsp.pay_method,
                vbank_name: rsp.vbank_name,
                vbank_num: rsp.vbank_num,
                vbank_holder: rsp.vbank_holder,
                vbank_date: rsp.vbank_date
              },
              status: isVirtualAccount ? 'pending' : 'ordered',
              createdAt: serverTimestamp()
            };

            const orderRef = await addDoc(collection(db, 'orders'), orderData);

            // Update stock
            for (const item of cart) {
              const productRef = doc(db, 'products', item.id);
              await updateDoc(productRef, {
                stock: increment(-item.quantity)
              });
            }

            clearCart();
            alert(isVirtualAccount ? '가상계좌가 발급되었습니다. 입금 확인 후 배송이 시작됩니다.' : '결제 및 주문이 완료되었습니다!');
            navigate('/my-orders');
          } catch (error) {
            console.error("Order Save Error:", error);
            alert('주문 처리 중 오류가 발생했습니다. 고객센터로 문의해 주세요.');
          }
        } else {
          alert(`결제에 실패하였습니다. 사유: ${rsp.error_msg}`);
        }
        setIsSubmitting(false);
      });

    } catch (error: any) {
      console.error("Order Submission Error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <p className="text-on-surface-variant mb-6">주문할 상품이 없습니다.</p>
        <button onClick={() => navigate('/')} className="text-primary font-bold hover:underline">쇼핑하러 가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 text-sm font-medium"
        >
          <ChevronLeft size={16} /> 뒤로가기
        </button>

        <h1 className="text-4xl font-headline font-bold mb-12">주문/결제</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {/* Order Items Summary */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <ShoppingBag className="text-primary" size={20} />
                <h2 className="text-xl font-headline font-bold">주문 상품 정보</h2>
              </div>
              <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden">
                {cart.map((item, index) => (
                  <div key={item.id} className={`p-6 flex items-center gap-6 ${index !== cart.length - 1 ? 'border-b border-outline-variant/5' : ''}`}>
                    <div className="w-20 h-20 bg-surface-container-lowest rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                      <p className="text-xs text-on-surface-variant/60">수량: {item.quantity}개</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{(item.price * item.quantity).toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Orderer Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <User className="text-primary" size={20} />
                <h2 className="text-xl font-headline font-bold">주문자 정보</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant ml-1">이름</label>
                  <input 
                    type="text" 
                    name="ordererName"
                    required
                    value={formData.ordererName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                    placeholder="주문하시는 분 성함"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant ml-1">연락처</label>
                  <input 
                    type="tel" 
                    name="ordererPhone"
                    required
                    value={formData.ordererPhone}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-on-surface-variant ml-1">이메일</label>
                  <input 
                    type="email" 
                    readOnly
                    value={auth.currentUser?.email || ''}
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-4 px-4 text-on-surface-variant/60 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Info */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
                <div className="flex items-center gap-3">
                  <Truck className="text-primary" size={20} />
                  <h2 className="text-xl font-headline font-bold">배송지 정보</h2>
                </div>
                <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer hover:text-primary transition-colors font-medium">
                  <input 
                    type="checkbox" 
                    checked={isSameAsOrderer}
                    onChange={handleSameAsOrdererChange}
                    className="w-4 h-4 rounded border-outline-variant/20 text-primary focus:ring-primary cursor-pointer"
                  />
                  주문자 정보와 동일
                </label>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface-variant ml-1">받으실 분</label>
                    <input 
                      type="text" 
                      name="recipientName"
                      required
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                      placeholder="수령인 성함"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface-variant ml-1">연락처</label>
                    <input 
                      type="tel" 
                      name="recipientPhone"
                      required
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      name="zipCode"
                      required
                      readOnly
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-32 bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                      placeholder="우편번호"
                    />
                    <button 
                      type="button" 
                      onClick={openPostcode}
                      className="px-6 bg-surface-container-high text-sm font-bold rounded-xl hover:bg-surface-container-highest transition-colors"
                    >
                      주소 찾기
                    </button>
                  </div>
                  <input 
                    type="text" 
                    name="address"
                    required
                    readOnly
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                    placeholder="기본 주소"
                  />
                  <input 
                    type="text" 
                    name="detailAddress"
                    required
                    value={formData.detailAddress}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                    placeholder="상세 주소 (동, 호수 등)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant ml-1">배송 요청사항 (선택)</label>
                  <textarea 
                    name="deliveryNote"
                    value={formData.deliveryNote}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                    placeholder="배송 기사님께 전달할 메시지를 적어주세요."
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <CreditCard className="text-primary" size={20} />
                <h2 className="text-xl font-headline font-bold">결제 수단</h2>
              </div>
              
              <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PAYMENT_METHODS.map((method) => {
                      const isUnavailable = isPaymentMethodUnavailable(method.value, IS_TEST_MODE, PAYMENT_ENV);
                      const isSelected = formData.paymentMethod === method.value;

                      return (
                      <div 
                        key={method.id} 
                        onClick={() => {
                          if (isUnavailable) {
                            alert(getPaymentSetupMessage(method.value, IS_TEST_MODE));
                            return;
                          }
                          setFormData(prev => ({ ...prev, paymentMethod: method.value }));
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-outline-variant/10 hover:bg-surface-container-high'
                        } ${
                          isUnavailable ? 'opacity-50 cursor-not-allowed hover:bg-surface-container-low' : ''
                        }`}
                      >
                        <input 
                          id={method.id} 
                          name="paymentMethod" 
                          value={method.value} 
                          type="radio" 
                          checked={isSelected}
                          disabled={isUnavailable}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                          className="w-4 h-4 text-primary focus:ring-primary border-outline-variant/20"
                        />
                        <label htmlFor={method.id} className="flex-grow text-sm font-medium cursor-pointer">
                          {method.label}
                          {isUnavailable && (
                            <span className="ml-2 text-xs text-on-surface-variant">설정 필요</span>
                          )}
                        </label>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 sticky top-32 space-y-8">
              <h2 className="text-2xl font-headline font-bold">최종 결제 금액</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-on-surface-variant">
                  <span>주문 상품 ({totalItems}개)</span>
                  <span className="font-medium">{formatWon(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>배송비</span>
                  <span className="text-success font-medium">무료</span>
                </div>
                <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-end">
                  <span className="font-bold">합계</span>
                  <span className="text-3xl font-headline font-bold text-primary">{formatWon(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-xl text-xs text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-on-surface mb-1">개인정보 수집 및 이용 동의</p>
                  주문 상품 정보 및 배송지 정보를 수집하며, 이는 배송 및 고객 응대를 위해 사용됩니다.
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-container transition-all transform active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? '처리 중...' : `${formatWon(totalPrice)} 결제하기`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Postcode Modal */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[600px] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-surface-container-low">
              <h1 className="text-xl font-headline font-bold text-on-surface">우편번호 검색</h1>
              <button 
                onClick={() => setIsPostcodeOpen(false)}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 bg-white">
              <div className="flex border-b mb-4">
                <button className="px-6 py-3 border-b-2 border-primary text-primary font-bold text-sm">통합 검색</button>
                <button className="px-6 py-3 text-on-surface-variant text-sm hover:text-on-surface">지번/도로명 검색</button>
              </div>

              <div 
                id="kakaoSearchLayer" 
                style={{ width: '100%', height: '500px' }}
                className="relative bg-white"
              >
                {/* Kakao API will inject iframe here */}
              </div>
            </div>

            <div className="p-4 border-t bg-surface-container-low flex justify-center">
              <button 
                onClick={() => setIsPostcodeOpen(false)}
                className="px-8 py-3 bg-on-surface text-surface rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Modal (무통장 입금 안내) */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 flex flex-col p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-headline font-bold text-on-surface">무통장 입금 안내</h2>
              <p className="text-sm text-on-surface-variant/80 font-medium">주문이 정상적으로 접수되었습니다. 아래 계좌로 입금해 주세요.</p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">입금 은행</span>
                <span className="font-bold text-on-surface">{bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">계좌 번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface">{bankInfo.accountNumber}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(bankInfo.accountNumber);
                      alert('계좌번호가 복사되었습니다.');
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    복사
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">예금주</span>
                <span className="font-bold text-on-surface">{bankInfo.accountHolder}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">입금 금액</span>
                <span className="font-bold text-primary text-base">{totalPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">입금자명</span>
                <span className="font-bold text-on-surface">{formData.ordererName}</span>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant/70 leading-relaxed space-y-1">
              <p>• 반드시 입금자명과 금액이 일치해야 자동 확인이 가능합니다.</p>
              <p>• 주문 후 24시간 이내에 입금되지 않으면 주문이 자동으로 취소됩니다.</p>
              <p>• 입금 확인 후 배송이 시작됩니다.</p>
            </div>

            <button 
              type="button"
              onClick={() => {
                setIsCashModalOpen(false);
                clearCart();
                navigate('/my-orders');
              }}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:bg-primary-container transition-all text-center"
            >
              확인 (주문 내역으로 이동)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
