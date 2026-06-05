/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Package, 
  Calendar, 
  CreditCard,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';
import { UserX, AlertTriangle, Settings } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  createdAt: any;
  shippingInfo: {
    recipientName: string;
    recipientPhone?: string;
    address: string;
    detailAddress: string;
  };
}

// Phone number formatter for display
const formatPhoneNumber = (phone: string | undefined) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    if (cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const getStatusLabel = (status: string) => {
  const mapping: Record<string, string> = {
    ordered: '결제완료',
    pending: '입금대기',
    processing: '배송준비중',
    shipped: '배송중',
    delivered: '배송완료',
    cancelled: '주문취소'
  };
  return mapping[status] || status;
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteAccount = async () => {
    if (!user) return;

    const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
    if (user.email?.toLowerCase() === defaultAdminEmail) {
      alert('관리자 계정은 탈퇴할 수 없습니다. 관리자 페이지에서 관리해 주세요.');
      return;
    }

    const confirm1 = window.confirm('정말 탈퇴하시겠습니까? 모든 주문 내역과 개인정보가 삭제되며 복구할 수 없습니다.');
    if (!confirm1) return;

    const confirm2 = window.confirm('마지막 확인입니다. 정말로 계정을 삭제하시겠습니까?');
    if (!confirm2) return;

    setLoading(true);
    try {
      // 1. Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete user from Firebase Auth
      await deleteUser(user);
      
      alert('회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 다시 로그인한 후 탈퇴를 진행해 주세요.');
        await signOut(auth);
        navigate('/login');
      } else {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">주문 내역</h1>
            <p className="text-on-surface-variant font-light">고객님께서 주문하신 상품 목록입니다.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/profile"
              className="flex items-center gap-2 px-6 py-3 bg-surface-container-high rounded-xl text-sm font-bold hover:bg-primary hover:text-on-primary transition-all group"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              회원 정보 수정
            </Link>
            <div className="hidden md:block">
              <div className="bg-surface-container-low px-6 py-4 rounded-2xl border border-outline-variant/10">
                <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest mb-1">총 주문 건수</p>
                <p className="text-2xl font-headline font-bold text-primary">{orders.length}건</p>
              </div>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-surface-container-low rounded-3xl p-16 text-center space-y-6 border border-outline-variant/10">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant/20">
              <Package size={40} />
            </div>
            <h2 className="text-2xl font-headline font-bold">주문 내역이 없습니다</h2>
            <p className="text-on-surface-variant max-w-xs mx-auto">
              아직 주문하신 내역이 없습니다. <br />
              핑크버튼의 다양한 상품을 만나보세요.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary-container transition-all"
            >
              쇼핑하러 가기 <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="bg-surface-container-high/50 p-6 border-b border-outline-variant/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">주문일자</p>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar size={14} className="text-primary" />
                        {order.createdAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">주문번호</p>
                      <p className="font-mono text-xs text-on-surface-variant">{order.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold">
                      {getStatusLabel(order.status)}
                    </span>
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 space-y-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-6">
                      <div className="w-20 h-20 bg-surface-container-lowest rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                        <p className="text-xs text-on-surface-variant/60">수량: {item.quantity}개 | {(item.price || 0).toLocaleString()}원</p>
                      </div>
                      <div className="flex flex-col justify-center text-right">
                        <p className="font-headline font-bold">{((item.price || 0) * item.quantity).toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/10 flex flex-wrap justify-between items-center gap-6">
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CreditCard size={16} />
                    <span>총 결제 금액: <span className="text-on-surface font-bold">{(order.totalPrice || (order as any).totalAmount || 0).toLocaleString()}원</span></span>
                  </div>
                  <div className="text-xs text-on-surface-variant/60">
                    배송지: {order.shippingInfo.recipientName}({formatPhoneNumber(order.shippingInfo.recipientPhone)}) | {order.shippingInfo.address} {order.shippingInfo.detailAddress}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Account Management Section */}
        <div className="mt-20 pt-10 border-t border-outline-variant/10">
          <div className="bg-error/5 rounded-3xl p-8 border border-error/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-error mb-1">위험 구역: 회원 탈퇴</h3>
                <p className="text-sm text-on-surface-variant/70">탈퇴 시 모든 주문 내역과 개인정보가 영구 삭제되며 복구할 수 없습니다.</p>
              </div>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-6 py-3 bg-error/10 text-error rounded-xl text-sm font-bold hover:bg-error hover:text-on-error transition-all"
            >
              <UserX size={18} /> 회원 탈퇴하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
