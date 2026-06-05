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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const filteredOrders = selectedDate 
    ? orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const localDate = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        return localDate === selectedDate;
      })
    : orders;

  // Update selected order ID when filtered orders list changes
  useEffect(() => {
    if (filteredOrders.length > 0) {
      const exists = filteredOrders.some(o => o.id === selectedOrderId);
      if (!exists) {
        setSelectedOrderId(filteredOrders[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order List (col-span-4 / col-span-3 on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {filteredOrders.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center text-on-surface-variant border border-outline-variant/10">
              {selectedDate ? '선택하신 날짜에 주문 내역이 없습니다.' : '주문 내역이 없습니다.'}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedOrderId === order.id 
                    ? 'bg-primary/5 border-primary shadow-sm' 
                    : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-high/50'
                }`}
              >
                {/* Compact Header: ID, Date, Status */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-on-surface-variant">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-on-surface-variant/50">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-success/10 text-success' : 
                    order.status === 'shipped' ? 'bg-info/10 text-info' : 
                    order.status === 'processing' ? 'bg-warning/10 text-warning' :
                    order.status === 'pending' ? 'bg-secondary/10 text-secondary' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {order.status === 'ordered' ? '결제완료' : 
                     order.status === 'pending' ? '준비중' :
                     order.status === 'processing' ? '배송준비' :
                     order.status === 'shipped' ? '배송중' :
                     order.status === 'delivered' ? '배송완료' : order.status}
                  </span>
                </div>
                
                {/* Customer and Total Price */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-on-surface-variant/70 font-medium">주문자: {order.shippingInfo?.recipientName || 'N/A'}</p>
                    <p className="text-[10px] text-on-surface-variant/50 max-w-[200px] truncate">
                      {order.items?.[0]?.name} {order.items?.length > 1 ? `외 ${order.items.length - 1}건` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary">{(order.totalPrice || order.totalAmount || 0).toLocaleString()}원</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Selected Order Details (col-span-8 / col-span-9 on xl) */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedOrder ? (
            <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-6 md:p-8 space-y-6 sticky top-24 shadow-sm">
              {/* Header: ID & Status Change dropdown */}
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/5">
                <div>
                  <h3 className="text-lg font-headline font-bold flex items-center gap-2">
                    <ShoppingBag size={20} className="text-primary" /> 주문 상세 정보
                  </h3>
                  <p className="text-xs text-on-surface-variant/60 font-mono mt-1">ID: #{selectedOrder.id}</p>
                </div>
                
                {/* Status Dropdown */}
                <div className="relative flex items-center gap-2">
                  <select 
                    value={selectedOrder.status}
                    disabled={updatingId === selectedOrder.id}
                    onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                    className={`text-xs font-bold uppercase px-3 py-2 rounded-full border-none focus:ring-1 focus:ring-primary cursor-pointer transition-all ${
                      selectedOrder.status === 'delivered' ? 'bg-success/10 text-success' : 
                      selectedOrder.status === 'shipped' ? 'bg-info/10 text-info' : 
                      selectedOrder.status === 'processing' ? 'bg-warning/10 text-warning' :
                      selectedOrder.status === 'pending' ? 'bg-secondary/10 text-secondary' :
                      'bg-primary/10 text-primary'
                    }`}
                  >
                    <option value="ordered">결제완료</option>
                    <option value="pending">준비중</option>
                    <option value="processing">배송준비</option>
                    <option value="shipped">배송중</option>
                    <option value="delivered">배송완료</option>
                  </select>
                  {updatingId === selectedOrder.id && (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {successId === selectedOrder.id && (
                    <span className="text-success animate-bounce"><Check size={16} /></span>
                  )}
                </div>
              </div>

              {/* Product Items */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Package size={16} className="text-primary" /> 주문 상품 ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/5">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-grow">
                        <p className="text-xs font-bold">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60">{item.quantity}개 | {item.price.toLocaleString()}원</p>
                      </div>
                      <p className="text-xs font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/5 text-sm">
                  <span className="font-medium text-on-surface-variant">총 결제 금액</span>
                  <span className="text-lg font-bold text-primary">{(selectedOrder.totalPrice || selectedOrder.totalAmount || 0).toLocaleString()}원</span>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/5">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> 배송지 정보
                </h4>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/5 text-xs space-y-2">
                  <p><span className="text-on-surface-variant/60 w-16 inline-block font-medium">수령인:</span> {selectedOrder.shippingInfo?.recipientName}</p>
                  <p><span className="text-on-surface-variant/60 w-16 inline-block font-medium">연락처:</span> {formatPhoneNumber(selectedOrder.shippingInfo?.recipientPhone)}</p>
                  <p><span className="text-on-surface-variant/60 w-16 inline-block font-medium">주소:</span> [{selectedOrder.shippingInfo?.zipCode}] {selectedOrder.shippingInfo?.address} {selectedOrder.shippingInfo?.detailAddress}</p>
                  {selectedOrder.shippingInfo?.deliveryNote && (
                    <p className="pt-2 italic text-primary">" {selectedOrder.shippingInfo.deliveryNote} "</p>
                  )}
                </div>
              </div>

              {/* Delivery Management */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/5">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Truck size={16} className="text-primary" /> 배송 관리
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="택배사 (예: CJ대한통운)"
                    defaultValue={selectedOrder.deliveryCompany}
                    key={`company-${selectedOrder.id}`}
                    id={`company-${selectedOrder.id}`}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-primary"
                  />
                  <input 
                    type="text" 
                    placeholder="운송장 번호"
                    defaultValue={selectedOrder.trackingNumber}
                    key={`tracking-${selectedOrder.id}`}
                    id={`tracking-${selectedOrder.id}`}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    onClick={() => {
                      const company = (document.getElementById(`company-${selectedOrder.id}`) as HTMLInputElement).value;
                      const number = (document.getElementById(`tracking-${selectedOrder.id}`) as HTMLInputElement).value;
                      handleTrackingUpdate(selectedOrder.id, company, number);
                    }}
                    disabled={updatingId === selectedOrder.id}
                    className="bg-primary text-on-primary px-6 py-3 rounded-xl text-xs font-bold hover:bg-primary-container transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    배송정보 저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-12 text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[400px]">
              <ShoppingBag size={48} className="text-on-surface-variant/20 mb-4" />
              <p className="font-bold text-lg">주문을 선택해 주세요</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">상세 내역을 조회할 주문 카드를 왼쪽 목록에서 클릭해 주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
