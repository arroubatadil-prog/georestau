# 🔔 Guide des Notifications Windows pour GeoResto

## Configuration requise pour recevoir les notifications dans le Centre de notifications Windows

### 1. Vérifier les paramètres du navigateur

#### Chrome / Edge
1. Ouvrir les paramètres du navigateur
2. Aller dans **Confidentialité et sécurité** > **Paramètres du site**
3. Cliquer sur **Notifications**
4. S'assurer que les notifications sont **autorisées**
5. Vérifier que votre site (localhost ou domaine) est dans la liste des sites autorisés

#### Firefox
1. Ouvrir les paramètres
2. Aller dans **Vie privée et sécurité**
3. Descendre jusqu'à **Permissions** > **Notifications**
4. Cliquer sur **Paramètres...**
5. Autoriser les notifications pour votre site

### 2. Vérifier les paramètres Windows

#### Windows 10/11
1. Ouvrir **Paramètres Windows** (Win + I)
2. Aller dans **Système** > **Notifications**
3. S'assurer que **Obtenir des notifications des applications et d'autres expéditeurs** est activé
4. Descendre et trouver votre navigateur (Chrome, Edge, Firefox)
5. S'assurer qu'il est **activé**

### 3. Tester les notifications

#### Dans l'application GeoResto

1. **Première connexion** : Une popup apparaîtra pour demander l'autorisation des notifications
   - Cliquer sur **Autoriser**

2. **Tester manuellement** :
   - Ouvrir la console du navigateur (F12)
   - Taper : `Notification.requestPermission().then(p => console.log(p))`
   - Devrait afficher : `"granted"`

3. **Tester une notification** :
   ```javascript
   new Notification('Test GeoResto', {
     body: 'Ceci est un test de notification',
     icon: '/pwa-192x192.png'
   });
   ```

### 4. Scénarios de notification dans GeoResto

Les notifications apparaissent dans les cas suivants :

#### Pour les clients :
- 💬 **Nouveau message** d'un restaurant
- 📦 **Changement de statut** de commande (en préparation, en route, livrée)
- ⏱️ **Compte à rebours** de livraison (toutes les 30 secondes)

#### Pour les restaurants :
- 🛎️ **Nouvelle commande** reçue
- 💬 **Nouveau message** d'un client

### 5. Dépannage

#### Les notifications n'apparaissent pas ?

1. **Vérifier la permission** :
   ```javascript
   console.log('Permission:', Notification.permission);
   // Devrait afficher: "granted"
   ```

2. **Réinitialiser les permissions** :
   - Chrome/Edge : Cliquer sur l'icône 🔒 dans la barre d'adresse
   - Cliquer sur **Paramètres du site**
   - Réinitialiser les permissions
   - Recharger la page

3. **Vérifier le Service Worker** :
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
     console.log('Service Worker prêt:', reg);
   });
   ```

4. **Mode Focus Assist (Windows)** :
   - Vérifier que le mode "Ne pas déranger" n'est pas activé
   - Paramètres > Système > Assistance de concentration
   - Mettre sur "Désactivé" ou "Priorité uniquement"

5. **Tester avec HTTPS** :
   - Les notifications fonctionnent mieux sur HTTPS
   - En local, `localhost` est considéré comme sécurisé

### 6. Format des notifications Windows

Les notifications GeoResto apparaissent avec :
- 🎨 **Icône** : Logo GeoResto (192x192)
- 📝 **Titre** : Type de notification + nom du restaurant
- 💬 **Corps** : Message détaillé
- 🔔 **Son** : Notification sonore Windows
- 📱 **Vibration** : Sur mobile uniquement

### 7. Exemple de notification dans le Centre de notifications

```
┌─────────────────────────────────────┐
│ 🍽️ GeoResto                         │
├─────────────────────────────────────┤
│ 💬 Nouveau message - Pizza Roma     │
│                                     │
│ Votre commande sera prête dans     │
│ 5 minutes !                         │
│                                     │
│ Il y a 2 minutes                    │
└─────────────────────────────────────┘
```

### 8. Bonnes pratiques

- ✅ Les notifications restent visibles dans le Centre de notifications
- ✅ Cliquer sur une notification ouvre/focus l'application
- ✅ Les notifications sont groupées par application
- ✅ L'historique est conservé dans le Centre de notifications
- ✅ Les notifications fonctionnent même si l'onglet est en arrière-plan

### 9. Développement

Pour tester en développement :
```bash
npm run dev
```

Le Service Worker est activé même en développement grâce à la configuration Vite.

### 10. Production

En production, les notifications fonctionnent automatiquement sur :
- ✅ HTTPS (obligatoire)
- ✅ Tous les navigateurs modernes
- ✅ Windows 10/11
- ✅ macOS
- ✅ Linux
- ✅ Android
- ✅ iOS (avec limitations)

---

## Support

Si les notifications ne fonctionnent toujours pas, vérifiez :
1. Version du navigateur à jour
2. Windows à jour
3. Pas de logiciel antivirus bloquant les notifications
4. Pas de politique d'entreprise bloquant les notifications
