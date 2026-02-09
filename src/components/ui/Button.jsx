import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({ className, variant = 'primary', size = 'default', isLoading, children, ...props }) {
    const variants = {
        primary: "gradient-atc hover:opacity-90 text-white shadow-lg hover:shadow-xl cursor-pointer",
        secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        icon: "h-10 w-10 p-0 flex items-center justify-center",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
