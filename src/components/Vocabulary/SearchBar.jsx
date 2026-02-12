import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchTerm, onSearch, placeholder = "Search..." }) => {
    const [inputValue, setInputValue] = useState(searchTerm || '');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Sync local state with prop
    useEffect(() => {
        setInputValue(searchTerm || '');
    }, [searchTerm]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== searchTerm) {
                onSearch(inputValue);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [inputValue, onSearch, searchTerm]);

    const handleClear = () => {
        setInputValue('');
        onSearch('');
        if (inputRef.current) inputRef.current.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleClear();
            if (inputRef.current) inputRef.current.blur();
        }
    };

    return (
        <div className={`relative transition-all duration-200 ${isFocused ? 'flex-1' : 'w-full md:w-64'}`}>
            <div className={`flex items-center bg-white dark:bg-slate-800 border rounded-full px-3 py-1.5 transition-colors ${isFocused
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}>
                <Search size={16} className={`mr-2 transition-colors ${isFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="bg-transparent border-none outline-none w-full text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                />
                {inputValue && (
                    <button
                        onClick={handleClear}
                        className="ml-1 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
