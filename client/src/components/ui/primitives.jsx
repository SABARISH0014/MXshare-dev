import React from 'react';

export const Card = ({ children, className = '' }) => (
    <div className={`rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-md text-gray-100 shadow-lg ${className}`}>
        {children}
    </div>
);
export const CardHeader = ({ children }) => (
    <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);
export const CardTitle = ({ children }) => (
    <h3 className="font-semibold leading-none tracking-tight text-xl text-white">{children}</h3>
);
export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';
    const sizeClasses = { default: 'h-10 px-4 py-2', lg: 'h-12 px-6 py-3 text-lg', icon: 'h-10 w-10' }[size];
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
        outline: 'border border-blue-700 text-blue-400 hover:bg-blue-900/20',
        ghost: 'hover:bg-gray-800 text-gray-200',
        secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600',
    }[variant];
    return (
        <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} transform active:scale-[0.98]`} {...props}>
            {children}
        </button>
    );
};

export const Input = ({ label, id, type = 'text', className = '', ...props }) => (
    <div className="space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
        <input
            id={id}
            type={type}
            className={`flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    </div>
);

export const Select = ({ label, id, children, className = '', ...props }) => (
    <div className="space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
        <select
            id={id}
            className={`flex h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </select>
    </div>
);