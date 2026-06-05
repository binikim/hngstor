/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ArrowRight, 
  ChevronRight,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../context/CartContext';

// --- Types ---
interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  badgeColor?: string;
}

interface Category {
  id: string | number;
  title: string;
  description: string;
  image: string;
  path: string;
  span?: string;
}

// --- Mock Data ---
// CATEGORIES are fetched dynamically

const Hero = ({ content }: { content?: any }) => {
  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1920" 
          alt="Hero" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto px-6 md:px-12 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <h1 
            className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-8 leading-tight break-keep text-on-surface"
            dangerouslySetInnerHTML={{ __html: content?.heroTitle || '감각의 <br />\n<span class="text-primary">예술.</span>' }}
          />
          <p 
            className="text-lg md:text-xl text-on-surface-variant leading-relaxed font-light max-w-lg break-keep"
            dangerouslySetInnerHTML={{ __html: content?.heroSubtitle || '당신의 가장 사적인 순간을 위한 큐레이션. <br />\n핑크버튼에서 엄선한 프리미엄 감각을 경험하세요.' }}
          />
        </motion.div>
      </div>
    </section>
  );
};

interface CategoryCardProps {
  category: Category;
  isLoggedIn: boolean;
  key?: React.Key;
}

const CategoryCard = ({ category, isLoggedIn }: CategoryCardProps) => {
  return (
    <Link to={category.path}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className={`relative h-[400px] rounded-2xl overflow-hidden group cursor-pointer ${category.span || ''}`}
      >
        <img 
          src={category.image} 
          alt={category.title} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:via-black/40 transition-all"></div>
        <div className="absolute bottom-8 left-8">
          <h3 className="text-2xl md:text-3xl font-headline font-bold text-white mb-2">{category.title}</h3>
          <p className="text-white/70 text-sm md:text-base">{category.description}</p>
        </div>
      </motion.div>
    </Link>
  );
};

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  key?: React.Key;
}

