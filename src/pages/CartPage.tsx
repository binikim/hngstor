/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ChevronLeft, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 max-w-md"
        >
          <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto text-on-surface-variant/20">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
          <h1 className="text-3xl font-headline font-bold">장바구니가 비어있습니다</h1>
          <p className="text-on-surface-variant leading-relaxed">
            아직 선택하신 상품이 없습니다. <br />
            핑크버튼의 프리미엄 컬렉션을 둘러보세요.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary-container transition-all transform active:scale-95"
          >
            쇼핑하러 가기 <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-4 text-sm font-medium"
            >
              <ChevronLeft size={16} /> 뒤로가기
            </button>
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">장바구니</h1>
            <p className="text-on-surface-variant mt-2 font-light">선택하신 {totalItems}개의 상품이 담겨있습니다.</p>
          </div>
          <button 
            onClick={clearCart}
            className="text-sm text-error font-medium hover:underline flex items-center gap-2"
          >
            <Trash2 size={16} /> 전체 삭제
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 flex flex-col sm:flex-row gap-6 group"
              >
                <div className="w-full sm:w-40 aspect-square bg-surface-container-lowest rounded-2xl overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-headline font-bold leading-tight">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/5 rounded-full transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="text-primary font-bold text-lg">{item.price.toLocaleString()} KRW</p>
                  </div>

                  <div className="flex items-center justify-between mt-6 sm:mt-0">
                    <div className="flex items-center bg-surface-container-high rounded-xl p-1 border border-outline-variant/5">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-12 text-center font-headline font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">소계</p>
                      <p className="text-xl font-headline font-bold">{(item.price * item.quantity).toLocaleString()} KRW</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 sticky top-32 space-y-8">
              <h2 className="text-2xl font-headline font-bold">결제 정보</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-on-surface-variant">
                  <span>상품 합계</span>
                  <span>{totalPrice.toLocaleString()} KRW</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>배송비</span>
                  <span className="text-success font-medium">무료</span>
                </div>
                <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-end">
                  <span className="font-bold">최종 결제 금액</span>
                  <div className="text-right">
                    <span className="text-3xl font-headline font-bold text-primary">{totalPrice.toLocaleString()} KRW</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-primary text-on-primary py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary-container transition-all transform active:scale-95 shadow-xl shadow-primary/20"
                >
                  <CreditCard size={20} /> 주문하기
                </button>
                <Link 
                  to="/" 
                  className="w-full bg-surface-container-lowest text-on-surface py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all"
                >
                  쇼핑 계속하기
                </Link>
              </div>

              <div className="pt-6 border-t border-outline-variant/10">
                <p className="text-[10px] text-on-surface-variant/60 leading-relaxed">
                  * 핑크버튼는 고객님의 프라이버시를 위해 모든 상품을 익명으로 안전하게 배송합니다. <br />
                  * 결제 완료 후 1-3일 이내에 배송이 시작됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
