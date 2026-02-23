import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';

/**
 * Service de gestion des rôles utilisateurs
 * Stocke et vérifie les rôles dans Firestore
 */

export interface UserRoleData {
  uid: string;
  role: UserRole;
  email: string;
  createdAt: number;
  restaurantId?: string; // Pour les chefs, ID du restaurant associé
}

/**
 * Récupère le rôle d'un utilisateur depuis Firestore
 */
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'userRoles', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserRoleData;
      console.log('✅ Rôle récupéré depuis Firestore:', data.role);
      return data.role;
    }
    console.log('⚠️ Aucun rôle trouvé pour cet utilisateur');
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération rôle:', error);
    return null;
  }
};

/**
 * Définit le rôle d'un utilisateur dans Firestore
 * Ne peut être fait qu'une seule fois lors de l'inscription
 */
export const setUserRole = async (
  uid: string,
  role: UserRole,
  email: string,
  restaurantId?: string
): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a déjà un rôle
    const existingRole = await getUserRole(uid);
    if (existingRole) {
      console.log('⚠️ L\'utilisateur a déjà un rôle:', existingRole);
      return false; // Ne pas permettre de changer de rôle
    }

    // Créer le document de rôle
    const roleData: UserRoleData = {
      uid,
      role,
      email,
      createdAt: Date.now(),
      ...(restaurantId && { restaurantId })
    };

    await setDoc(doc(db, 'userRoles', uid), roleData);
    console.log('✅ Rôle défini avec succès:', role);
    return true;
  } catch (error) {
    console.error('❌ Erreur définition rôle:', error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur a le droit d'accéder à une interface
 */
export const verifyUserAccess = async (
  uid: string,
  requiredRole: UserRole
): Promise<boolean> => {
  try {
    const userRole = await getUserRole(uid);
    if (!userRole) {
      console.log('❌ Accès refusé: Aucun rôle défini');
      return false;
    }
    
    const hasAccess = userRole === requiredRole;
    if (!hasAccess) {
      console.log(`❌ Accès refusé: Rôle ${userRole} != ${requiredRole}`);
    } else {
      console.log(`✅ Accès autorisé: Rôle ${userRole}`);
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ Erreur vérification accès:', error);
    return false;
  }
};

/**
 * Récupère l'ID du restaurant associé à un chef
 */
export const getChefRestaurantId = async (uid: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'userRoles', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserRoleData;
      return data.restaurantId || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération restaurant ID:', error);
    return null;
  }
};
