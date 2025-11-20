// Local Database Client
// Replaces Supabase client with local database operations

import { localDatabase, type Product, type Sale, type SaleItem, type Customer, type PaymentHistory, type CustomerLoan } from '@/lib/localDatabase';

// Simulate Supabase query builder interface
class QueryBuilder<T> {
  private table: string;
  private filters: any = {};
  private orderByColumn?: string;
  private orderAscending: boolean = true;
  private limitCount?: number;
  private selectFields?: string[];
  private insertData?: any;
  private isDelete: boolean = false;
  private isUpdate: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  insert(data: any[] | any) {
    this.insertData = data;
    this.isUpdate = false;
    this.isDelete = false;
    this.selectFields = undefined; // Reset select fields
    return this;
  }

  update(updates: any) {
    this.insertData = updates;
    this.isUpdate = true;
    this.isDelete = false;
    return this;
  }

  delete() {
    this.isDelete = true;
    this.isUpdate = false;
    this.insertData = undefined;
    return this;
  }


  eq(column: string, value: any) {
    if (!this.filters.eq) this.filters.eq = {};
    this.filters.eq[column] = value;
    return this;
  }

  gt(column: string, value: any) {
    if (!this.filters.gt) this.filters.gt = {};
    this.filters.gt[column] = value;
    return this;
  }

  gte(column: string, value: any) {
    if (!this.filters.gte) this.filters.gte = {};
    this.filters.gte[column] = value;
    return this;
  }

  lt(column: string, value: any) {
    if (!this.filters.lt) this.filters.lt = {};
    this.filters.lt[column] = value;
    return this;
  }

