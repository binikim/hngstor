/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { ShoppingBag, Clock, User, CreditCard, Package, Truck, MapPin, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react';

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
  userEmail: string;
  totalPrice?: number;
  totalAmount?: number;
  status: string;
  createdAt: any;
  items: OrderItem[];
  shippingInfo: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    detailAddress: string;
    zipCode: string;
    deliveryNote?: string;
  };
  trackingNumber?: string;
  deliveryCompany?: string;
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setSuccessId(orderId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTrackingUpdate = async (orderId: string, company: string, number: string) => {
    setUpdatingId(orderId);
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, deliveryCompany: company, trackingNumber: number, status: 'shipped' } : order
      )
    );
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        deliveryCompany: company,
        trackingNumber: number,
        status: 'shipped'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = selectedDate 
    ? orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const localDate = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        return localDate === selectedDate;
      })
    : orders;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
            <ShoppingBag size={24} /> 주문 관리
          </h2>
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
            <Clock size={16} className="text-on-surface-variant/50" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none"
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate('')}
                className="text-xs text-primary hover:underline ml-2"
              >
                전체 보기
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-on-surface-variant shrink-0">
          총 {filteredOrders.length}건의 주문이 있습니다.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="md:col-span-2 bg-surface-container-low rounded-2xl p-12 text-center text-on-surface-variant border border-outline-variant/10">
            {selectedDate ? '선택하신 날짜에 주문 내역이 없습니다.' : '주문 내역이 없습니다.'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm flex flex-col h-fit">
              {/* Order Summary Header */}
              <div 
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-high/30 transition-colors"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('select')) {
                    return;
                  }
                  setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                }}
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-grow">
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">주문번호</p>
                    <p className="font-mono text-xs font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">주문자</p>
                    <p className="text-sm font-medium">{order.shippingInfo?.recipientName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">금액</p>
                    <p className="text-sm font-bold text-primary">{(order.totalPrice || order.totalAmount || 0).toLocaleString()}원</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">날짜</p>
                    <p className="text-sm">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="relative">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border-none focus:ring-1 focus:ring-primary cursor-pointer transition-all text-stone-900 ${
                        order.status === 'delivered' ? 'bg-success/10' : 
                        order.status === 'shipped' ? 'bg-info/10' : 
                        order.status === 'processing' ? 'bg-warning/10' :
                        order.status === 'pending' ? 'bg-secondary/10' :
                        'bg-primary/10'
                      }`}
                    >
                      {order.status === 'pending' && (
                        <option value="pending" className="text-stone-900 bg-white">입금대기</option>
                      )}
                      <option value="ordered" className="text-stone-900 bg-white">결제완료</option>
                      <option value="processing" className="text-stone-900 bg-white">배송준비중</option>
                      <option value="shipped" className="text-stone-900 bg-white">배송중</option>
                      <option value="delivered" className="text-stone-900 bg-white">배송완료</option>
                    </select>
                    {updatingId === order.id && (
                      <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {successId === order.id && (
                      <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-success animate-bounce">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                  {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrderId === order.id && (
                <div className="p-6 border-t border-outline-variant/5 bg-surface-container-lowest/50 flex flex-col gap-6">
                  {/* Product Items */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold flex items-center gap-2 mb-2">
                      <Package size={14} className="text-primary" /> 주문 상품 ({order.items?.length || 0})
                    </h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-grow">
                            <p className="text-[11px] font-bold">{item.name}</p>
                            <p className="text-[9px] text-on-surface-variant/60">{item.quantity}개 | {item.price.toLocaleString()}원</p>
                          </div>
                          <p className="text-xs font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Tracking */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/5">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                        <MapPin size={14} className="text-primary" /> 배송지 정보
                      </h3>
                      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/5 text-[11px] space-y-2">
                        <p><span className="text-on-surface-variant/60 w-12 inline-block">수령인:</span> {order.shippingInfo?.recipientName}</p>
                        <p><span className="text-on-surface-variant/60 w-12 inline-block">연락처:</span> {formatPhoneNumber(order.shippingInfo?.recipientPhone)}</p>
                        <p><span className="text-on-surface-variant/60 w-12 inline-block">주소:</span> [{order.shippingInfo?.zipCode}] {order.shippingInfo?.address} {order.shippingInfo?.detailAddress}</p>
                        {order.shippingInfo?.deliveryNote && (
                          <p className="pt-2 italic text-primary">" {order.shippingInfo.deliveryNote} "</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                        <Truck size={14} className="text-primary" /> 배송 관리
                      </h3>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text" 
                          placeholder="택배사 (예: CJ대한통운)"
                          defaultValue={order.deliveryCompany}
                          id={`company-${order.id}`}
                          className="bg-surface-container-low border border-outline-variant/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                        <input 
                          type="text" 
                          placeholder="운송장 번호"
                          defaultValue={order.trackingNumber}
                          id={`tracking-${order.id}`}
                          className="bg-surface-container-low border border-outline-variant/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                        <button 
                          onClick={() => {
                            const company = (document.getElementById(`company-${order.id}`) as HTMLInputElement).value;
                            const number = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                            handleTrackingUpdate(order.id, company, number);
                          }}
                          disabled={updatingId === order.id}
                          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-container transition-all disabled:opacity-50 cursor-pointer"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
