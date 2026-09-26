"""beats.py -- beat/tempo detection for syncing reel cuts to music.

API:
    beats(audio_path) -> (tempo, [beat_times])
        audio_path: path to any audio/video file ffmpeg can decode.
        Returns (tempo_bpm: float, beat_times: list[float] seconds).
        Uses librosa's beat tracker when librosa is importable; otherwise
        falls back to a numpy/scipy onset-envelope autocorrelation.

    snap(t, beat_times) -> float
        Returns the beat time in `beat_times` nearest to `t`.

CLI:
    python beats.py <audio_or_video_path>
        Prints the detected tempo and the first 20 beat times.

Requires: librosa (`pip install librosa`) for the primary path, or numpy +
scipy (already required elsewhere in reelkit) for the fallback. Uses
imageio_ffmpeg's bundled ffmpeg to decode audio from any container.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np


def _ffmpeg_exe():
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def _load_audio(path, sr=22050):
    """Decode any audio/video file to a mono float32 waveform at `sr` Hz."""
    path = str(path)
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = Path(tmp) / "audio.wav"
        cmd = [
            _ffmpeg_exe(),
            "-y",
            "-i",
            path,
            "-ac",
            "1",
            "-ar",
            str(sr),
            "-vn",
            str(wav_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        import soundfile as sf

        y, file_sr = sf.read(str(wav_path), dtype="float32")
        if file_sr != sr:
            # shouldn't happen since ffmpeg resampled, but be safe
            sr = file_sr
        return y, sr


def _beats_librosa(path):
    import librosa

    # librosa 1.x's default loader (soundfile) can't decode most video
    # containers, so decode to WAV via ffmpeg first (this also covers
    # formats soundfile itself can't read, like some MOV/MP4 audio codecs).
    y, sr = _load_audio(path, sr=22050)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    tempo_val = float(tempo) if np.ndim(tempo) == 0 else float(tempo[0])
    return tempo_val, [float(t) for t in beat_times]


def _onset_envelope(y, sr, hop_length=512):
    from scipy.signal import stft

    n_fft = 2048
    f, t, Z = stft(y, fs=sr, nperseg=n_fft, noverlap=n_fft - hop_length)
    mag = np.abs(Z)
    flux = np.diff(mag, axis=1)
    flux[flux < 0] = 0
    env = flux.sum(axis=0)
    env = np.concatenate([[0.0], env])
    if env.max() > 0:
        env = env / env.max()
    frame_times = t
    return env, frame_times, hop_length


def _beats_fallback(path):
    """Onset-envelope autocorrelation fallback (no librosa)."""
    y, sr = _load_audio(path, sr=22050)
    env, frame_times, hop_length = _onset_envelope(y, sr)

    # Autocorrelation over plausible tempo range (60-200 BPM).
    frame_rate = sr / hop_length
    min_lag = int(frame_rate * 60 / 200)
    max_lag = int(frame_rate * 60 / 60)
    env_centered = env - env.mean()
    ac = np.correlate(env_centered, env_centered, mode="full")
    mid = len(ac) // 2
    ac = ac[mid:]
    search = ac[min_lag:max_lag]
    if len(search) == 0:
        return 0.0, []
    best_lag = min_lag + int(np.argmax(search))
    tempo = 60.0 * frame_rate / best_lag

    # Peak-pick the onset envelope to get beat candidate frames, then snap
    # them onto a grid at the detected tempo starting from the strongest
    # early peak.
    from scipy.signal import find_peaks

    peaks, _ = find_peaks(env, distance=max(1, int(frame_rate * 60 / 300)))
    if len(peaks) == 0:
        return tempo, []
    period = frame_rate * 60 / tempo
    start_frame = peaks[0]
    n_beats = int((len(env) - start_frame) / period) + 1
    beat_frames = [start_frame + i * period for i in range(max(0, n_beats))]
    beat_times = [float(np.interp(bf, np.arange(len(frame_times)), frame_times)) for bf in beat_frames]
    return float(tempo), beat_times


def beats(audio_path):
    """Return (tempo_bpm, [beat_times_seconds])."""
    try:
        return _beats_librosa(audio_path)
    except ImportError:
        return _beats_fallback(audio_path)


def snap(t, beat_times):
    """Return the beat time nearest to `t`."""
    if not beat_times:
        return t
    arr = np.asarray(beat_times)
    idx = int(np.argmin(np.abs(arr - t)))
    return float(arr[idx])


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python beats.py <audio_or_video_path>")
        sys.exit(1)
    tempo, beat_times = beats(sys.argv[1])
    print(f"tempo: {tempo:.2f} BPM")
    print(f"first {min(20, len(beat_times))} beats (of {len(beat_times)}):")
    for t in beat_times[:20]:
        print(f"  {t:.3f}s")
