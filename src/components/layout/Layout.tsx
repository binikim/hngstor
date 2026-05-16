/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  X,
  Globe,
  Share2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LogOut, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../CartDrawer';

const NAV_LINKS = [
  { name: "남성 성인용품", path: "/category/men" },
  { name: "여성 성인용품", path: "/category/women" },
  { name: "콘돔", path: "/category/condoms" },
  { name: "러브젤", path: "/category/lubes" },
  { name: "기타 성인용품", path: "/category/others" },
  { name: "섹시속옷", path: "/category/lingerie" }
];

export const Navbar = () => {
  const [navLinks, setNavLinks] = useState(NAV_LINKS);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { totalItems, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [footerInfo, setFooterInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchFooterInfo() {
      try {
        const docRef = doc(db, 'siteContent', 'footer');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFooterInfo(docSnap.data().content);
        }
      } catch (error) {
        console.error("Error fetching footer info for navbar:", error);
      }
    }
    fetchFooterInfo();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const emailLower = currentUser.email?.toLowerCase();
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        setIsAdmin(userData?.role === 'admin' || emailLower === 'admin@hng.com');
      } else {
        setIsAdmin(false);
      }
    });

    const fetchCategories = async () => {
      try {
        const { setDoc } = await import('firebase/firestore');
        const catRef = doc(db, 'siteContent', 'categories');
        const catDoc = await getDoc(catRef);
        
        let fetchedCategories: any[] = [];
        if (catDoc.exists() && Array.isArray(catDoc.data().content)) {
          fetchedCategories = catDoc.data().content;
        }

        const defaultCategories = [
          { id: 'men', title: '남성용품', description: '프리미엄 남성 전용 아이템', image: 'https://images.unsplash.com/photo-1618022325802-7e5e732d97a1?auto=format&fit=crop&q=80&w=800', path: '/category/men', span: '' },
          { id: 'men_acc', title: '남성보조용품', description: '더욱 완벽한 경험을 위한 보조용품', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', path: '/category/men_acc', span: '' },
          { id: 'women', title: '여성용품', description: '섬세한 감각을 깨우는 프리미엄 컬렉션', image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=800', path: '/category/women', span: '' },
          { id: 'women_acc', title: '여성보조용품', description: '특별한 순간을 위한 여성 보조용품', image: 'https://images.unsplash.com/photo-1518085250890-410c5a278916?auto=format&fit=crop&q=80&w=800', path: '/category/women_acc', span: '' },
          { id: 'condoms', title: '콘돔', description: '안전하고 건강한 사랑을 위한 필수 선택', image: 'https://images.unsplash.com/photo-1614031679269-138379ba51fb?auto=format&fit=crop&q=80&w=800', path: '/category/condoms', span: '' },
          { id: 'lubes', title: '러브젤', description: '부드러운 경험의 완성', image: 'https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&q=80&w=800', path: '/category/lubes', span: '' },
          { id: 'couple', title: '커플성인용품', description: '둘만의 특별한 시간을 위한 아이템', image: 'https://images.unsplash.com/photo-1518144591331-17a5dd71c477?auto=format&fit=crop&q=80&w=800', path: '/category/couple', span: '' },
          { id: 'lingerie', title: '섹시속옷', description: '당신의 매력을 더욱 돋보이게 할 미드나잇 컬렉션', image: 'https://images.unsplash.com/photo-1512413916298-5c4dd8bbab4d?auto=format&fit=crop&q=80&w=800', path: '/category/lingerie', span: '' },
          { id: 'others', title: '기타 성인용품', description: '더욱 다채로운 즐거움을 위한 액세서리', image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=800', path: '/category/others', span: '' }
        ];

        if (!catDoc.exists() || (Array.isArray(catDoc.data()?.content) && catDoc.data().content.length === 0)) {
          fetchedCategories = defaultCategories;
          await setDoc(catRef, { content: fetchedCategories });
        }

        setNavLinks(fetchedCategories.map((c: any) => ({ name: c.title, path: c.path })));
      } catch (e) {
        console.error("Error fetching categories for navbar", e);
      }
    };
    fetchCategories();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    clearCart(); // Clear cart on logout
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled || location.pathname !== '/' ? 'glass py-4 shadow-xl' : 'bg-transparent py-6'}`}>
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="text-2xl font-headline font-extrabold tracking-tighter text-primary flex items-center">
          {footerInfo?.logoImage ? (
            <img src={footerInfo.logoImage} alt="핑크버튼" className="h-10 md:h-14 object-contain" />
          ) : (
            (footerInfo?.logoText || '핑크버튼').replace(/H&G스토아/g, '핑크버튼')
          )}
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className={`text-sm font-headline font-medium transition-colors ${
                location.pathname === link.path ? 'text-primary' : 'text-on-surface/70 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button className="p-2 text-on-surface/70 hover:text-primary transition-colors" title="검색">
            <Search size={20} />
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 text-on-surface/70 hover:text-primary transition-colors relative"
            title="장바구니"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin" className="p-2 text-primary hover:text-primary-container transition-colors" title="관리자 대시보드">
                  <Shield size={20} />
                </Link>
              )}
              <Link to="/profile" className="hidden md:block text-sm font-medium text-on-surface/70 hover:text-primary transition-colors cursor-pointer">
                {user.displayName || user.email?.split('@')[0]}님
              </Link>
              <button onClick={handleLogout} className="p-2 text-on-surface/70 hover:text-error transition-colors" title="로그아웃">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="p-2 text-on-surface/70 hover:text-primary transition-colors">
              <User size={20} />
            </Link>
          )}
          
          <button 
            className="lg:hidden p-2 text-on-surface/70 hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-outline-variant/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className={`text-lg font-headline font-medium transition-colors ${
                    location.pathname === link.path ? 'text-primary' : 'text-on-surface/70 hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const Footer = () => {
  const [footerInfo, setFooterInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchFooterInfo() {
      try {
        const docRef = doc(db, 'siteContent', 'footer');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFooterInfo(docSnap.data().content);
        }
      } catch (error) {
        console.error("Error fetching footer info:", error);
      }
    }
    fetchFooterInfo();
  }, []);

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-headline font-extrabold text-primary tracking-tighter flex items-center">
              {footerInfo?.logoImage ? (
                <img src={footerInfo.logoImage} alt="핑크버튼" className="h-12 md:h-16 object-contain" />
              ) : (
                (footerInfo?.logoText || '핑크버튼').replace(/H&G스토아/g, '핑크버튼')
              )}
            </Link>
            <p 
              className="text-on-surface-variant text-sm leading-relaxed max-w-xs"
              dangerouslySetInnerHTML={{ __html: (footerInfo?.copyrightText || '© 2024 핑크버튼. 본 사이트는 만 19세 미만의 청소년의 출입을 금합니다. 성인 인증 후 모든 콘텐츠 이용이 가능합니다.').replace(/H&G스토아/g, '핑크버튼') }}
            />
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div className="space-y-6">
              <h4 className="text-on-surface font-headline font-bold text-sm uppercase tracking-widest">정보</h4>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li><Link to="/about" className="hover:text-primary transition-colors">회사소개</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">이용약관</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors font-bold text-primary">개인정보처리방침</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-on-surface font-headline font-bold text-sm uppercase tracking-widest">고객센터</h4>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li><Link to="/inquiry" className="hover:text-primary transition-colors">문의하기</Link></li>
                <li><Link to="/tracking" className="hover:text-primary transition-colors">배송조회</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">자주 묻는 질문</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] leading-relaxed">
            {Array.isArray(footerInfo) 
              ? footerInfo.filter(item => item.label || item.value).map(item => `${item.label}: ${String(item.value).replace(/H&G스토아|H&G/g, '핑크버튼')}`).join(' | ')
              : <>
                  사업자등록번호: {footerInfo?.businessNumber || '000-00-00000'} | 대표: {(footerInfo?.ceo || '핑크버튼 팀').replace(/H&G스토아|H&G/g, '핑크버튼')} | 전화: {footerInfo?.phone || '00-000-0000'} | 주소: {footerInfo?.address || '서울특별시'}
                  {footerInfo?.extraFields?.length > 0 && ' | ' + footerInfo.extraFields.filter((item: any) => item.label || item.value).map((item: any) => `${item.label}: ${String(item.value).replace(/H&G스토아|H&G/g, '핑크버튼')}`).join(' | ')}
                </>
            }
          </p>
        </div>
      </div>
    </footer>
  );
};
