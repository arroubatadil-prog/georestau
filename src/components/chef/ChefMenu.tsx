import React, { useState, useRef } from 'react';
import { MenuItem, Restaurant } from '../../types';
import { Plus, Sparkles, Loader2, Image as ImageIcon, Wand2, Camera, Trash2, Pencil, X, Upload } from 'lucide-react';
import { generateDishImage, generateMenuDescription, parseMenuFromImage, suggestMenuCategory } from '../../services/gemini';

interface ChefMenuProps {
  restaurant: Restaurant;
  onUpdateMenu: (newMenu: MenuItem[]) => void;
  onUpdateMenuImage?: (menuImage: string) => void;
}

// Fonction helper pour l'image
const getSmartImageUrl = (dishName: string) => {
    const prompt = `delicious ${dishName} food plate, restaurant professional photography, 8k, appetizing, gourmet`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&nologo=true&seed=${Math.random()}`;
};

export const ChefMenu: React.FC<ChefMenuProps> = ({ restaurant, onUpdateMenu, onUpdateMenuImage }) => {
  // États locaux du formulaire
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemIngredients, setNewItemIngredients] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState('');
  
  // États de chargement
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isScanningMenu, setIsScanningMenu] = useState(false);
  const [loadingImages, setLoadingImages] = useState<{[key: string]: boolean}>({});

  // États d'édition
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showMenuImage, setShowMenuImage] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS AJOUT ---
  const handleGenerateDescription = async () => {
    if (!newItemName || !newItemIngredients) return;
    setIsGeneratingAI(true);
    try {
      const desc = await generateMenuDescription(newItemName, newItemIngredients);
      setGeneratedDescription(desc);
    } finally { setIsGeneratingAI(false); }
  };

  const handleGenerateNewItemImage = async () => {
      if (!newItemName) return;
      setIsGeneratingImage(true);
      try {
          const base64 = await generateDishImage(newItemName, newItemIngredients || 'delicious food');
          if (base64) setNewItemImage(`data:image/jpeg;base64,${base64}`);
          else setNewItemImage(getSmartImageUrl(newItemName));
      } catch (e) { setNewItemImage(getSmartImageUrl(newItemName)); } 
      finally { setIsGeneratingImage(false); }
  };

  const handleAddMenuItem = async () => {
    if (!newItemName || !newItemPrice) return;
    const category = await suggestMenuCategory(newItemName);
    const finalImage = newItemImage || getSmartImageUrl(newItemName);
    const newItem: MenuItem = {
      id: `item-${Date.now()}`, name: newItemName, price: parseFloat(newItemPrice),
      description: generatedDescription || 'No description yet.', category: category, image: finalImage
    };
    onUpdateMenu([...restaurant.menu, newItem]);
    
    // Reset form
    setNewItemName(''); setNewItemPrice(''); setNewItemIngredients('');
    setGeneratedDescription(''); setNewItemImage(null);
  };

  // --- HANDLERS SCAN ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsScanningMenu(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Full = reader.result as string;
            const [header, cleanBase64] = base64Full.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            
            // Sauvegarder l'image originale du menu
            if (onUpdateMenuImage) {
                onUpdateMenuImage(base64Full);
            }
            
            const items = await parseMenuFromImage(cleanBase64, mimeType);
            if (items && items.length > 0) {
                const newItems: MenuItem[] = items.map((item: any, index: number) => ({
                    id: `scan-${Date.now()}-${index}`, name: item.name, price: item.price || 0,
                    description: item.description || '', category: item.category || 'Mains',
                    image: getSmartImageUrl(item.name) 
                }));
                onUpdateMenu([...restaurant.menu, ...newItems]);
            } else { alert("Aucun plat détecté. Essayez une photo plus claire."); }
            setIsScanningMenu(false);
        };
    } catch (error) { console.error(error); setIsScanningMenu(false); }
  };

  // --- HANDLERS ITEM ACTIONS ---
  const handleDeleteItem = (id: string) => {
    if (confirm('Supprimer ce plat ?')) {
        onUpdateMenu(restaurant.menu.filter(m => m.id !== id));
    }
  };

  const handleRegenerateItemImage = async (item: MenuItem) => {
      setLoadingImages(prev => ({ ...prev, [item.id]: true }));
      try {
          const base64 = await generateDishImage(item.name, item.description);
          let newImageUrl = base64 ? `data:image/jpeg;base64,${base64}` : getSmartImageUrl(item.name);
          onUpdateMenu(restaurant.menu.map(m => m.id === item.id ? { ...m, image: newImageUrl } : m));
      } finally { setLoadingImages(prev => ({ ...prev, [item.id]: false })); }
  };

  // --- HANDLERS EDIT ---
  const handleSaveEdit = () => {
    if (!editingItem) return;
    onUpdateMenu(restaurant.menu.map(m => m.id === editingItem.id ? editingItem : m));
    setEditingItem(null);
  };
  
  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingItem) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setEditingItem({ ...editingItem, image: reader.result as string });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fadeIn">
        
        {/* Zone Scan */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
                <div><h2 className="text-2xl font-bold mb-2">Importer le Menu via IA</h2><p className="text-indigo-100 text-sm max-w-md">Prenez une photo de votre menu papier.</p></div>
                <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isScanningMenu} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-50 disabled:opacity-70">
                        {isScanningMenu ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20} />}{isScanningMenu ? 'Analyse...' : 'Scanner'}
                    </button>
                </div>
            </div>
        </div>

        {/* Section Affichage Menu Scanné - Image Originale */}
        {restaurant.menuImage && (
          <div className="mb-8 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Menu Original Scanné
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Image du menu analysée par l'IA • {restaurant.menu.length} plat{restaurant.menu.length > 1 ? 's' : ''} détecté{restaurant.menu.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowMenuImage(true)}
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Voir en Grand
              </button>
            </div>
            
            {/* Aperçu de l'image du menu */}
            <div 
              className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowMenuImage(true)}
            >
              <img 
                src={restaurant.menuImage} 
                alt="Menu original scanné" 
                className="w-full h-auto max-h-96 object-contain"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-gray-800 dark:text-gray-100 font-bold text-sm">Cliquer pour agrandir</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formulaire Ajout */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit lg:sticky lg:top-6">
                <h3 className="font-bold text-xl mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2"><Plus className="text-orange-500" /> Nouveau Plat</h3>
                <div className="space-y-4">
                    <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Nom</label><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="ex: Burger Maison" /></div>
                    <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Ingrédients</label><div className="flex gap-2"><input type="text" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={newItemIngredients} onChange={(e) => setNewItemIngredients(e.target.value)} placeholder="Boeuf, Fromage..." /><button onClick={handleGenerateDescription} disabled={!newItemName || !newItemIngredients || isGeneratingAI} className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 p-3 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900 disabled:opacity-50">{isGeneratingAI ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}</button></div></div>
                    <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Photo</label><div className="flex gap-2">{newItemImage ? (<div className="w-16 h-16 rounded-lg overflow-hidden relative group"><img src={newItemImage} className="w-full h-full object-cover" alt="New" /><button onClick={() => setNewItemImage(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><X size={16} /></button></div>) : (<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600"><ImageIcon size={20} /></div>)}<button onClick={handleGenerateNewItemImage} disabled={!newItemName || isGeneratingImage} className="flex-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2">{isGeneratingImage ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Photo AI</button></div></div>
                    <div><label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Prix (DH)</label><input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} /></div>
                    {generatedDescription && (<div className="bg-orange-50 p-3 rounded-xl text-sm text-orange-800 italic">"{generatedDescription}"</div>)}
                    <button onClick={handleAddMenuItem} disabled={!newItemName || !newItemPrice} className="w-full bg-orange-600 dark:bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"><Plus size={20} /> Ajouter au Menu</button>
                </div>
            </div>

            {/* Liste des Plats */}
            <div className="lg:col-span-2 space-y-4">
                {restaurant.menu.length === 0 ? (<div className="text-center py-20 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"><p>Votre menu est vide</p></div>) : (restaurant.menu.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 group">
                        <div className="w-full sm:w-32 h-32 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden relative">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'} />
                            <div className="absolute top-2 right-2"><button onClick={() => handleRegenerateItemImage(item)} className="p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full shadow text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors">{loadingImages[item.id] ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}</button></div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start"><h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{item.name}</h4><span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg">{item.price} DH</span></div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">{item.category}</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{item.description}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingItem(item)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Pencil size={18} /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                )))}
            </div>
        </div>

        {/* Modal Edition (Interne au composant Menu pour simplifier) */}
        {editingItem && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Modifier le plat</h3>
                        <button onClick={() => setEditingItem(null)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"><X size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-5">
                        <div className="flex flex-col items-center gap-4 mb-4">
                            <img src={editingItem.image || 'https://via.placeholder.com/200'} className="w-full h-48 object-cover rounded-xl" alt="Preview" />
                            <button onClick={() => editFileInputRef.current?.click()} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600"><Upload size={16} className="inline mr-2"/> Changer Photo</button>
                            <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={handleEditFileChange} />
                        </div>
                        <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nom</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Prix</label><input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})} /></div>
                            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Catégorie</label><input className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} /></div>
                        </div>
                        <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Description</label><textarea rows={3} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} /></div>
                    </div>
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                        <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
                        <button onClick={handleSaveEdit} className="flex-[2] py-3 bg-orange-600 dark:bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-600">Enregistrer</button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal Affichage Image Menu en Grand */}
        {showMenuImage && restaurant.menuImage && (
            <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Menu Original - {restaurant.name}
                            </h3>
                            <p className="text-purple-100 text-sm mt-1">
                                Image analysée par l'IA • {restaurant.menu.length} plat{restaurant.menu.length > 1 ? 's' : ''} détecté{restaurant.menu.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowMenuImage(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Image du menu */}
                    <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                        <div className="flex justify-center">
                            <img 
                                src={restaurant.menuImage} 
                                alt="Menu original scanné" 
                                className="max-w-full h-auto rounded-xl shadow-lg"
                                style={{ maxHeight: 'calc(95vh - 200px)' }}
                            />
                        </div>
                    </div>

                    {/* Footer avec info */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-500 dark:text-gray-400">
                                💡 Cette image a été analysée automatiquement par l'IA pour extraire les plats
                            </p>
                            <button 
                                onClick={() => setShowMenuImage(false)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};