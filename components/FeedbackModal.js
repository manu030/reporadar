import { useEffect } from 'react';
import useTranslations from '../hooks/useTranslations';

export default function FeedbackModal({ isOpen, onClose }) {
  const t = useTranslations();

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-secondary border-3 border-primary shadow-brutal max-w-md w-full mx-4 rounded-sm">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b-3 border-primary">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-extrabold text-primary">
              🚀 Ayúdanos a mejorar
            </h3>
            <button
              onClick={onClose}
              className="text-primary hover:text-accent text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-gray-text mb-4 leading-relaxed text-center">
            ¿Qué features te gustaría ver? ¿Qué mejorarías de Repo Radar?
            Todas las ideas son bienvenidas.
          </p>

          {/* Tally Embedded Form */}
          <div className="w-full">
            <iframe
              src="https://tally.so/embed/nPxJk0?hideTitle=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1"
              width="100%"
              height="200"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              title="Feedback Form"
              className="rounded-sm"
              style={{ border: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <p className="text-xs text-gray-text text-center">
            Tu feedback nos ayuda a priorizar las mejores features.
          </p>
        </div>
      </div>
    </div>
  );
}