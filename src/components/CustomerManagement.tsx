import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus, DollarSign, Phone, Mail, MapPin, Calendar, CreditCard } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { SettingsManager } from '@/utils/settings';

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

const CustomerManagement = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    notes: ''
  });
  const [debtData, setDebtData] = useState({
    amount: '',
    notes: ''
  });

  // Get currency symbol from SettingsManager
  const getCurrencySymbol = () => {
    const pharmacySettings = SettingsManager.getPharmacySettings();
    const systemSettings = SettingsManager.getSystemSettings();
    
    const currency = pharmacySettings.currency || systemSettings.currency || 'PKR';
    return SettingsManager.getCurrencySymbol(currency);
  };

  const currencySymbol = getCurrencySymbol();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data as Customer[];
    },
    enabled: !!user?.id,
  });

  // Fetch payment history for selected customer
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['payment-history', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as PaymentHistory[];
    },
    enabled: !!selectedCustomer?.id && !!user?.id,
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof newCustomer) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          user_id: user.id,
          outstanding_balance: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddDialogOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      toast.success('Customer added successfully!');
    },
    onError: () => {
      toast.error('Failed to add customer');
    },
  });

  // Delete customer mutation - Fixed to handle all foreign key constraints
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, get all sales for this customer to delete sale_items
      const { data: sales, error: salesFetchError } = await supabase
        .from('sales')
        .select('id')
        .eq('customer_id', customerId)
        .eq('user_id', user.id);

      if (salesFetchError) {
        throw new Error(`Failed to fetch sales: ${salesFetchError.message}`);
      }

      // Delete sale_items for all sales of this customer
      if (sales && sales.length > 0) {
        const saleIds = sales.map(sale => sale.id);
        
        const { error: saleItemsError } = await supabase
          .from('sale_items')
          .delete()
          .in('sale_id', saleIds);

        if (saleItemsError) {
          // Error deleting sale items - continue with deletion
          throw new Error(`Failed to delete sale items: ${saleItemsError.message}`);
        }
      }

      // Delete all sales for this customer
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('customer_id', customerId)
        .eq('user_id', user.id);

      if (salesError) {
        // Error deleting sales - continue with deletion
        throw new Error(`Failed to delete sales: ${salesError.message}`);
      }

      // Delete payment history for this customer
      const { error: paymentError } = await supabase
        .from('payment_history')
        .delete()
        .eq('customer_id', customerId)
        .eq('user_id', user.id);

      if (paymentError) {
        // Error deleting payment history - continue with deletion
        throw new Error(`Failed to delete payment history: ${paymentError.message}`);
      }

      // Finally, delete the customer
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('user_id', user.id);

      if (customerError) {
        throw new Error(`Failed to delete customer: ${customerError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] }); // Also invalidate sales cache
      toast.success('Customer and all related records deleted successfully!');
      setSelectedCustomer(null);
    },
    onError: (error) => {
      console.error('Delete customer error:', error);
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });

  // Record payment mutation - Fixed to handle balance correctly
  const recordPaymentMutation = useMutation({
    mutationFn: async (payment: typeof paymentData & { customerId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const amount = parseFloat(payment.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Get the current customer balance from database to ensure accuracy
      const { data: currentCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('outstanding_balance')
        .eq('id', payment.customerId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current balance: ${fetchError.message}`);
      }

      // Calculate new balance - ensure it doesn't go below 0
      const newBalance = Math.max(0, currentCustomer.outstanding_balance - amount);

      // Insert payment history record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payment_history')
        .insert([{
          customer_id: payment.customerId,
          user_id: user.id,
          amount: amount,
          notes: payment.notes || `Payment received: $${amount}`
        }])
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }

      // Update customer balance
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          outstanding_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.customerId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update customer balance: ${updateError.message}`);
      }
      return paymentRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      setIsPaymentDialogOpen(false);
      setPaymentData({ amount: '', notes: '' });
      toast.success('Payment recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.message || 'Unknown error'}`);
    },
  });

  // Record debt mutation - Fixed to handle balance correctly
  const recordDebtMutation = useMutation({
    mutationFn: async (debt: typeof debtData & { customerId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const amount = parseFloat(debt.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid debt amount');
      }

      // Get the current customer balance from database to ensure accuracy
      const { data: currentCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('outstanding_balance')
        .eq('id', debt.customerId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current balance: ${fetchError.message}`);
      }

      // Calculate new balance (add debt to existing balance)
      const newBalance = currentCustomer.outstanding_balance + amount;

      // Update customer balance first
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          outstanding_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', debt.customerId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update customer balance: ${updateError.message}`);
      }

      // Record debt entry as negative payment in payment history for tracking
      const { data: debtRecord, error: debtError } = await supabase
        .from('payment_history')
        .insert([{
          customer_id: debt.customerId,
          user_id: user.id,
          amount: -amount, // Negative amount to indicate debt
          notes: debt.notes ? `Debt added: ${debt.notes}` : `Debt added: ${getCurrencySymbol(currency)}${amount}`
        }])
        .select()
        .single();

      // Don't throw error here as the main operation (updating balance) succeeded
      if (debtError) {
        // Debt recorded in customer balance but not in payment history
      }
      return debtRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      setIsDebtDialogOpen(false);
      setDebtData({ amount: '', notes: '' });
      toast.success('Debt recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to record debt: ${error.message || 'Unknown error'}`);
    },
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    addCustomerMutation.mutate(newCustomer);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (amount > selectedCustomer.outstanding_balance) {
      toast.error('Payment amount cannot exceed outstanding balance');
      return;
    }

    recordPaymentMutation.mutate({
      ...paymentData,
      customerId: selectedCustomer.id
    });
  };

  const handleRecordDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = parseFloat(debtData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid debt amount');
      return;
    }

    recordDebtMutation.mutate({
      ...debtData,
      customerId: selectedCustomer.id
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Customer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer information to add them to your system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Customer address"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? 'Adding...' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({customers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No customers found.</p>
            ) : (
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm sm:text-base">{customer.name}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-2">
                          {customer.email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm sm:text-base ${
                          customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {currencySymbol}{customer.outstanding_balance.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Outstanding</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedCustomer ? 'Customer Details' : 'Select a Customer'}
              {selectedCustomer && (
                <div className="flex space-x-2">
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={selectedCustomer.outstanding_balance <= 0}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Payment - {selectedCustomer.name}</DialogTitle>
                        <DialogDescription>Record a payment received from this customer</DialogDescription>
                      </DialogHeader>
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">Outstanding Balance: <span className="font-semibold">{currencySymbol}{selectedCustomer.outstanding_balance.toFixed(2)}</span></p>
                      </div>
                      <form onSubmit={handleRecordPayment} className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Payment Amount *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={selectedCustomer.outstanding_balance}
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            placeholder="Payment notes..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={recordPaymentMutation.isPending}>
                            {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Record Debt
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Debt - {selectedCustomer.name}</DialogTitle>
                        <DialogDescription>Add a new debt amount to this customer's account</DialogDescription>
                      </DialogHeader>
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">Current Outstanding Balance: <span className="font-semibold">{currencySymbol}{selectedCustomer.outstanding_balance.toFixed(2)}</span></p>
                      </div>
                      <form onSubmit={handleRecordDebt} className="space-y-4">
                        <div>
                          <Label htmlFor="debtAmount">Debt Amount *</Label>
                          <Input
                            id="debtAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={debtData.amount}
                            onChange={(e) => setDebtData({ ...debtData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="debtNotes">Notes (Optional)</Label>
                          <Textarea
                            id="debtNotes"
                            value={debtData.notes}
                            onChange={(e) => setDebtData({ ...debtData, notes: e.target.value })}
                            placeholder="Reason for debt..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={recordDebtMutation.isPending}>
                            {recordDebtMutation.isPending ? 'Recording...' : 'Record Debt'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCustomerMutation.mutate(selectedCustomer.id)}
                    disabled={deleteCustomerMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {selectedCustomer.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedCustomer.email}
                    </div>
                  )}
                  
                  {selectedCustomer.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  
                  {selectedCustomer.address && (
                    <div className="flex items-start text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-0.5" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}

                  <div className={`text-xl font-bold ${
                    selectedCustomer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Outstanding Balance: {currencySymbol}{selectedCustomer.outstanding_balance.toFixed(2)}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="font-semibold mb-3">Payment History</h4>
                  {paymentHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payment history found.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className={`font-medium ${payment.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {payment.amount < 0 ? '-' : '+'}{currencySymbol}{Math.abs(payment.amount).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                            {payment.notes && (
                              <div className="text-sm text-muted-foreground mt-1">{payment.notes}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a customer from the list to view details and manage payments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerManagement;
