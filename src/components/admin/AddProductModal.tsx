/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X as CloseIcon, Upload } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '여성 성인용품',
    price: 0,
    stock: 0,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('이미지 크기가 너무 큽니다. 500KB 이하의 이미지를 사용해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct({ ...newProduct, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: serverTimestamp()
      });
      onSuccess?.();
      onClose();
      setNewProduct({
        name: '',
        category: '여성 성인용품',
        price: 0,
        stock: 0,
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface-container-low w-full max-w-lg p-8 rounded-3xl border border-outline-variant/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-headline font-bold">새 제품 등록</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <CloseIcon size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant">제품명</label>
            <input 
              type="text" required
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">가격 (KRW)</label>
              <input 
                type="number" required
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">재고</label>
              <input 
                type="number" required
                value={newProduct.stock}
                onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant">카테고리</label>
            <select 
              value={newProduct.category}
              onChange={e => setNewProduct({...newProduct, category: e.target.value})}
              className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-1 focus:ring-primary"
            >
              <option>남성 성인용품</option>
              <option>여성 성인용품</option>
              <option>콘돔</option>
              <option>러브젤</option>
              <option>기타 성인용품</option>
              <option>섹시속옷</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant">이미지 등록</label>
            <div className="flex flex-col gap-4">
              {newProduct.image && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/10">
                  <img src={newProduct.image} alt="Preview" className="w-full h-full object-contain" />
                  <button 
                    type="button"
                    onClick={() => setNewProduct({...newProduct, image: ''})}
                    className="absolute top-2 right-2 p-1.5 bg-error text-on-error rounded-full shadow-lg"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                  <Upload size={18} className="text-primary" />
                  <span className="text-xs font-bold">이미지 업로드</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-surface-container-high rounded-xl font-bold">취소</button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
