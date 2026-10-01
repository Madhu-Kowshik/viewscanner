import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  onSubmit: (password: string) => Promise<boolean>;
  error?: string | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  fileName,
  onSubmit,
  error: externalError,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the document password.');
      return;
    }

    try {
      setIsDecrypting(true);
      setError(null);
      const success = await onSubmit(password);
      if (success) {
        setPassword('');
        setError(null);
        onClose();
      } else {
        setError('Incorrect password. Please verify and try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Decryption failed';
      setError(msg);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Password-Protected PDF"
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
          <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Encrypted Document Detected
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              {fileName ? (
                <>
                  <span className="font-medium font-mono text-slate-800 dark:text-slate-200">
                    {fileName}
                  </span>{' '}
                  is protected with a password.
                </>
              ) : (
                'This PDF is protected with a password.'
              )}{' '}
              Please enter the password below to decrypt and edit it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Enter Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Document password"
                autoFocus
                disabled={isDecrypting}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {(error || externalError) && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error || externalError}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% Client-Side Privacy: Your password and file are never transmitted to any server.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isDecrypting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isDecrypting || !password.trim()}
              className="gap-1.5"
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Unlock & Open
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
