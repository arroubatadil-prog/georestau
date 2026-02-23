# Guide de Sélection de Position sur la Carte

## 📍 Fonctionnalités

Lors de la création d'un compte restaurant ou client, vous pouvez maintenant sélectionner précisément votre position sur la carte avec trois méthodes différentes.

## 🎯 Méthodes de Sélection

### 1. Recherche par Adresse
- **Barre de recherche** en haut de la carte
- Tapez une adresse, ville, ou lieu
- Appuyez sur Entrée ou cliquez sur le bouton de recherche
- La carte se centre automatiquement sur le résultat
- Un marqueur orange apparaît à la position trouvée

**Exemples de recherche:**
- "Casablanca, Maroc"
- "Boulevard Mohammed V, Rabat"
- "Marrakech Medina"
- "Tanger Port"

### 2. Détection Automatique
- **Bouton GPS** (icône Navigation) à côté de la barre de recherche
- Cliquez pour détecter automatiquement votre position actuelle
- Nécessite l'autorisation de géolocalisation du navigateur
- La carte se centre sur votre position exacte
- Un marqueur orange apparaît à votre emplacement

**Note:** Sur mobile, assurez-vous que la géolocalisation est activée dans les paramètres de votre navigateur.

### 3. Sélection Manuelle
- **Cliquez directement** sur la carte à l'endroit souhaité
- Un marqueur orange apparaît à la position cliquée
- Vous pouvez cliquer plusieurs fois pour ajuster la position
- Le dernier clic définit la position finale

## ✅ Confirmation

Une fois la position sélectionnée (par l'une des trois méthodes):
1. Un marqueur orange animé apparaît sur la carte
2. Un bouton de confirmation apparaît en bas de la carte
3. Cliquez sur **"Confirmer la position du restaurant"** (pour les chefs) ou **"Confirmer mon domicile"** (pour les clients)
4. La position est enregistrée et le modal se ferme

## 🎨 Interface

### Pour les Restaurants (Chefs)
- Titre: "Position du Restaurant"
- Bouton: "Confirmer la position du restaurant"
- La position sera utilisée pour afficher le restaurant sur la carte des clients

### Pour les Clients
- Titre: "Mon Domicile"
- Bouton: "Confirmer mon domicile"
- La position sera utilisée pour calculer les distances et les itinéraires

## 🔧 Fonctionnalités Techniques

### Recherche d'Adresse
- Utilise l'API Nominatim d'OpenStreetMap
- Recherche mondiale
- Résultats en temps réel
- Pas de limite de requêtes pour un usage normal

### Géolocalisation
- Utilise l'API Geolocation du navigateur
- Précision GPS sur mobile
- Précision IP sur desktop
- Demande d'autorisation automatique

### Carte Interactive
- Zoom avec molette ou pincement
- Déplacement par glisser-déposer
- Mode sombre automatique
- Marqueurs animés

## 📱 Compatibilité

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Tablette
- ✅ Mode sombre / clair

## 🚀 Utilisation

1. Lors de la création de compte, cliquez sur "Choisir sur la carte"
2. Le modal de carte s'ouvre en plein écran
3. Utilisez l'une des trois méthodes pour sélectionner votre position
4. Vérifiez que le marqueur orange est au bon endroit
5. Cliquez sur "Confirmer"
6. La position est enregistrée et vous pouvez continuer l'inscription

## 💡 Conseils

- **Pour les restaurants:** Sélectionnez l'entrée principale de votre établissement
- **Pour les clients:** Sélectionnez votre adresse de livraison habituelle
- **Précision:** Zoomez au maximum pour une sélection précise
- **Vérification:** Utilisez la recherche pour vérifier que vous êtes au bon endroit

## 🔒 Sécurité

- La position n'est enregistrée qu'après confirmation
- Vous pouvez fermer le modal sans enregistrer (bouton X)
- La position peut être modifiée ultérieurement dans les paramètres du profil
