/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Mail, Shield, Calendar, Edit2, Trash2, Check, X as CloseIcon } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: string;
  createdAt: any;
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

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', role: '' });

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[];
      setUsers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'user'
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: editForm.displayName,
        email: editForm.email,
        role: editForm.role,
        updatedAt: new Date()
      });
      alert('회원 정보가 성공적으로 수정되었습니다.');
      setEditingUser(null);
    } catch (error: any) {
      console.error("Update User Error:", error);
      let errorMessage = '정보 수정 중 오류가 발생했습니다.';
      
      if (error.message?.includes('permission-denied')) {
        errorMessage = '권한이 없습니다. 관리자 권한을 확인해주세요.';
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      
      alert(errorMessage);
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingUser.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
    if (userEmail?.toLowerCase() === defaultAdminEmail) {
      alert(`시스템 마스터 관리자 계정(${defaultAdminEmail})은 삭제할 수 없습니다.`);
      return;
    }

    if (window.confirm(`정말 ${userEmail} 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 해당 사용자의 모든 정보가 삭제됩니다.`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('회원이 성공적으로 삭제되었습니다.');
      } catch (error: any) {
        console.error("Delete User Error:", error);
        alert('회원 삭제 중 오류가 발생했습니다: ' + (error.message || error));
        handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Users size={24} /> 회원 관리
        </h2>
        <div className="text-sm text-on-surface-variant">총 {users.length}명의 회원이 가입되어 있습니다.</div>
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/5">
                <th className="px-6 py-4 font-medium">사용자</th>
                <th className="px-6 py-4 font-medium">이메일</th>
                <th className="px-6 py-4 font-medium">연락처</th>
                <th className="px-6 py-4 font-medium">역할</th>
                <th className="px-6 py-4 font-medium">가입일</th>
                <th className="px-6 py-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map((user) => (
                <tr key={user.id} className="border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.displayName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{user.displayName || '이름 없음'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Mail size={14} /> {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {formatPhoneNumber(user.phoneNumber)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                        title="회원 정보 수정"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-30"
                        title="회원 삭제"
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-low w-full max-w-md rounded-3xl p-8 border border-outline-variant/10 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                <Edit2 size={20} className="text-primary" /> 회원 정보 수정
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">이름</label>
                <input 
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">이메일</label>
                <input 
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">역할 (ROLE)</label>
                <select 
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-4 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="user">USER (일반 회원)</option>
                  <option value="admin">ADMIN (시스템 관리자)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-4 bg-outline-variant/10 rounded-xl font-bold hover:bg-outline-variant/20 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {isUpdating ? '저장 중...' : <><Check size={20} /> 저장하기</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
