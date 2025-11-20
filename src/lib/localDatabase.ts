// Local Database Service using IndexedDB
// Replaces Supabase functionality

interface DatabaseSchema {
  products: Product[];
  sales: Sale[];
  sale_items: SaleItem[];
  customers: Customer[];
  payment_history: PaymentHistory[];
  customer_loans: CustomerLoan[];
}

interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  description?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  batch_number?: string;
  cost: number;
  manufacturer?: string;
  minimum_stock: number;
}

interface Sale {
  id: string;
  user_id: string;
  customer_id?: string;
  total_amount: number;
  discount: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

interface PaymentHistory {
  id: string;
  customer_id: string;
  user_id: string;
  amount: number;
  notes?: string;
  created_at: string;
  payment_date: string;
}

interface CustomerLoan {
  id: string;
  customer_id: string;
  sale_id?: string;
  amount: number;
  remaining_balance: number;
  notes?: string;
  created_at: string;
}

class LocalDatabase {
  private dbName = 'pharmacy_db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('user_id', 'user_id', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('user_id', 'user_id', { unique: false });
          saleStore.createIndex('customer_id', 'customer_id', { unique: false });
          saleStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Sale items store
        if (!db.objectStoreNames.contains('sale_items')) {
          const saleItemStore = db.createObjectStore('sale_items', { keyPath: 'id' });
          saleItemStore.createIndex('sale_id', 'sale_id', { unique: false });
          saleItemStore.createIndex('product_id', 'product_id', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('user_id', 'user_id', { unique: false });
          customerStore.createIndex('name', 'name', { unique: false });
        }

        // Payment history store
        if (!db.objectStoreNames.contains('payment_history')) {
          const paymentStore = db.createObjectStore('payment_history', { keyPath: 'id' });
          paymentStore.createIndex('customer_id', 'customer_id', { unique: false });
          paymentStore.createIndex('user_id', 'user_id', { unique: false });
          paymentStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Customer loans store
        if (!db.objectStoreNames.contains('customer_loans')) {
          const loanStore = db.createObjectStore('customer_loans', { keyPath: 'id' });
          loanStore.createIndex('customer_id', 'customer_id', { unique: false });
          loanStore.createIndex('sale_id', 'sale_id', { unique: false });
        }
      };
    });
  }

  private async getStore(storeName: keyof DatabaseSchema, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  private async getStoreWithTransaction(storeName: keyof DatabaseSchema, mode: IDBTransactionMode = 'readonly'): Promise<{ store: IDBObjectStore; transaction: IDBTransaction }> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction([storeName], mode);
    return { store: transaction.objectStore(storeName), transaction };
  }

  // Generic query methods
  async select<T extends keyof DatabaseSchema>(
    table: T,
    filters?: {
      eq?: { [key: string]: any };
      gt?: { [key: string]: any };
      gte?: { [key: string]: any };
      lt?: { [key: string]: any };
      lte?: { [key: string]: any };
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ): Promise<DatabaseSchema[T]> {
    const store = await this.getStore(table, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let results: any[] = request.result || [];

        // Apply filters
        if (filters) {
          if (filters.eq) {
            Object.entries(filters.eq).forEach(([key, value]) => {
              results = results.filter(item => item[key] === value);
            });
          }
          if (filters.gt) {
            Object.entries(filters.gt).forEach(([key, value]) => {
              results = results.filter(item => item[key] > value);
            });
          }
          if (filters.gte) {
            Object.entries(filters.gte).forEach(([key, value]) => {
              results = results.filter(item => item[key] >= value);
            });
          }
          if (filters.lt) {
            Object.entries(filters.lt).forEach(([key, value]) => {
              results = results.filter(item => item[key] < value);
            });
          }
          if (filters.lte) {
            Object.entries(filters.lte).forEach(([key, value]) => {
              results = results.filter(item => item[key] <= value);
            });
          }

          // Order by
          if (filters.orderBy) {
            const { column, ascending = true } = filters.orderBy;
            results.sort((a, b) => {
              const aVal = a[column];
              const bVal = b[column];
              if (aVal < bVal) return ascending ? -1 : 1;
              if (aVal > bVal) return ascending ? 1 : -1;
              return 0;
            });
          }

          // Limit
          if (filters.limit) {
            results = results.slice(0, filters.limit);
          }
        }

        resolve(results as DatabaseSchema[T]);
      };
    });
  }

  async insert<T extends keyof DatabaseSchema>(
    table: T,
    data: DatabaseSchema[T][number] | DatabaseSchema[T]
  ): Promise<DatabaseSchema[T][number] | DatabaseSchema[T]> {
    const store = await this.getStore(table, 'readwrite');
    const items = Array.isArray(data) ? data : [data];

    return new Promise((resolve, reject) => {
      const requests = items.map(item => {
        // Check if item already exists (for put operation)
        return new Promise((res, rej) => {
          const getRequest = store.get(item.id);
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              // Item exists, use put to update
              const putRequest = store.put(item);
              putRequest.onsuccess = () => res(item);
              putRequest.onerror = () => rej(putRequest.error);
            } else {
              // Item doesn't exist, use add
              const addRequest = store.add(item);
              addRequest.onsuccess = () => res(item);
              addRequest.onerror = () => {
                // If add fails due to duplicate, try put
                if (addRequest.error?.name === 'ConstraintError') {
                  const putRequest = store.put(item);
                  putRequest.onsuccess = () => res(item);
                  putRequest.onerror = () => rej(putRequest.error);
                } else {
                  rej(addRequest.error);
                }
              };
            }
          };
          getRequest.onerror = () => {
            // If get fails, try add
            const addRequest = store.add(item);
            addRequest.onsuccess = () => res(item);
            addRequest.onerror = () => {
              // If add fails, try put
              const putRequest = store.put(item);
              putRequest.onsuccess = () => res(item);
              putRequest.onerror = () => rej(putRequest.error);
            };
          };
        });
      });
      
      Promise.all(requests).then(() => {
        resolve(items.length === 1 ? items[0] : items as DatabaseSchema[T]);
      }).catch(reject);
    });
  }

  async update<T extends keyof DatabaseSchema>(
    table: T,
    updates: Partial<DatabaseSchema[T][number]>,
    filters: { [key: string]: any }
  ): Promise<void> {
    // First, get the items to update (this creates its own transaction)
    const items = await this.select(table, { eq: filters });

    if (!items || (items as any[]).length === 0) {
      return; // Nothing to update
    }

    // Get store with transaction to keep it alive
    const { store, transaction } = await this.getStoreWithTransaction(table, 'readwrite');

    return new Promise((resolve, reject) => {
      let resolved = false;
      
      // Handle transaction errors
      transaction.onerror = () => {
        if (!resolved) {
          resolved = true;
          reject(transaction.error);
        }
      };

      // Handle transaction completion
      transaction.oncomplete = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Perform all updates
      const requests = (items as any[]).map(item => {
        const updated = { ...item, ...updates, updated_at: new Date().toISOString() };
        return store.put(updated);
      });

      // Wait for all put requests to complete
      Promise.all(requests.map(req => 
        new Promise<void>((res, rej) => {
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        })
      )).catch(error => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });
    });
  }

  async delete<T extends keyof DatabaseSchema>(
    table: T,
    filters: { [key: string]: any }
  ): Promise<void> {
    // First, get the items to delete (this creates its own transaction)
    const items = await this.select(table, { eq: filters });

    if (!items || (items as any[]).length === 0) {
      return; // Nothing to delete
    }

    // Get store with transaction to keep it alive
    const { store, transaction } = await this.getStoreWithTransaction(table, 'readwrite');

    return new Promise((resolve, reject) => {
      let resolved = false;
      
      // Handle transaction errors
      transaction.onerror = () => {
        if (!resolved) {
          resolved = true;
          reject(transaction.error);
        }
      };

      // Handle transaction completion
      transaction.oncomplete = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Perform all deletes
      const requests = (items as any[]).map(item => store.delete(item.id));

      // Wait for all delete requests to complete
      Promise.all(requests.map(req => 
        new Promise<void>((res, rej) => {
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        })
      )).catch(error => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });
    });
  }

  // Count method
  async count<T extends keyof DatabaseSchema>(
    table: T,
    filters?: { eq?: { [key: string]: any } }
  ): Promise<number> {
    const items = await this.select(table, filters);
    return (items as any[]).length;
  }

  // Single record fetch
  async single<T extends keyof DatabaseSchema>(
    table: T,
    id: string
  ): Promise<DatabaseSchema[T][number] | null> {
    const store = await this.getStore(table, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
}

// Create singleton instance
export const localDatabase = new LocalDatabase();

// Initialize on import
localDatabase.init().catch(console.error);

// Export types
export type { Product, Sale, SaleItem, Customer, PaymentHistory, CustomerLoan };

