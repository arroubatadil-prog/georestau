// Service de notifications push pour le client

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.log('Permission de notification refusée');
        return;
      }
    }

    try {
      const notificationOptions = {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options,
      };

      // Utiliser le Service Worker si disponible (meilleur pour Windows)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, notificationOptions as any);
          console.log('✅ Notification envoyée via Service Worker');
          return;
        } catch (swError) {
          console.warn('Service Worker notification échouée, fallback vers Notification API:', swError);
        }
      }
      
      // Fallback vers notification simple (fonctionne aussi sur Windows)
      const notification = new Notification(title, notificationOptions);
      
      // Ajouter des événements pour le tracking
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      console.log('✅ Notification envoyée via Notification API');
    } catch (error) {
      console.error('❌ Erreur notification:', error);
    }
  }

  // Notification de changement de statut
  async notifyOrderStatusChange(restaurantName: string, status: string, estimatedTime?: number): Promise<void> {
    const statusMessages: Record<string, string> = {
      preparing: '👨‍🍳 Votre commande est en préparation',
      ready: '🚀 Votre commande est en route !',
      completed: '✅ Votre commande est arrivée !',
    };

    const message = statusMessages[status] || 'Statut de commande mis à jour';
    let body = `${restaurantName}\n${message}`;

    if (status === 'ready' && estimatedTime) {
      const minutes = Math.floor(estimatedTime / 60000);
      body += `\n⏱️ Arrivée dans ${minutes} min`;
    }

    await this.showNotification('🍽️ GeoResto - Commande', {
      body,
      tag: 'order-status-' + Date.now(), // Tag unique pour chaque notification
      requireInteraction: status === 'ready' || status === 'completed',
      vibrate: [300, 100, 300],
      silent: false,
    } as NotificationOptions);
  }

  // Notification de nouveau message
  async notifyNewMessage(restaurantName: string, message: string): Promise<void> {
    const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    await this.showNotification(`💬 Nouveau message - ${restaurantName}`, {
      body: messagePreview,
      tag: 'new-message-' + Date.now(), // Tag unique pour chaque message
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      data: {
        url: window.location.origin,
        restaurantName,
        timestamp: Date.now()
      }
    } as NotificationOptions);
  }

  // Notification avec compte à rebours (mise à jour périodique)
  async startDeliveryCountdown(restaurantName: string, estimatedArrivalTime: number): Promise<void> {
    const updateCountdown = async () => {
      const now = Date.now();
      const remaining = estimatedArrivalTime - now;

      if (remaining <= 0) {
        await this.showNotification('🎉 Votre commande arrive !', {
          body: `${restaurantName}\nLe livreur est à votre porte`,
          tag: 'delivery-countdown',
          requireInteraction: true,
        });
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      await this.showNotification('🚀 Livraison en cours', {
        body: `${restaurantName}\n⏱️ Arrivée dans ${minutes}:${seconds.toString().padStart(2, '0')}`,
        tag: 'delivery-countdown',
        silent: true, // Pas de son pour les mises à jour
      });
    };

    // Première notification
    await updateCountdown();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(async () => {
      const remaining = estimatedArrivalTime - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        await updateCountdown();
      } else {
        await updateCountdown();
      }
    }, 30000); // 30 secondes

    // Nettoyer après l'arrivée
    setTimeout(() => clearInterval(interval), estimatedArrivalTime - Date.now() + 5000);
  }
}

export const notificationService = NotificationService.getInstance();
