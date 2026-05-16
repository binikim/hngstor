import React, { useState } from 'react';
import { db, handleFirestoreError } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function MigrationAdmin() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runMigration = async () => {
    setLoading(true);
    addLog('마이그레이션 시작...');
    try {
      // Users
      addLog('회원 데이터(Users) 가져오는 중...');
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        await fetch(`http://${window.location.hostname}:3001/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userDoc.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() })
        });
      }
      addLog(`회원 ${usersSnap.size}명 이전 완료!`);

      // Products
      addLog('상품 데이터(Products) 가져오는 중...');
      const productsSnap = await getDocs(collection(db, 'products'));
      for (const prodDoc of productsSnap.docs) {
        const data = prodDoc.data();
        await fetch(`http://${window.location.hostname}:3001/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prodDoc.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() })
        });
      }
      addLog(`상품 ${productsSnap.size}개 이전 완료!`);

      // Orders
      addLog('주문 데이터(Orders) 가져오는 중...');
      const ordersSnap = await getDocs(collection(db, 'orders'));
      for (const ordDoc of ordersSnap.docs) {
        const data = ordDoc.data();
        await fetch(`http://${window.location.hostname}:3001/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ordDoc.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString() })
        });
      }
      addLog(`주문 ${ordersSnap.size}건 이전 완료!`);

      // Content
      addLog('사이트 설정(Content) 가져오는 중...');
      const contents = ['home', 'footer', 'about', 'terms', 'privacy', 'faq', 'inquiry', 'categories'];
      for (const cid of contents) {
        const cSnap = await getDoc(doc(db, 'siteContent', cid));
        if (cSnap.exists()) {
          await fetch(`http://${window.location.hostname}:3001/api/content/${cid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: cSnap.data().content })
          });
        }
      }
      addLog(`사이트 설정 이전 완료!`);

      addLog('🚀 모든 데이터 이전 성공! 이제 저에게 완료되었다고 알려주세요!');
    } catch (e: any) {
      addLog(`❌ 오류 발생: ${e.message}`);
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-32 px-6 pb-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">데이터베이스 자동 이전 (마이그레이션)</h1>
      <p className="mb-8 text-on-surface-variant">버튼을 누르면 현재 로그인된 권한으로 파이어베이스의 모든 데이터를 로컬 DB로 옮깁니다.</p>
      
      <button 
        onClick={runMigration}
        disabled={loading}
        className="bg-primary text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50"
      >
        {loading ? '이전 중...' : '데이터 이전 시작하기'}
      </button>

      <div className="mt-8 bg-surface-container-low p-6 rounded-xl space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="font-mono text-sm">{log}</div>
        ))}
      </div>
    </div>
  );
}
