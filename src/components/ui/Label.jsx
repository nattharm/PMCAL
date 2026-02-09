import React from 'react';
import { cn } from '../../lib/utils';

export function Label({ className, children, ...props }) {
    return (
        <label
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 mb-2 block",
                className
            )}
            {...props}
        >
            {children}
        </label>
    );
}
