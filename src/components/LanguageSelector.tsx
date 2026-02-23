import React from 'react';
import { useI18n } from '../i18n';

export const LanguageSelector: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { setLang, lang } = useI18n();

  const choose = (l: 'fr' | 'en' | 'ar') => {
    setLang(l);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
        <h3 className="text-xl font-bold mb-4">Choisir la langue / Select language / اختر اللغة</h3>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => choose('fr')} className={`py-3 rounded-xl ${lang==='fr'?'bg-orange-500 text-white':'bg-gray-100'}`}>Français</button>
          <button onClick={() => choose('en')} className={`py-3 rounded-xl ${lang==='en'?'bg-orange-500 text-white':'bg-gray-100'}`}>English</button>
          <button onClick={() => choose('ar')} className={`py-3 rounded-xl ${lang==='ar'?'bg-orange-500 text-white':'bg-gray-100'}`}>العربية</button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
