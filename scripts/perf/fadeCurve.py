#!/usr/bin/env python3
"""
TEMPORARY profiling helper. Do not merge.

Measures how a screen region's brightness changes over a screen recording,
to tell a real fade (many in-between frames) from a jump (one or two).

Usage:
  python3 fadeCurve.py rec.mp4 overlay=0.02,0.40,0.28,0.20 \
      drawer=0.55,0.40,0.40,0.20 tap=0.88,0.04,0.10,0.05

Each region is name=x,y,w,h as fractions of the frame. For each region it
prints the luminance before and after, the times it crossed 10% and 90% of
that change, and how many frames sat in between. Pass --csv to also dump
every frame. Requires ffmpeg and ffprobe on the PATH.
"""

import json
import subprocess
import sys


def probe(path):
    out = subprocess.run(
        [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height:frame=pts_time',
            '-of', 'json', path,
        ],
        check=True, capture_output=True, text=True,
    ).stdout
    data = json.loads(out)
    stream = data['streams'][0]
    times = [float(f['pts_time']) for f in data['frames'] if 'pts_time' in f]
    return stream['width'], stream['height'], times


def luminance(path, width, height, region):
    x, y, w, h = region
    crop = 'crop=%d:%d:%d:%d' % (
        max(2, int(w * width)), max(2, int(h * height)),
        int(x * width), int(y * height),
    )
    raw = subprocess.run(
        [
            'ffmpeg', '-v', 'error', '-i', path, '-vsync', 'passthrough',
            '-vf', crop + ',scale=1:1:flags=area,format=gray',
            '-f', 'rawvideo', '-',
        ],
        check=True, capture_output=True,
    ).stdout
    return list(raw)


def median(values):
    s = sorted(values)
    return s[len(s) // 2]


def analyze(name, times, lum):
    n = min(len(times), len(lum))
    times, lum = times[:n], lum[:n]
    start = median(lum[:5])
    end = median(lum[-5:])
    change = end - start
    print('%s: start=%d end=%d change=%d' % (name, start, end, change))
    if abs(change) < 4:
        print('  no clear change in this region')
        return
    t10 = t90 = None
    i10 = i90 = None
    for i, v in enumerate(lum):
        frac = (v - start) / change
        if t10 is None and frac >= 0.1:
            t10, i10 = times[i], i
        if t90 is None and frac >= 0.9:
            t90, i90 = times[i], i
            break
    if t10 is None or t90 is None:
        print('  never crossed 10%/90%')
        return
    print(
        '  10%%=%.3fs 90%%=%.3fs duration=%.0fms frames between=%d'
        % (t10, t90, (t90 - t10) * 1000, i90 - i10)
    )


def main():
    args = [a for a in sys.argv[1:] if a != '--csv']
    dump_csv = '--csv' in sys.argv
    path, specs = args[0], args[1:]
    width, height, times = probe(path)
    print('%s: %dx%d, %d frames' % (path, width, height, len(times)))
    columns = {}
    for spec in specs:
        name, coords = spec.split('=')
        region = [float(c) for c in coords.split(',')]
        lum = luminance(path, width, height, region)
        columns[name] = lum
        analyze(name, times, lum)
    if dump_csv:
        print('time,' + ','.join(columns))
        for i, t in enumerate(times):
            row = [str(columns[c][i]) if i < len(columns[c]) else ''
                   for c in columns]
            print('%.4f,%s' % (t, ','.join(row)))


if __name__ == '__main__':
    main()
