export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: number;
  priority: number;
  listName: string;
  isCompleted: boolean;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isLocked: boolean;
  passwordHash?: string;
  lastModified: number;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: number;
  isIncome: boolean;
  category: string;
  receiptImageUrl?: string;
}

export interface User {
  uid: string;
  email: string;
}
