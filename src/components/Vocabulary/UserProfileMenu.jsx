import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const UserProfileMenu = ({ user, isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // App.jsx listener will handle redirect
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 border-t border-white/5" ref={menuRef}>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 glass-card">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 w-full text-left"
                    title={user.email}
                >
                    <div className="w-10 h-10 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center text-primary-glow font-bold shadow-inner shrink-0">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span className="text-lg">{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    <div className={`flex-1 min-w-0 ${isMobile ? 'block' : 'hidden lg:block'}`}>
                        <p className="text-sm font-semibold truncate text-slate-100">{user.displayName || 'User'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                </button>
            </div>

            {/* Popup Menu */}
            {isOpen && (
                <div
                    className="absolute bottom-full left-4 mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 origin-bottom-left border border-slate-200 dark:border-slate-700"
                    style={{ left: isMobile ? '16px' : '64px', bottom: '16px' }}
                >
                    {/* Header in Popup (Gmail style shows detailed info inside) */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-200 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfileMenu;
