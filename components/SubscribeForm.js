import { useState } from 'react';
import { useRouter } from 'next/router';
import useTranslations from '../hooks/useTranslations';
import FeedbackModal from './FeedbackModal';

export default function SubscribeForm() {
  const { locale } = useRouter();
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(t.invalidEmailMessage);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiEndpoint = locale === 'en' ? '/api/en/subscribe' : '/api/subscribe';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(t.successMessage);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || t.errorMessage);
      }

    } catch (error) {
      setStatus('error');
      setMessage(t.connectionErrorMessage);
    }
  };

  return (
    <div className="card-brutal max-w-md mx-auto text-center">
      <h3 className="text-xl sm:text-2xl font-extrabold text-primary mb-3 sm:mb-4">
        {t.subscribeTitle}
      </h3>
      
      <p className="text-gray-text mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
        {t.subscribeDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-brutal w-full text-sm sm:text-base py-3 sm:py-3"
            disabled={status === 'loading'}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`w-full transition-all duration-150 py-3 sm:py-3 text-sm sm:text-base font-semibold ${
            status === 'success'
              ? 'bg-success text-primary border-3 border-primary shadow-brutal cursor-not-allowed px-6 rounded-sm'
              : 'btn-brutal-accent'
          }`}
        >
          {status === 'loading' && t.subscribingButton}
          {status === 'success' && t.subscribedButton}
          {status === 'idle' && t.subscribeButton}
          {status === 'error' && t.retryButton}
        </button>

        {message && (
          <div className={`text-center font-semibold text-sm sm:text-base ${
            status === 'success' ? 'text-primary' : 'text-accent'
          }`}>
            {message}
          </div>
        )}
      </form>

      <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-center space-y-2">
        <p className="text-gray-text">{t.freeForever}</p>
        <button
          onClick={() => setShowFeedback(true)}
          className="text-accent hover:text-primary font-semibold underline transition-colors"
        >
          {t.helpImprove}
        </button>
      </div>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}