const ProductCard = ({ product, isLoggedIn }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative aspect-[3/4] bg-surface-container-low rounded-2xl overflow-hidden mb-6">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
          referrerPolicy="no-referrer"
        />
        {product.badge && (
          <div className="absolute top-4 right-4">
            <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded text-[10px] font-bold font-headline uppercase tracking-widest">
              {product.badge}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={() => addToCart(product)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform active:scale-95"
          >
            <ShoppingCart size={18} /> 담기
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-on-surface-variant font-medium tracking-wider uppercase">{product.category}</p>
        <h3 className="text-lg font-headline font-semibold group-hover:text-primary transition-colors leading-tight">
          {product.name}
        </h3>
        <p className="text-xl font-bold font-headline text-on-surface">{(product.price || 0).toLocaleString()} KRW</p>
      </div>
    </motion.div>
  );
};

// --- Seed Data Function ---
const seedProducts = async () => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  if (snapshot.empty) {
    const initialProducts = [
      {
        category: "여성 성인용품",
        name: "실크 웨이브 프리미엄 진동기",
        price: 129000,
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
        badge: "HOT",
        createdAt: serverTimestamp()
      },
      {
        category: "러브젤",
        name: "워터베이직 수용성 루브리컨트",
        price: 24000,
        image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=800",
        createdAt: serverTimestamp()
      },
      {
        category: "남성 성인용품",
        name: "티타늄 엑스 스마트 링",
        price: 89000,
        image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80&w=800",
        createdAt: serverTimestamp()
      },
      {
        category: "섹시속옷",
        name: "미드나잇 레이스 란제리 세트",
        price: 65000,
        image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=800",
        badge: "LIMITED",
        createdAt: serverTimestamp()
      }
    ];

    for (const p of initialProducts) {
      await addDoc(productsRef, p);
    }
  }
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("전체");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeContent, setHomeContent] = useState<any>(null);

  const [categoriesData, setCategoriesData] = useState<Category[]>([]);

  useEffect(() => {
    seedProducts(); // Seed if empty

    async function loadPageData() {
      try {
        const [homeDoc, catDoc] = await Promise.all([
          getDoc(doc(db, 'siteContent', 'home')),
          getDoc(doc(db, 'siteContent', 'categories'))
        ]);
        
        let homeData = null;
        if (homeDoc.exists()) {
          homeData = homeDoc.data().content;
          setHomeContent(homeData);
        }
        if (catDoc.exists() && Array.isArray(catDoc.data().content)) {
          setCategoriesData(catDoc.data().content);
        }

        if (homeData?.featuredProductIds?.length > 0) {
          const productPromises = homeData.featuredProductIds.map((id: string) => getDoc(doc(db, 'products', id)));
          const productSnaps = await Promise.all(productPromises);
          const productData = productSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as Product));
          setProducts(productData);
          setLoading(false);
        } else {
          // Fallback to latest
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
          const snapshot = await getDocs(q);
          const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(productData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    }
    loadPageData();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const emailLower = currentUser.email?.toLowerCase();
          const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
          const isDefaultAdmin = emailLower === defaultAdminEmail;
          
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const userRole = userData?.role || (isDefaultAdmin ? 'admin' : 'user');

          if (userRole === 'admin') {
            localStorage.setItem('isAdmin', 'true');
          } else {
            localStorage.removeItem('isAdmin');
          }
        } catch (error) {
          console.error("Home auth check error:", error);
          const emailLower = currentUser.email?.toLowerCase();
          const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
          const isDefaultAdmin = emailLower === defaultAdminEmail;
          if (isDefaultAdmin) {
            localStorage.setItem('isAdmin', 'true');
          } else {
            localStorage.removeItem('isAdmin');
          }
        }
      } else {
        localStorage.removeItem('isAdmin');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Removed duplicate useEffect for products
  const filteredProducts = products.filter(product => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "베스트셀러") return product.badge === "HOT" || product.badge === "BEST";
    if (activeFilter === "한정수량") return product.badge === "LIMITED";
    if (activeFilter === "특가상품") return !product.badge || product.badge === "SALE" || product.badge === "SPECIAL";
    return true;
  });

  return (
    <div>
      <Hero content={homeContent} />

      {/* Categories Section */}
      <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-tertiary font-headline font-bold text-xs tracking-[0.3em] block mb-3 uppercase">
              {homeContent?.categoriesSubtitle || '큐레이션 컬렉션'}
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
              {homeContent?.categoriesTitle || '베스트 카테고리'}
            </h2>
          </div>
          <button 
            onClick={() => {
              if (categoriesData.length > 0) {
                navigate(categoriesData[0].path);
              }
            }}
            className="group text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform"
          >
            전체보기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {categoriesData.map((cat, index) => (
            <CategoryCard key={cat.id || index} category={cat} isLoggedIn={!!user} />
          ))}
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-24 bg-surface-container-lowest/30">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-8">
            {homeContent?.productsTitle || '인기 제품'}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {["전체", "베스트셀러", "특가상품", "한정수량"].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeFilter === filter 
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-surface-container-low rounded-2xl mb-6"></div>
                <div className="h-4 bg-surface-container-low rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-surface-container-low rounded w-3/4"></div>
              </div>
            ))
          ) : (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} isLoggedIn={!!user} />
            ))
          )}
        </div>

        <div className="mt-20 text-center">
          <button 
            onClick={() => {
              if (categoriesData.length > 0) {
                navigate(categoriesData[0].path);
              }
            }}
            className="group px-10 py-4 border border-outline-variant/20 rounded-xl font-bold hover:bg-surface-container-low transition-all flex items-center gap-3 mx-auto"
          >
            더 많은 제품 보기 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Brand Philosophy / Banner */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920" 
            alt="Philosophy" 
            className="w-full h-full object-cover opacity-20 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 
              className="text-3xl md:text-6xl font-serif font-medium mb-8 leading-tight break-keep"
              dangerouslySetInnerHTML={{ __html: homeContent?.philosophyTitle || '우리는 단순한 상점이 아닌, <br />\n당신의 <span class="text-primary italic">가장 아름다운 순간</span>을 디자인합니다.' }}
            />
            <p 
              className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light font-sans whitespace-pre-line break-keep"
              dangerouslySetInnerHTML={{ __html: homeContent?.philosophySubtitle || '핑크버튼는 엄선된 품질과 세련된 디자인을 통해 성인용품에 대한 새로운 기준을 제시합니다. \n모든 제품은 당신의 프라이버시를 최우선으로 생각하며 안전하게 배송됩니다.' }}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
