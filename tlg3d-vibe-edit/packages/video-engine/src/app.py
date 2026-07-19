# ============================================================
#  CutFlow — Python Video Engine (Flask)
#  Full video processing API with FFmpeg.
#  All operations preserve audio tracks.
# ============================================================

from flask       import Flask, request, jsonify, send_file
from flask_cors  import CORS
import os, json, subprocess, shutil, tempfile, uuid
from pathlib     import Path
from datetime    import datetime

app     = Flask(__name__)
CORS(app)

DATA_DIR = os.getenv('DATA_DIR', './data/users')
TEMP_DIR = os.getenv('TEMP_DIR', './tmp')
FFMPEG   = os.getenv('FFMPEG_PATH',  'ffmpeg')
FFPROBE  = os.getenv('FFPROBE_PATH', 'ffprobe')

Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
Path(TEMP_DIR).mkdir(parents=True, exist_ok=True)


# ── Helpers ──────────────────────────────────────────────────

def user_dir(user_id: str) -> Path:
    d = Path(DATA_DIR) / f"user_{user_id}"
    d.mkdir(parents=True, exist_ok=True)
    return d

def tmp_path(ext='mp4') -> str:
    return str(Path(TEMP_DIR) / f"{uuid.uuid4().hex}.{ext}")

def probe(video_path: str) -> dict:
    cmd = [FFPROBE, '-v', 'error', '-print_format', 'json',
           '-show_streams', '-show_format', video_path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return {}
    data     = json.loads(r.stdout)
    streams  = data.get('streams', [])
    fmt      = data.get('format',  {})
    vstream  = next((s for s in streams if s.get('codec_type') == 'video'), {})
    astream  = next((s for s in streams if s.get('codec_type') == 'audio'), {})
    return {
        'duration_secs': float(fmt.get('duration', 0)),
        'width':         int(vstream.get('width',        0)),
        'height':        int(vstream.get('height',       0)),
        'fps':           eval(vstream.get('r_frame_rate', '30/1')),
        'codec':         vstream.get('codec_name', ''),
        'has_audio':     bool(astream),
        'audio_codec':   astream.get('codec_name', ''),
        'sample_rate':   int(astream.get('sample_rate', 0)),
        'channels':      int(astream.get('channels',    0)),
        'size_mb':       round(int(fmt.get('size', 0)) / 1024 / 1024, 2),
    }

def run_ffmpeg(*args) -> tuple:
    """Run ffmpeg command; return (success, stderr)."""
    cmd = [FFMPEG, '-hide_banner', '-loglevel', 'error'] + list(args) + ['-y']
    r   = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0, r.stderr


# ── Health ────────────────────────────────────────────────────

@app.route('/health')
def health():
    ffmpeg_ok  = shutil.which(FFMPEG)  is not None
    ffprobe_ok = shutil.which(FFPROBE) is not None
    return jsonify({
        'status':         'ok',
        'service':        'CutFlow Video Engine',
        'ffmpeg_found':   ffmpeg_ok,
        'ffprobe_found':  ffprobe_ok,
        'data_dir':       DATA_DIR,
    })


# ── Probe ─────────────────────────────────────────────────────

@app.route('/api/video/probe', methods=['POST'])
def probe_video():
    data  = request.json or {}
    vpath = data.get('video_path') or data.get('input_video')
    if not vpath or not os.path.exists(vpath):
        return jsonify({'error': 'File not found'}), 404
    return jsonify(probe(vpath))


# ── Transition ────────────────────────────────────────────────

TRANSITION_FILTERS = {
    'fade':     lambda d: f'fade=t=in:d={d}',
    'fade_out': lambda d: f'fade=t=out:d={d}',
    'slide':    lambda d: f'zoompan=z=\'min(zoom+0.0015,1.5)\':d={int(d*25)}:s=hd1080',
    'dissolve': lambda d: f'fade=t=in:d={d}:alpha=1',
    'zoom':     lambda d: f'zoompan=z=\'zoom+0.001\':d={int(d*25)}',
    'wipe':     lambda d: f'crop=iw*t/{d}:ih:0:0',
}

@app.route('/api/video/transition', methods=['POST'])
def apply_transition():
    data     = request.json or {}
    user_id  = data.get('user_id', 'unknown')
    inp      = data.get('input_video')
    trans    = data.get('transition_type', 'fade')
    duration = float(data.get('duration', 1.0))

    if not inp or not os.path.exists(inp):
        return jsonify({'error': 'input_video not found'}), 400

    out    = str(user_dir(user_id) / f'transition_{uuid.uuid4().hex}.mp4')
    filt   = TRANSITION_FILTERS.get(trans, TRANSITION_FILTERS['fade'])(duration)
    ok, err = run_ffmpeg('-i', inp, '-vf', filt,
                         '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
                         '-c:a', 'copy', out)

    if not ok:
        return jsonify({'error': err}), 500
    return jsonify({'output_video': out, 'transition': trans, 'duration': duration})


# ── Color Grade ───────────────────────────────────────────────

COLOR_FILTERS = {
    'neutral':   'eq=saturation=1.0:contrast=1.0',
    'warm':      'colorbalance=rs=0.15:gs=0.05:bs=-0.1,eq=saturation=1.1',
    'cool':      'colorbalance=rs=-0.1:gs=0:bs=0.15,eq=saturation=0.95',
    'cinematic': "curves=r='0/0 0.25/0.22 0.75/0.8 1/1':g='0/0 0.5/0.48 1/1':b='0/0.05 1/0.95',eq=contrast=1.1:saturation=1.15",
    'vintage':   'hue=h=10:s=0.8,curves=r=\'0/0.05 1/0.95\':b=\'0/0 1/0.85\',vignette',
    'vivid':     'eq=saturation=1.4:contrast=1.1:brightness=0.02',
    'bw':        'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
    'matte':     "curves=all='0/0.1 0.5/0.5 1/0.9'",
    'horror':    'colorchannelmixer=1.2:0:0:0:0:0.8:0:0:0:0:0.5:0,vignette',
    'summer':    'hue=h=5:s=1.2,colorbalance=rs=0.1:bs=-0.05,eq=brightness=0.03',
    'fade':      "curves=all='0/0.1 0.5/0.5 1/0.9'",
}

@app.route('/api/video/color-grade', methods=['POST'])
def color_grade():
    data    = request.json or {}
    user_id = data.get('user_id', 'unknown')
    inp     = data.get('input_video')
    preset  = data.get('preset', 'neutral')

    if not inp or not os.path.exists(inp):
        return jsonify({'error': 'input_video not found'}), 400

    out     = str(user_dir(user_id) / f'graded_{preset}_{uuid.uuid4().hex}.mp4')
    filt    = COLOR_FILTERS.get(preset, COLOR_FILTERS['neutral'])
    ok, err = run_ffmpeg('-i', inp, '-vf', filt,
                         '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
                         '-c:a', 'copy', out)

    if not ok:
        return jsonify({'error': err}), 500
    return jsonify({'output_video': out, 'preset': preset})


# ── Scene Detection ───────────────────────────────────────────

@app.route('/api/video/detect-scenes', methods=['POST'])
def detect_scenes():
    data      = request.json or {}
    user_id   = data.get('user_id', 'unknown')
    inp       = data.get('input_video')
    threshold = float(data.get('threshold', 0.3))

    if not inp or not os.path.exists(inp):
        return jsonify({'error': 'input_video not found'}), 400

    cmd = [FFMPEG, '-i', inp,
           '-vf', f"select='gt(scene\\,{threshold})',showinfo",
           '-f', 'null', '-']
    r   = subprocess.run(cmd, capture_output=True, text=True)
    output = r.stderr

    timestamps = []
    for line in output.split('\n'):
        if 'pts_time:' in line:
            m = line.split('pts_time:')
            if len(m) > 1:
                try:
                    timestamps.append(float(m[1].split()[0]))
                except:
                    pass

    # Get duration
    info     = probe(inp)
    duration = info.get('duration_secs', 0)

    # Build scene segments
    scene_ts = [0.0] + timestamps + [duration]
    scenes   = [{'start': scene_ts[i], 'end': scene_ts[i+1], 'duration': scene_ts[i+1] - scene_ts[i]}
                for i in range(len(scene_ts) - 1)]

    return jsonify({'scenes': scenes, 'total_scenes': len(scenes), 'duration': duration})


# ── Concatenate ───────────────────────────────────────────────

@app.route('/api/video/concatenate', methods=['POST'])
def concatenate():
    data      = request.json or {}
    user_id   = data.get('user_id', 'unknown')
    video_list= data.get('video_list', [])

    if not video_list:
        return jsonify({'error': 'video_list is empty'}), 400

    # Verify all files exist
    for vp in video_list:
        if not os.path.exists(vp):
            return jsonify({'error': f'File not found: {vp}'}), 400

    concat_file = tmp_path('txt')
    with open(concat_file, 'w') as f:
        for vp in video_list:
            f.write(f"file '{vp}'\n")

    out     = str(user_dir(user_id) / f'concat_{uuid.uuid4().hex}.mp4')
    ok, err = run_ffmpeg('-f', 'concat', '-safe', '0', '-i', concat_file,
                         '-c', 'copy', out)
    os.unlink(concat_file)

    if not ok:
        return jsonify({'error': err}), 500
    return jsonify({'output_video': out, 'clips_merged': len(video_list)})


# ── Extract Audio ─────────────────────────────────────────────

@app.route('/api/video/extract-audio', methods=['POST'])
def extract_audio():
    data    = request.json or {}
    user_id = data.get('user_id', 'unknown')
    inp     = data.get('input_video')
    fmt     = data.get('format', 'mp3')

    if not inp or not os.path.exists(inp):
        return jsonify({'error': 'input_video not found'}), 400

    info = probe(inp)
    if not info.get('has_audio'):
        return jsonify({'error': 'Video has no audio track', 'has_audio': False}), 400

    out     = str(user_dir(user_id) / f'audio_{uuid.uuid4().hex}.{fmt}')
    codec   = {'mp3': 'libmp3lame', 'aac': 'aac', 'wav': 'pcm_s16le'}.get(fmt, 'libmp3lame')
    quality = '-q:a 2' if fmt == 'mp3' else '-b:a 192k'
    ok, err = run_ffmpeg('-i', inp, '-vn', '-acodec', codec, *quality.split(), out)

    if not ok:
        return jsonify({'error': err}), 500
    return jsonify({'output_audio': out, 'format': fmt, 'source_audio_codec': info.get('audio_codec')})


# ── Mix Background Music ──────────────────────────────────────

@app.route('/api/video/mix-audio', methods=['POST'])
def mix_audio():
    data             = request.json or {}
    user_id          = data.get('user_id', 'unknown')
    video_path       = data.get('video_path')
    music_path       = data.get('music_path')
    background_vol   = float(data.get('background_volume', 0.3))
    original_vol     = float(data.get('original_volume', 1.0))
    fade_in          = int(data.get('fade_in', 2))
    fade_out         = int(data.get('fade_out', 3))
    ducking          = data.get('ducking_enabled', True)
    duck_level       = float(data.get('ducking_level', 0.15))
    loop_music       = data.get('loop', True)
    normalize        = data.get('normalize', True)

    for p, name in [(video_path, 'video_path'), (music_path, 'music_path')]:
        if not p or not os.path.exists(p):
            return jsonify({'error': f'{name} not found'}), 400

    out          = str(user_dir(user_id) / f'mixed_{uuid.uuid4().hex}.mp4')
    loop_flag    = ['-stream_loop', '-1'] if loop_music else []
    fade_filters = ''
    if fade_in  > 0: fade_filters += f',afade=t=in:st=0:d={fade_in}'
    if fade_out > 0: fade_filters += f',afade=t=out:st=-{fade_out}:d={fade_out}'

    if ducking:
        fc = (
            f'[0:a]volume={original_vol}[orig];'
            f'[1:a]volume={background_vol}{fade_filters}[bgm];'
            f'[bgm][orig]sidechaincompress=threshold=0.015:ratio=4:release=200:level_sc={duck_level}[bgm_d];'
            f'[orig][bgm_d]amix=inputs=2:duration=first:dropout_transition=2[out]'
        )
    else:
        fc = (
            f'[0:a]volume={original_vol}[orig];'
            f'[1:a]volume={background_vol}{fade_filters}[bgm];'
            f'[orig][bgm]amix=inputs=2:duration=first:dropout_transition=2[out]'
        )

    if normalize:
        fc += ';[out]loudnorm=I=-23:LRA=7:TP=-2[final]'
    out_map = '[final]' if normalize else '[out]'

    cmd = [FFMPEG, '-hide_banner', '-loglevel', 'error',
           '-i', video_path] + loop_flag + ['-i', music_path,
           '-filter_complex', fc,
           '-map', '0:v:0', '-map', out_map,
           '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out, '-y']

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return jsonify({'error': r.stderr}), 500
    return jsonify({'output_video': out})


# ── Render Project ────────────────────────────────────────────

@app.route('/api/video/render', methods=['POST'])
def render_project():
    data        = request.json or {}
    user_id     = data.get('user_id', 'unknown')
    project_id  = data.get('project_id', 'unknown')
    clips       = data.get('clips', [])
    resolution  = data.get('resolution', '1080p')
    output_path = data.get('output_path')

    res_map = {
        '720p':  '1280:720',
        '1080p': '1920:1080',
        '1440p': '2560:1440',
        '4k':    '3840:2160',
    }
    scale = res_map.get(resolution, '1920:1080')

    video_clips = [c for c in clips if c.get('type') == 'video' and not c.get('muted', False)]
    if not video_clips:
        return jsonify({'error': 'No video clips to render'}), 400

    udir = user_dir(user_id)
    if not output_path:
        output_path = str(udir / f'render_{project_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.mp4')

    # Build concat file from clip paths
    concat_file = tmp_path('txt')
    valid_clips = [c for c in video_clips if os.path.exists(c.get('path', ''))]
    if not valid_clips:
        return jsonify({'error': 'No valid clip paths found'}), 400

    with open(concat_file, 'w') as f:
        for clip in valid_clips:
            f.write(f"file '{clip['path']}'\n")

    raw_concat = tmp_path('mp4')
    ok, err = run_ffmpeg('-f', 'concat', '-safe', '0', '-i', concat_file,
                         '-c', 'copy', raw_concat)
    os.unlink(concat_file)

    if not ok:
        return jsonify({'error': f'Concat failed: {err}'}), 500

    # Scale to target resolution
    ok, err = run_ffmpeg('-i', raw_concat,
                         '-vf', f'scale={scale}:flags=lanczos',
                         '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                         '-c:a', 'aac', '-b:a', '192k', output_path)

    try:
        os.unlink(raw_concat)
    except:
        pass

    if not ok:
        return jsonify({'error': f'Render failed: {err}'}), 500

    size_mb = round(os.path.getsize(output_path) / 1024 / 1024, 2)
    return jsonify({
        'success':     True,
        'output_path': output_path,
        'resolution':  resolution,
        'size_mb':     size_mb,
    })


# ── Normalize Audio ───────────────────────────────────────────

@app.route('/api/video/normalize', methods=['POST'])
def normalize_audio():
    data    = request.json or {}
    user_id = data.get('user_id', 'unknown')
    inp     = data.get('input_video')
    target  = int(data.get('target_lufs', -23))

    if not inp or not os.path.exists(inp):
        return jsonify({'error': 'input_video not found'}), 400

    out     = str(user_dir(user_id) / f'normalized_{uuid.uuid4().hex}.mp4')
    ok, err = run_ffmpeg('-i', inp,
                         '-af', f'loudnorm=I={target}:LRA=7:TP=-2',
                         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out)

    if not ok:
        return jsonify({'error': err}), 500
    return jsonify({'output_video': out, 'target_lufs': target})


# ── Add SFX Overlay ───────────────────────────────────────────

@app.route('/api/video/add-sfx', methods=['POST'])
def add_sfx():
    data       = request.json or {}
    user_id    = data.get('user_id', 'unknown')
    video_path = data.get('video_path')
    sfx_tracks = data.get('sfx_tracks', [])   # [{sfx_path, start_time, volume}]

    if not video_path or not os.path.exists(video_path):
        return jsonify({'error': 'video_path not found'}), 400
    if not sfx_tracks:
        return jsonify({'error': 'No sfx_tracks provided'}), 400

    out      = str(user_dir(user_id) / f'sfx_{uuid.uuid4().hex}.mp4')
    inputs   = ['-i', video_path]
    filters  = ['[0:a]volume=1.0[orig]']

    for i, sfx in enumerate(sfx_tracks):
        sfx_path  = sfx.get('sfx_path', '')
        start_ms  = int(float(sfx.get('start_time', 0)) * 1000)
        volume    = float(sfx.get('volume', 0.8))
        if not os.path.exists(sfx_path):
            continue
        inputs   += ['-i', sfx_path]
        filters.append(f'[{i+1}:a]volume={volume},adelay={start_ms}|{start_ms}[sfx{i}]')

    n_sfx   = len(sfx_tracks)
    streams = '[orig]' + ''.join(f'[sfx{i}]' for i in range(n_sfx))
    filters.append(f'{streams}amix=inputs={n_sfx+1}:duration=first[mixed]')

    cmd = ([FFMPEG, '-hide_banner', '-loglevel', 'error']
           + inputs
           + ['-filter_complex', ';'.join(filters),
              '-map', '0:v:0', '-map', '[mixed]',
              '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out, '-y'])

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return jsonify({'error': r.stderr}), 500
    return jsonify({'output_video': out})


# ── Thumbnail Generator ───────────────────────────────────────

@app.route('/api/video/thumbnail', methods=['POST'])
def generate_thumbnail():
    data       = request.json or {}
    user_id    = data.get('user_id', 'unknown')
    video_path = data.get('video_path')
    count      = int(data.get('count', 3))
    width      = int(data.get('width', 1280))
    height     = int(data.get('height', 720))

    if not video_path or not os.path.exists(video_path):
        return jsonify({'error': 'video_path not found'}), 400

    info         = probe(video_path)
    duration     = info.get('duration_secs', 10)
    interval     = duration / (count + 1)
    thumbnails   = []

    thumb_dir = user_dir(user_id) / 'thumbnails'
    thumb_dir.mkdir(exist_ok=True)

    for i in range(count):
        ts       = interval * (i + 1)
        out_path = str(thumb_dir / f'thumb_{i+1}_{uuid.uuid4().hex[:8]}.jpg')
        ok, _    = run_ffmpeg('-ss', str(ts), '-i', video_path,
                              '-vframes', '1', '-vf', f'scale={width}:{height}', out_path)
        if ok:
            thumbnails.append(out_path)

    return jsonify({'thumbnails': thumbnails, 'count': len(thumbnails)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
