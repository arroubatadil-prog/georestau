/**
 * Base de connaissances pour le chatbot GeoResto
 * Ce fichier contient toutes les informations sur l'application, les fonctionnalités,
 * et les réponses aux questions fréquentes
 */

export interface KnowledgeEntry {
  keywords: string[];
  question: string;
  answer: {
    fr: string;
    en: string;
    ar: string;
  };
  category: 'app' | 'restaurant' | 'order' | 'payment' | 'delivery' | 'account' | 'technical';
}

export const GEORESTO_KNOWLEDGE: KnowledgeEntry[] = [
  // === INFORMATIONS SUR L'APPLICATION ===
  {
    keywords: ['georesto', 'application', 'app', 'c\'est quoi', 'qu\'est-ce que', 'what is', 'ما هو'],
    question: 'Qu\'est-ce que GeoResto ?',
    answer: {
      fr: 'GeoResto est une plateforme qui connecte les restaurants et les clients en temps réel. Vous pouvez découvrir des restaurants près de vous, consulter leurs menus, passer des commandes et suivre leur préparation en direct.',
      en: 'GeoResto is a platform that connects restaurants and customers in real-time. You can discover nearby restaurants, view their menus, place orders, and track their preparation live.',
      ar: 'GeoResto هي منصة تربط المطاعم والعملاء في الوقت الفعلي. يمكنك اكتشاف المطاعم القريبة منك، وعرض قوائمها، وتقديم الطلبات، ومتابعة تحضيرها مباشرة.'
    },
    category: 'app'
  },
  {
    keywords: ['fonctionnalités', 'features', 'que faire', 'what can', 'possibilités', 'الميزات', 'ماذا يمكن'],
    question: 'Quelles sont les fonctionnalités de GeoResto ?',
    answer: {
      fr: 'GeoResto vous permet de : 📍 Trouver des restaurants près de vous sur une carte interactive, 🍽️ Consulter les menus et prix en temps réel, 🛒 Commander directement depuis l\'app, 💬 Discuter avec le restaurant via chat, 📦 Suivre votre commande en temps réel, ⭐ Noter et commenter les restaurants, 🚚 Choisir entre livraison ou sur place.',
      en: 'GeoResto allows you to: 📍 Find nearby restaurants on an interactive map, 🍽️ View menus and prices in real-time, 🛒 Order directly from the app, 💬 Chat with the restaurant, 📦 Track your order in real-time, ⭐ Rate and review restaurants, 🚚 Choose between delivery or dine-in.',
      ar: 'يتيح لك GeoResto: 📍 العثور على المطاعم القريبة على خريطة تفاعلية، 🍽️ عرض القوائم والأسعار في الوقت الفعلي، 🛒 الطلب مباشرة من التطبيق، 💬 الدردشة مع المطعم، 📦 تتبع طلبك في الوقت الفعلي، ⭐ تقييم ومراجعة المطاعم، 🚚 الاختيار بين التوصيل أو تناول الطعام في المكان.'
    },
    category: 'app'
  },
  {
    keywords: ['gratuit', 'free', 'prix', 'price', 'coût', 'cost', 'مجاني', 'سعر'],
    question: 'Est-ce que GeoResto est gratuit ?',
    answer: {
      fr: 'Oui ! GeoResto est 100% gratuit pour les clients. Vous ne payez que vos commandes. Aucun frais d\'inscription, aucun abonnement.',
      en: 'Yes! GeoResto is 100% free for customers. You only pay for your orders. No registration fees, no subscription.',
      ar: 'نعم! GeoResto مجاني 100% للعملاء. أنت تدفع فقط مقابل طلباتك. لا توجد رسوم تسجيل، ولا اشتراك.'
    },
    category: 'app'
  },

  // === COMMANDES ===
  {
    keywords: ['commander', 'order', 'passer commande', 'how to order', 'كيف أطلب', 'طلب'],
    question: 'Comment passer une commande ?',
    answer: {
      fr: '1️⃣ Trouvez un restaurant sur la carte ou dans la liste\n2️⃣ Consultez le menu et ajoutez des plats au panier 🛒\n3️⃣ Cliquez sur le panier et choisissez "Sur place" ou "Livraison"\n4️⃣ Confirmez votre commande\n5️⃣ Suivez la préparation en temps réel ! 📦',
      en: '1️⃣ Find a restaurant on the map or in the list\n2️⃣ Browse the menu and add dishes to cart 🛒\n3️⃣ Click on cart and choose "Dine-in" or "Delivery"\n4️⃣ Confirm your order\n5️⃣ Track preparation in real-time! 📦',
      ar: '1️⃣ ابحث عن مطعم على الخريطة أو في القائمة\n2️⃣ تصفح القائمة وأضف الأطباق إلى السلة 🛒\n3️⃣ انقر على السلة واختر "في المكان" أو "التوصيل"\n4️⃣ أكد طلبك\n5️⃣ تتبع التحضير في الوقت الفعلي! 📦'
    },
    category: 'order'
  },
  {
    keywords: ['annuler', 'cancel', 'supprimer commande', 'cancel order', 'إلغاء', 'حذف الطلب'],
    question: 'Puis-je annuler ma commande ?',
    answer: {
      fr: 'Vous pouvez annuler votre commande tant qu\'elle n\'est pas encore en préparation. Une fois que le restaurant a commencé à préparer, contactez-le via le chat 💬 pour discuter.',
      en: 'You can cancel your order as long as it\'s not being prepared yet. Once the restaurant has started preparing, contact them via chat 💬 to discuss.',
      ar: 'يمكنك إلغاء طلبك طالما أنه لم يتم تحضيره بعد. بمجرد أن يبدأ المطعم في التحضير، اتصل به عبر الدردشة 💬 للمناقشة.'
    },
    category: 'order'
  },
  {
    keywords: ['suivi', 'tracking', 'où est', 'where is', 'statut', 'status', 'تتبع', 'أين', 'حالة'],
    question: 'Comment suivre ma commande ?',
    answer: {
      fr: 'Allez dans "Mes Commandes" 📋. Vous verrez le statut en temps réel :\n⏳ En attente → 👨‍🍳 En préparation → ✅ Prête → 🎉 Livrée/Récupérée',
      en: 'Go to "My Orders" 📋. You\'ll see the real-time status:\n⏳ Pending → 👨‍🍳 Preparing → ✅ Ready → 🎉 Delivered/Picked up',
      ar: 'انتقل إلى "طلباتي" 📋. سترى الحالة في الوقت الفعلي:\n⏳ قيد الانتظار → 👨‍🍳 قيد التحضير → ✅ جاهز → 🎉 تم التسليم/الاستلام'
    },
    category: 'order'
  },

  // === LIVRAISON ===
  {
    keywords: ['livraison', 'delivery', 'frais', 'fees', 'combien', 'how much', 'التوصيل', 'رسوم'],
    question: 'Quels sont les frais de livraison ?',
    answer: {
      fr: 'Les frais de livraison varient selon le restaurant et la distance. Vous verrez le montant exact avant de confirmer votre commande. Certains restaurants offrent la livraison gratuite ! 🚚',
      en: 'Delivery fees vary by restaurant and distance. You\'ll see the exact amount before confirming your order. Some restaurants offer free delivery! 🚚',
      ar: 'تختلف رسوم التوصيل حسب المطعم والمسافة. سترى المبلغ الدقيق قبل تأكيد طلبك. بعض المطاعم تقدم توصيل مجاني! 🚚'
    },
    category: 'delivery'
  },
  {
    keywords: ['temps livraison', 'delivery time', 'combien de temps', 'how long', 'وقت التوصيل', 'كم من الوقت'],
    question: 'Combien de temps prend la livraison ?',
    answer: {
      fr: 'Le temps de livraison dépend de la distance et du trafic. En moyenne : 20-45 minutes. Vous pouvez suivre votre commande en temps réel sur la carte ! 🗺️',
      en: 'Delivery time depends on distance and traffic. Average: 20-45 minutes. You can track your order in real-time on the map! 🗺️',
      ar: 'يعتمد وقت التوصيل على المسافة والازدحام المروري. المتوسط: 20-45 دقيقة. يمكنك تتبع طلبك في الوقت الفعلي على الخريطة! 🗺️'
    },
    category: 'delivery'
  },

  // === PAIEMENT ===
  {
    keywords: ['paiement', 'payment', 'payer', 'pay', 'carte', 'card', 'الدفع', 'بطاقة'],
    question: 'Quels modes de paiement sont acceptés ?',
    answer: {
      fr: 'Actuellement, GeoResto accepte le paiement en espèces 💵 à la livraison ou au restaurant. Le paiement par carte bancaire arrive bientôt ! 💳',
      en: 'Currently, GeoResto accepts cash payment 💵 on delivery or at the restaurant. Card payment is coming soon! 💳',
      ar: 'حاليًا، يقبل GeoResto الدفع نقدًا 💵 عند التسليم أو في المطعم. الدفع بالبطاقة قريبًا! 💳'
    },
    category: 'payment'
  },

  // === COMPTE ===
  {
    keywords: ['compte', 'account', 'inscription', 'register', 'créer', 'create', 'حساب', 'تسجيل'],
    question: 'Dois-je créer un compte ?',
    answer: {
      fr: 'Non ! Vous pouvez commander sans compte en scannant le QR code sur la table du restaurant 📱. Mais créer un compte vous permet de sauvegarder vos adresses, suivre vos commandes et accumuler des points fidélité ! ⭐',
      en: 'No! You can order without an account by scanning the QR code on the restaurant table 📱. But creating an account lets you save addresses, track orders, and earn loyalty points! ⭐',
      ar: 'لا! يمكنك الطلب بدون حساب عن طريق مسح رمز QR على طاولة المطعم 📱. لكن إنشاء حساب يتيح لك حفظ العناوين، وتتبع الطلبات، وكسب نقاط الولاء! ⭐'
    },
    category: 'account'
  },
  {
    keywords: ['qr code', 'scanner', 'scan', 'table', 'مسح', 'رمز'],
    question: 'Comment utiliser le QR code ?',
    answer: {
      fr: 'Sur l\'écran de connexion, cliquez sur "Commander sans compte (QR)" 📷. Scannez le code sur votre table et commandez directement ! Parfait pour les clients pressés. ⚡',
      en: 'On the login screen, click "Order without account (QR)" 📷. Scan the code on your table and order directly! Perfect for customers in a hurry. ⚡',
      ar: 'على شاشة تسجيل الدخول، انقر على "الطلب بدون حساب (QR)" 📷. امسح الرمز على طاولتك واطلب مباشرة! مثالي للعملاء المستعجلين. ⚡'
    },
    category: 'account'
  },

  // === RESTAURANTS ===
  {
    keywords: ['restaurant partenaire', 'partner', 'inscrire restaurant', 'add restaurant', 'مطعم شريك', 'إضافة مطعم'],
    question: 'Comment devenir restaurant partenaire ?',
    answer: {
      fr: 'Choisissez "Je suis Chef" sur l\'écran d\'accueil 👨‍🍳. Créez votre compte, ajoutez votre menu, et commencez à recevoir des commandes ! C\'est simple et gratuit pour commencer. 🎉',
      en: 'Choose "I am Chef" on the home screen 👨‍🍳. Create your account, add your menu, and start receiving orders! It\'s simple and free to start. 🎉',
      ar: 'اختر "أنا طاهٍ" على الشاشة الرئيسية 👨‍🍳. أنشئ حسابك، أضف قائمتك، وابدأ في تلقي الطلبات! إنه بسيط ومجاني للبدء. 🎉'
    },
    category: 'restaurant'
  },
  {
    keywords: ['horaires', 'hours', 'ouvert', 'open', 'fermé', 'closed', 'ساعات', 'مفتوح', 'مغلق'],
    question: 'Comment connaître les horaires d\'un restaurant ?',
    answer: {
      fr: 'Cliquez sur le restaurant sur la carte ou dans la liste. Vous verrez ses horaires d\'ouverture, son numéro de téléphone et toutes les infos utiles ! 📞',
      en: 'Click on the restaurant on the map or in the list. You\'ll see its opening hours, phone number, and all useful info! 📞',
      ar: 'انقر على المطعم على الخريطة أو في القائمة. سترى ساعات عمله، ورقم هاتفه، وجميع المعلومات المفيدة! 📞'
    },
    category: 'restaurant'
  },

  // === TECHNIQUE ===
  {
    keywords: ['bug', 'erreur', 'error', 'problème', 'problem', 'ne marche pas', 'not working', 'خطأ', 'مشكلة'],
    question: 'J\'ai un problème technique',
    answer: {
      fr: 'Désolé pour le désagrément ! 😔 Essayez de :\n1️⃣ Rafraîchir la page (F5)\n2️⃣ Vider le cache du navigateur\n3️⃣ Vérifier votre connexion internet\nSi le problème persiste, contactez le support : support@georesto.com',
      en: 'Sorry for the inconvenience! 😔 Try to:\n1️⃣ Refresh the page (F5)\n2️⃣ Clear browser cache\n3️⃣ Check your internet connection\nIf the problem persists, contact support: support@georesto.com',
      ar: 'عذرًا على الإزعاج! 😔 حاول:\n1️⃣ تحديث الصفحة (F5)\n2️⃣ مسح ذاكرة التخزين المؤقت للمتصفح\n3️⃣ التحقق من اتصالك بالإنترنت\nإذا استمرت المشكلة، اتصل بالدعم: support@georesto.com'
    },
    category: 'technical'
  },
  {
    keywords: ['localisation', 'gps', 'position', 'location', 'géolocalisation', 'الموقع', 'نظام تحديد المواقع'],
    question: 'Pourquoi l\'app demande ma localisation ?',
    answer: {
      fr: 'GeoResto utilise votre position pour vous montrer les restaurants les plus proches de vous 📍. Vos données de localisation ne sont jamais partagées avec des tiers. Vous pouvez refuser et chercher manuellement.',
      en: 'GeoResto uses your location to show you the nearest restaurants 📍. Your location data is never shared with third parties. You can refuse and search manually.',
      ar: 'يستخدم GeoResto موقعك لإظهار أقرب المطاعم إليك 📍. لا يتم مشاركة بيانات موقعك مع أطراف ثالثة أبدًا. يمكنك الرفض والبحث يدويًا.'
    },
    category: 'technical'
  },

  // === PLATS ET MENUS ===
  {
    keywords: ['allergies', 'allergen', 'végétarien', 'vegetarian', 'vegan', 'halal', 'حساسية', 'نباتي', 'حلال'],
    question: 'Puis-je filtrer par régime alimentaire ?',
    answer: {
      fr: 'Actuellement, vous pouvez voir les descriptions des plats dans le menu. Pour des informations spécifiques sur les allergènes ou régimes (végétarien, halal, etc.), contactez directement le restaurant via le chat 💬.',
      en: 'Currently, you can see dish descriptions in the menu. For specific information about allergens or diets (vegetarian, halal, etc.), contact the restaurant directly via chat 💬.',
      ar: 'حاليًا، يمكنك رؤية أوصاف الأطباق في القائمة. للحصول على معلومات محددة حول مسببات الحساسية أو الأنظمة الغذائية (نباتي، حلال، إلخ)، اتصل بالمطعم مباشرة عبر الدردشة 💬.'
    },
    category: 'restaurant'
  },
  {
    keywords: ['promotion', 'promo', 'réduction', 'discount', 'code promo', 'coupon', 'خصم', 'عرض'],
    question: 'Y a-t-il des promotions ?',
    answer: {
      fr: 'Oui ! Certains restaurants proposent des promotions spéciales. Vous les verrez directement sur leur page. Activez les notifications 🔔 pour ne rien manquer !',
      en: 'Yes! Some restaurants offer special promotions. You\'ll see them directly on their page. Enable notifications 🔔 to not miss anything!',
      ar: 'نعم! تقدم بعض المطاعم عروضًا خاصة. سترى ذلك مباشرة على صفحتها. قم بتفعيل الإشعارات 🔔 حتى لا تفوت أي شيء!'
    },
    category: 'restaurant'
  }
];

