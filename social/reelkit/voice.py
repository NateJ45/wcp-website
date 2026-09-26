"""voice.py -- local offline TTS narration for reels.

API:
    say(text, out_wav, voice="en_US-lessac-medium", rate=1.0) -> float
        Synthesizes `text` to a mono WAV file at `out_wav` using a local
        Piper voice model (downloaded on first use to
        %LOCALAPPDATA%/wcp-reelkit/models/piper). `rate` is a speed
        multiplier: 1.0 is normal, >1.0 is faster, <1.0 is slower.
        Returns the resulting clip duration in seconds.

CLI:
    python voice.py "Some narration text" out.wav [voice] [rate]

Requires: piper-tts (`pip install piper-tts`). Falls back to kokoro-onnx
(`pip install kokoro-onnx`) if Piper cannot be imported or its voice model
cannot be loaded/downloaded.
"""
from __future__ import annotations

import os
import sys
import wave
from pathlib import Path

_MODEL_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "wcp-reelkit" / "models" / "piper"

_voice_cache = {}


def _piper_voice(voice_name):
    if voice_name in _voice_cache:
        return _voice_cache[voice_name]
    try:
        from piper import PiperVoice
        from piper.download_voices import download_voice
    except ImportError as exc:
        raise ImportError(
            "piper-tts is required for narration: pip install piper-tts"
        ) from exc

    _MODEL_DIR.mkdir(parents=True, exist_ok=True)
    onnx_path = _MODEL_DIR / f"{voice_name}.onnx"
    if not onnx_path.exists():
        print(f"voice.py: downloading Piper voice '{voice_name}' ...")
        download_voice(voice_name, _MODEL_DIR)

    pv = PiperVoice.load(str(onnx_path))
    _voice_cache[voice_name] = pv
    return pv


def _say_piper(text, out_wav, voice, rate):
    from piper.config import SynthesisConfig

    pv = _piper_voice(voice)
    # Piper's length_scale is inversely proportional to speed: bigger
    # length_scale = slower speech. rate is speed, so invert it.
    syn_config = SynthesisConfig(length_scale=1.0 / max(rate, 1e-3))

    out_wav = Path(out_wav)
    out_wav.parent.mkdir(parents=True, exist_ok=True)

    with wave.open(str(out_wav), "wb") as wav_file:
        sample_rate = None
        sample_width = None
        channels = None
        total_frames = 0
        for chunk in pv.synthesize(text, syn_config=syn_config):
            if sample_rate is None:
                sample_rate = chunk.sample_rate
                sample_width = chunk.sample_width
                channels = chunk.sample_channels
                wav_file.setnchannels(channels)
                wav_file.setsampwidth(sample_width)
                wav_file.setframerate(sample_rate)
            audio_bytes = chunk.audio_int16_bytes
            wav_file.writeframes(audio_bytes)
            total_frames += len(audio_bytes) // (sample_width * channels)

        if sample_rate is None:
            # No audio produced (empty text) -- write a tiny silent file.
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(22050)
            sample_rate = 22050
            total_frames = 0

    return total_frames / sample_rate


def _say_kokoro(text, out_wav, voice, rate):
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    model_dir = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "wcp-reelkit" / "models" / "kokoro"
    model_path = model_dir / "kokoro-v0_19.onnx"
    voices_path = model_dir / "voices.json"
    if not model_path.exists() or not voices_path.exists():
        raise ImportError(
            "kokoro-onnx requires manually downloaded model files "
            f"(kokoro-v0_19.onnx, voices.json) in {model_dir}. "
            "See https://github.com/thewh1teagle/kokoro-onnx for download links."
        )

    kokoro = Kokoro(str(model_path), str(voices_path))
    samples, sample_rate = kokoro.create(text, voice="af_sarah", speed=rate, lang="en-us")
    out_wav = Path(out_wav)
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out_wav), samples, sample_rate)
    return len(samples) / sample_rate


def say(text, out_wav, voice="en_US-lessac-medium", rate=1.0):
    """Synthesize `text` to `out_wav`, returning duration in seconds."""
    try:
        return _say_piper(text, out_wav, voice, rate)
    except ImportError as exc:
        print(f"voice.py: Piper unavailable ({exc}); trying kokoro-onnx fallback")
        return _say_kokoro(text, out_wav, voice, rate)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('usage: python voice.py "text" out.wav [voice] [rate]')
        sys.exit(1)
    text_arg = sys.argv[1]
    out_arg = sys.argv[2]
    voice_arg = sys.argv[3] if len(sys.argv) > 3 else "en_US-lessac-medium"
    rate_arg = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    duration = say(text_arg, out_arg, voice=voice_arg, rate=rate_arg)
    print(f"wrote {out_arg}: {duration:.2f}s")
