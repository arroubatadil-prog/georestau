import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import L from 'leaflet';
import { Location, Restaurant } from '../types';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';

// Styles for the custom dark map theme and route/user visuals
const darkModeStyles = `
  <style>
    /* Map container background to match deep charcoal */
    .leaflet-container { background-color: #1f2937; }
    
    /* Contraste extrême pour visibilité maximale en mode sombre */
    .dark-map-tiles {
      filter: brightness(2.0) contrast(2.2) saturate(0.7) invert(0.05);
    }
    
    .leaflet-container.dark-mode .leaflet-popup-content {
      background-color: #111827; /* darker than container for contrast */
      color: #fff;
      border: 1px solid #374151;
    }
    .leaflet-container.dark-mode .leaflet-popup-tip {
      background-color: #111827;
      border-top-color: #374151;
    }

    /* Restaurant preview popup */
    .restaurant-preview-popup .leaflet-popup-content-wrapper {
      background: #1f2937 !important;
      border: 2px solid #374151 !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
      padding: 20px !important;
      animation: popupFadeIn 0.2s ease-out;
      max-height: none !important;
      overflow: visible !important;
    }
    
    .restaurant-preview-popup .leaflet-popup-content {
      margin: 0 !important;
      width: 300px !important;
      max-width: 300px !important;
      min-width: 300px !important;
      color: #fff !important;
      max-height: none !important;
      overflow: visible !important;
    }
    
    .restaurant-preview-popup .leaflet-popup-tip {
      background: #1f2937 !important;
      border: 2px solid #374151 !important;
      border-top: none !important;
      border-right: none !important;
    }
    
    .restaurant-preview-popup .leaflet-popup-close-button {
      color: #9ca3af !important;
      font-size: 24px !important;
      padding: 4px 8px !important;
      z-index: 10 !important;
    }
    
    .restaurant-preview-popup .leaflet-popup-close-button:hover {
      color: #fb923c !important;
    }
    
    /* Force le popup à ne pas être coupé */
    .restaurant-preview-popup {
      max-height: none !important;
    }
    
    .restaurant-preview-popup .leaflet-popup-content-wrapper,
    .restaurant-preview-popup .leaflet-popup-content {
      height: auto !important;
      max-height: none !important;
    }
    
    @keyframes popupFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Route gradient styling - path will reference SVG gradient id */
    .leaflet-overlay-pane svg path.route-gradient {
      stroke: url(#routeGradient);
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 2px 6px rgba(249,115,22,0.45));
    }

    /* Fallback solid color if gradient not supported */
    .leaflet-overlay-pane svg path.route-solid {
      stroke: #fb923c;
    }

    /* User location glowing puck */
    .user-puck-outer { position: relative; width: 32px; height: 32px; }
    .user-puck-outer .pulse { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at center, rgba(249,115,22,0.45), rgba(249,115,22,0.15) 40%, transparent 60%); animation: pulse 1.8s infinite; }
    .user-puck-outer .center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; border-radius: 50%; background: #fb923c; box-shadow: 0 6px 18px rgba(251,146,60,0.45); border: 2px solid white; }
    @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.9 } 70% { transform: scale(1.8); opacity: 0 } 100% { transform: scale(1.8); opacity: 0 } }

    /* Popup text contrast */
    .leaflet-container.dark-mode .leaflet-popup-content b { color: #fb923c; }
    
    /* Animation bounce pour le marqueur de sélection */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  </style>
`;

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProps {
  center: Location;
  zoom?: number;
  interactive?: boolean;
  restaurants?: Restaurant[];
  onLocationSelect?: (loc: Location) => void;
  onRestaurantSelect?: (resto: Restaurant) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  selectedRestoId?: string | null;
  userLocation?: Location | null;
  route?: Location[] | null;
  showSearchBar?: boolean;
  showLocationButton?: boolean;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  confirmButtonText?: string;
}

