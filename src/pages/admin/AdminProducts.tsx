/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Trash2, Package, Search, Edit2, Check, X as CloseIcon, Upload, Image as ImageIcon } from 'lucide-react';
import AddProductModal from '../../components/admin/AddProductModal';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const catUnsubscribe = onSnapshot(doc(db, 'siteContent', 'categories'), (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data().content)) {
        setDynamicCategories(docSnap.data().content.map((c: any) => c.title));
      }
    });

    return () => {
      unsubscribe();
      catUnsubscribe();
    };
  }, []);

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditLoading(true);
    try {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, 'products', id), data);

      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${editingProduct.id}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products');
      }
    }
  };

  const handleUpdateStock = async (id: string) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        stock: tempStock
      });
      setEditingStockId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 500KB for base64 in Firestore)
    if (file.size > 500 * 1024) {
      alert('이미지 크기가 너무 큽니다. 500KB 이하의 이미지를 사용해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit && editingProduct) {
        setEditingProduct({ ...editingProduct, image: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const categories = ['전체', ...Array.from(new Set([...products.map(p => p.category), ...dynamicCategories]))];
  const uniqueEditCategories = Array.from(new Set([...dynamicCategories, ...products.map(p => p.category)]));
  const filteredProducts = selectedCategory === '전체' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <h2 className="text-2xl font-headline font-bold flex items-center gap-2 shrink-0">
            <Package size={24} /> 제품 관리
          </h2>
          
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
            <Search size={16} className="text-on-surface-variant/50" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none w-40"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-all whitespace-nowrap shrink-0"
        >
          <Plus size={20} /> 새 제품 등록
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-4 font-medium">이미지</th>
                <th className="px-6 py-4 font-medium">제품명</th>
                <th className="px-6 py-4 font-medium">카테고리</th>
                <th className="px-6 py-4 font-medium">가격</th>
                <th className="px-6 py-4 font-medium">재고</th>
                <th className="px-6 py-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  </td>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{product.category}</td>
                  <td className="px-6 py-4 font-mono">{product.price.toLocaleString()}원</td>
                  <td className="px-6 py-4">
                    {editingStockId === product.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={tempStock}
                          onChange={(e) => setTempStock(Number(e.target.value))}
                          className="w-20 bg-surface-container-lowest border border-outline-variant/20 rounded px-2 py-1 text-xs"
                          autoFocus
                        />
                        <button onClick={() => handleUpdateStock(product.id)} className="text-success hover:scale-110 transition-transform">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingStockId(null)} className="text-error hover:scale-110 transition-transform">
                          <CloseIcon size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className={product.stock <= 5 ? 'text-error font-bold' : ''}>
                          {product.stock}
                        </span>
                        <button 
                          onClick={() => {
                            setEditingStockId(product.id);
                            setTempStock(product.stock);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                        title="수정"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-on-surface-variant hover:text-error transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddProductModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        categories={uniqueEditCategories}
      />

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-surface-container-low w-full max-w-lg p-8 rounded-3xl border border-outline-variant/10 shadow-2xl">
            <h3 className="text-2xl font-headline font-bold mb-6">제품 수정</h3>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">제품명</label>
                <input 
                  type="text" required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">가격 (원)</label>
                  <input 
                    type="text" required
                    value={editingProduct.price === 0 ? '' : editingProduct.price.toLocaleString()}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEditingProduct({...editingProduct, price: val ? Number(val) : 0});
                    }}
                    placeholder="0"
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">재고</label>
                  <input 
                    type="text" required
                    value={editingProduct.stock === 0 ? '' : editingProduct.stock.toLocaleString()}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEditingProduct({...editingProduct, stock: val ? Number(val) : 0});
                    }}
                    placeholder="0"
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">카테고리</label>
                <select 
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
                >
                  {uniqueEditCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">이미지 수정</label>
                <div className="flex flex-col gap-4">
                  {editingProduct.image && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/10">
                      <img src={editingProduct.image} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                      <Upload size={18} className="text-primary" />
                      <span className="text-xs font-bold">이미지 변경</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-surface-container-high rounded-xl font-bold">취소</button>
                <button 
                  type="submit" 
                  disabled={editLoading}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold disabled:opacity-50"
                >
                  {editLoading ? '수정 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
