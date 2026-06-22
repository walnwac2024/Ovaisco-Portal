import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuSearch, LuCheck, LuX } from 'react-icons/lu';

/**
 * SharedDropdown - A premium, searchable, and responsive dropdown component.
 * 
 * @param {Array} options - [{ value: any, label: string }] or [string]
 * @param {any} value - Current selected value
 * @param {Function} onChange - (value) => void
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Optional label above the dropdown
 * @param {boolean} searchable - Whether to show a search input
 * @param {string} className - Extra classes for the container
 * @param {boolean} clearable - Whether to show a clear button
 */
export default function SharedDropdown({
    options = [],
    value,
    onChange,
    placeholder = "Select option...",
    label,
    searchable = false,
    className = "",
    clearable = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [menuStyle, setMenuStyle] = useState(null);
    const containerRef = useRef(null);
    const menuRef = useRef(null);
    const listRef = useRef(null);

    // Memoize normalized options - only recalculate when options change
    const normalizedOptions = useMemo(() => {
        return options.map(opt => {
            if (typeof opt === 'string') return { value: opt, label: opt };
            return opt;
        });
    }, [options]);

    // Memoize selected option lookup - only recalculate when value or options change
    const selectedOption = useMemo(() => {
        return normalizedOptions.find(opt => opt.value === value);
    }, [normalizedOptions, value]);

    // Memoize filtered options - only recalculate when search term or options change
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        const lowerSearch = searchTerm.toLowerCase();
        return normalizedOptions.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch)
        );
    }, [normalizedOptions, searchTerm]);

    // Memoize toggle handler
    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const updateMenuPosition = useCallback(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        setMenuStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            minWidth: Math.max(rect.width, 200),
            zIndex: 9999,
        });
    }, []);

    // Memoize select handler
    const handleSelect = useCallback((val) => {
        onChange?.(val);
        setIsOpen(false);
        setSearchTerm("");
    }, [onChange]);

    // Memoize clear handler
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange?.("");
        setSearchTerm("");
    }, [onChange]);

    // Optimized outside click listener - only active when dropdown is open
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            const clickedTrigger = containerRef.current?.contains(event.target);
            const clickedMenu = menuRef.current?.contains(event.target);
            if (!clickedTrigger && !clickedMenu) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        const closeOnLayoutChange = () => updateMenuPosition();
        window.addEventListener('resize', closeOnLayoutChange);
        window.addEventListener('scroll', closeOnLayoutChange, true);

        return () => {
            window.removeEventListener('resize', closeOnLayoutChange);
            window.removeEventListener('scroll', closeOnLayoutChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    // Focus search when opening
    useEffect(() => {
        if (isOpen && searchable) {
            setTimeout(() => {
                const searchInput = menuRef.current?.querySelector('input');
                searchInput?.focus();
            }, 50);
        }
    }, [isOpen, searchable]);

    const dropdownMenu = isOpen && menuStyle ? (
        <div
            ref={menuRef}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={menuStyle}
        >
            {searchable && (
                <div className="p-2 border-b border-slate-50">
                    <div className="relative">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            className="w-full h-8 pl-9 pr-3 text-[13px] rounded-lg bg-slate-50 border-none outline-none focus:ring-1 focus:ring-customRed/20"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1" ref={listRef}>
                {filteredOptions.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-slate-400 italic text-center">
                        No results found
                    </div>
                ) : (
                    filteredOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={`
                                    px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors
                                    ${isSelected ? 'bg-customRed/5 text-customRed font-semibold' : 'text-slate-600 hover:bg-slate-50'}
                                `}
                            >
                                <span className="truncate">{opt.label}</span>
                                {isSelected && <LuCheck className="h-4 w-4 shrink-0" />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    ) : null;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <div className="text-[12px] text-slate-600 mb-1 ml-1">{label}</div>}

            <div
                onClick={handleToggle}
                className={`
                    w-full h-10 rounded-xl border px-4 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm
                    ${isOpen ? 'border-customRed ring-4 ring-customRed/5 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}
                `}
            >
                <div className={`text-[14px] truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                    {clearable && value && (
                        <LuX
                            onClick={handleClear}
                            className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        />
                    )}
                    <LuChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-customRed' : ''}`} />
                </div>
            </div>

            {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
        </div>
    );
}
