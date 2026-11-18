import os, sys
root = sys.argv[1]
needles = [b'agentPreset', b'session-pet-main-v10']
skip = ('node_modules', '.pnpm', 'sessions', 'profiles')
for base, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in skip]
    for name in files:
        p = os.path.join(base, name)
        try:
            with open(p, 'rb') as f:
                data = f.read(4_000_000)
        except Exception:
            continue
        for n in needles:
            if n in data:
                print(p, n.decode(), data[max(0, data.find(n)-40):data.find(n)+60].decode('utf-8', 'ignore').replace('\n', ' '))
                break
