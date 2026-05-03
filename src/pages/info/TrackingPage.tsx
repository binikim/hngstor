/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, ExternalLink, Calendar, CreditCard, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  createdAt: any;
  shippingInfo: {
    recipientName: string;
    address: string;
    detailAddress: string;
  };
  trackingNumber?: string;
  deliveryCompany?: string;
}

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setOrdersLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

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
      setOrdersLoading(false);
    }, (error) => {
      console.error("Order List Fetch Error:", error);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setSearchError(null);
    setSearchResult(null);
    setSearched(false);

    try {
      // Clean order number (remove # if present)
      const cleanId = orderNumber.trim().startsWith('#') 
        ? orderNumber.trim().substring(1) 
        : orderNumber.trim();

      // We need to find the full ID if the user provided a partial one, 
      // but since Firestore doc IDs are random, we usually expect the full ID 
      // or at least a significant prefix. For this implementation, we'll try direct getDoc first
      // Assuming the user might type the full ID or a partial one.
      
      const docRef = doc(db, 'orders', cleanId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        // Privacy check: Only allow viewing if:
        // 1. Order belongs to current user
        // 2. Order is anonymous (but then anyone with ID can see it)
        // 3. User is admin
        
        const isOwner = user && data.userId === user.uid;
        const isAnonymous = data.userId === 'anonymous';
        
        // Check for admin role
        let isAdmin = false;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          isAdmin = userDoc.data()?.role === 'admin';
        }

        if (isOwner || isAnonymous || isAdmin) {
          setSearchResult({ id: docSnap.id, ...data });
          setSearched(true);
        } else {
          setSearchError('해당 주문을 조회할 권한이 없거나 다른 계정의 주문입니다.');
        }
      } else {
        // Try searching by partial ID or other fields if needed, 
        // but typically doc ID is the primary way.
        setSearchError('주문번호가 올바르지 않거나 존재하지 않는 주문입니다.');
      }
    } catch (error: any) {
      console.error("Search Error:", error);
      setSearchError('조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-headline font-bold mb-4 uppercase tracking-tight">배송조회</h1>
          <p className="text-on-surface-variant">비회원 주문 또는 주문번호를 알고 계신 경우 바로 조회가 가능합니다.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-12 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={20} />
              <input 
                required
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="주문번호를 입력하세요"
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <button 
              disabled={loading}
              className="bg-primary text-on-primary px-8 rounded-2xl font-bold flex items-center justify-center hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 max-w-2xl mx-auto p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-center text-sm font-bold"
          >
            {searchError}
          </motion.div>
        )}

        {searched && searchResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-8 space-y-8 max-w-2xl mx-auto mb-12"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mb-1">상태</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${searchResult.status === 'delivered' ? 'bg-success' : 'bg-primary animate-pulse'}`} />
                  <span className="font-bold text-lg">
                    {searchResult.status === 'ordered' ? '결제완료' : 
                     searchResult.status === 'pending' ? '준비중' : 
                     searchResult.status === 'processing' ? '배송준비' :
                     searchResult.status === 'shipped' ? '배송중' :
                     searchResult.status === 'delivered' ? '배송완료' : searchResult.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mb-1">운송장 번호</p>
                <p className="font-mono text-sm">
                  {searchResult.trackingNumber 
                    ? `${searchResult.trackingNumber} (${searchResult.deliveryCompany || '배송사 정보 없음'})` 
                    : '발급 대기 중'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">주문 상품</p>
              <div className="space-y-3">
                {searchResult.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-surface-container-lowest/50 p-3 rounded-xl">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-grow">
                      <p className="text-xs font-bold">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant/60">{item.quantity}개 | {item.price.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
              <div className={`relative ${searchResult.status === 'delivered' || searchResult.status === 'shipped' ? '' : 'opacity-40'}`}>
                <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-4 border-background ${searchResult.status === 'delivered' || searchResult.status === 'shipped' ? 'bg-primary' : 'bg-outline-variant'}`} />
                <div className="space-y-1">
                  <p className="text-sm font-bold">배송 중</p>
                  <p className="text-xs text-on-surface-variant">
                    {searchResult.status === 'shipped' || searchResult.status === 'delivered' 
                      ? '고객님의 상품이 배송 중입니다.' 
                      : '준비가 완료되면 배송이 시작됩니다.'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[27px] w-4 h-4 bg-primary rounded-full border-4 border-background" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">주문 접수</p>
                  <p className="text-xs text-on-surface-variant">
                    {searchResult.createdAt?.toDate().toLocaleDateString()} | 정상적으로 주문이 접수되었습니다.
                  </p>
                </div>
              </div>
            </div>

            {searchResult.trackingNumber && (
              <button className="w-full py-3 bg-surface-container-highest rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-outline-variant/10 transition-colors">
                상세 위치 보기 <ExternalLink size={14} />
              </button>
            )}
          </motion.div>
        )}

        {authLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : user ? (
          <div className="mt-16 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold">내 주문 내역</h2>
              <Link to="/my-orders" className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
                전체보기 <ChevronRight size={16} />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface-container-low rounded-3xl p-12 text-center border border-outline-variant/10">
                <p className="text-on-surface-variant">구매하신 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {orders.slice(0, 3).map((order) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6 flex flex-wrap items-center justify-between gap-6"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-surface-container-highest rounded-xl overflow-hidden flex-shrink-0">
                        <img src={order.items[0]?.image} alt={order.items[0]?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm truncate max-w-[200px]">
                          {order.items[0]?.name} {order.items.length > 1 && `외 ${order.items.length - 1}건`}
                        </h3>
                        <p className="text-xs text-on-surface-variant/60">
                          {order.createdAt?.toDate().toLocaleDateString()} | {(order.totalPrice || 0).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                        {order.status === 'ordered' ? '결제완료' : order.status}
                      </span>
                      <Link to="/my-orders" className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-12 p-8 bg-surface-container-lowest/50 rounded-3xl border border-dashed border-outline-variant/30 text-center space-y-4">
            <p className="text-sm text-on-surface-variant font-medium">로그인하시면 주문 내역을 모두 한눈에 확인할 수 있습니다.</p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 bg-on-surface text-surface px-8 py-3 rounded-xl font-bold hover:bg-on-surface/80 transition-all text-sm"
            >
              로그인 하러가기 <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
