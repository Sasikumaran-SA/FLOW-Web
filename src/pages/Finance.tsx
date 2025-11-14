import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction } from '../types';
import './Finance.css';

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, `users/${userId}/transactions`),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        console.log('Transactions loaded:', transactionsData.length);
        setTransactions(transactionsData);
      },
      (error) => {
        console.error('Error loading transactions:', error);
        console.log('Falling back to simple query without orderBy...');
        // If index error, try without orderBy
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          const simpleQuery = query(
            collection(db, `users/${userId}/transactions`)
          );
          const unsubscribeSimple = onSnapshot(simpleQuery, (snapshot) => {
            const transactionsData: Transaction[] = [];
            snapshot.forEach((doc) => {
              transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
            });
            // Sort client-side
            transactionsData.sort((a, b) => b.date - a.date);
            console.log('Transactions loaded (simple query):', transactionsData.length);
            setTransactions(transactionsData);
          });
          return () => unsubscribeSimple();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !description || !amount || !date) return;

    try {
      if (editingTransaction) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, editingTransaction.id), {
          id: editingTransaction.id,
          userId: auth.currentUser.uid,
          description,
          amount: parseFloat(amount),
          date: new Date(date).getTime(),
          isIncome,
          category: '',
          receiptImageUrl: null,
        });
      } else {
        const newTransactionRef = doc(collection(db, `users/${auth.currentUser.uid}/transactions`));
        await setDoc(newTransactionRef, {
          id: newTransactionRef.id,
          userId: auth.currentUser.uid,
          description,
          amount: parseFloat(amount),
          date: new Date(date).getTime(),
          isIncome,
          category: '',
          receiptImageUrl: null,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (confirm('Delete this transaction?')) {
      try {
        if (!auth.currentUser) return;
        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, transactionId));
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setDate(new Date(transaction.date).toISOString().split('T')[0]);
    setIsIncome(transaction.isIncome);
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setDescription('');
    setAmount('');
    setDate('');
    setIsIncome(false);
  };

  const totalIncome = transactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="finance-page">
      <div className="page-header">
        <h2>Finance</h2>
        <button onClick={() => setShowModal(true)} className="add-button">+ Add Transaction</button>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <h3>Income</h3>
          <p className="amount">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="summary-card expense">
          <h3>Expense</h3>
          <p className="amount">${totalExpense.toFixed(2)}</p>
        </div>
      </div>

      <div className="transactions-list">
        {transactions.map(transaction => (
          <div key={transaction.id} className={transaction.isIncome ? 'transaction-card income' : 'transaction-card expense'}>
            <div className="transaction-main">
              <div className="transaction-info">
                <h3 className="transaction-description">{transaction.description}</h3>
                <span className="transaction-date">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
              <div className="transaction-amount">
                {transaction.isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>

            <div className="transaction-actions">
              <button onClick={() => startEdit(transaction)} className="edit-btn">Edit</button>
              <button onClick={() => deleteTransaction(transaction.id)} className="delete-btn">Delete</button>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="empty-state">No transactions yet. Add one to start tracking!</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isIncome}
                    onChange={(e) => setIsIncome(e.target.checked)}
                  />
                  <span>This is income</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
