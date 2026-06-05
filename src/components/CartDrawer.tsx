/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-surface-container-highest backdrop-blur-3xl shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-primary" size={24} />
                <h2 className="text-xl font-headline font-bold">장바구니 ({totalItems})</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                aria-label="장바구니 닫기"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Fixed expanding area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 space-y-8 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <p className="font-medium">장바구니가 비어있습니다.</p>
                  <button 
                    onClick={onClose}
                    className="text-primary font-bold hover:underline"
                  >
                    쇼핑 계속하기
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-24 h-24 bg-surface-container-lowest rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-sm leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-on-surface-variant/40 hover:text-error transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-primary font-bold text-sm">{item.price.toLocaleString()} KRW</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center bg-surface-container-high rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-surface-container-highest rounded transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-surface-container-highest rounded transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 space-y-3 shrink-0">
              {cart.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-on-surface-variant font-medium">총 합계</span>
                    <span className="text-xl font-headline font-bold text-primary">{totalPrice.toLocaleString()} KRW</span>
                  </div>
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all transform active:scale-95"
                  >
                    주문하기 <ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/cart');
                    }}
                    className="w-full bg-surface-container-lowest text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all"
                  >
                    장바구니 전체보기
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  onClose();
                  navigate('/my-orders');
                }}
                className="w-full bg-surface-container-low border border-outline-variant/20 text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
              >
                주문 내역 확인
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
