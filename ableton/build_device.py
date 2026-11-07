"""Rebuild the existing uncompressed AMXD patch chunk; no Live execution."""
import json
import struct
from pathlib import Path
root = Path(__file__).parent
source = root / 'QUINTA Receiver.maxpat'
target = root / 'QUINTA Receiver.amxd'
data = source.read_bytes()
json.loads(data)
header = target.read_bytes()[:28]
assert header[:4] == b'ampf' and header[24:28] == b'ptch'
data += b'\0'
target.write_bytes(header + struct.pack('<I', len(data)) + data)
