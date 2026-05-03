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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
          <ShoppingBag size={24} /> 주문 관리
        </h2>
        <div className="text-sm text-on-surface-variant">총 {orders.length}건의 주문이 있습니다.</div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-surface-container-low rounded-2xl p-12 text-center text-on-surface-variant border border-outline-variant/10">
            주문 내역이 없습니다.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
              {/* Order Summary Header */}
              <div 
                className="p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-high/30 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">주문번호</p>
                    <p className="font-mono text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
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
                    <p className="text-sm">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <select 
                      value={order.status}
                      disabled={updatingId === order.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border-none focus:ring-1 focus:ring-primary cursor-pointer transition-all ${
                        order.status === 'delivered' ? 'bg-success/10 text-success' : 
                        order.status === 'shipped' ? 'bg-info/10 text-info' : 
                        order.status === 'processing' ? 'bg-warning/10 text-warning' :
                        order.status === 'pending' ? 'bg-secondary/10 text-secondary' :
                        'bg-primary/10 text-primary'
                      }`}
                    >
                      <option value="ordered">결제완료</option>
                      <option value="pending">준비중</option>
                      <option value="processing">배송준비</option>
                      <option value="shipped">배송중</option>
                      <option value="delivered">배송완료</option>
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
                <div className="p-6 border-t border-outline-variant/5 bg-surface-container-lowest/50 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Product Items */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <Package size={16} className="text-primary" /> 주문 상품 ({order.items?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-grow">
                            <p className="text-xs font-bold">{item.name}</p>
                            <p className="text-[10px] text-on-surface-variant/60">{item.quantity}개 | {item.price.toLocaleString()}원</p>
                          </div>
                          <p className="text-xs font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Shipping & Tracking */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <MapPin size={16} className="text-primary" /> 배송지 정보
                      </h3>
                      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/5 text-xs space-y-2">
                        <p><span className="text-on-surface-variant/60 w-16 inline-block">수령인:</span> {order.shippingInfo?.recipientName}</p>
                        <p><span className="text-on-surface-variant/60 w-16 inline-block">연락처:</span> {formatPhoneNumber(order.shippingInfo?.recipientPhone)}</p>
                        <p><span className="text-on-surface-variant/60 w-16 inline-block">주소:</span> [{order.shippingInfo?.zipCode}] {order.shippingInfo?.address} {order.shippingInfo?.detailAddress}</p>
                        {order.shippingInfo?.deliveryNote && (
                          <p className="pt-2 italic text-primary">" {order.shippingInfo.deliveryNote} "</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Truck size={16} className="text-primary" /> 배송 관리
                      </h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="택배사 (예: CJ대한통운)"
                          defaultValue={order.deliveryCompany}
                          id={`company-${order.id}`}
                          className="flex-grow bg-surface-container-low border border-outline-variant/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                        <input 
                          type="text" 
                          placeholder="운송장 번호"
                          defaultValue={order.trackingNumber}
                          id={`tracking-${order.id}`}
                          className="flex-grow bg-surface-container-low border border-outline-variant/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                        <button 
                          onClick={() => {
                            const company = (document.getElementById(`company-${order.id}`) as HTMLInputElement).value;
                            const number = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                            handleTrackingUpdate(order.id, company, number);
                          }}
                          disabled={updatingId === order.id}
                          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-container transition-all disabled:opacity-50"
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