const MapComponent = forwardRef<any, MapProps>(({
  center,
  zoom = 13,
  interactive = false,
  onBoundsChange,
  restaurants = [],
  onLocationSelect,
  onRestaurantSelect,
  selectedRestoId,
  userLocation,
  route = null,
  showSearchBar = false,
  showLocationButton = false,
  showConfirmButton = false,
  onConfirm,
  confirmButtonText = 'Confirmer la position'
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Location | null>(null);

  // Expose zoom methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
      }
    },
    zoomOut: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
      }
    }
  }));
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Add dark mode styles to head
    if (!document.querySelector('style[data-dark-map]')) {
      const style = document.createElement('style');
      style.setAttribute('data-dark-map', 'true');
      style.textContent = darkModeStyles;
      document.head.appendChild(style);
    }

    // 👇 MODIFICATION ICI : AJOUT DES OPTIONS
    const map = L.map(mapContainerRef.current, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        tap: false,
        zoomControl: false // Désactive les boutons +/- par défaut
    }).setView([center.lat, center.lng], zoom);

    // Use Carto dark positron style for minimalist look (like Uber/InDrive)
    const isDarkMode = document.documentElement.classList.contains('dark');
    const tileUrl = isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      className: isDarkMode ? 'dark-map-tiles' : ''
    }).addTo(map);
    
    // Store reference to update on theme change
    (map as any).tileLayerRef = tileLayer;
    
    // Ajouter une couche de labels plus clairs en mode sombre
    if (isDarkMode) {
      const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: 2.0 // Labels très visibles
      }).addTo(map);
      (map as any).labelsLayerRef = labelsLayer;
    }

    if (isDarkMode) {
      mapContainerRef.current.classList.add('dark-mode');
    }

    mapInstanceRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (interactive) {
        const location = { lat: e.latlng.lat, lng: e.latlng.lng };
        setSelectedPosition(location);
        
        // Ajouter un marqueur de sélection
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.remove();
        }
        
        const markerIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="position: relative; width: 40px; height: 40px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fb923c; box-shadow: 0 4px 12px rgba(251,146,60,0.5); background-color: white; display: flex; align-items: center; justify-content: center; animation: bounce 0.5s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fb923c" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        
        selectedMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng], { icon: markerIcon, zIndexOffset: 2000 })
          .addTo(map);
        
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      }
    });

    // Écouter les changements de bounds (quand on déplace ou zoom la carte)
    const updateBounds = () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      }
    };

    // Envoyer les bounds initiaux
    updateBounds();

    // Écouter les mouvements de la carte
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onBoundsChange]);

  // Observer dark mode changes
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const map = mapInstanceRef.current;
      if (!map) return;

      // Update tile layer based on theme
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      // Remove old tile layer
      if ((map as any).tileLayerRef) {
        map.removeLayer((map as any).tileLayerRef);
      }
      
      // Remove old labels layer
      if ((map as any).labelsLayerRef) {
        map.removeLayer((map as any).labelsLayerRef);
      }

      // Add new tile layer with contrast filter in dark mode
      const newTileLayer = L.tileLayer(tileUrl, {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        className: isDarkMode ? 'dark-map-tiles' : ''
      }).addTo(map);
      
      (map as any).tileLayerRef = newTileLayer;
      
      // Ajouter une couche de labels plus clairs en mode sombre
      if (isDarkMode) {
        const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
          attribution: '',
          subdomains: 'abcd',
          maxZoom: 19,
          opacity: 2.0 // Labels très visibles
        }).addTo(map);
        (map as any).labelsLayerRef = labelsLayer;
      }
      
      // Update map container dark class
      if (isDarkMode) {
        mapContainerRef.current?.classList.add('dark-mode');
      } else {
        mapContainerRef.current?.classList.remove('dark-mode');
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 2. CENTRAGE
  useEffect(() => {
    if(mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // 3. MARQUEUR UTILISATEUR (CERCLE ROUGE)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
    }

    if (userLocation) {
        // Use styled puck for glowing orange user location
        const userIconHtml = `
          <div class="user-puck-outer">
            <div class="pulse"></div>
            <div class="center"></div>
          </div>
        `;

        const userIcon = L.divIcon({
            className: 'bg-transparent user-puck',
            html: userIconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1500 }).addTo(mapInstanceRef.current!);
        userMarkerRef.current.bindPopup("<b style='color: #fb923c;'>📍 Vous êtes ici</b>");
    }
  }, [userLocation]);

  // 4. MARQUEURS RESTAURANTS (COULEURS FORCÉES)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Nettoyage des anciens marqueurs
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    restaurants.forEach(resto => {
      const isSelected = selectedRestoId === resto.id;
      const isPartner = resto.source === 'firebase';
      
      // ON FORCE LA COULEUR EN HEXADÉCIMAL (Plus de dépendance à Tailwind)
      // Partners highlighted with sunset orange, others muted slate gray
      const color = isPartner ? '#fb923c' : '#9ca3af';
      const scale = isSelected ? 'transform: scale(1.2);' : '';
      const zIndex = isPartner ? 500 : 100;

      // Construction de l'icône avec style inline
      const iconHtml = `
        <div style="position: relative; width: 32px; height: 32px; transition: transform 0.3s; ${scale}">
          <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); background-color: ${color}; display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </div>
          ${isSelected ? `<div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${color};"></div>` : ''}
        </div>
      `;

      const icon = L.divIcon({
        className: 'bg-transparent',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([resto.location.lat, resto.location.lng], { icon, zIndexOffset: zIndex })
        .addTo(mapInstanceRef.current!);

      // Créer un popup riche avec preview du restaurant
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; width: 280px; min-height: 350px;">
          <div style="position: relative; height: 100px; overflow: hidden; margin: -20px -20px 10px -20px; border-radius: 12px 12px 0 0;">
            <img src="${resto.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}" 
                 style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                 onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'" />
            <div style="position: absolute; bottom: -25px; left: 12px; width: 50px; height: 50px; border-radius: 50%; border: 3px solid #1f2937; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5); background: white;">
              <img src="${resto.profileImage || resto.coverImage || 'https://via.placeholder.com/50'}" 
                   style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                   onerror="this.src='https://via.placeholder.com/50'" />
            </div>
          </div>
          
          <div style="padding-top: 30px;">
            <div style="font-weight: bold; font-size: 15px; color: #fb923c; margin-bottom: 12px;">${resto.name || 'Restaurant'}</div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #d1d5db; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🛵</span>
                <span>${resto.delivery ? 'Livraison disponible' : 'Pas de livraison'}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>📞</span>
                <span>${resto.phone || 'Non renseigné'}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>🕐</span>
                <span>${resto.openingHours || 'Horaires non renseignés'}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>⭐</span>
                <span>${resto.rating ? resto.rating.toFixed(1) + ' (' + (resto.ratingCount || 0) + ' avis)' : 'Pas encore d\'avis'}</span>
              </div>
            </div>
            
            <button 
              id="view-profile-btn-${resto.id}"
              style="width: 100%; padding: 12px; background: linear-gradient(135deg, #fb923c, #f97316); color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 2px 8px rgba(249,115,22,0.3);"
            >
              👁️ Voir le profil complet
            </button>
          </div>
        </div>
      `;
      
      // Utiliser un popup au lieu d'un tooltip
      const popup = L.popup({
        maxWidth: 340,
        minWidth: 300,
        maxHeight: 600,
        className: 'restaurant-preview-popup',
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
        autoPan: true,
        keepInView: true
      }).setContent(popupContent);
      
      marker.bindPopup(popup);

      // Détecter si on est sur mobile
      const isMobile = window.innerWidth < 768;
      
      // Variable pour tracker si le popup était déjà ouvert
      let wasPopupOpen = false;
      
      marker.on('click', () => {
        // Sur mobile: premier clic ouvre le popup, pas le profil
        if (isMobile) {
          if (!wasPopupOpen) {
            marker.openPopup();
            wasPopupOpen = true;
          } else {
            // Si le popup était déjà ouvert, ouvrir le profil
            if (onRestaurantSelect) onRestaurantSelect(resto);
          }
        } else {
          // Sur desktop: clic ouvre directement le profil
          if (onRestaurantSelect) onRestaurantSelect(resto);
        }
      });
      
      // Réinitialiser le flag quand le popup se ferme
      marker.on('popupclose', () => {
        wasPopupOpen = false;
      });
      
      // Sur desktop: ouvrir le popup au survol avec délai avant fermeture
      if (!isMobile) {
        let closeTimeout: NodeJS.Timeout | null = null;
        
        // Ouvrir au survol du marqueur
        marker.on('mouseover', function() {
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
          }
          this.openPopup();
        });
        
        // Délai avant fermeture quand on quitte le marqueur
        marker.on('mouseout', function() {
          closeTimeout = setTimeout(() => {
            this.closePopup();
          }, 500); // 500ms de délai
        });
        
        // Annuler la fermeture si on survole le popup
        marker.on('popupopen', () => {
          const popupElement = marker.getPopup()?.getElement();
          if (popupElement) {
            popupElement.addEventListener('mouseenter', () => {
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
              }
            });
            
            popupElement.addEventListener('mouseleave', () => {
              closeTimeout = setTimeout(() => {
                marker.closePopup();
              }, 500); // 500ms de délai
            });
          }
        });
      }
      
      // Ajouter l'événement click au bouton après l'ouverture du popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-profile-btn-${resto.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (onRestaurantSelect) onRestaurantSelect(resto);
          };
        }
      });
      
      markersRef.current.push(marker);
    });
  }, [restaurants, onRestaurantSelect, selectedRestoId]);

  // 5. ROUTE (polyline)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    // remove existing route
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }

    if (route && Array.isArray(route) && route.length > 0) {
      const latlngs = route.map((p: Location) => [p.lat, p.lng] as [number, number]);
      // Create polyline using a class so we can style it with an SVG gradient
      routeRef.current = L.polyline(latlngs, { className: 'route-gradient', weight: 6, opacity: 1 }).addTo(map);

      // Ensure an SVG <defs> with our linearGradient exists (we may need to wait briefly for SVG to be created)
      const ensureDefs = () => {
        try {
          const overlay = map.getPanes().overlayPane as HTMLElement;
          const svg = overlay.querySelector('svg');
          if (!svg) return false;
          let defs = svg.querySelector('defs#routeDefs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.setAttribute('id', 'routeDefs');

            const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            grad.setAttribute('id', 'routeGradient');
            grad.setAttribute('x1', '0%');
            grad.setAttribute('y1', '0%');
            grad.setAttribute('x2', '100%');
            grad.setAttribute('y2', '0%');

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#ff7a18');

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', '#ff4500');

            grad.appendChild(stop1);
            grad.appendChild(stop2);
            defs.appendChild(grad);
            svg.insertBefore(defs, svg.firstChild);
          }
          return true;
        } catch (e) {
          return false;
        }
      };

      // Try to ensure defs immediately; if not present, retry a few times
      if (!ensureDefs()) {
        let tries = 0;
        const t = setInterval(() => {
          tries += 1;
          if (ensureDefs() || tries > 10) clearInterval(t);
        }, 120);
      }

      // Fit bounds with some padding
      try { const bounds = L.latLngBounds(latlngs as any); map.fitBounds(bounds, { padding: [50, 50] }); } catch (e) { /* ignore */ }
    }
  }, [route]);

  // Fonction de recherche d'adresse avec Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        
        // Centrer la carte sur le résultat
        mapInstanceRef.current.flyTo([location.lat, location.lng], 15);
        
        // Ajouter un marqueur
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.remove();
        }
        
        const markerIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="position: relative; width: 40px; height: 40px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fb923c; box-shadow: 0 4px 12px rgba(251,146,60,0.5); background-color: white; display: flex; align-items: center; justify-content: center; animation: bounce 0.5s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fb923c" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        
        selectedMarkerRef.current = L.marker([location.lat, location.lng], { icon: markerIcon, zIndexOffset: 2000 })
          .addTo(mapInstanceRef.current);
        
        setSelectedPosition(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Fonction de détection de localisation
  const handleDetectLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    
    setSearchLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Centrer la carte
        mapInstanceRef.current?.flyTo([location.lat, location.lng], 16);
        
        // Ajouter un marqueur
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.remove();
        }
        
        const markerIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="position: relative; width: 40px; height: 40px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fb923c; box-shadow: 0 4px 12px rgba(251,146,60,0.5); background-color: white; display: flex; align-items: center; justify-center; animation: bounce 0.5s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fb923c" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        
        selectedMarkerRef.current = L.marker([location.lat, location.lng], { icon: markerIcon, zIndexOffset: 2000 })
          .addTo(mapInstanceRef.current!);
        
        setSelectedPosition(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        setSearchLoading(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible de détecter votre position. Veuillez autoriser la géolocalisation.');
        setSearchLoading(false);
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* Barre de recherche */}
      {showSearchBar && (
        <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
          <div className="flex-1 flex gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
            <input
              type="text"
              placeholder="Rechercher une adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {searchLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>
          
          {/* Bouton de détection de localisation */}
          {showLocationButton && (
            <button
              onClick={handleDetectLocation}
              disabled={searchLoading}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-orange-600 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              title="Détecter ma position"
            >
              <Navigation size={20} />
            </button>
          )}
        </div>
      )}
      
      {/* Carte */}
      <div ref={mapContainerRef} className="w-full h-full transition-all duration-300" />
      
      {/* Bouton de confirmation */}
      {showConfirmButton && selectedPosition && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-xl hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MapPin size={20} />
            {confirmButtonText}
          </button>
        </div>
      )}
    </div>
  );
});
  
  export { MapComponent };
  export type { MapBounds };