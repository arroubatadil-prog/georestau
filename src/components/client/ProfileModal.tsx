import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { X, User as UserIcon, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useI18n } from '../../i18n';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState(user);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setFormData(user);
  }, [user, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name || formData.displayName,
        displayName: formData.name || formData.displayName,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || ''
      });

      setSaveMessage(t('save_success') || 'Profil mis à jour avec succès');
      if (onSave) {
        onSave(formData);
      }

      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setSaveMessage(t('save_error') || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[6000]">
      <div className="bg-white dark:bg-[#071127] rounded-xl shadow-2xl w-96 max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-[#071127]">
          <div className="flex items-center gap-2">
            <UserIcon size={20} className="text-orange-600" />
            <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('my_profile') || 'Mon Profil'}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Avatar Placeholder */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold">
              {(formData.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('full_name') || 'Nom Complet'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Votre nom"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0b2740] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Mail size={14} /> {t('email') || 'Email'}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="votre@email.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0b2740] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Phone size={14} /> {t('phone') || 'Téléphone'}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0b2740] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MapPin size={14} /> {t('address') || 'Adresse'}
            </label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              placeholder="Votre adresse"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0b2740] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`text-sm font-bold text-center py-2 rounded ${saveMessage.includes('succès') ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'}`}>
              {saveMessage}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={16} /> {isSaving ? (t('saving') || 'Enregistrement...') : (t('save_profile') || 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
};
