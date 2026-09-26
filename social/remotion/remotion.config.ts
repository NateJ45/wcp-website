// Remotion CLI config. Media never lives in this repo: the public dir is an
// external folder written by the reel's export_assets.py. Pass
// `--public-dir "<folder>"` on the command line (it overrides this), or set
// WCP_REEL_PUBLIC. The default points at the One Pump pilot's export.
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setPublicDir(process.env.WCP_REEL_PUBLIC ?? 'C:/Users/natha/Videos/WCP Reels/2026-09-25-one-pump-remotion/public');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCrf(17); // matches reelkit.render
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709'); // limited-range bt709, what platforms expect
Config.setAudioCodec('aac');
Config.setOverwriteOutput(true);
