import { useEffect, useState } from 'react';

const typeClasses = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500 text-gray-900'
};

export const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((current) => ({ ...current, show: false }));
  };

  return { toast, showToast, hideToast };
};

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${typeClasses[type] || typeClasses.success}`}>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
