import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, MessageSquareText, SendHorizontal } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './FirebaseProvider';
import { Message, Project, UserProfile } from '../types';
import { cn } from '../lib/utils';

export const ChatWindow = ({
  project,
  currentUser,
  onClose,
}: {
  project: Project;
  currentUser: UserProfile;
  onClose: () => void;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', project.id),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );
    return unsub;
  }, [project.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const receiverId = currentUser.role === 'client' ? project.electricianId : project.clientId;
      if (!receiverId) throw new Error('No receiver found');

      await addDoc(collection(db, 'messages'), {
        projectId: project.id,
        senderId: currentUser.uid,
        receiverId,
        text: newMessage.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col h-[600px] max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-[2rem]">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">{project.title}</h3>
            <p className="text-xs text-white/40 font-bold tracking-widest uppercase">Chat de Proyecto</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col max-w-[80%]',
                  m.senderId === currentUser.uid ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm font-medium',
                    m.senderId === currentUser.uid
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-white rounded-tl-none'
                  )}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-white/20 mt-1 font-bold">
                  {format(new Date(m.createdAt), 'HH:mm')}
                </span>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <MessageSquareText className="w-12 h-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay mensajes aún</p>
              <p className="text-xs mt-1">Inicia la conversación sobre el proyecto.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/5 rounded-b-[2rem]">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none transition-colors"
            />
            <button
              disabled={!newMessage.trim() || isSending}
              className="p-3 bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <SendHorizontal className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
