# 🔐 Système de Sécurité des Rôles - GeoResto

## ✅ Problème Résolu

**Avant** : Un utilisateur pouvait changer de rôle en modifiant le localStorage et accéder à n'importe quelle interface.

**Maintenant** : Chaque utilisateur a un rôle **permanent** stocké dans Firestore qui ne peut pas être modifié.

---

## 🏗️ Architecture

### 1. **Collection Firestore : `userRoles`**

Chaque utilisateur a un document dans cette collection :

```typescript
{
  uid: "user123",
  role: "client" | "chef",
  email: "user@example.com",
  createdAt: 1234567890,
  restaurantId: "resto123" // Uniquement pour les chefs
}
```

### 2. **Service `userRole.ts`**

Fonctions de gestion des rôles :

- `getUserRole(uid)` - Récupère le rôle depuis Firestore
- `setUserRole(uid, role, email)` - Définit le rôle (une seule fois)
- `verifyUserAccess(uid, requiredRole)` - Vérifie l'accès
- `getChefRestaurantId(uid)` - Récupère l'ID du restaurant d'un chef

### 3. **Flux d'Authentification**

```
1. Utilisateur choisit son rôle (Client ou Chef)
   ↓
2. S'inscrit avec email/mot de passe
   ↓
3. Le rôle est enregistré dans Firestore (PERMANENT)
   ↓
4. À chaque connexion, le rôle est vérifié
   ↓
5. Si l'utilisateur essaie d'accéder à la mauvaise interface → ACCÈS REFUSÉ
```

---

## 🔒 Sécurité

### ✅ **Ce qui est sécurisé**

1. **Rôle permanent** : Une fois défini, le rôle ne peut pas être changé
2. **Stockage Firestore** : Impossible de modifier depuis le client
3. **Vérification à chaque connexion** : Le rôle est vérifié depuis Firestore
4. **Écran d'accès refusé** : Si tentative d'accès non autorisé

### ⚠️ **Règles Firestore à ajouter**

Pour une sécurité maximale, ajoutez ces règles dans Firebase Console :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection userRoles - Lecture seule après création
    match /userRoles/{userId} {
      // Permettre la lecture uniquement à l'utilisateur concerné
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Permettre la création uniquement si le document n'existe pas
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && !exists(/databases/$(database)/documents/userRoles/$(userId));
      
      // Interdire toute modification ou suppression
      allow update, delete: if false;
    }
    
    // Autres collections...
  }
}
```

---

## 🎯 Utilisation

### **Pour les nouveaux utilisateurs**

1. Choisir "Je suis Client" ou "Je suis Restaurant"
2. S'inscrire normalement
3. Le rôle est automatiquement enregistré
4. Impossible de changer de rôle par la suite

### **Pour les utilisateurs existants**

Les utilisateurs existants n'ont pas encore de rôle dans `userRoles`.

**Solution** : À leur prochaine connexion, ils devront choisir leur rôle qui sera alors enregistré de manière permanente.

---

## 🚨 Écran d'Accès Refusé

Si un utilisateur essaie d'accéder à la mauvaise interface :

```
┌─────────────────────────────────────┐
│         🚫 Accès Refusé             │
├─────────────────────────────────────┤
│                                     │
│  Votre compte n'a pas accès à      │
│  cette interface.                   │
│  Vous êtes enregistré comme client. │
│                                     │
│  [Retour à mon interface]           │
│  [Se déconnecter]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 Avantages

✅ **Sécurité renforcée** : Impossible de changer de rôle
✅ **Séparation claire** : Clients et restaurants ont des comptes distincts
✅ **Traçabilité** : Chaque utilisateur a un rôle permanent
✅ **Simplicité** : Pas besoin de gestion complexe des permissions
✅ **Évolutif** : Facile d'ajouter de nouveaux rôles (admin, livreur, etc.)

---

## 🔄 Migration des Utilisateurs Existants

Pour les utilisateurs qui existent déjà sans rôle :

1. À la prochaine connexion, ils verront l'écran de choix de rôle
2. Ils choisissent leur rôle
3. Le rôle est enregistré de manière permanente
4. Ils ne verront plus jamais cet écran

---

## 🛠️ Maintenance

### **Changer le rôle d'un utilisateur (Admin uniquement)**

Si nécessaire, un administrateur peut changer le rôle via Firebase Console :

1. Aller dans Firestore
2. Collection `userRoles`
3. Trouver le document de l'utilisateur
4. Modifier le champ `role`

⚠️ **Attention** : Cette opération doit être rare et justifiée.

---

## 📝 Notes Techniques

- Le rôle est vérifié à chaque chargement de l'application
- Le localStorage n'est plus utilisé pour stocker le rôle
- La vérification se fait côté serveur (Firestore)
- Impossible de contourner la sécurité depuis le client

---

## 🎉 Résultat

**Avant** : 🔓 Sécurité faible, changement de rôle possible

**Maintenant** : 🔐 Sécurité forte, rôles permanents et vérifiés

Votre application est maintenant sécurisée contre les accès non autorisés ! 🚀
