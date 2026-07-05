/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { TrendingUp, Search, Sparkles, Star, Flame, Award } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  badge?: string;
}

export default function AdminPopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateBadge = async (productId: string, badgeValue: string | null) => {
    setUpdatingId(productId);
    try {
      await updateDoc(doc(db, 'products', productId), {
        badge: badgeValue
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    } finally {
      setTimeout(() => setUpdatingId(null), 500);
    }
  };

  const categories = ['전체', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <h2 className="text-2xl font-headline font-bold flex items-center gap-2 shrink-0">
            <TrendingUp size={24} className="text-primary" /> 인기 제품 설정
          </h2>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10 w-64">
              <Search size={16} className="text-on-surface-variant/50" />
              <input
                type="text"
                placeholder="제품명 또는 카테고리 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none w-full placeholder:text-on-surface-variant/30"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
              <span className="text-xs text-on-surface-variant/60 font-bold">분류:</span>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none w-36"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-sm text-on-surface-variant leading-relaxed">
        💡 메인 페이지의 <strong>인기 제품</strong> 섹션에 노출할 뱃지(베스트셀러, 특가상품, 한정수량)를 각 제품별로 지정할 수 있습니다. 변경 사항은 즉시 반영됩니다.
      </div>

      {/* Products List */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-4 font-medium">이미지</th>
                <th className="px-6 py-4 font-medium">제품명</th>
                <th className="px-6 py-4 font-medium">카테고리</th>
                <th className="px-6 py-4 font-medium">가격</th>
                <th className="px-6 py-4 font-medium text-center">인기 제품 분류 지정</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant/60 font-medium">
                    해당 조건의 제품이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-6 py-4">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    </td>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{product.category}</td>
                    <td className="px-6 py-4 font-mono">{product.price.toLocaleString()}원</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* None Badge */}
                        <button
                          disabled={updatingId === product.id}
                          onClick={() => handleUpdateBadge(product.id, null)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            !product.badge
                              ? 'bg-outline-variant/20 text-on-surface border-outline-variant/30'
                              : 'bg-transparent text-on-surface-variant/50 border-outline-variant/10 hover:border-outline-variant/30'
                          }`}
                        >
                          일반 (없음)
                        </button>

                        {/* Bestseller (HOT) */}
                        <button
                          disabled={updatingId === product.id}
                          onClick={() => handleUpdateBadge(product.id, 'HOT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                            product.badge === 'HOT' || product.badge === 'BEST'
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-transparent text-primary border-primary/20 hover:bg-primary/5'
                          }`}
                        >
                          <Flame size={12} /> 베스트셀러
                        </button>

                        {/* Special Offer (SALE) */}
                        <button
                          disabled={updatingId === product.id}
                          onClick={() => handleUpdateBadge(product.id, 'SALE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                            product.badge === 'SALE'
                              ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                              : 'bg-transparent text-secondary border-secondary/20 hover:bg-secondary/5'
                          }`}
                        >
                          <Sparkles size={12} /> 특가상품
                        </button>

                        {/* Limited Quantity (LIMITED) */}
                        <button
                          disabled={updatingId === product.id}
                          onClick={() => handleUpdateBadge(product.id, 'LIMITED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                            product.badge === 'LIMITED'
                              ? 'bg-tertiary text-on-tertiary border-tertiary shadow-sm'
                              : 'bg-transparent text-tertiary border-tertiary/20 hover:bg-tertiary/5'
                          }`}
                        >
                          <Award size={12} /> 한정수량
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
