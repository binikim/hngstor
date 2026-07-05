/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  badgeColor?: string;
}

const CATEGORY_DATA: Record<string, { title: string; description: string; image: string }> = {
  men: {
    title: "남성용품",
    description: "프리미엄 남성 전용 아이템",
    image: "https://images.unsplash.com/photo-1618022325802-7e5e732d97a1?auto=format&fit=crop&q=80&w=1920"
  },
  men_acc: {
    title: "남성보조용품",
    description: "더욱 완벽한 경험을 위한 보조용품",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1920"
  },
  women: {
    title: "여성용품",
    description: "섬세한 감각을 깨우는 프리미엄 컬렉션",
    image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=1920"
  },
  women_acc: {
    title: "여성보조용품",
    description: "특별한 순간을 위한 여성 보조용품",
    image: "https://images.unsplash.com/photo-1518085250890-410c5a278916?auto=format&fit=crop&q=80&w=1920"
  },
  condoms: {
    title: "콘돔",
    description: "안전하고 건강한 사랑을 위한 필수 선택",
    image: "https://images.unsplash.com/photo-1614031679269-138379ba51fb?auto=format&fit=crop&q=80&w=1920"
  },
  lubes: {
    title: "러브젤",
    description: "부드럽고 매끄러운 경험의 완성",
    image: "https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&q=80&w=1920"
  },
  couple: {
    title: "커플성인용품",
    description: "둘만의 특별한 시간을 위한 아이템",
    image: "https://images.unsplash.com/photo-1518144591331-17a5dd71c477?auto=format&fit=crop&q=80&w=1920"
  },
  lingerie: {
    title: "섹시속옷",
    description: "당신의 매력을 더욱 돋보이게 할 미드나잇 컬렉션",
    image: "https://images.unsplash.com/photo-1512413916298-5c4dd8bbab4d?auto=format&fit=crop&q=80&w=1920"
  },
  others: {
    title: "기타 성인용품",
    description: "더욱 다채로운 즐거움을 위한 액세서리",
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=1920"
  }
};

const matchCategory = (productCat: string, categoryTitle: string): boolean => {
  const pCat = productCat || '';
  const cTitle = categoryTitle || '';

  if (cTitle.includes('보조')) {
    if (cTitle.includes('남성')) {
      return pCat.includes('남성') && pCat.includes('보조');
    }
    if (cTitle.includes('여성')) {
      return pCat.includes('여성') && pCat.includes('보조');
    }
  }

  if (cTitle.includes('남성')) {
    return pCat.includes('남성') && !pCat.includes('보조');
  }

  if (cTitle.includes('여성')) {
    return pCat.includes('여성') && !pCat.includes('보조');
  }

  if (cTitle.includes('콘돔') && pCat.includes('콘돔')) return true;
  if (cTitle.includes('러브젤') && pCat.includes('러브젤')) return true;
  if (cTitle.includes('속옷') && (pCat.includes('속옷') || pCat.includes('란제리'))) return true;
  if (cTitle.includes('커플') && pCat.includes('커플')) return true;
  if (cTitle.includes('기타') && pCat.includes('기타')) return true;

  return pCat.includes(cTitle) || cTitle.includes(pCat);
};

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { addToCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const docRef = doc(db, 'siteContent', 'categories');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && Array.isArray(docSnap.data().content)) {
          const categories = docSnap.data().content;
          const found = categories.find((c: any) => c.id === categoryId);
          if (found) {
            setData(found);
            return;
          }
        }
        // Fallback to local
        if (categoryId && CATEGORY_DATA[categoryId]) {
          setData(CATEGORY_DATA[categoryId]);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const allProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(allProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => 
    data ? matchCategory(product.category, data.title) : false
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-on-surface-variant font-bold">카테고리 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <h1 className="text-2xl font-headline font-bold">카테고리를 찾을 수 없습니다.</h1>
      </div>
    );
  }

  return (
    <div className="pt-24">
      {/* Category Header */}
      <section className="relative h-[40vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={data.image} 
            alt={data.title} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${!user ? 'blur-3xl opacity-10' : 'opacity-40'}`}
            referrerPolicy="no-referrer"
          />
          {!user && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <Lock className="text-white/20 mb-4" size={48} />
              <p className="text-white font-bold text-xl">로그인 후 이미지를 확인할 수 있습니다.</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background"></div>
        </div>
        <div className="relative z-10 max-w-[1920px] mx-auto px-6 md:px-12 w-full text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter mb-4"
          >
            {data.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant text-lg font-light"
          >
            {data.description}
          </motion.p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-20">
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-surface-container-low rounded-2xl mb-6"></div>
                <div className="h-4 bg-surface-container-low rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-surface-container-low rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="relative aspect-[3/4] bg-surface-container-low rounded-2xl overflow-hidden mb-6">
                  {!user ? (
                    <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="text-on-surface-variant/10 mb-4" size={40} />
                      <p className="text-on-surface-variant/40 text-sm font-bold leading-tight">로그인 시<br/>상품 이미지가 노출됩니다.</p>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform active:scale-95"
                        >
                          <ShoppingCart size={18} /> 담기
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant font-medium tracking-wider uppercase">{product.category}</p>
                  <h3 className="text-lg font-headline font-semibold group-hover:text-primary transition-colors leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xl font-bold font-headline text-on-surface">{(product.price || 0).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback mock products using data.image */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="group">
                <div className="relative aspect-[3/4] bg-surface-container-low rounded-2xl overflow-hidden mb-6">
                  {!user ? (
                    <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="text-on-surface-variant/10 mb-4" size={40} />
                      <p className="text-on-surface-variant/40 text-sm font-bold leading-tight">로그인 시<br/>상품 이미지가 노출됩니다.</p>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={data.image} 
                        alt={`프리미엄 ${data.title} 제품 ${i}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => addToCart({
                            id: `${categoryId}-${i}`,
                            name: `프리미엄 ${data.title} 제품 ${i}`,
                            price: (50000 + i * 10000),
                            image: data.image
                          })}
                          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform active:scale-95"
                        >
                          <ShoppingCart size={18} /> 담기
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant font-medium tracking-wider uppercase">{data.title}</p>
                  <h3 className="text-lg font-headline font-semibold group-hover:text-primary transition-colors leading-tight">
                    프리미엄 {data.title} 제품 {i}
                  </h3>
                  <p className="text-xl font-bold font-headline text-on-surface">{(50000 + i * 10000).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
