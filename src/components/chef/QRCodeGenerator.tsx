import React, { useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { QrCode, Download, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';

interface QRCodeGeneratorProps {
  restaurantId: string;
  restaurantName: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ restaurantId, restaurantName }) => {
  const { t } = useI18n();
  const [numberOfTables, setNumberOfTables] = useState<number>(10);
  const [qrSize, setQrSize] = useState<'small' | 'medium' | 'large'>('small');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCodesPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Configuration pour QR codes adaptables avec espacement pour les textes
      const sizeConfig = {
        small: { 
          qrSize: 30, 
          cols: 4, 
          rows: 5, 
          fontSize: 8, 
          nameSize: 6, 
          instructionSize: 5,
          textSpaceTop: 5,    // Espace pour "Table X" au-dessus
          textSpaceBottom: 12 // Espace pour nom restaurant + instruction en-dessous
        }, // 20 par page
        medium: { 
          qrSize: 35, 
          cols: 3, 
          rows: 4, 
          fontSize: 10, 
          nameSize: 7, 
          instructionSize: 6,
          textSpaceTop: 6,
          textSpaceBottom: 15
        }, // 12 par page  
        large: { 
          qrSize: 50, 
          cols: 2, 
          rows: 3, 
          fontSize: 12, 
          nameSize: 9, 
          instructionSize: 7,
          textSpaceTop: 8,
          textSpaceBottom: 18
        } // 6 par page
      };
      
      const config = sizeConfig[qrSize];
      
      // Calculer l'espace total nécessaire pour chaque QR code (QR + textes)
      const totalItemHeight = config.qrSize + config.textSpaceTop + config.textSpaceBottom;
      const totalItemWidth = config.qrSize;
      
      const marginX = (pageWidth - (config.cols * totalItemWidth)) / (config.cols + 1);
      const marginY = 20;
      const spacingY = (pageHeight - marginY * 2 - (config.rows * totalItemHeight)) / (config.rows - 1);

      for (let i = 1; i <= numberOfTables; i++) {
        // URL qui pointe vers le restaurant avec le numéro de table
        const url = `${window.location.origin}/?restaurant=${restaurantId}&table=${i}`;
        
        // Générer le QR code en base64 (plus petit et optimisé)
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 200, // Taille réduite pour des QR codes plus nets mais plus petits
          margin: 0.5, // Marge réduite
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M' // Niveau de correction d'erreur moyen (bon compromis)
        });

        // Calculer la position avec l'espacement correct
        const tableIndex = (i - 1) % (config.cols * config.rows);
        const col = tableIndex % config.cols;
        const row = Math.floor(tableIndex / config.cols);
        
        const x = marginX + col * (totalItemWidth + marginX);
        const y = marginY + config.textSpaceTop + row * (totalItemHeight + spacingY);

        // Ajouter une nouvelle page si nécessaire
        if (i > 1 && tableIndex === 0) {
          pdf.addPage();
        }

        // Ajouter le texte "Table X" AU-DESSUS du QR code
        pdf.setFontSize(config.fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Table ${i}`, x + config.qrSize / 2, y - 2, { align: 'center' });

        // Ajouter le QR code
        pdf.addImage(qrDataUrl, 'PNG', x, y, config.qrSize, config.qrSize);
        
        // Ajouter le nom du restaurant EN-DESSOUS du QR code
        pdf.setFontSize(config.nameSize);
        pdf.setFont('helvetica', 'normal');
        const restaurantText = restaurantName.length > 20 ? restaurantName.substring(0, 17) + '...' : restaurantName;
        pdf.text(restaurantText, x + config.qrSize / 2, y + config.qrSize + 4, { align: 'center' });
        
        // Ajouter l'instruction de scan ENCORE PLUS BAS
        pdf.setFontSize(config.instructionSize);
        pdf.setTextColor(100, 100, 100); // Gris
        pdf.text('Scannez pour commander', x + config.qrSize / 2, y + config.qrSize + 9, { align: 'center' });
        pdf.setTextColor(0, 0, 0); // Remettre en noir
      }

      // Télécharger le PDF
      pdf.save(`QR_Codes_${restaurantName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération des QR codes:', error);
      alert('Erreur lors de la génération des QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
          <QrCode className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Codes QR Compacts pour Tables</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Générez des QR codes petits et pratiques à coller sur vos tables</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Taille des QR codes
          </label>
          <select
            value={qrSize}
            onChange={(e) => setQrSize(e.target.value as 'small' | 'medium' | 'large')}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="small">Petit (3cm) - 20 par page - Idéal pour tables</option>
            <option value="medium">Moyen (3.5cm) - 12 par page - Équilibré</option>
            <option value="large">Grand (5cm) - 6 par page - Plus visible</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Nombre de tables
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={numberOfTables}
            onChange={(e) => setNumberOfTables(parseInt(e.target.value) || 1)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ex: 10"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {qrSize === 'small' && 'Format compact : 20 QR codes par page - Parfait pour coller sur les tables'}
            {qrSize === 'medium' && 'Format équilibré : 12 QR codes par page - Bon compromis taille/visibilité'}
            {qrSize === 'large' && 'Format grand : 6 QR codes par page - Maximum de visibilité'}
          </p>
        </div>

        <button
          onClick={generateQRCodesPDF}
          disabled={isGenerating || numberOfTables < 1}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Génération en cours...
            </>
          ) : (
            <>
              <Download size={20} />
              Générer le PDF ({numberOfTables} QR codes - Taille {qrSize === 'small' ? 'Petite' : qrSize === 'medium' ? 'Moyenne' : 'Grande'})
            </>
          )}
        </button>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
          <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium mb-2">
            📱 QR Codes Compacts pour Tables
          </p>
          <ul className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
            <li>• <strong>3 tailles disponibles :</strong> Petit (20/page), Moyen (12/page), Grand (6/page)</li>
            <li>• <strong>Recommandé :</strong> Taille "Petit" pour coller facilement sur les tables</li>
            <li>• <strong>Scan rapide :</strong> Le client arrive directement sur votre menu</li>
            <li>• <strong>Numéro automatique :</strong> La table est pré-remplie dans la commande</li>
            <li>• <strong>Impression :</strong> Utilisez du papier autocollant pour un collage facile</li>
            <li>• <strong>Résistant :</strong> Plastifiez pour une meilleure durabilité</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
