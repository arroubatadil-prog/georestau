import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Store, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useI18n } from '../../i18n';
import { Order, ChatMessage } from '../../types';

interface ClientMessagesProps {
  userId: string;
  restaurants: any[];
}

interface Conversation {
  order: Order;
  restaurantName: string;
  unreadCount: number;
}

export const ClientMessages: React.FC<ClientMessagesProps> = ({ userId, restaurants }) => {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Order | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger toutes les commandes avec des messages
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('clientId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      // Filtrer les commandes qui ont des messages et créer les conversations
      const convs: Conversation[] = orders
        .filter(order => order.chat && order.chat.length > 0)
        .map(order => {
          const restaurant = restaurants.find(r => r.id === order.restaurantId);
          const unreadCount = order.chat.filter(msg => msg.sender === 'chef' && !(msg as any).read).length;
          
          return {
            order,
            restaurantName: restaurant?.name || 'Restaurant',
            unreadCount
          };
        })
        .sort((a, b) => {
          const lastA = a.order.chat[a.order.chat.length - 1]?.timestamp || 0;
          const lastB = b.order.chat[b.order.chat.length - 1]?.timestamp || 0;
          return lastB - lastA;
        });

      setConversations(convs);
    });

    return () => unsubscribe();
  }, [userId, restaurants]);

  // Charger les conversations directes (sans commande)
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('clientId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const directConversations: Conversation[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const messages = data.messages || [];
        
        if (messages.length > 0) {
          const restaurant = restaurants.find(r => r.id === data.restaurantId);
          const unreadCount = messages.filter((m: any) => m.sender === 'chef' && !m.read).length;
          const lastMsg = messages[messages.length - 1];
          
          // Créer un objet Order fictif pour la conversation directe
          const conversationOrder: Order = {
            id: doc.id,
            restaurantId: data.restaurantId,
            clientId: userId,
            items: [],
            total: 0,
            status: 'completed',
            timestamp: data.createdAt || Date.now(),
            chat: messages,
            tableNumber: 'CONVERSATION' // Marqueur pour identifier les conversations directes
          };
          
          directConversations.push({
            order: conversationOrder,
            restaurantName: restaurant?.name || 'Restaurant',
            unreadCount
          });
        }
      });

      // Fusionner avec les conversations des commandes
      setConversations(prev => {
        const merged = new Map<string, Conversation>();
        
        // Ajouter les conversations des commandes
        prev.forEach(conv => {
          if (conv.order.tableNumber !== 'CONVERSATION') {
            merged.set(conv.order.id, conv);
          }
        });
        
        // Ajouter les conversations directes
        directConversations.forEach(conv => {
          merged.set(conv.order.id, conv);
        });
        
        // Trier par dernier message
        return Array.from(merged.values()).sort((a, b) => {
          const lastA = a.order.chat[a.order.chat.length - 1]?.timestamp || 0;
          const lastB = b.order.chat[b.order.chat.length - 1]?.timestamp || 0;
          return lastB - lastA;
        });
      });
    });

    return () => unsubscribe();
  }, [userId, restaurants]);

  // Marquer les messages comme lus quand on ouvre une conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const markAsRead = async () => {
      try {
        const unreadMessages = selectedConversation.chat.filter(
          msg => msg.sender === 'chef' && !msg.read
        );

        if (unreadMessages.length > 0) {
          const updatedChat = selectedConversation.chat.map(msg => ({
            ...msg,
            read: msg.sender === 'chef' ? true : msg.read
          }));

          if (selectedConversation.tableNumber === 'CONVERSATION') {
            const conversationRef = doc(db, 'conversations', selectedConversation.id);
            await updateDoc(conversationRef, {
              messages: updatedChat
            });
          } else {
            const orderRef = doc(db, 'orders', selectedConversation.id);
            await updateDoc(orderRef, {
              chat: updatedChat
            });
          }
        }
      } catch (error) {
        console.error('Erreur marquage messages lus:', error);
      }
    };

    markAsRead();
  }, [selectedConversation?.id]);

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.chat]);

  // Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      text: messageText.trim(),
      timestamp: Date.now()
    };

    try {
      // Vérifier si c'est une conversation directe ou une commande
      if (selectedConversation.tableNumber === 'CONVERSATION') {
        const conversationRef = doc(db, 'conversations', selectedConversation.id);
        await updateDoc(conversationRef, {
          messages: arrayUnion(newMessage),
          lastMessageTime: Date.now()
        });
      } else {
        const orderRef = doc(db, 'orders', selectedConversation.id);
        await updateDoc(orderRef, {
          chat: arrayUnion(newMessage)
        });
      }
      setMessageText('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      
      {/* Liste des conversations */}
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="text-orange-600 dark:text-orange-400" size={20} />
            {t('my_messages') || 'Mes Messages'}
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
            <p>{t('no_messages') || 'Aucun message'}</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.order.id}
              onClick={() => setSelectedConversation(conv.order)}
              className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                selectedConversation?.id === conv.order.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-gray-400" />
                  <span className="font-bold text-gray-800 dark:text-gray-100">{conv.restaurantName}</span>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Clock size={12} />
                Commande #{conv.order.id.slice(0, 6)}
              </div>
              {conv.order.chat.length > 0 && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {conv.order.chat[conv.order.chat.length - 1].text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.order.chat[conv.order.chat.length - 1].timestamp).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </>
              )}
            </button>
          ))
        )}
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* En-tête */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={20} className="text-gray-400" />
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">
                      {conversations.find(c => c.order.id === selectedConversation.id)?.restaurantName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Commande #{selectedConversation.id.slice(0, 6)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedConversation.chat.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === 'client'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'client' ? 'text-orange-200' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t('write_message') || 'Écrire un message...'}
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
              <p>{t('select_conversation') || 'Sélectionnez une conversation'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
