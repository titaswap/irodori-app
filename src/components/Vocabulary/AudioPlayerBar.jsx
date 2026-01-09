
import React from 'react';
import { 
  Layers, SkipBack, Pause, Play, SkipForward, ChevronDown, Repeat
} from 'lucide-react';

const AudioPlayerBar = ({ 
  playbackMode, 
  playbackQueue, 
  currentIndex, 
  vocabList, 
  isPlaying, 
  audioConfig, 
  onPrevTrack, 
  onNextTrack, 
  onTogglePlayPause, 
  onCycleRepeat, 
  onCycleSpeed, 
  onToggleBangla,
  onHide // New Prop
}) => {
  if (playbackMode !== 'playlist' || playbackQueue.length === 0) return null;
  const currentItem = vocabList.find(v => v.localId === playbackQueue[currentIndex]);
  if (!currentItem) return null;

  return (
      <div className="w-full bg-white/95 backdrop-blur-sm border-t border-slate-200 h-20 flex items-center justify-between px-6 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300">
          <div className="flex items-center gap-4 w-1/4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 hidden md:block"><Layers size={24}/></div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-800 truncate">{currentItem.japanese}</div>
                <div className="text-xs text-slate-500 truncate">{currentItem.bangla}</div>
              </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-4">
                  <button onClick={onPrevTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><SkipBack size={20}/></button>
                  <button onClick={onTogglePlayPause} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-md transform active:scale-95 transition-all">{isPlaying ? <Pause size={24} fill="white"/> : <Play size={24} fill="white" className="ml-1"/>}</button>
                  <button onClick={onNextTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><SkipForward size={20}/></button>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{currentIndex + 1} / {playbackQueue.length} • Mode: {audioConfig.repeatMode.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-3 w-1/4 justify-end">
              <button onClick={onToggleBangla} className={`p-2 rounded-lg text-xs font-bold border transition-all ${audioConfig.includeBangla ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`} title="Toggle Bangla TTS">BN</button>
              <div className="relative group">
                  <select 
                      value={audioConfig.repeatPerItem} 
                      onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onCycleRepeat(val); 
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  >
                      {[1, 2, 3, 5, 10, 20, 30, 40, 50, 100].map(n => (
                          <option key={n} value={n}>{n}x</option>
                      ))}
                  </select>
                  <button className={`p-2 rounded-lg flex items-center gap-1 transition-all ${audioConfig.repeatPerItem > 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`} title={`Repeat: ${audioConfig.repeatPerItem}x`}> 
                      <Repeat size={16}/>
                      <span className="text-xs font-bold">{audioConfig.repeatPerItem}x</span>
                  </button>

              </div>
              <button onClick={onCycleSpeed} className="p-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold w-12 hover:bg-slate-200 transition-colors" title="Playback Speed">{audioConfig.speed}x</button>
              
              {/* Hide Button */}
              <button onClick={onHide} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ml-2" title="Hide Player">
                <ChevronDown size={20} />
              </button>
          </div>
      </div>
  );
};

export default AudioPlayerBar;