  lte(column: string, value: any) {
    if (!this.filters.lte) this.filters.lte = {};
    this.filters.lte[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    // For 'in' queries, we'll filter after fetching
    this.filters.in = this.filters.in || {};
    this.filters.in[column] = values;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  select(fields?: string) {
    if (this.isUpdate && this.insertData !== undefined) {
      // Handle update().eq().select().single() pattern
      return {
        single: async () => {
          try {
            await localDatabase.update(this.table as any, this.insertData!, this.filters.eq || {});
            // Fetch updated record
            const updated = await localDatabase.select(this.table as any, { eq: this.filters.eq || {} });
            const result = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
            return { data: result, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        then: async (onfulfilled?: any) => {
          try {
            await localDatabase.update(this.table as any, this.insertData!, this.filters.eq || {});
            const response = { data: null, error: null };
            return onfulfilled ? onfulfilled(response) : response;
          } catch (error) {
            const response = { data: null, error };
            return onfulfilled ? onfulfilled(response) : response;
          }
        },
      };
    }
    
    if (this.insertData !== undefined && !this.isUpdate) {
      // Handle insert().select() pattern
      return {
        single: async () => {
          try {
            const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
            const itemsWithIds = items.map(item => ({
              ...item,
              id: item.id || `${this.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            }));
            
            const result = await localDatabase.insert(this.table as any, itemsWithIds.length === 1 ? itemsWithIds[0] : itemsWithIds);
            return { data: result, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        then: async (onfulfilled?: any) => {
          try {
            const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
            const itemsWithIds = items.map(item => ({
              ...item,
              id: item.id || `${this.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            }));
            
            const result = await localDatabase.insert(this.table as any, itemsWithIds.length === 1 ? itemsWithIds[0] : itemsWithIds);
            const response = { data: result, error: null };
            return onfulfilled ? onfulfilled(response) : response;
          } catch (error) {
            const response = { data: null, error };
            return onfulfilled ? onfulfilled(response) : response;
          }
        },
      };
    }
    
    this.selectFields = fields === '*' ? undefined : fields?.split(',').map(f => f.trim());
    return this;
  }

  single() {
    // Return a promise that resolves with a single item
    const self = this;
    return {
      then: async (onfulfilled?: any, onrejected?: any) => {
        try {
          const result = await self.execute();
          const singleItem = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;
          const response = { data: singleItem, error: singleItem ? null : { message: 'No record found', code: 'PGRST116' } };
          return onfulfilled ? onfulfilled(response) : response;
        } catch (error) {
          const response = { data: null, error };
          if (onrejected) {
            return onrejected(error);
          }
          return onfulfilled ? onfulfilled(response) : response;
        }
      },
      catch: async (onrejected?: any) => {
        try {
          const result = await self.execute();
          const singleItem = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;
          const response = { data: singleItem, error: singleItem ? null : { message: 'No record found', code: 'PGRST116' } };
          return response;
        } catch (error) {
          if (onrejected) {
            return onrejected(error);
          }
          return { data: null, error };
        }
      }
    } as Promise<any>;
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      // Handle delete().eq().then() or delete().in().then() pattern
      if (this.isDelete) {
        try {
          if (this.filters.in) {
            // Handle delete().in() pattern
            const inFilter = Object.entries(this.filters.in)[0];
            if (inFilter) {
              const [column, values] = inFilter;
              // Delete items matching any of the values
              for (const value of values as any[]) {
                await localDatabase.delete(this.table as any, { [column]: value });
              }
            }
          } else {
            await localDatabase.delete(this.table as any, this.filters.eq || {});
          }
          const response = { data: null, error: null };
          return onfulfilled ? onfulfilled(response) : response as TResult1;
        } catch (error) {
          const response = { data: null, error };
          if (onrejected) {
            return onrejected(error);
          }
          return response as TResult1;
        }
      }
      
      // Handle insert().then() pattern (without select)
      if (this.insertData !== undefined && !this.isUpdate && !this.isDelete && !this.selectFields) {
        try {
          const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
          const itemsWithIds = items.map(item => ({
            ...item,
            id: item.id || `${this.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          }));
          
          const result = await localDatabase.insert(this.table as any, itemsWithIds.length === 1 ? itemsWithIds[0] : itemsWithIds);
          const response = { data: result, error: null };
          return onfulfilled ? onfulfilled(response) : response as TResult1;
        } catch (error) {
          const response = { data: null, error };
          if (onrejected) {
            return onrejected(error);
          }
          return response as TResult1;
        }
      }
      
      // Handle update().eq().then() pattern (without select)
      if (this.isUpdate && this.insertData !== undefined && !this.selectFields) {
        try {
          await localDatabase.update(this.table as any, this.insertData, this.filters.eq || {});
          const response = { data: null, error: null };
          return onfulfilled ? onfulfilled(response) : response as TResult1;
        } catch (error) {
          const response = { data: null, error };
          if (onrejected) {
            return onrejected(error);
          }
          return response as TResult1;
        }
      }
      
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : result as TResult1;
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }

  private async execute(): Promise<any> {
    const filters: any = { ...this.filters };
    
    if (this.orderByColumn) {
      filters.orderBy = {
        column: this.orderByColumn,
        ascending: this.orderAscending,
      };
    }

    if (this.limitCount) {
      filters.limit = this.limitCount;
    }

    let results = await localDatabase.select(this.table as any, filters);

    // Handle 'in' filter
    if (this.filters.in) {
      Object.entries(this.filters.in).forEach(([column, values]: [string, any]) => {
        results = (results as any[]).filter(item => values.includes(item[column]));
      });
    }

    // Apply field selection
    if (this.selectFields && this.selectFields.length > 0) {
      results = (results as any[]).map(item => {
        const selected: any = {};
        this.selectFields!.forEach(field => {
          if (item.hasOwnProperty(field)) {
            selected[field] = item[field];
          }
        });
        return selected;
      });
    }

    return { data: results, error: null };
  }
}

// Simulate Supabase client
class SupabaseClient {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  }

  // Stub for functions (not available in local mode)
  functions = {
    invoke: async (functionName: string, options?: any) => {
      console.warn(`Supabase function '${functionName}' is not available in local mode. AI features require Supabase setup.`);
      return {
        data: null,
        error: {
          message: 'AI functions are not available in local mode. Please set up Supabase for AI features.',
          name: 'LocalModeError'
        }
      };
    }
  };
}


// Export supabase client (maintaining compatibility)
export const supabase = new SupabaseClient();

// Helper for count queries
export const createCountQuery = (table: string) => {
  return {
    select: (fields: string, options?: { count?: 'exact'; head?: boolean }) => {
      return {
        eq: (column: string, value: any) => ({
          then: async (onfulfilled?: any) => {
            const count = await localDatabase.count(table as any, { eq: { [column]: value } });
            const result = { count, error: null };
            return onfulfilled ? onfulfilled(result) : result;
          },
        }),
      };
    },
  };
};
