import React from 'react';

// --- Card Components ---
// Updated: Added dark:bg-slate-900, dark:border-slate-800, dark:text-white

export const Card = ({ children, className = '' }) => (
    <div className={`rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = '' }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`font-semibold leading-none tracking-tight text-xl text-gray-900 dark:text-white ${className}`}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={`p-6 pt-0 text-gray-700 dark:text-slate-300 ${className}`}>{children}</div>
);


// --- Button Component ---
// Updated: Added dark mode variants for Outline, Ghost, and Secondary styles.

export const Button = React.forwardRef(({ 
    children, 
    variant = 'primary', 
    size = 'default', 
    className = '', 
    ...props 
}, ref) => {
    
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-slate-950';
    
    const sizeClasses = { 
        default: 'h-10 px-4 py-2', 
        lg: 'h-12 px-6 py-3 text-lg', 
        icon: 'h-10 w-10' 
    }[size];
    
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent dark:bg-blue-600 dark:hover:bg-blue-500',
        
        // Outline: Dark text on light, Light text on dark
        outline: 'border border-gray-300 dark:border-slate-700 bg-white dark:bg-transparent text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800',
        
        // Ghost: Hover effect adaptation
        ghost: 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white',
        
        // Secondary: Light Gray vs Dark Slate
        secondary: 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700',
        
        danger: 'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500'
    }[variant];

    return (
        <button 
            ref={ref}
            className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} transform active:scale-[0.98]`} 
            {...props}
        >
            {children}
        </button>
    );
});
Button.displayName = 'Button';


// --- Input Component ---
// Updated: Dark background, light text, dark border for inputs

export const Input = React.forwardRef(({ label, id, type = 'text', className = '', ...props }, ref) => (
    <div className="space-y-2 w-full">
        {label && <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
        <input
            ref={ref}
            id={id}
            type={type}
            className={`flex h-10 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 ${className}`}
            {...props}
        />
    </div>
));
Input.displayName = 'Input';


// --- Select Component ---
// Updated: Dark background and borders

export const Select = React.forwardRef(({ label, id, children, className = '', ...props }, ref) => (
    <div className="space-y-2 w-full">
        {label && <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
        <select
            ref={ref}
            id={id}
            className={`flex h-10 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 ${className}`}
            {...props}
        >
            {children}
        </select>
    </div>
));
Select.displayName = 'Select';