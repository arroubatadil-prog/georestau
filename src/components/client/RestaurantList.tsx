import React from 'react';
import { Restaurant } from '../../types';
import { Loader2, MapPin, X, SlidersHorizontal, Star } from 'lucide-react';
import { useI18n } from '../../i18n';

interface RestaurantListProps {
  restaurants: Restaurant[];
  isLoading: boolean;
  onSelect: (resto: Restaurant) => void;
  showMobileList: boolean;
  onCloseMobile: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  filterType: string; setFilterType: (val: string) => void;
  filterDish: string; setFilterDish: (val: string) => void;
  sortOption: string; setSortOption: (val: string) => void;
  minRating: number; setMinRating: (val: number) => void;
  priceSort: string; setPriceSort: (val: string) => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants, isLoading, onSelect, showMobileList, onCloseMobile, isFilterOpen, onToggleFilter,
  filterType, setFilterType, filterDish, setFilterDish, sortOption, setSortOption, minRating, setMinRating, priceSort, setPriceSort
}) => {
  const { t } = useI18n();
  const RESTAURANT_TYPES = [
    { label: t('all'), value: 'all' },
    { label: t('resto'), value: 'restaurant' },
    { label: t('snack'), value: 'fast_food' },
    { label: t('cafe'), value: 'cafe' }
  ];
  const DISH_TYPES = [
    { label: t('all'), value: 'all' },
    { label: `🍕 ${t('pizza')}`, value: 'pizza' },
    { label: `🌮 ${t('tacos')}`, value: 'tacos' },
    { label: `🍔 ${t('burger')}`, value: 'burger' }
  ];
  const SORT_OPTIONS = [
    { label: `📍 ${t('nearby')}`, value: 'distance' },
    { label: `💰 ${t('price_asc')}`, value: 'price_asc' }
  ];

  return (
    <div className={`
      bg-white dark:bg-transparent shadow-xl border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col
      /* --- CORRECTIF MOBILE --- */
      /* pt-24 = Laisser 6rem (96px) d'espace en haut pour la barre de recherche */
      ${showMobileList ? 'fixed inset-0 z-[2000] pt-24' : 'hidden'}
      /* --- PC --- */
      md:relative md:flex md:w-96 md:translate-x-0 md:pt-0 md:z-20
    `}>
        {/* Header Liste */}
        <div className="p-4 bg-white dark:bg-transparent border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shadow-sm shrink-0">
          <div><h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('nearby_places')}</h2><p className="text-xs text-gray-500 dark:text-gray-300">{restaurants.length} {t('results')}</p></div>
            <div className="flex gap-2">
                <button onClick={onToggleFilter} className={`p-2 rounded-full transition-colors border ${isFilterOpen ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' : 'bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:border-gray-700'}`}><SlidersHorizontal size={20} /></button>
                <button onClick={onCloseMobile} className="md:hidden p-2 bg-red-50 text-red-600 rounded-full border border-red-100 dark:bg-transparent dark:text-red-300 dark:border-red-700"><X size={20}/></button>
            </div>
        </div>

        {/* Filtres */}
        {isFilterOpen && (
                <div className="bg-orange-50 dark:bg-gray-900 p-4 border-b border-orange-100 dark:border-gray-700 animate-fadeIn text-sm space-y-4 shrink-0 max-h-[50vh] overflow-y-auto">
                <div><p className="font-bold text-orange-900 mb-2 text-sm uppercase dark:text-orange-400">{t('type')}</p><div className="flex flex-wrap gap-2">{RESTAURANT_TYPES.map(ti => (<button key={ti.value} onClick={() => setFilterType(ti.value)} className={`px-3 py-1 rounded-lg border ${filterType === ti.value ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>{ti.label}</button>))}</div></div>
                
                <div><p className="font-bold text-orange-900 mb-2 text-sm uppercase dark:text-orange-400">{t('dish')}</p><div className="flex flex-wrap gap-2">{DISH_TYPES.map(d => (<button key={d.value} onClick={() => setFilterDish(d.value)} className={`px-3 py-1 rounded-lg border ${filterDish === d.value ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>{d.label}</button>))}</div></div>
                
                <div><p className="font-bold text-orange-900 mb-2 text-sm uppercase dark:text-orange-400">{t('sort_and_sort')}</p><div className="flex flex-wrap gap-2">{SORT_OPTIONS.map(s => (<button key={s.value} onClick={() => setSortOption(s.value)} className={`px-3 py-1 rounded-lg border text-xs ${sortOption === s.value ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>{s.label}</button>))}</div></div>
                
                <div><p className="font-bold text-orange-900 mb-2 text-sm uppercase dark:text-orange-400">{t('min_rating')}</p><div className="flex items-center gap-3"><input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(parseFloat(e.target.value))} className="flex-1"/><span className="text-orange-800 dark:text-orange-400 font-bold text-base">{minRating > 0 ? `${minRating}⭐` : t('all')}</span></div></div>
                
                <div><p className="font-bold text-orange-900 mb-2 text-sm uppercase dark:text-orange-400">{t('price')}</p><div className="flex flex-wrap gap-2">
                  <button onClick={() => setPriceSort("all")} className={`px-3 py-1 rounded-lg border text-xs ${priceSort === "all" ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>{t('all_prices')}</button>
                  <button onClick={() => setPriceSort("price_asc")} className={`px-3 py-1 rounded-lg border text-xs ${priceSort === "price_asc" ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>💰 {t('cheaper')}</button>
                  <button onClick={() => setPriceSort("price_desc")} className={`px-3 py-1 rounded-lg border text-xs ${priceSort === "price_desc" ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>💰 {t('expensive')}</button>
                </div></div>
                
                <div className="pt-2 border-t border-orange-200 dark:border-gray-700 flex justify-between items-center"><button onClick={() => { setFilterType('all'); setFilterDish('all'); setSortOption('distance'); setMinRating(0); setPriceSort('all'); }} className="text-xs text-gray-600 dark:text-gray-200 underline font-semibold">{t('reset_all')}</button><button onClick={onToggleFilter} className="text-xs font-bold text-orange-800 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-3 py-1.5 rounded-lg">{t('close')}</button></div>
            </div>
        )}

        {/* Résultats */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50 dark:bg-transparent">
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500"/></div> : restaurants.filter(r => r && r.name).map(resto => (
                <div key={resto.id} onClick={() => onSelect(resto)} className="p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors border bg-white dark:bg-[#071127] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0b2740] shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${resto.source === 'firebase' ? 'bg-orange-500' : 'bg-blue-500'}`}>{(resto.name || 'R').charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{resto.name || t('place')}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300">{resto.category}</span>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-300 flex items-center gap-1"><MapPin size={10} /> {(resto as any).distance ? (resto as any).distance.toFixed(1) : '0.0'} km</span>
                      </div>
                      {resto.rating && resto.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={`${
                                star <= Math.round(resto.rating!)
                                  ? 'fill-orange-400 text-orange-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{resto.rating.toFixed(1)}</span>
                          {resto.ratingCount && <span className="text-xs text-gray-500 dark:text-gray-400">({resto.ratingCount})</span>}
                        </div>
                      )}
                    </div>
                </div>
            ))}
            <div className="h-20 md:hidden"></div>
        </div>
    </div>
  );
};