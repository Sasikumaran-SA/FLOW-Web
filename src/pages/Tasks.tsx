import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Task } from '../types';
import './Tasks.css';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(1);
  const [listName, setListName] = useState('Default');
  const [filterList, setFilterList] = useState('All');

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, `users/${userId}/tasks`),
      orderBy('priority', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as Task);
        });
        console.log('Tasks loaded:', tasksData.length);
        setTasks(tasksData);
      },
      (error) => {
        console.error('Error loading tasks:', error);
        console.log('Falling back to simple query without orderBy...');
        // If index error, try without orderBy
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          const simpleQuery = query(
            collection(db, `users/${userId}/tasks`)
          );
          const unsubscribeSimple = onSnapshot(simpleQuery, (snapshot) => {
            const tasksData: Task[] = [];
            snapshot.forEach((doc) => {
              tasksData.push({ id: doc.id, ...doc.data() } as Task);
            });
            // Sort client-side
            tasksData.sort((a, b) => b.priority - a.priority);
            console.log('Tasks loaded (simple query):', tasksData.length);
            setTasks(tasksData);
          });
          return () => unsubscribeSimple();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title) return;

    try {
      if (editingTask) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, editingTask.id), {
          userId: auth.currentUser.uid,
          title,
          description: null,
          deadline: deadline ? new Date(deadline).getTime() : null,
          priority,
          listName,
        });
        console.log('Task updated successfully');
      } else {
        const newTask = await addDoc(collection(db, `users/${auth.currentUser.uid}/tasks`), {
          userId: auth.currentUser.uid,
          title,
          description: null,
          deadline: deadline ? new Date(deadline).getTime() : null,
          priority,
          listName,
          isCompleted: false,
        });
        console.log('Task created successfully:', newTask.id);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please check console for details.');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      if (!auth.currentUser) return;
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, task.id), {
        isCompleted: !task.isCompleted,
      });
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      try {
        if (!auth.currentUser) return;
        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/tasks`, taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
    setPriority(task.priority);
    setListName(task.listName);
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTask(null);
    setTitle('');
    setDeadline('');
    setPriority(1);
    setListName('Default');
  };

  const filteredTasks = filterList === 'All' 
    ? tasks 
    : tasks.filter(t => t.listName === filterList);

  const lists = ['All', ...Array.from(new Set(tasks.map(t => t.listName)))];

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return '#ef4444';
    if (priority === 2) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h2>Tasks</h2>
        <button onClick={() => setShowModal(true)} className="add-button">+ Add Task</button>
      </div>

      <div className="filter-section">
        {lists.map(list => (
          <button
            key={list}
            onClick={() => setFilterList(list)}
            className={filterList === list ? 'filter-button active' : 'filter-button'}
          >
            {list}
          </button>
        ))}
      </div>

      <div className="tasks-list">
        {filteredTasks.map(task => (
          <div key={task.id} className={task.isCompleted ? 'task-card completed' : 'task-card'}>
            <div className="task-header">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => toggleComplete(task)}
                className="task-checkbox"
              />
              <h3 className="task-title">{task.title}</h3>
              <div 
                className="priority-badge" 
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              >
                {getPriorityLabel(task.priority)}
              </div>
            </div>
            
            <div className="task-footer">
              <span className="task-list">{task.listName}</span>
              {task.deadline && (
                <span className="task-deadline">
                  📅 {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="task-actions">
              <button onClick={() => startEdit(task)} className="edit-btn">Edit</button>
              <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="empty-state">No tasks found. Create one to get started!</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="priority-select"
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>List</label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
