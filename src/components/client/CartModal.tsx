import React, { useState, useMemo, useEffect } from 'react';
import { Cart, OrderItem, Location } from '../../types';
import { X, Minus, Plus, Bike, Utensils, Info, Search, Crosshair, CheckCircle } from 'lucide-react';
import { MapComponent } from '../MapComponent';
import { useI18n } from '../../i18n';

interface CartModalProps {
  cart: Cart;
  onClose: () => void;
  onAddToCart: (item: any) => void;
  onRemoveFromCart: (itemId: string) => void;
  onFinalizeOrder: (orderData: any) => void;
  defaultLocation: Location;
  onLocateMe: (target: 'delivery') => void;
  userLocation: Location | null;
}

export const CartModal: React.FC<CartModalProps> = ({
  cart, onClose, onAddToCart, onRemoveFromCart, onFinalizeOrder, defaultLocation, onLocateMe, userLocation
}) => {
  const { t } = useI18n();
  // On ne garde que 3 étapes : cart -> method -> details
  const [step, setStep] = useState<'cart' | 'method' | 'details'>('cart');
  const [orderType, setOrderType] = useState<'delivery' | 'dine_in' | null>(null);
  
  // Champs
  const [deliveryCoords, setDeliveryCoords] = useState<Location>(defaultLocation);
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderNote, setOrderNote] = useState('');

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + (item.price * item.count), 0);
  }, [cart]);

  // Confirmation directe sans passer par l'écran de paiement
  const handleConfirm = () => {
    const orderData = {
        orderType,
        tableNumber,
        deliveryCoords: orderType === 'delivery' ? deliveryCoords : null,
        deliveryInstructions,
        orderNote,
        paymentMethod: 'cash' // On force l'espèce
    };
    onFinalizeOrder(orderData);
  };

  const handleDeliverySearch = (e: React.FormEvent) => { e.preventDefault(); console.log("Recherche:", deliverySearchQuery); };

  useEffect(() => {
      if (userLocation && step === 'details') {
          setDeliveryCoords(userLocation);
      }
  }, [userLocation, step]);

  return (
    <div className="fixed inset-0 z-[3000]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slideUp h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">{t('cart')}</h2>
            {/* Barre de progression à 3 étapes */}
            <div className="flex gap-1 mt-1">
                <div className={`h-1 w-8 rounded ${step === 'cart' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                <div className={`h-1 w-8 rounded ${step === 'method' ? 'bg-orange-500' : step === 'details' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 w-8 rounded ${step === 'details' ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ETAPE 1 : LISTE ARTICLES */}
          {step === 'cart' && (
            <div className="space-y-4">
              {Object.keys(cart).length === 0 ? (
                <div className="text-center text-gray-400 py-10">{t('empty_cart')}</div>
              ) : (
                Object.values(cart).map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="flex gap-3 items-center">
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">{item.count}x</span>
                      <div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-gray-500">${item.price * item.count}</div></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onRemoveFromCart(item.id)} className="w-8 h-8 border rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50"><Minus size={14}/></button>
                      <button onClick={() => onAddToCart(item)} className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-black"><Plus size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ETAPE 2 : MODE */}
          {step === 'method' && (
            <div className="grid grid-cols-2 gap-4 min-h-[150px]">
              <button onClick={() => { setOrderType('delivery'); setStep('details'); }} className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"><div className="bg-green-100 p-4 rounded-full group-hover:bg-green-200 transition-colors"><Bike size={32} className="text-green-600"/></div><span className="font-bold text-lg text-gray-800">{t('delivery_order')}</span></button>
              <button onClick={() => { setOrderType('dine_in'); setStep('details'); }} className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all group"><div className="bg-orange-100 p-4 rounded-full group-hover:bg-orange-200 transition-colors"><Utensils size={32} className="text-orange-600"/></div><span className="font-bold text-lg">{t('dine_in_order')}</span></button>
            </div>
          )}

          {/* ETAPE 3 : DÉTAILS */}
          {step === 'details' && orderType === 'delivery' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700 flex items-center gap-2 mb-2"><Info size={16}/> {t('specify_delivery_location')}</div>
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border-2 border-gray-200 shrink-0">
                <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-2">
                  <input type="text" className="flex-1 bg-white h-10 rounded-lg px-3 text-sm shadow-md outline-none" placeholder={t('search_address')} value={deliverySearchQuery} onChange={e => setDeliverySearchQuery(e.target.value)} />
                  <button onClick={handleDeliverySearch} className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-md"><Search size={16}/></button>
                  <button onClick={() => onLocateMe('delivery')} className="w-10 h-10 bg-white text-gray-700 rounded-lg flex items-center justify-center shadow-md"><Crosshair size={16}/></button>
                </div>
                <MapComponent center={deliveryCoords} userLocation={deliveryCoords} interactive={true} onLocationSelect={setDeliveryCoords} restaurants={[]} />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-xs font-bold z-[1000]">{t('tap_to_adjust')}</div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('instructions')}</label>
                <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl mb-3" placeholder={t('instructions_placeholder')} value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} />
                <label className="text-sm font-bold text-gray-700 mb-1 block">{t('message_for_restaurant')}</label>
                <textarea rows={2} className="w-full p-3 bg-gray-50 border rounded-xl resize-none" placeholder={t('message_placeholder')} value={orderNote} onChange={e => setOrderNote(e.target.value)} />
              </div>
            </div>
          )}

          {step === 'details' && orderType === 'dine_in' && (
            <div className="space-y-4 text-center">
                <div className="bg-orange-50 p-6 rounded-2xl">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Utensils size={32} className="text-orange-500"/></div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('table_number')}</label>
                    <input type="text" className="w-24 mx-auto text-center p-4 text-2xl font-bold border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none" placeholder={t('table_placeholder')} value={tableNumber} onChange={e => setTableNumber(e.target.value)} autoFocus />
                </div>
                <textarea rows={3} className="w-full p-3 bg-gray-50 border rounded-xl resize-none" placeholder={t('message_placeholder')} value={orderNote} onChange={e => setOrderNote(e.target.value)} />
            </div>
          )}
        </div>

        {/* BOUTONS NAVIGATION */}
        <div className="p-6 border-t border-gray-100 bg-white">
            {step === 'cart' ? (
                <button onClick={() => setStep('method')} disabled={Object.keys(cart).length === 0} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50">{t('choose_pickup_mode')}</button>
            ) : (
                <div className="flex gap-3">
                    <button onClick={() => setStep(step === 'method' ? 'cart' : 'method')} className="px-6 py-4 text-gray-600 font-bold bg-gray-100 rounded-xl">{t('back')}</button>
                    
                    {step === 'method' ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">{t('choose_an_option')}</div>
                    ) : (
                        // BOUTON FINAL DIRECT
                        <button 
                            onClick={handleConfirm} 
                            className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20}/> {t('confirm_order')}
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};