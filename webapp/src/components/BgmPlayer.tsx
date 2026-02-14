import { useBgmPlayer } from '../hooks/useBgmPlayer';
import './BgmPlayer.css';

export function BgmPlayer() {
  const {
    isPlaying,
    volume,
    currentTrack,
    expanded,
    togglePlay,
    nextTrack,
    prevTrack,
    changeVolume,
    toggleExpanded,
  } = useBgmPlayer();

  return (
    <div className="bgm-player">
      <div className={`bgm-panel ${expanded ? 'open' : ''}`}>
        <div className="bgm-track-info">
          <div className="bgm-track-name">
            {currentTrack?.title ?? 'No track'}
          </div>
          <div className="bgm-track-artist">
            {currentTrack?.artist ?? ''}
          </div>
        </div>
        <div className="bgm-controls">
          <button className="bgm-btn" onClick={prevTrack} title="前の曲">
            ⏮
          </button>
          <button
            className="bgm-btn bgm-btn-play"
            onClick={togglePlay}
            title={isPlaying ? '一時停止' : '再生'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="bgm-btn" onClick={nextTrack} title="次の曲">
            ⏭
          </button>
        </div>
        <div className="bgm-volume-row">
          <span className="bgm-volume-icon">🔊</span>
          <input
            type="range"
            className="bgm-volume-slider"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        className={`bgm-toggle ${isPlaying ? 'active' : ''}`}
        onClick={toggleExpanded}
        title="BGM"
      >
        ♪
      </button>
    </div>
  );
}
