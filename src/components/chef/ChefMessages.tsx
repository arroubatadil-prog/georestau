import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Phone, User, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useI18n } from '../../i18n';

interface Message {
  id: string;
  restaurantId: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  text: string;
  sender: 'client' | 'chef';
  timestamp: number;
  read: boolean;
}

interface Conversation {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  messages: Message[];
}

interface ChefMessagesProps {
  restaurantId: string;
}

export const ChefMessages: React.FC<ChefMessagesProps> = ({ restaurantId }) => {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages depuis la collection "messages" (ancien système)
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('restaurantId', '==', restaurantId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Grouper par client
      const convMap = new Map<string, Conversation>();
      messages.forEach(msg => {
        if (!convMap.has(msg.clientId)) {
          convMap.set(msg.clientId, {
            clientId: msg.clientId,
            clientName: msg.clientName,
            clientPhone: msg.clientPhone,
            lastMessage: msg.text,
            lastTimestamp: msg.timestamp,
            unreadCount: 0,
            messages: []
          });
        }
        const conv = convMap.get(msg.clientId)!;
        conv.messages.push(msg);
        if (msg.sender === 'client' && !msg.read) {
          conv.unreadCount++;
        }
      });

      // Trier les messages de chaque conversation
      convMap.forEach(conv => {
        conv.messages.sort((a, b) => a.timestamp - b.timestamp);
      });

      setConversations(Array.from(convMap.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp));
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Charger les conversations directes depuis la collection "conversations" (nouveau système)
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const directConversations: Conversation[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const messages = (data.messages || []).map((msg: any) => ({
          ...msg,
          restaurantId,
          read: msg.sender === 'chef' || msg.read || false
        }));
        
        if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          const unreadCount = messages.filter((m: any) => m.sender === 'client' && !m.read).length;
          
          directConversations.push({
            clientId: data.clientId,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            lastMessage: lastMsg.text,
            lastTimestamp: lastMsg.timestamp,
            unreadCount,
            messages,
            conversationId: doc.id // Ajouter l'ID de la conversation pour les mises à jour
          } as any);
        }
      });

      // Fusionner avec les conversations existantes (de la collection messages)
      setConversations(prev => {
        const merged = new Map<string, Conversation>();
        
        // Ajouter les anciennes conversations
        prev.forEach(conv => {
          if (!conv.conversationId) { // Seulement celles de la collection "messages"
            merged.set(conv.clientId, conv);
          }
        });
        
        // Ajouter/remplacer avec les nouvelles conversations directes
        directConversations.forEach(conv => {
          merged.set(conv.clientId, conv);
        });
        
        return Array.from(merged.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, conversations]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const conv = conversations.find(c => c.clientId === selectedConversation) as any;
    if (!conv) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      text: messageText.trim(),
      sender: 'chef' as const,
      timestamp: Date.now(),
      read: false
    };

    try {
      // Vérifier si c'est une conversation directe (nouveau système)
      if (conv.conversationId) {
        const conversationRef = doc(db, 'conversations', conv.conversationId);
        await updateDoc(conversationRef, {
          messages: [...conv.messages, newMessage],
          lastMessageTime: Date.now()
        });
      } else {
        // Ancien système avec collection "messages"
        await addDoc(collection(db, 'messages'), {
          restaurantId,
          clientId: conv.clientId,
          clientName: conv.clientName,
          clientPhone: conv.clientPhone,
          text: messageText.trim(),
          sender: 'chef',
          timestamp: Date.now(),
          read: false
        });
      }
      setMessageText('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  // Marquer comme lu
  const markAsRead = async (clientId: string) => {
    const conv = conversations.find(c => c.clientId === clientId) as any;
    if (!conv) return;

    try {
      // Vérifier si c'est une conversation directe (nouveau système)
      if (conv.conversationId) {
        const updatedMessages = conv.messages.map((m: any) => ({
          ...m,
          read: m.sender === 'client' ? true : m.read
        }));
        
        const conversationRef = doc(db, 'conversations', conv.conversationId);
        await updateDoc(conversationRef, {
          messages: updatedMessages
        });
      } else {
        // Ancien système avec collection "messages"
        const unreadMessages = conv.messages.filter((m: any) => m.sender === 'client' && !m.read);
        for (const msg of unreadMessages) {
          await updateDoc(doc(db, 'messages', msg.id), { read: true });
        }
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const selectedConv = conversations.find(c => c.clientId === selectedConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      
      {/* Liste des conversations */}
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
            Messages
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </h3>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun message</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.clientId}
              onClick={() => {
                setSelectedConversation(conv.clientId);
                markAsRead(conv.clientId);
              }}
              className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                selectedConversation === conv.clientId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-bold text-gray-800 dark:text-gray-100">{conv.clientName}</span>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              {conv.clientPhone && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Phone size={12} />
                  {conv.clientPhone}
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{conv.lastMessage}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(conv.lastTimestamp).toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* En-tête */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <User size={20} className="text-gray-400" />
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100">{selectedConv.clientName}</h4>
                  {selectedConv.clientPhone && (
                    <a 
                      href={`tel:${selectedConv.clientPhone}`}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Phone size={12} />
                      {selectedConv.clientPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedConv.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'chef' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === 'chef'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'chef' ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrire un message..."
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
