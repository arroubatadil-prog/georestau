import React, { useState, useEffect, useRef } from 'react';
import { Order, ChatMessage } from '../../types';
import { Sparkles, CheckCircle, MessageCircle, Send, X, Navigation, Clock } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface ChefOrdersProps {
  orders: Order[];
  // Fonction pour mettre à jour le statut (passée depuis le parent ou gérée ici)
  onUpdateStatus: (orderId: string, status: any) => void;
}

export const ChefOrders: React.FC<ChefOrdersProps> = ({ orders, onUpdateStatus }) => {
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [chefMessage, setChefMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll auto dans le chat
  useEffect(() => {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatOrder?.chat]);

  // Mise à jour temps réel du chat ouvert
  useEffect(() => {
      if (activeChatOrder) {
          const updated = orders.find(o => o.id === activeChatOrder.id);
          if (updated) setActiveChatOrder(updated);
      }
  }, [orders, activeChatOrder]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chefMessage.trim() || !activeChatOrder) return;
      const newMessage: ChatMessage = { id: `msg-${Date.now()}`, sender: 'chef', text: chefMessage, timestamp: Date.now() };
      try {
          const orderRef = doc(db, "orders", activeChatOrder.id);
          await updateDoc(orderRef, { chat: arrayUnion(newMessage) });
          setChefMessage('');
      } catch (error) { console.error(error); }
  };

  const handleOpenRoute = (location: any) => {
      if (!location) return;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
        <h2 className="font-bold text-2xl mb-6 text-gray-800 dark:text-gray-100">Commandes en cours</h2>
        <div className="space-y-4">
            {orders.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 py-20">Aucune commande pour le moment.</div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        {/* Indicateur de statut couleur */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${order.status === 'pending' ? 'bg-yellow-400' : order.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-4 pl-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-400 dark:text-gray-400 font-bold text-xs uppercase tracking-widest">
                                        {order.tableNumber === 'LIVRAISON' ? '🚀 Livraison' : `Table ${order.tableNumber}`}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span className="text-gray-400 dark:text-gray-400 text-xs flex items-center gap-1"><Clock size={12}/> {new Date(order.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">{order.clientName || 'Client'} <span className="text-gray-400 dark:text-gray-500 text-sm">#{order.id.slice(0, 6)}</span></h3>
                                
                                {/* Informations de contact du client */}
                                {order.clientPhone && (
                                    <a 
                                        href={`tel:${order.clientPhone}`}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors group border border-blue-200 dark:border-blue-700"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                        </svg>
                                        <span>{order.clientPhone}</span>
                                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">📞 Appeler</span>
                                    </a>
                                )}
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                order.status === 'pending' 
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' 
                                    : order.status === 'completed' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            }`}>
                                {order.status}
                            </div>
                        </div>

                        {/* Note Client */}
                        {order.chat && order.chat[0] && (
                            <div className="ml-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm text-gray-600 dark:text-gray-300 border-l-4 border-gray-300 dark:border-gray-600">
                                {order.chat[0].text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        )}

                        {/* Liste Articles */}
                        <div className="pl-4 space-y-2 mb-6">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{item.count}x</span>
                                        <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.price * item.count} DH</span>
                                </div>
                            ))}
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-600 pt-3 mt-3 flex justify-between items-center font-bold text-lg text-gray-900 dark:text-gray-100">
                                <span>Total</span>
                                <span>{order.total} DH</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pl-4 flex gap-3 flex-wrap">
                            {/* Phase 1: Accepter la commande */}
                            {order.status === 'pending' && (
                                <button onClick={() => onUpdateStatus(order.id, 'preparing')} className="flex-1 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-gray-600 shadow-md flex items-center justify-center gap-2">
                                    <Sparkles size={18} /> Accepter & Cuisiner
                                </button>
                            )}
                            
                            {/* Phase 2: Marquer comme prêt / en route */}
                            {order.status === 'preparing' && (
                                <button onClick={() => onUpdateStatus(order.id, 'ready')} className="flex-1 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md flex items-center justify-center gap-2">
                                    {order.deliveryLocation ? (
                                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Prêt & En Route</>
                                    ) : (
                                        <><CheckCircle size={18} /> Prêt à Servir</>
                                    )}
                                </button>
                            )}
                            
                            {/* Phase 3: Marquer comme livré/servi */}
                            {order.status === 'ready' && (
                                <button onClick={() => onUpdateStatus(order.id, 'completed')} className="flex-1 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 shadow-md flex items-center justify-center gap-2">
                                    <CheckCircle size={18} /> {order.deliveryLocation ? 'Livré' : 'Servi'}
                                </button>
                            )}
                            
                            <button onClick={() => setActiveChatOrder(order)} className="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 relative shadow-sm border border-orange-200 dark:border-orange-700">
                                <MessageCircle size={20} />
                                {order.chat.length > 1 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></span>}
                            </button>
                            {order.deliveryLocation && (
                                <button onClick={() => handleOpenRoute(order.deliveryLocation)} className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 relative shadow-sm border border-blue-200 dark:border-blue-700" title="Itinéraire">
                                    <Navigation size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* CHAT MODAL */}
        {activeChatOrder && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl overflow-hidden border dark:border-gray-700">
                    <div className="bg-orange-50 dark:bg-orange-900/30 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <div><h3 className="font-bold text-gray-800 dark:text-gray-100">Chat Client</h3><p className="text-xs text-orange-600 dark:text-orange-400 font-bold">#{activeChatOrder.id.slice(-4)}</p></div>
                        <button onClick={() => setActiveChatOrder(null)}><X size={20} className="text-orange-600 dark:text-orange-400"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {activeChatOrder.chat.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'chef' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'chef' ? 'bg-orange-600 dark:bg-orange-700 text-white rounded-tr-none' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
                        <input type="text" value={chefMessage} onChange={(e) => setChefMessage(e.target.value)} placeholder="Répondre..." className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 dark:placeholder-gray-400" />
                        <button type="submit" disabled={!chefMessage.trim()} className="p-3 bg-orange-600 dark:bg-orange-700 text-white rounded-xl hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-50"><Send size={18} /></button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};