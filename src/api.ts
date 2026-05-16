const API_BASE = 'http://localhost:3001/api';

export const api = {
  // Users
  getUsers: async () => await (await fetch(`${API_BASE}/users`)).json(),
  getUser: async (uid: string) => await (await fetch(`${API_BASE}/users/${uid}`)).json(),
  createUser: async (data: any) => await (await fetch(`${API_BASE}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  updateUser: async (uid: string, data: any) => await (await fetch(`${API_BASE}/users/${uid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  deleteUser: async (uid: string) => await (await fetch(`${API_BASE}/users/${uid}`, { method: 'DELETE' })).json(),

  // Products
  getProducts: async () => await (await fetch(`${API_BASE}/products`)).json(),
  getProduct: async (id: string) => await (await fetch(`${API_BASE}/products/${id}`)).json(),
  createProduct: async (data: any) => await (await fetch(`${API_BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  updateProduct: async (id: string, data: any) => await (await fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  deleteProduct: async (id: string) => await (await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' })).json(),

  // Orders
  getOrders: async () => await (await fetch(`${API_BASE}/orders`)).json(),
  getUserOrders: async (userId: string) => await (await fetch(`${API_BASE}/orders/user/${userId}`)).json(),
  createOrder: async (data: any) => await (await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  updateOrder: async (id: string, data: any) => await (await fetch(`${API_BASE}/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json(),
  deleteOrder: async (id: string) => await (await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' })).json(),

  // Site Content
  getContent: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/content/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  updateContent: async (id: string, content: any) => await (await fetch(`${API_BASE}/content/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })).json(),
};
