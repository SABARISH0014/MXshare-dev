import React from 'react';

export const Card = ({ children, className = '' }) => (
    // Changed defaults to white background and gray borders (Light Mode Base)
    <div className={`rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ children }) => (
    <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);

export const CardTitle = ({ children }) => (
    // Changed text-white to text-gray-900
    <h3 className="font-semibold leading-none tracking-tight text-xl text-gray-900">{children}</h3>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';
    const sizeClasses = { default: 'h-10 px-4 py-2', lg: 'h-12 px-6 py-3 text-lg', icon: 'h-10 w-10' }[size];
    
    // Updated variants for Light Mode
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white',
        ghost: 'hover:bg-gray-100 text-gray-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    }[variant];

    return (
        <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} transform active:scale-[0.98]`} {...props}>
            {children}
        </button>
    );
};

export const Input = ({ label, id, type = 'text', className = '', ...props }) => (
    <div className="space-y-2 w-full">
        {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
        <input
            id={id}
            type={type}
            // Changed to light background, dark text, lighter border
            className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400 ${className}`}
            {...props}
        />
    </div>
);

export const Select = ({ label, id, children, className = '', ...props }) => (
    <div className="space-y-2 w-full">
        {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
        <select
            id={id}
            // Changed to light background, dark text
            className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </select>
    </div>
);