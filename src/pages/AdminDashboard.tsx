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
  Calendar as CalendarIcon
} from 'lucide-react';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminSettings from './admin/AdminSettings';
import AdminContent from './admin/AdminContent';
import AddProductModal from '../components/admin/AddProductModal';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'settings' | 'content';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    newOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  });

  const getLocalDateString = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };
  const todayDateString = getLocalDateString(new Date());
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>(todayDateString);

  useEffect(() => {
    // 1. Listen to Products count
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    // 2. Listen to Users count
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (!selectedDashboardDate) return;

    const dateObj = new Date(selectedDashboardDate);
    dateObj.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startTimestamp = Timestamp.fromDate(dateObj);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const qOrders = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<', endTimestamp)
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      let revenue = 0;
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        revenue += (data.totalPrice || data.totalAmount || 0);
        count++;
      });
      setStats(prev => ({ 
        ...prev, 
        todayRevenue: revenue,
        newOrders: count
      }));
    });

    return () => {
      unsubscribeOrders();
    };
  }, [selectedDashboardDate]);

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
            navigate('/login');
          }
        } catch (error) {
          if (isDefaultAdmin) setIsAdmin(true);
          else navigate('/login');
        }
      } else {
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
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
              <CalendarIcon size={16} className="text-on-surface-variant/50" />
              <input 
                type="date" 
                value={selectedDashboardDate}
                onChange={(e) => setSelectedDashboardDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                label: selectedDashboardDate === todayDateString ? '오늘의 매출' : '선택일 매출', 
                value: `${stats.todayRevenue.toLocaleString()} KRW`, 
                icon: TrendingUp, 
                color: 'text-primary',
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">관리자 센터</h1>
            <p className="text-on-surface-variant font-light">핑크버튼 운영을 위한 통합 관리 시스템입니다.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-high rounded-xl text-on-surface hover:bg-surface-container-highest transition-all"
          >
            <LogOut size={18} /> 로그아웃
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-8 scrollbar-hide">
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
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
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
    </div>
  );
}
