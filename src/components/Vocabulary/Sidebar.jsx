import React from 'react';
import { Folder } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu';

const Sidebar = ({ folders, currentFolderId, handleFolderChange, isMobile = false, user }) => {
  return (
    <div className={`${isMobile ? 'w-full' : 'w-16 lg:w-64'} bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 transition-all`}>
      <div className={`p-4 h-16 border-b border-slate-800 flex items-center ${isMobile ? 'justify-start' : 'justify-center lg:justify-start'} gap-3`}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg text-white flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">あ</div>
        <span className={`${isMobile ? 'block' : 'hidden lg:block'} font-bold text-white text-lg`}>Irodori<span className="text-indigo-400">AI</span></span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        <div className={`${isMobile ? 'block' : 'hidden lg:block'} px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2`}>My Workbooks</div>
        <button onClick={() => handleFolderChange('root')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${currentFolderId === 'root' ? 'bg-slate-800 text-white border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Folder size={20} className="flex-shrink-0" />
          <span className={`${isMobile ? 'block' : 'hidden lg:block'}`}>All Books</span>
        </button>
        {folders.filter(f => f.parentId === 'root').map(f => (
          <div key={f.id} className="group relative">
            <button onClick={() => handleFolderChange(f.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${currentFolderId === f.id ? 'bg-slate-800 text-white border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Folder size={20} className={`flex-shrink-0 ${currentFolderId === f.id ? 'text-yellow-400 fill-yellow-400' : ''}`} />
              <span className={`${isMobile ? 'block' : 'hidden lg:block'}`}>{f.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* User Profile Menu (Bottom) */}
      <UserProfileMenu user={user} isMobile={isMobile} />
    </div>
  );
};

export default Sidebar;
