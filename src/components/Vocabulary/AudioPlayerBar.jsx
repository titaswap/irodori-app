
import React from 'react';
import { 
  Layers, SkipBack, Pause, Play, SkipForward, ChevronDown, Repeat, Star
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
  onHide,
  onToggleMark 
}) => {
  if (playbackMode !== 'playlist' || playbackQueue.length === 0) return null;
  const currentItem = vocabList.find(v => v.localId === playbackQueue[currentIndex]);
  if (!currentItem) return null;

  return (
      <div className="w-full bg-white/95 backdrop-blur-sm border-t border-slate-200 h-12 flex items-center justify-between px-3 md:px-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300">
          <div className="flex items-center gap-2 w-1/4 min-w-0">
              <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600 hidden md:block shrink-0"><Layers size={18}/></div>
              <div className="overflow-hidden flex flex-col justify-center">
                <div className="font-bold text-slate-800 truncate text-sm leading-tight">{currentItem.japanese}</div>
                <div className="text-[10px] text-slate-500 truncate leading-tight">{currentItem.bangla}</div>
              </div>
          </div>
          <div className="flex items-center justify-center gap-2 flex-1">
              <button onClick={onPrevTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><SkipBack size={18}/></button>
              
              <button onClick={onTogglePlayPause} className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full shadow-sm transform active:scale-95 transition-all ${isPlaying ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {isPlaying ? <Pause size={18} fill="white"/> : <Play size={18} fill="white" className="ml-0.5"/>}
              </button>

              <button onClick={onNextTrack} className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><SkipForward size={18}/></button>

              <button 
                  onClick={() => onToggleMark(currentItem.id || currentItem.localId)} 
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors order-last outline-none ${currentItem.isMarked ? 'text-amber-400 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
                  title={currentItem.isMarked ? "Unmark" : "Mark"}
              >
                  <Star size={18} fill={currentItem.isMarked ? "currentColor" : "none"} />
              </button>
              <div className="hidden md:block text-[9px] text-slate-400 font-mono tracking-widest uppercase ml-2">{currentIndex + 1} / {playbackQueue.length} • {audioConfig.repeatMode.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-2 w-1/4 justify-end min-w-0">
              <button onClick={onToggleBangla} className={`px-2 py-1 rounded-[6px] text-[10px] font-bold border transition-all ${audioConfig.includeBangla ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`} title="Bangla">BN</button>
              <div className="relative group shrink-0">
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
                  <button className={`px-2 py-1 rounded-[6px] flex items-center gap-1 transition-all ${audioConfig.repeatPerItem > 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`} title={`Repeat: ${audioConfig.repeatPerItem}x`}> 
                      <Repeat size={14}/>
                      <span className="text-[10px] font-bold">{audioConfig.repeatPerItem}x</span>
                  </button>

              </div>
              <button onClick={onCycleSpeed} className="px-2 py-1 rounded-[6px] bg-slate-100 text-slate-500 text-[10px] font-bold w-10 hover:bg-slate-200 transition-colors" title="Speed">{audioConfig.speed}x</button>
              
              <button onClick={onHide} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ml-1" title="Hide">
                <ChevronDown size={18} />
              </button>
          </div>
      </div>
  );
};

export default AudioPlayerBar;
