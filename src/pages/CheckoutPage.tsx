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
  }
}

import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export default function CheckoutPage() {
  const { cart, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [isOrdered, setIsOrdered] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    paymentMethod: 'card'
  });

  // Auto-fill orderer info when auth state changes
  React.useEffect(() => {
    if (auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        ordererName: prev.ordererName || auth.currentUser?.displayName || ''
      }));
    }
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
      
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

      // 2. Create Order
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
        status: 'ordered',
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // 3. Update stock for each item
      try {
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }
      } catch (error) {
        console.error("Stock Update Error:", error);
        handleFirestoreError(error, OperationType.UPDATE, `products (OrderID: ${orderRef.id})`);
        return; // Stop here if stock update fails
      }

      setIsOrdered(true);
      clearCart();
    } catch (error: any) {
      console.error("Order Submission Error:", error);
      // If we already handled the error in the sub-try block, don't re-handle here if it was already thrown
      if (!(error.message && error.message.includes('"operationType"'))) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 max-w-2xl w-full bg-surface-container-low p-8 md:p-12 rounded-3xl border border-outline-variant/10 shadow-2xl"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-3xl font-headline font-bold">주문이 완료되었습니다!</h1>
            <p className="text-on-surface-variant leading-relaxed">
              핑크버튼를 이용해 주셔서 감사합니다. <br />
              고객님의 프라이버시를 위해 송장에는 <br />
              <span className="text-primary font-bold">'의류' 또는 '생활잡화'</span>로 기재되어 안전하게 배송됩니다.
            </p>
          </div>

          {/* Order Summary in Success Page */}
          <div className="bg-surface-container-high rounded-2xl p-6 space-y-6 text-left">
            <h2 className="font-headline font-bold border-b border-outline-variant/10 pb-3">주문 상품 정보</h2>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-on-surface-variant/60 text-xs">수량: {item.quantity}개</p>
                    </div>
                  </div>
                  <span className="font-bold">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center font-bold">
              <span>총 결제 금액</span>
              <span className="text-xl text-primary">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          {/* Shipping Info in Success Page */}
          <div className="bg-surface-container-high rounded-2xl p-6 space-y-4 text-left">
            <h2 className="font-headline font-bold border-b border-outline-variant/10 pb-3">배송 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-on-surface-variant/60 mb-1">받으시는 분</p>
                <p className="font-bold">{formData.recipientName}</p>
              </div>
              <div>
                <p className="text-on-surface-variant/60 mb-1">연락처</p>
                <p className="font-bold">{formData.recipientPhone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-on-surface-variant/60 mb-1">배송지 주소</p>
                <p className="font-bold">[{formData.zipCode}] {formData.address} {formData.detailAddress}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:bg-primary-container transition-all"
          >
            홈으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

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
              <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                <Truck className="text-primary" size={20} />
                <h2 className="text-xl font-headline font-bold">배송지 정보</h2>
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
                    {[
                      { id: 'addr_paymethod0', value: 'card', label: '카드 결제' },
                      { id: 'addr_paymethod1', value: 'tcash', label: '에스크로(실시간 계좌이체)' },
                      { id: 'addr_paymethod2', value: 'icash', label: '가상계좌' },
                      { id: 'addr_paymethod3', value: 'kakaopay', label: '카카오페이(간편결제)' },
                      { id: 'addr_paymethod4', value: 'cell', label: '휴대폰 결제' },
                      { id: 'addr_paymethod5', value: 'cash', label: '무통장 입금' },
                      { id: 'addr_paymethod6', value: 'danalpay_ispay', label: '삼성페이' },
                    ].map((method) => (
                      <div 
                        key={method.id} 
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                          formData.paymentMethod === method.value 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-outline-variant/10 hover:bg-surface-container-high'
                        }`}
                      >
                        <input 
                          id={method.id} 
                          name="paymentMethod" 
                          value={method.value} 
                          type="radio" 
                          checked={formData.paymentMethod === method.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-4 h-4 text-primary focus:ring-primary border-outline-variant/20"
                        />
                        <label htmlFor={method.id} className="flex-grow text-sm font-medium cursor-pointer">
                          {method.label}
                        </label>
                      </div>
                    ))}
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
                  <span className="font-medium">{totalPrice.toLocaleString()} KRW</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>배송비</span>
                  <span className="text-success font-medium">무료</span>
                </div>
                <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-end">
                  <span className="font-bold">합계</span>
                  <span className="text-3xl font-headline font-bold text-primary">{totalPrice.toLocaleString()} KRW</span>
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
                  {isSubmitting ? '처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
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
    </div>
  );
}
