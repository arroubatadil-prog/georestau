# 🚀 Fix Rapide: Activer les SMS de Test

## ⚡ Solution en 2 Minutes

### Étape 1: Firebase Console (1 min)

1. Ouvrez: https://console.firebase.google.com
2. Cliquez sur votre projet
3. Menu gauche > **Authentication**
4. Onglet **Sign-in method**
5. Cliquez sur **Phone**
6. Descendez jusqu'à **Phone numbers for testing**
7. Cliquez **Add phone number**
8. Entrez:
   - **Phone number:** `+212600000001`
   - **Verification code:** `123456`
9. Cliquez **Add**
10. Cliquez **Save** en haut

### Étape 2: Tester (30 sec)

1. Retournez sur votre application
2. Créez un compte restaurant
3. **Téléphone:** `0600000001`
4. Cliquez **Suivant**
5. **Code:** `123456`
6. ✅ Ça marche!

## 📱 Numéros de Test Recommandés

Ajoutez ces 5 numéros pour vos tests:

```
+212600000001 → 123456
+212600000002 → 123456
+212600000003 → 123456
+212600000004 → 123456
+212600000005 → 123456
```

## ✅ Avantages

- ✅ **Gratuit** - Pas besoin du plan payant
- ✅ **Instantané** - Pas d'attente de SMS
- ✅ **Illimité** - Pas de quota
- ✅ **Simple** - Code toujours 123456

## 🎯 Utilisation

Dans votre formulaire:
- Utilisez `0600000001` (ou `+212600000001`)
- Le code sera toujours `123456`
- Aucun SMS réel n'est envoyé

## 💡 Astuce

Pour tester plusieurs restaurants, utilisez des numéros différents:
- Restaurant 1: `0600000001`
- Restaurant 2: `0600000002`
- Restaurant 3: `0600000003`

Chaque numéro peut créer un compte différent!

## 🔄 Si Ça Ne Marche Pas

1. Vérifiez que vous avez bien **sauvegardé** dans Firebase
2. **Rechargez** votre application (F5)
3. Vérifiez que le numéro est bien `+212600000001` (avec +212)
4. Le code doit être exactement `123456`

## 📞 Format des Numéros

| Vous tapez | Firebase comprend |
|------------|-------------------|
| `0600000001` | `+212600000001` ✅ |
| `+212600000001` | `+212600000001` ✅ |
| `600000001` | `+212600000001` ✅ |

L'application ajoute automatiquement `+212` si nécessaire!

## 🎉 C'est Tout!

Vous pouvez maintenant créer des comptes restaurants sans SMS réel et sans payer! 🚀
