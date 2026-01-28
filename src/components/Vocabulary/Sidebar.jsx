import React from 'react';
import { Folder } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu';

const Sidebar = ({ folders, currentFolderId, handleFolderChange, isMobile = false, onClose, user }) => {
  // Handle click on folder/item
  const onNavigate = (id) => {
    handleFolderChange(id);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const SidebarContent = (
    <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-2xl bg-white dark:bg-slate-900' : 'hidden md:flex w-16 lg:w-64 bg-transparent'} flex flex-col h-full flex-shrink-0 transition-all border-r border-slate-200 dark:border-white/5`}>
      <div className={`p-6 flex items-center ${isMobile ? 'justify-between' : 'justify-center lg:justify-start'} gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-slate-300 dark:border-white/5 shrink-0">
            <span className="text-slate-700 dark:text-white font-bold text-xl">あ</span>
          </div>
          <span className={`${isMobile ? 'block' : 'hidden lg:block'} text-xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm`}>IrodoriAI</span>
        </div>

        {/* Mobile Close Button */}
        {isMobile && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
        <p className={`${isMobile ? 'block' : 'hidden lg:block'} text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] px-3 mb-3`}>My Workbooks</p>
        <button onClick={() => onNavigate('root')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${currentFolderId === 'root' ? 'bg-primary/20 text-slate-900 dark:text-white border border-primary/30 shadow-lg shadow-primary/10 reflection-sweep' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/5'}`}>
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 group-hover:neon-glow transition-all">library_books</span>
          <span className={`${isMobile ? 'block' : 'hidden lg:block'} truncate`}>All Books</span>
        </button>
        {folders.filter(f => f.parentId === 'root').map(f => (
          <button key={f.id} onClick={() => onNavigate(f.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${currentFolderId === f.id ? 'bg-primary/20 text-slate-900 dark:text-white border border-primary/30 shadow-lg shadow-primary/10 reflection-sweep' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/5'}`}>
            <span className="material-symbols-outlined text-[20px] flex-shrink-0 group-hover:neon-glow transition-all">menu_book</span>
            <span className={`${isMobile ? 'block' : 'hidden lg:block'} truncate text-left`}>{f.name}</span>
          </button>
        ))}
      </nav>

      {/* User Profile Menu (Bottom) */}
      <UserProfileMenu user={user} isMobile={isMobile} />
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        {SidebarContent}
      </>
    );
  }

  return SidebarContent;
};

export default Sidebar;
