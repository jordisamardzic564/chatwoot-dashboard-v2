"use client";

import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
    value: string;
    onChange: (val: string) => void;
    className?: string;
}

export default function EditableField({ value, onChange, className = "" }: EditableFieldProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => setLocalValue(value), [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
        setIsEditing(false);
    };

    return (
        <div className={`value ${className}`}>
            <input 
                className="input-edit"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={handleBlur}
            />
        </div>
    );
}
