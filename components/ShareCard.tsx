// components/ShareCard.tsx
'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Download, X, Share2 } from 'lucide-react';
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
  textPreview,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const scoreEmoji =
    regretScore < 30 ? '\u{1F9D8}' : regretScore < 60 ? '\u{1F914}' : '\u{1F6A8}';
  const scoreMessage =
    regretScore < 30
      ? 'Clear-headed communication'
      : regretScore < 60
      ? 'Worth a second look'
      : 'Saved by the pause';

  const shareText = `I almost sent this ${context}, but Pause caught ${biasesDetected} cognitive ${
    biasesDetected === 1 ? 'bias' : 'biases'
  } and gave it a ${regretScore}% regret probability. ${scoreEmoji}\n\n\u201C${textPreview.substring(
    0,
    100
  )}...\u201D\n\n${scoreMessage}.`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `pause-analysis-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Image downloaded!');
    } catch {
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    await copyToClipboard(shareText);
    toast.success('Copied to clipboard!');
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  const handleNativeShare = async () => {
    const appUrl = window.location.origin;
    const shareData = {
      title: 'My Pause Analysis',
      text: shareText,
      url: appUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared! Thanks for spreading the word.');
        return;
      } catch {
        // fall through
      }
    }
    await copyToClipboard(shareText);
    toast.success('Analysis copied! Share it anywhere you like.', { duration: 4000 });
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
        <div className="flex justify-between items-center p-6 border-b border-stone-200">
          <h2 className="text-xl font-playfair font-bold text-stone-800">
            Share Your Pause
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100"
            style={{ maxWidth: '360px', margin: '0 auto' }}
          >
            {/* Logo */}
  <div className="text-center mb-4">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
  src="/logo.png"
  alt="Pause"
  style={{ height: '40px', display: 'inline-block' }}
  crossOrigin="anonymous"
/>
  </div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{scoreEmoji}</div>
              <div
                className="text-4xl font-bold font-playfair mb-2"
                style={{
                  color:
                    regretScore < 30 ? '#059669' : regretScore < 60 ? '#D97706' : '#DC2626',
                }}
              >
                {regretScore}%
              </div>
              <p className="text-stone-600">Regret Probability</p>
            </div>

            <div className="bg-white/80 rounded-xl p-4 mb-4">
              <p className="text-sm text-stone-600 mb-2">Almost sent as {context}:</p>
              <p
                className="text-stone-800 italic break-words"
                style={{ maxWidth: '100%', wordBreak: 'break-word' }}
              >
                &ldquo;{textPreview.substring(0, 120)}
                {textPreview.length > 120 ? '...' : ''}&rdquo;
              </p>
            </div>

            <div className="flex justify-between items-center text-sm text-stone-600">
  <span>
    {biasesDetected} {biasesDetected === 1 ? 'bias' : 'biases'} detected
  </span>
  <span className="text-stone-400 text-xs">Analysed by Pause</span>
</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-2 p-3 bg-black text-white rounded-2xl hover:bg-stone-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 p-3 bg-teal-500 text-white rounded-2xl hover:bg-teal-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
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