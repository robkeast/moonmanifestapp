import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg font-medium transition-colors duration-200';
  
  const variants = {
    primary: 'bg-[rgb(67,83,143)] hover:bg-[rgb(44,52,88)] text-white',
    secondary: 'bg-[rgb(117,58,171)] hover:bg-[rgb(75,37,109)] text-white',
    outline: 'border-2 border-[rgb(67,83,143)] text-[rgb(67,83,143)] hover:bg-[rgb(67,83,143)] hover:text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};