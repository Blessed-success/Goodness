/**
 * WatchVideoModal
 * Lightweight, accessible lightbox for the hero's "Watch Video" CTA —
 * plays the same promo video unmuted with controls.
 */

import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const WatchVideoModal = ({ videoUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Promotional video"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close video"
        autoFocus
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <FiX size={20} />
      </button>

      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={videoUrl}
          controls
          autoPlay
          className="h-full w-full bg-black"
        />
      </div>
    </div>
  );
};

export default WatchVideoModal;