/**
 * Recherche intelligente dans la base de connaissances
 */
export function searchKnowledge(query: string, language: 'fr' | 'en' | 'ar' = 'fr'): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Recherche par mots-clés
  for (const entry of GEORESTO_KNOWLEDGE) {
    for (const keyword of entry.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        return entry.answer[language];
      }
    }
  }
  
  return null;
}

/**
 * Obtient toutes les connaissances d'une catégorie
 */
export function getKnowledgeByCategory(category: KnowledgeEntry['category'], language: 'fr' | 'en' | 'ar' = 'fr'): string[] {
  return GEORESTO_KNOWLEDGE
    .filter(entry => entry.category === category)
    .map(entry => `Q: ${entry.question}\nR: ${entry.answer[language]}`);
}

/**
 * Génère un contexte enrichi pour l'IA
 */
export function generateEnrichedContext(language: 'fr' | 'en' | 'ar' = 'fr'): string {
  const intro = {
    fr: 'Tu es l\'assistant virtuel de GeoResto, une plateforme de commande de restaurant en temps réel. Voici les informations importantes sur l\'application :',
    en: 'You are the virtual assistant of GeoResto, a real-time restaurant ordering platform. Here is important information about the application:',
    ar: 'أنت المساعد الافتراضي لـ GeoResto، منصة طلب المطاعم في الوقت الفعلي. إليك معلومات مهمة حول التطبيق:'
  };
  
  let context = intro[language] + '\n\n';
  
  // Ajouter les connaissances par catégorie
  const categories: KnowledgeEntry['category'][] = ['app', 'order', 'delivery', 'payment', 'account', 'restaurant', 'technical'];
  
  for (const cat of categories) {
    const knowledge = getKnowledgeByCategory(cat, language);
    if (knowledge.length > 0) {
      context += knowledge.join('\n\n') + '\n\n';
    }
  }
  
  const guidelines = {
    fr: '\nRègles importantes :\n- Réponds toujours de manière amicale et professionnelle\n- Si tu ne connais pas la réponse, propose de contacter le support\n- Utilise des emojis pour rendre la conversation plus agréable\n- Sois concis mais complet\n- Si on te demande des informations sur un restaurant spécifique, utilise les données fournies',
    en: '\nImportant rules:\n- Always respond in a friendly and professional manner\n- If you don\'t know the answer, suggest contacting support\n- Use emojis to make the conversation more pleasant\n- Be concise but complete\n- If asked about a specific restaurant, use the provided data',
    ar: '\nقواعد مهمة:\n- أجب دائمًا بطريقة ودية ومهنية\n- إذا كنت لا تعرف الإجابة، اقترح الاتصال بالدعم\n- استخدم الرموز التعبيرية لجعل المحادثة أكثر متعة\n- كن موجزًا ​​ولكن كاملاً\n- إذا سُئلت عن مطعم معين، استخدم البيانات المقدمة'
  };
  
  context += guidelines[language];
  
  return context;
}
