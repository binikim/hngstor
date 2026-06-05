/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  Timestamp,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  TrendingUp,
  ShoppingBag,
  Plus,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminSettings from './admin/AdminSettings';
import AdminContent from './admin/AdminContent';
import AddProductModal from '../components/admin/AddProductModal';

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

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'settings' | 'content';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const getLocalDateString = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };
  const todayDateString = getLocalDateString(new Date());
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>(todayDateString);

  // Calendar Year/Month State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Subscribe to all orders
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to products count
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setTotalProducts(snapshot.size);
    });
    return () => unsubscribeProducts();
  }, []);

  // Subscribe to users count
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
    });
    return () => unsubscribeUsers();
  }, []);

  // Calculate statistics via useMemo
  const stats = React.useMemo(() => {
    let todayRevenue = 0;
    let newOrders = 0;
    let totalRevenue = 0;

    orders.forEach(order => {
      const price = order.totalPrice || order.totalAmount || 0;
      totalRevenue += price;

      if (order.createdAt) {
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const localDate = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        if (localDate === selectedDashboardDate) {
          todayRevenue += price;
          newOrders++;
        }
      }
    });

    return {
      todayRevenue,
      newOrders,
      totalRevenue,
      totalProducts,
      totalUsers
    };
  }, [orders, selectedDashboardDate, totalProducts, totalUsers]);

  // Map orders by date for Calendar view
  const ordersByDate = React.useMemo(() => {
    const map: Record<string, { revenue: number; items: { name: string; quantity: number }[] }> = {};
    orders.forEach(order => {
      if (!order.createdAt) return;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dateStr = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      if (!map[dateStr]) {
        map[dateStr] = { revenue: 0, items: [] };
      }

      map[dateStr].revenue += (order.totalPrice || order.totalAmount || 0);

      order.items?.forEach(item => {
        const existing = map[dateStr].items.find(i => i.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          map[dateStr].items.push({ name: item.name, quantity: item.quantity });
        }
      });
    });
    return map;
  }, [orders]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailLower = user.email?.toLowerCase();
        const isDefaultAdmin = emailLower === 'kimsabin71@gmail.com' || emailLower === 'admin@hng.com';
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          if (isDefaultAdmin || (userData && userData.role === 'admin')) {
            setIsAdmin(true);
          } else {
            localStorage.removeItem('isAdmin');
            navigate('/login');
          }
        } catch (error) {
          if (isDefaultAdmin) {
            setIsAdmin(true);
          } else {
            localStorage.removeItem('isAdmin');
            navigate('/login');
          }
        }
      } else {
        localStorage.removeItem('isAdmin');
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'products': return <AdminProducts />;
      case 'orders': return <AdminOrders />;
      case 'users': return <AdminUsers />;
      case 'settings': return <AdminSettings />;
      case 'content': return <AdminContent />;
      default: return (
        <>
          {/* Stats Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-headline font-bold">운영 현황</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/10">
                <CalendarIcon size={16} className="text-on-surface-variant/50" />
                <input 
                  type="date" 
                  value={selectedDashboardDate}
                  onChange={(e) => setSelectedDashboardDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {[
              { 
                label: '누적 전체 매출', 
                value: `${stats.totalRevenue.toLocaleString()} KRW`, 
                icon: TrendingUp, 
                color: 'text-primary',
                onClick: () => setActiveTab('orders')
              },
              { 
                label: selectedDashboardDate === todayDateString ? '오늘의 매출' : '선택일 매출', 
                value: `${stats.todayRevenue.toLocaleString()} KRW`, 
                icon: TrendingUp, 
                color: 'text-secondary',
                onClick: () => setActiveTab('orders')
              },
              { 
                label: selectedDashboardDate === todayDateString ? '신규 주문 (오늘)' : '선택일 주문', 
                value: `${stats.newOrders}건`, 
                icon: ShoppingBag, 
                color: 'text-tertiary',
                onClick: () => setActiveTab('orders')
              },
              { 
                label: '등록 제품', 
                value: `${stats.totalProducts}개`, 
                icon: Package, 
                color: 'text-on-surface',
                onClick: () => setActiveTab('products')
              },
              { 
                label: '누적 회원', 
                value: `${stats.totalUsers}명`, 
                icon: Users, 
                color: 'text-on-surface',
                onClick: () => setActiveTab('users')
              },
            ].map((stat, i) => (
              <button 
                key={i} 
                onClick={stat.onClick}
                className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 text-left hover:bg-surface-container-high transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-on-surface-variant font-medium">{stat.label}</span>
                  <stat.icon size={20} className={`${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="text-2xl font-headline font-bold">{stat.value}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AdminOrders />
            </div>
            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <h2 className="font-headline font-bold mb-6 flex items-center gap-2">
                  <Settings size={20} /> 빠른 작업
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setIsAddingProduct(true)} 
                    className="flex items-center justify-between w-full p-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-all"
                  >
                    <span className="flex items-center gap-3"><Plus size={20} /> 새 제품 등록</span>
                    <ChevronRight size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCalendarOpen(true)} 
                    className="flex items-center justify-between w-full p-4 bg-surface-container-high rounded-xl font-bold hover:bg-surface-container-highest transition-all"
                  >
                    <span className="flex items-center gap-3"><CalendarIcon size={20} /> 월간 판매 캘린더</span>
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={() => setActiveTab('products')} className="flex items-center justify-between w-full p-4 bg-surface-container-high rounded-xl font-bold hover:bg-surface-container-highest transition-all">
                    <span className="flex items-center gap-3"><Package size={20} /> 재고 관리</span>
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={() => setActiveTab('users')} className="flex items-center justify-between w-full p-4 bg-surface-container-high rounded-xl font-bold hover:bg-surface-container-highest transition-all">
                    <span className="flex items-center gap-3"><Users size={20} /> 회원 관리</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-background pb-20">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">관리자 센터</h1>
            <p className="text-on-surface-variant font-light">핑크버튼 운영을 위한 통합 관리 시스템입니다.</p>
          </div>

          {/* Admin Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:pb-0 shrink-0">
            {[
              { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
              { id: 'products', label: '제품 관리', icon: Package },
              { id: 'orders', label: '주문 관리', icon: ShoppingBag },
              { id: 'users', label: '회원 관리', icon: Users },
              { id: 'content', label: '컨텐츠 관리', icon: FileText },
              { id: 'settings', label: '설정', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {renderContent()}
      </div>

      <AddProductModal 
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        onSuccess={() => {
          setActiveTab('products');
          setIsAddingProduct(false);
        }}
      />

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-[1200px] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 flex flex-col p-5 md:p-6 max-h-[95vh] lg:max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-headline font-bold flex items-center gap-2 text-on-surface">
                  📅 월간 판매 및 출고 현황 캘린더
                </h2>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  날짜를 클릭하면 해당 일의 통계와 주문 내역으로 연동됩니다. 날짜 위에 마우스를 올리면 당일 출고 품목을 상세히 확인하실 수 있습니다.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-grow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div></div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const prev = new Date(calendarDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarDate(prev);
                    }}
                    className="px-3 py-1.5 text-xs bg-surface-container-high hover:bg-surface-container-highest rounded-xl border border-outline-variant/10 text-on-surface-variant hover:text-on-surface transition-all font-bold"
                  >
                    &larr; 이전달
                  </button>
                  <span className="font-headline font-bold text-sm min-w-[100px] text-center px-1">
                    {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarDate(next);
                    }}
                    className="px-3 py-1.5 text-xs bg-surface-container-high hover:bg-surface-container-highest rounded-xl border border-outline-variant/10 text-on-surface-variant hover:text-on-surface transition-all font-bold"
                  >
                    다음달 &rarr;
                  </button>
                </div>
              </div>

              {/* Calendar Grid Header (Weeks) */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-on-surface-variant py-2 bg-rose-50/80 rounded-xl">
                <div className="text-error">일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div className="text-primary">토</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const firstDayIndex = new Date(year, month, 1).getDay();
                  const lastDate = new Date(year, month + 1, 0).getDate();
                  const prevLastDate = new Date(year, month, 0).getDate();

                  const days = [];

                  // Prev Month
                  for (let i = firstDayIndex; i > 0; i--) {
                    const d = prevLastDate - i + 1;
                    const dateObj = new Date(year, month - 1, d);
                    const dateString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    days.push({ day: d, isCurrentMonth: false, dateString });
                  }

                  // Current Month
                  for (let i = 1; i <= lastDate; i++) {
                    const dateObj = new Date(year, month, i);
                    const dateString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    days.push({ day: i, isCurrentMonth: true, dateString });
                  }

                  // Next Month
                  const remaining = 42 - days.length;
                  for (let i = 1; i <= remaining; i++) {
                    const dateObj = new Date(year, month + 1, i);
                    const dateString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    days.push({ day: i, isCurrentMonth: false, dateString });
                  }

                  return days.map((dayItem, index) => {
                    const dayData = ordersByDate[dayItem.dateString];
                    const hasOrders = dayData && dayData.revenue > 0;
                    const isSelected = selectedDashboardDate === dayItem.dateString;
                    const dayOfWeek = index % 7;
                    
                    // Text formatting for tooltip
                    const tooltipText = hasOrders
                      ? `[${dayItem.dateString}] 총 매출: ${dayData.revenue.toLocaleString()}원\n\n출고 품목:\n` + 
                        dayData.items.map(item => `• ${item.name} (수량: ${item.quantity})`).join('\n')
                      : `[${dayItem.dateString}] 판매 내역 없음`;

                    return (
                      <button
                        type="button"
                        key={index}
                        title={tooltipText}
                        onClick={() => {
                          setSelectedDashboardDate(dayItem.dateString);
                          setIsCalendarOpen(false);
                        }}
                        className={`min-h-[70px] md:min-h-[85px] lg:min-h-[95px] p-1.5 md:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all group relative ${
                          dayItem.isCurrentMonth 
                            ? 'bg-stone-50 text-on-surface border-outline-variant/20' 
                            : 'bg-zinc-100/40 text-zinc-400/60 border-zinc-200/20'
                        } ${
                          isSelected 
                            ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md z-10' 
                            : 'hover:bg-rose-50/50 hover:border-rose-200 hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Date number */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                            isSelected ? 'bg-primary text-on-primary' : 
                            dayOfWeek === 0 ? 'text-error font-extrabold' : 
                            dayOfWeek === 6 ? 'text-primary font-extrabold' : 'text-on-surface font-extrabold'
                          }`}>
                            {dayItem.day}
                          </span>
                          {hasOrders && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                          )}
                        </div>

                        {/* Revenue and items */}
                        <div className="mt-1 md:mt-2 w-full flex-grow flex flex-col justify-end">
                          {hasOrders ? (
                            <>
                              {/* Revenue */}
                              <div className="text-[9px] md:text-[11px] font-black text-rose-600 mb-0.5 md:mb-1 truncate">
                                +₩{dayData.revenue.toLocaleString()}
                              </div>
                              
                              {/* Items List */}
                              <div className="space-y-0.5 overflow-hidden max-h-[32px] md:max-h-[44px] flex flex-col">
                                {dayData.items.slice(0, 2).map((item, itemIdx) => (
                                  <div 
                                    key={itemIdx} 
                                    className="text-[9px] text-rose-950 bg-rose-100/70 px-1 rounded truncate leading-tight py-0.5 flex justify-between font-bold"
                                  >
                                    <span className="truncate">{item.name}</span>
                                    <span className="font-extrabold text-rose-600 shrink-0 ml-1">x{item.quantity}</span>
                                  </div>
                                ))}
                                {dayData.items.length > 2 && (
                                  <div className="text-[9px] text-rose-700 font-extrabold pl-1 mt-0.5">
                                    외 {dayData.items.length - 2}건 출고
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-on-surface-variant/20 italic self-end">
                              -
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-6 py-2.5 bg-on-surface text-surface font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
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
