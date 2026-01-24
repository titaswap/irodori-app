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
        <div className="relative p-4 mt-auto border-t border-slate-800" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 w-full p-2 rounded-full hover:bg-slate-800 transition-colors ${isOpen ? 'bg-slate-800' : ''}`}
                title={user.email}
            >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-700 flex items-center justify-center shrink-0">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-slate-300 font-bold text-sm">
                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info (Visible on Mobile or Expanded Desktop if we had one, but strict req says "Avatar... click... popup") 
                    Actually, Gmail style usually shows email/name on hover or inside the popup.
                    For this sidebar, keeping it minimal (Avatar only on collapsed desktop?) 
                    The current sidebar is fixed width w-16 or w-64.
                */}
                <div className={`flex-1 text-left overflow-hidden ${isMobile ? 'block' : 'hidden lg:block'}`}>
                    <div className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                </div>
            </button>

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
