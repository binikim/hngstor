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
import { doc, getDoc } from 'firebase/firestore';

const CATEGORY_DATA: Record<string, { title: string; description: string; image: string }> = {
  men: {
    title: "남성 성인용품",
    description: "강렬한 퍼포먼스와 혁신적인 테크놀로지의 만남",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=1920"
  },
  women: {
    title: "여성 성인용품",
    description: "섬세한 감각과 우아한 디자인의 프리미엄 컬렉션",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1920"
  },
  condoms: {
    title: "콘돔",
    description: "안전하고 건강한 사랑을 위한 필수 선택",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1920"
  },
  lubes: {
    title: "러브젤",
    description: "부드럽고 매끄러운 경험의 완성",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1920"
  },
  others: {
    title: "기타 성인용품",
    description: "더욱 다채로운 즐거움을 위한 액세서리",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920"
  },
  lingerie: {
    title: "섹시속옷",
    description: "당신의 매력을 더욱 돋보이게 할 미드나잇 컬렉션",
    image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=1920"
  }
};

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { addToCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
            className={`w-full h-full object-cover transition-opacity duration-500 opacity-40`}
            referrerPolicy="no-referrer"
          />
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

      {/* Product Grid (Placeholder) */}
      <section className="max-w-[1920px] mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="group">
              <div className="relative aspect-[3/4] bg-surface-container-low rounded-2xl overflow-hidden mb-6">
                  <>
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/20">
                      <span className="text-4xl font-headline font-bold">{i}</span>
                    </div>
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
              </div>
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium tracking-wider uppercase">{data.title}</p>
                <h3 className="text-lg font-headline font-semibold group-hover:text-primary transition-colors leading-tight">
                  프리미엄 {data.title} 제품 {i}
                </h3>
                <p className="text-xl font-bold font-headline text-on-surface">{(50000 + i * 10000).toLocaleString()} KRW</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
