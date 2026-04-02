# Fix: Erreur auth/internal-error avec Recaptcha

## 🐛 Problème Identifié

**Erreur:** `Firebase: Error (auth/internal-error)` avec message `assertNotDestroyed`

**Cause:** Le Recaptcha était nettoyé (`.clear()`) trop tôt par le `useEffect`, ce qui le détruisait avant qu'il puisse être utilisé pour l'envoi du SMS.

## 🔧 Solution Appliquée

### Avant (Problématique)
```typescript
useEffect(() => {
  if (isRegistering && role === UserRole.CHEF && !window.recaptchaVerifier) {
    // Initialisation
    window.recaptchaVerifier = new RecaptchaVerifier(...);
  }
  return () => {
    // ❌ PROBLÈME: Nettoyage à chaque changement de isRegistering/role
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear(); // Détruit le Recaptcha
      window.recaptchaVerifier = null;
    }
  }
}, [isRegistering, role]); // Se déclenche à chaque changement
```

**Problème:** Quand `isRegistering` ou `role` change, le cleanup se déclenche et détruit le Recaptcha, même s'il est encore nécessaire.

### Après (Corrigé)
```typescript
// 1. Nettoyage uniquement au démontage du composant
useEffect(() => {
  return () => {
    // ✅ Nettoyage seulement quand le composant est démonté
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  }
}, []); // Tableau vide = une seule fois

// 2. Initialisation séparée
useEffect(() => {
  if (isRegistering && role === UserRole.CHEF && !window.recaptchaVerifier) {
    // ✅ Initialisation sans cleanup automatique
    window.recaptchaVerifier = new RecaptchaVerifier(...);
  }
}, [isRegistering, role]);
```

**Avantages:**
- Le Recaptcha n'est nettoyé qu'au démontage du composant
- Il reste disponible pendant toute la durée de vie du composant
- Pas de destruction prématurée

## 📋 Changements Détaillés

### 1. Séparation des useEffect
- **Premier useEffect** (cleanup): Se déclenche uniquement au démontage
- **Deuxième useEffect** (init): Se déclenche quand on passe en mode inscription chef

### 2. Suppression du Nettoyage en Cas d'Erreur
```typescript
// Avant
catch (err) {
  setError(errorMessage);
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear(); // ❌ Causait des problèmes
    window.recaptchaVerifier = null;
  }
}

// Après
catch (err) {
  setError(errorMessage);
  // ✅ Pas de nettoyage, le Recaptcha reste disponible pour réessayer
}
```

## 🧪 Test de la Correction

### Étapes de Test
1. Ouvrez la console du navigateur (F12)
2. Allez sur la page de création de compte restaurant
3. Remplissez tous les champs
4. Cliquez sur "Suivant"

### Logs Attendus
```
🔐 Initialisation du Recaptcha...
✅ Recaptcha initialisé
📱 Tentative d'envoi SMS...
Téléphone: 0612345678
Téléphone formaté: +212612345678
Envoi du SMS...
✅ SMS envoyé avec succès
```

### Si Erreur Persiste
Si vous voyez encore une erreur, ce sera maintenant une erreur **différente** et plus spécifique:
- `auth/quota-exceeded` → Quota SMS dépassé
- `auth/invalid-phone-number` → Numéro invalide
- `auth/invalid-app-credential` → Configuration Firebase incorrecte

## 🎯 Prochaines Étapes

### Si le SMS ne s'envoie toujours pas:

#### 1. Vérifier la Configuration Firebase
```bash
# Vérifiez votre fichier .env.local
cat .env.local
```

Doit contenir:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### 2. Activer l'Authentification par Téléphone dans Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. **Authentication** > **Sign-in method**
4. Cliquez sur **Phone**
5. **Activez** le fournisseur
6. Sauvegardez

#### 3. Ajouter un Numéro de Test (Recommandé)

Pour éviter de consommer le quota SMS pendant les tests:

1. Firebase Console > **Authentication** > **Sign-in method**
2. Cliquez sur **Phone** > **Phone numbers for testing**
3. Ajoutez:
   - Numéro: `+212600000000`
   - Code: `123456`
4. Sauvegardez

Maintenant, utilisez `0600000000` dans le formulaire et le code sera toujours `123456`.

#### 4. Vérifier les Domaines Autorisés

1. Firebase Console > **Authentication** > **Settings**
2. **Authorized domains**
3. Assurez-vous que `localhost` est dans la liste

#### 5. Recharger la Page

Après toute modification de configuration:
- Rechargez la page (F5)
- Videz le cache si nécessaire (Ctrl+Shift+Delete)

## 📊 Diagnostic Rapide

| Symptôme | Cause Probable | Solution |
|----------|----------------|----------|
| `auth/internal-error` | Recaptcha détruit | ✅ Corrigé dans ce fix |
| `auth/quota-exceeded` | Quota SMS dépassé | Utilisez un numéro de test |
| `auth/invalid-phone-number` | Format incorrect | Utilisez `0612345678` |
| `auth/invalid-app-credential` | Config Firebase | Vérifiez .env.local |
| Rien ne se passe | Recaptcha non initialisé | Rechargez la page |

## 💡 Conseils

1. **Utilisez des numéros de test** pendant le développement
2. **Vérifiez la console** pour voir les logs détaillés
3. **Rechargez la page** après chaque modification
4. **Videz le cache** si les problèmes persistent
5. **Vérifiez le quota** dans Firebase Console

## 🎓 Explication Technique

### Cycle de Vie des useEffect

```typescript
// ❌ Mauvais: Cleanup à chaque changement
useEffect(() => {
  // Setup
  return () => {
    // Cleanup se déclenche à chaque changement de deps
  }
}, [dep1, dep2]);

// ✅ Bon: Cleanup uniquement au démontage
useEffect(() => {
  // Setup
  return () => {
    // Cleanup se déclenche uniquement au démontage
  }
}, []); // Pas de dépendances
```

### Pourquoi Séparer les useEffect?

1. **Initialisation** (avec deps): Se déclenche quand les conditions sont remplies
2. **Nettoyage** (sans deps): Se déclenche uniquement au démontage

Cela évite les conflits entre l'initialisation et le nettoyage.

## ✅ Résultat Attendu

Après cette correction:
- ✅ Le Recaptcha s'initialise correctement
- ✅ Il reste disponible pendant toute la session
- ✅ L'envoi de SMS fonctionne
- ✅ Pas d'erreur `auth/internal-error`
- ✅ Messages d'erreur plus clairs si autre problème

## 🔄 Si Vous Devez Réinitialiser le Recaptcha

Si vous avez besoin de réinitialiser manuellement le Recaptcha:

```typescript
// Dans la console du navigateur
if (window.recaptchaVerifier) {
  window.recaptchaVerifier.clear();
  window.recaptchaVerifier = null;
}
// Puis rechargez la page
location.reload();
```
