import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Note } from '../types';
import './Notes.css';

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());

  // Simple XOR encryption function
  const encryptContent = (content: string, key: string): string => {
    let result = '';
    for (let i = 0; i < content.length; i++) {
      const charCode = content.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  };

  // Simple XOR decryption function
  const decryptContent = (encryptedContent: string, key: string): string => {
    const decoded = atob(encryptedContent);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const q = query(
      collection(db, `users/${userId}/notes`),
      orderBy('lastModified', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const notesData: Note[] = [];
        snapshot.forEach((doc) => {
          notesData.push({ id: doc.id, ...doc.data() } as Note);
        });
        console.log('Notes loaded:', notesData.length);
        setNotes(notesData);
      },
      (error) => {
        console.error('Error loading notes:', error);
        console.log('Falling back to simple query without orderBy...');
        // If index error, try without orderBy
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          const simpleQuery = query(
            collection(db, `users/${userId}/notes`)
          );
          const unsubscribeSimple = onSnapshot(simpleQuery, (snapshot) => {
            const notesData: Note[] = [];
            snapshot.forEach((doc) => {
              notesData.push({ id: doc.id, ...doc.data() } as Note);
            });
            // Sort client-side
            notesData.sort((a, b) => b.lastModified - a.lastModified);
            console.log('Notes loaded (simple query):', notesData.length);
            setNotes(notesData);
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
      const noteData: any = {
        userId: auth.currentUser.uid,
        title,
        content,
        locked: isLocked,
        lastModified: Date.now(),
      };

      if (isLocked && password) {
        noteData.passwordHash = btoa(password); // Simple encoding (in production, use proper hashing)
        // Encrypt the content before saving
        noteData.content = encryptContent(content, password);
      } else if (!isLocked) {
        // If note is not locked, ensure content is not encrypted
        noteData.content = content;
      }

      if (editingNote) {
        noteData.id = editingNote.id;
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/notes`, editingNote.id), noteData);
      } else {
        const newNoteRef = doc(collection(db, `users/${auth.currentUser.uid}/notes`));
        noteData.id = newNoteRef.id;
        await setDoc(newNoteRef, noteData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (confirm('Delete this note?')) {
      try {
        if (!auth.currentUser) return;
        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/notes`, noteId));
        setUnlockedNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const startEdit = (note: Note) => {
    if (note.locked && !unlockedNotes.has(note.id)) {
      const inputPassword = prompt('Enter note password:');
      if (!inputPassword || btoa(inputPassword) !== note.passwordHash) {
        alert('Incorrect password!');
        return;
      }
      // Try to decrypt the content
      try {
        const decryptedContent = decryptContent(note.content, inputPassword);
        setUnlockedNotes(prev => new Set(prev).add(note.id));
        setEditingNote(note);
        setTitle(note.title);
        setContent(decryptedContent);
        setIsLocked(note.locked);
        setPassword('');
        setShowModal(true);
      } catch (e) {
        alert('Failed to decrypt note. Incorrect password or corrupted data.');
        return;
      }
    } else {
      // Note is not locked or already unlocked
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setIsLocked(note.locked);
      setPassword('');
      setShowModal(true);
    }
  };

  const viewNote = (note: Note) => {
    if (note.locked && !unlockedNotes.has(note.id)) {
      const inputPassword = prompt('Enter note password:');
      if (!inputPassword || btoa(inputPassword) !== note.passwordHash) {
        alert('Incorrect password!');
        return;
      }
      // Try to decrypt the content
      try {
        const decryptedContent = decryptContent(note.content, inputPassword);
        setUnlockedNotes(prev => new Set(prev).add(note.id));
        // Update the note with decrypted content for display
        const updatedNotes = notes.map(n => 
          n.id === note.id ? {...n, content: decryptedContent} : n
        );
        setNotes(updatedNotes);
      } catch (e) {
        alert('Failed to decrypt note. Incorrect password or corrupted data.');
        return;
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsLocked(false);
    setPassword('');
    setShowPassword(false);
  };

  const isNoteUnlocked = (note: Note) => {
    return !note.locked || unlockedNotes.has(note.id);
  };

  return (
    <div className="notes-page">
      <div className="page-header">
        <h2>Notes</h2>
        <button onClick={() => setShowModal(true)} className="add-button">+ Add Note</button>
      </div>

      <div className="notes-grid">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="note-card"
            onClick={() => viewNote(note)}
          >
            <div className="note-header">
              <h3 className="note-title">
                {note.locked && <span className="lock-icon">🔒</span>}
                {note.title}
              </h3>
              <span className="note-date">
                {new Date(note.lastModified).toLocaleDateString()}
              </span>
            </div>

            <p className="note-content">
              {isNoteUnlocked(note) 
                ? (note.content || 'No content') 
                : '🔒 Locked note. Click to unlock.'}
            </p>

            {isNoteUnlocked(note) && (
              <div className="note-actions">
                <button onClick={(e) => { e.stopPropagation(); startEdit(note); }} className="edit-btn">
                  Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="delete-btn">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <div className="empty-state">No notes yet. Create one to get started!</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingNote ? 'Edit Note' : 'New Note'}</h3>
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
                <label>Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="Write your note here..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                  />
                  <span>Lock this note with a password</span>
                </label>
              </div>

              {isLocked && (
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

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
