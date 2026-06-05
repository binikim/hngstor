// Mock of firebase/firestore connecting to SQLite backend
const API_BASE = `http://${window.location.hostname}:3001/api`;

export const getFirestore = () => ({});

export const collection = (db: any, path: string) => ({ type: 'collection', path });
export const doc = (db: any, collectionName: string, id: string) => {
  if (typeof db === 'object' && db.type === 'collection') {
    return { type: 'doc', path: `${db.path}/${collectionName}` };
  }
  return { type: 'doc', path: `${collectionName}/${id}` };
};

export const query = (ref: any, ...args: any[]) => ({ ...ref, queryArgs: args });
export const orderBy = (field: string, direction: string = 'asc') => ({ type: 'orderBy', field, direction });
export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const limit = (num: number) => ({ type: 'limit', num });

export const getDoc = async (ref: any) => {
  const parts = ref.path.split('/');
  const collectionName = parts[0];
  const id = parts.slice(1).join('/');
  
  if (collectionName === 'siteContent') {
    const res = await fetch(`${API_BASE}/content/${id}`);
    if (!res.ok) return { exists: () => false, data: () => null, id };
    const data = await res.json();
    return { exists: () => true, data: () => ({ content: data.content }), id };
  }

  const res = await fetch(`${API_BASE}/${collectionName}/${id}`);
  if (!res.ok) return { exists: () => false, data: () => null, id };
  const data = await res.json();
  return { exists: () => true, data: () => data, id };
};

export const getDocFromServer = getDoc;

export const getDocs = async (ref: any) => {
  const collectionName = ref.path;
  let url = `${API_BASE}/${collectionName}`;
  
  const whereArg = ref.queryArgs?.find((a: any) => a.type === 'where');
  if (whereArg && collectionName === 'orders' && whereArg.field === 'userId') {
    url = `${API_BASE}/orders/user/${whereArg.value}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  return {
    docs: data.map((item: any) => ({
      id: item.id || item.uid,
      data: () => item
    }))
  };
};

export const onSnapshot = (ref: any, callback: any) => {
  let isCancelled = false;
  
  const fetchData = async () => {
    try {
      if (ref.type === 'doc') {
        const docSnap = await getDoc(ref);
        if (!isCancelled) callback(docSnap);
      } else {
        const docsSnap = await getDocs(ref);
        if (!isCancelled) callback(docsSnap);
      }
    } catch (e) {
      console.error('onSnapshot mock error', e);
    }
  };

  fetchData(); // Initial fetch
  
  // Polling every 5 seconds for real-time simulation
  const interval = setInterval(fetchData, 5000);

  return () => {
    isCancelled = true;
    clearInterval(interval);
  };
};

export const addDoc = async (ref: any, data: any) => {
  const res = await fetch(`${API_BASE}/${ref.path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Add document failed' }));
    throw new Error(errData.error || 'Add document failed');
  }
  const result = await res.json();
  return { id: result.id || result.uid };
};

export const setDoc = async (ref: any, data: any, options?: any) => {
  const parts = ref.path.split('/');
  const collectionName = parts[0];
  const id = parts.slice(1).join('/');

  if (collectionName === 'siteContent') {
    const res = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: data })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Set site content failed' }));
      throw new Error(errData.error || 'Set site content failed');
    }
    return;
  }

  const method = options?.merge ? 'PUT' : 'POST';
  const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Set document failed' }));
    throw new Error(errData.error || 'Set document failed');
  }
};

export const updateDoc = async (ref: any, data: any) => {
  const parts = ref.path.split('/');
  const collectionName = parts[0];
  const id = parts.slice(1).join('/');

  // Handle increment logic simply by not breaking, though true increment needs backend logic.
  // For this mock, we send the raw data.
  const cleanedData = { ...data };
  for (const key in cleanedData) {
    if (cleanedData[key]?.type === 'increment') {
      cleanedData[key] = cleanedData[key].value; // Fake increment, just pass value
      // Ideally, the backend would handle this, but for simplicity we ignore complex increments here.
    }
  }

  const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanedData)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Update document failed' }));
    throw new Error(errData.error || 'Update document failed');
  }
};

export const deleteDoc = async (ref: any) => {
  const parts = ref.path.split('/');
  const collectionName = parts[0];
  const id = parts.slice(1).join('/');

  const res = await fetch(`${API_BASE}/${collectionName}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Delete document failed' }));
    throw new Error(errData.error || 'Delete document failed');
  }
};

export const serverTimestamp = () => new Date().toISOString();
export const increment = (val: number) => ({ type: 'increment', value: val });

// Fake Timestamp class
export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }
  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }
}
