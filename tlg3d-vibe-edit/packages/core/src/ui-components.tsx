// ===== MODERN UI COMPONENT LIBRARY - REFINED =====
// Dark-first with muted accent colors

import React from 'react';

// Button Component - Subtle by default
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-500 text-gray-100 transition-colors',
    secondary: 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:text-gray-100 transition-colors',
    accent: 'bg-amber-700 hover:bg-amber-600 text-gray-100 transition-colors',
    outline: 'border border-green-600 text-green-400 hover:bg-gray-900 transition-colors',
    ghost: 'text-gray-400 hover:text-green-400 hover:bg-gray-900 bg-transparent transition-colors',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        font-medium rounded-lg transition-all duration-200 flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {icon}
      {children}
    </button>
  );
};

// Card Component - Subtle dark
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ elevated = true, className, children, ...props }) => {
  return (
    <div
      className={`
        bg-gray-900 border border-gray-800 rounded-lg p-6
        transition-all duration-200
        ${elevated ? 'hover:border-gray-700 shadow-lg' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// Input Component - Subtle with muted focus
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-gray-500">{icon}</span>}
        <input
          className={`
            w-full px-4 py-2 bg-gray-900 border border-gray-700
            text-gray-100 placeholder-gray-600
            rounded-lg focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:ring-opacity-30
            transition-colors duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-600 focus:border-red-600' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Badge Component - Muted with borders
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-green-900 text-green-300 border border-green-700',
    accent: 'bg-amber-900 text-amber-300 border border-amber-700',
    success: 'bg-green-900 text-green-300 border border-green-700',
    warning: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
    error: 'bg-red-900 text-red-300 border border-red-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        font-medium rounded-full inline-block
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// Progress Component - Subtle bar
interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'primary' | 'accent';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = true,
  variant = 'primary',
}) => {
  const percentage = (value / max) * 100;
  const color = variant === 'primary' ? 'bg-green-600' : 'bg-amber-600';

  return (
    <div className="w-full">
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
};

// Alert Component - Subtle with muted colors
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  icon,
  dismissible = false,
  onDismiss,
  children,
  className,
  ...props
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const typeClasses = {
    success: 'bg-green-900 bg-opacity-40 border border-green-700 text-green-300',
    warning: 'bg-yellow-900 bg-opacity-40 border border-yellow-700 text-yellow-300',
    error: 'bg-red-900 bg-opacity-40 border border-red-700 text-red-300',
    info: 'bg-green-900 bg-opacity-40 border border-green-700 text-green-300',
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`
        rounded-lg p-4 flex items-start gap-3
        ${typeClasses[type]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0 text-lg">{icon}</span>}
      <div className="flex-1">
        {children}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// Modal Component - Subtle dark overlay
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={onClose}
      />
      <Card className={`relative z-10 ${sizeClasses[size]}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
};

// Loading Spinner - Subtle with muted green
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <div className="w-full h-full border-4 border-gray-700 border-t-green-600 rounded-full" />
    </div>
  );
};

export default {
  Button,
  Card,
  Input,
  Badge,
  Progress,
  Alert,
  Modal,
  Spinner,
};
