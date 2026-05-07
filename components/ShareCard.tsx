'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Twitter, 
  Linkedin, 
  Link2, 
  Download,
  X 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  regretScore: number;
  biasesDetected: number;
  context: string;
  textPreview: string;
}

export default function ShareCard({ 
  isOpen, 
  onClose, 
  regretScore, 
  biasesDetected, 
  context,
  textPreview 
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const scoreEmoji = regretScore < 30 ? '\u{1F9D8}' : regretScore < 60 ? '\u{1F914}' : '\u{1F6A8}';
  const scoreMessage = regretScore < 30 
    ? 'Clear-headed communication' 
    : regretScore < 60 
    ? 'Worth a second look' 
    : 'Saved by the pause';

  const shareText = `I almost sent this ${context}, but Pause caught ${biasesDetected} cognitive ${biasesDetected === 1 ? 'bias' : 'biases'} and gave it a ${regretScore}% regret probability. ${scoreEmoji}\n\n\u201C${textPreview.substring(0, 100)}...\u201D\n\n${scoreMessage}.\n\nTry Pause: https://pauseapp.com`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { 
        quality: 0.95,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `pause-analysis-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  const handleLinkedInShare = () => {
    navigator.clipboard.writeText(shareText);
    window.open('https://linkedin.com/sharing/share-offsite/', '_blank');
    toast.success('Text copied! Paste it on LinkedIn');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-playfair font-bold">Share Your Pause</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100"
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{scoreEmoji}</div>
              <div className="text-4xl font-bold font-playfair mb-2" 
                style={{ 
                  color: regretScore < 30 ? '#059669' : regretScore < 60 ? '#D97706' : '#DC2626' 
                }}
              >
                {regretScore}%
              </div>
              <p className="text-stone-600">Regret Probability</p>
            </div>

            <div className="bg-white/80 rounded-xl p-4 mb-4">
              <p className="text-sm text-stone-600 mb-2">Almost sent as {context}:</p>
              <p className="text-stone-800 italic">
                &ldquo;{textPreview.substring(0, 120)}{textPreview.length > 120 ? '...' : ''}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center text-sm text-stone-600">
              <span>{biasesDetected} {biasesDetected === 1 ? 'bias' : 'biases'} detected</span>
              <span className="font-bold text-teal-600">pauseapp.com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-2 p-3 bg-black text-white rounded-2xl hover:bg-stone-800 transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </button>
            
            <button
              onClick={handleLinkedInShare}
              className="flex items-center justify-center gap-2 p-3 bg-[#0A66C2] text-white rounded-2xl hover:bg-[#004182] transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </button>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 p-3 bg-stone-100 text-stone-700 rounded-2xl hover:bg-stone-200 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Copy Text
            </button>
            
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 p-3 bg-stone-100 text-stone-700 rounded-2xl hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Save Image'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}