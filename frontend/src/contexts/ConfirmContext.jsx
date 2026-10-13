import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmContext = createContext();

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: true,
    action: null,
  });
  const [resolver, setResolver] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || 'Confirm',
        message: opts.message || 'Are you sure?',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        isDanger: opts.isDanger !== false,
        action: opts.action || null,
      });
      setResolver(() => resolve);
      setIsOpen(true);
      setIsProcessing(false);
    });
  }, []);

  const handleConfirm = async () => {
    if (options.action) {
      setIsProcessing(true);
      try {
        await options.action();
        if (resolver) resolver(true);
        setIsOpen(false);
      } catch (error) {
        if (resolver) resolver(false);
        setIsOpen(false);
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (resolver) resolver(true);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    if (resolver) resolver(false);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={!isProcessing ? handleCancel : undefined}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(16px)' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
            
            <div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                
                <div className="space-y-3 px-2 max-w-[320px] mx-auto">
                  <h2 className="text-xl font-bold text-slate-100">{options.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-white/5">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300 min-w-[100px]"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  {options.cancelText}
                </Button>
                <Button 
                  variant={options.isDanger ? "destructive" : "default"} 
                  className="min-w-[120px]"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                    </>
                  ) : (
                    options.confirmText || (options.isDanger ? "Delete" : "Confirm")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
