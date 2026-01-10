import React from 'react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { Download, X, AlertTriangle } from 'lucide-react';

const UpdateNotification = () => {
    const { updateAvailable, force, message, storeUrl, version } = useUpdateCheck();
    const [dismissed, setDismissed] = React.useState(false);

    if (!updateAvailable) return null;
    if (dismissed && !force) return null;

    const handleUpdate = () => {
        // Content-only update: Strictly reload to fetch fresh assets
        // We ignore storeUrl to prevent "Cannot handle this link" errors on Android
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 pointer-events-none">
            {/* Backdrop: Darker and strictly blocking for forced updates */}
            {force && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md pointer-events-auto" />
            )}
            
            {!force && (
                <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={() => setDismissed(true)} />
            )}

            <div className={`
                relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden pointer-events-auto
                animate-in slide-in-from-bottom-4 duration-300
                ${force ? 'scale-105 ring-4 ring-red-500/20' : 'border border-slate-200'}
            `}>
                {/* Header */}
                <div className={`${force ? 'bg-red-600' : 'bg-indigo-600'} px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            {force ? <AlertTriangle className="text-white" size={20} /> : <Download className="text-white" size={20} />}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-none">
                                {force ? 'Critical Update Required' : 'Update Available'}
                            </h3>
                            <p className={`${force ? 'text-red-100' : 'text-indigo-200'} text-xs mt-1`}>Version {version}</p>
                        </div>
                    </div>
                    {!force && (
                        <button 
                            onClick={() => setDismissed(true)}
                            className="text-white/70 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                        {message || "A new version of the application is available. Please update to continue ensuring the best experience."}
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={handleUpdate}
                            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-lg transition-all active:scale-95 text-sm
                                ${force 
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                                }`}
                        >
                            {force ? 'Update Now' : 'Reload to Update'}
                        </button>

                        {!force && (
                            <button 
                                onClick={() => setDismissed(true)}
                                className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                            >
                                Not now
                            </button>
                        )}
                    </div>
                    
                    {force && (
                         <div className="flex items-start gap-2 mt-6 p-3 bg-red-50 rounded text-xs text-red-600 border border-red-100">
                            <AlertTriangle size={14} className="min-w-[14px] mt-0.5"/>
                            <p>This update includes critical security or feature changes. You cannot continue using the app without updating.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateNotification;
