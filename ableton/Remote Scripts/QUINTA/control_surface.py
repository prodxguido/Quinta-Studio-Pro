"""QUINTA protocol v2. All Live calls run from schedule_message, never a thread."""
import json
import socket
import struct
import time
from _Framework.ControlSurface import ControlSurface

RACK_PATH = ('Presets', 'MIDI Effects', 'MIDI Effect Rack', 'Quinta MIDI Reciever.adg')

def osc(address, *args):
    def string(value):
        b = str(value).encode('utf-8') + b'\0'
        return b + b'\0' * (-len(b) % 4)
    return string(address) + string(',' + 's' * len(args)) + b''.join(string(a) for a in args)

def decode(data):
    if len(data) % 4:
        raise ValueError('OSC length')
    offset = 0
    def string():
        nonlocal offset
        end = data.index(b'\0', offset)
        value = data[offset:end].decode('utf-8')
        limit = (end + 4) & ~3
        if any(data[end:limit]):
            raise ValueError('OSC padding')
        offset = limit
        return value
    address, tags = string(), string()
    if not tags.startswith(','):
        raise ValueError('OSC types')
    args = []
    for tag in tags[1:]:
        if tag == 's':
            args.append(string())
        elif tag == 'i':
            args.append(struct.unpack_from('>i', data, offset)[0]); offset += 4
        else:
            raise ValueError('OSC unsupported type')
    if offset != len(data):
        raise ValueError('OSC trailing bytes')
    return address, tags, args

class QUINTA(ControlSurface):
    def __init__(self, c_instance):
        super().__init__(c_instance)
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._socket.setblocking(False)
        self._socket.bind(('127.0.0.1', 9010))
        self._request = None
        self._closed = False
        self.log_message('QUINTA v2: escuchando 127.0.0.1:9010')
        self.schedule_message(1, self._poll)

    def disconnect(self):
        self._closed = True
        self._socket.close()
        super().disconnect()

    def _reply(self, stage, detail):
        r = self._request
        r['stage'], r['detail'] = stage, str(detail)
        self._socket.sendto(json.dumps(dict(id=r['id'], stage=stage, detail=str(detail))).encode('utf-8'), r['peer'])
        if stage in ('error', 'done', 'ready'):
            self.log_message('QUINTA v2: %s: %s' % (stage, detail))
        if stage in ('error', 'done', 'ready'):
            previous = r.get('previous')
            if previous is not None and previous in self.song().tracks and self.song().view.selected_track == r.get('track'):
                self.song().view.selected_track = previous

    def _fail(self, error):
        try:
            self._cleanup()
        except Exception as cleanup_error:
            error = '%s; limpieza: %s' % (error, cleanup_error)
        self._reply('error', error)

    def _poll(self):
        if self._closed:
            return
        try:
            for _ in range(64):
                try:
                    data, peer = self._socket.recvfrom(65535)
                except BlockingIOError:
                    break
                except OSError as error:
                    # Windows reports ICMP Port Unreachable from an earlier UDP
                    # probe here. Before loading Max, 9009 is normally closed.
                    # This is not a failed bootstrap or an import result.
                    if getattr(error, 'winerror', None) == 10054:
                        continue
                    raise
                if peer[0] != '127.0.0.1':
                    continue
                try:
                    address, tags, args = decode(data)
                    if address == '/quinta_bootstrap' and tags == ',ss' and args[1] == '2':
                        self._begin(args[0], peer)
                    elif address == '/quinta_status' and tags == ',sss':
                        r = self._request
                        if r and args[0] == r['id']:
                            if args[1] == 'ready' and args[2] == 'quinta-live-v2' and r['stage'] not in ('done', 'error'):
                                self._reply('ready', 'Receptor v2 confirmado')
                            elif args[1] in ('done', 'error') and r['stage'] == 'ready':
                                if args[1] == 'error':
                                    self._fail(args[2])
                                else:
                                    self._reply(args[1], args[2])
                except Exception as error:
                    self.log_message('QUINTA v2 paquete: %s' % error)
            self._advance()
        except Exception as error:
            if self._request:
                self._fail(str(error))
        finally:
            self.schedule_message(1, self._poll)

    def _begin(self, identifier, peer):
        if not identifier.startswith('q') or len(identifier) > 80:
            return
        r = self._request
        if r and r['id'] == identifier:
            if peer == r['peer']:
                self._reply(r['stage'], r['detail'])
            return
        if r and r['stage'] not in ('done', 'error'):
            self._socket.sendto(json.dumps(dict(id=identifier, stage='error', detail='Hay otro envío activo en Live.')).encode(), peer)
            return
        self._request = dict(id=identifier, peer=peer, stage='probing', detail='Buscando receptor v2', start=time.monotonic(), probe=0, track=None)

    def _advance(self):
        r = self._request
        if not r or r['stage'] in ('done', 'error'):
            return
        elapsed = time.monotonic() - r['start']
        if r['stage'] == 'ready':
            if elapsed > 120:
                # Import result may be unknown: never delete potentially successful work.
                self._reply('error', 'Se perdió la confirmación final; revisá Arrangement antes de repetir.')
            return
        if elapsed > 17:
            self._fail('El JS v2 del receptor no respondió. Revisá quinta_receiver.js junto al AMXD y Log.txt.')
            return
        if r['stage'] == 'probing' and elapsed > 1:
            # A busy/old instance is not evidence that a second device is needed.
            if any(self._has_receiver(t.devices) for t in self.song().tracks):
                r['stage'] = 'loading'
                self._socket.sendto(osc('/quinta_probe', r['id']), ('127.0.0.1', 9009))
                r['probe'] = time.monotonic()
                return
            browser = self.application().browser
            item = getattr(browser, 'user_library', None)
            for name in RACK_PATH:
                if item is None:
                    break
                choices = list(getattr(item, 'children', ()))
                matches = [x for x in choices if str(x.name) in (name, name.removesuffix('.adg'))]
                if len(matches) != 1:
                    raise RuntimeError('No se encontró de forma única %s dentro de %s. Entradas: %s' % (name, getattr(item, 'name', 'User Library'), ', '.join(str(x.name) for x in choices[:20])))
                item = matches[0]
            if item is None or not getattr(item, 'is_loadable', False):
                raise RuntimeError('Preset no cargable: ' + '/'.join(RACK_PATH))
            song = self.song()
            previous = song.view.selected_track
            r['previous'] = previous
            song.create_midi_track(-1)  # No Track return is assumed.
            track = song.tracks[-1]
            r['track'] = track
            track.name = 'QUINTA Receiver'
            song.view.selected_track = track
            browser.hotswap_target = None
            browser.load_item(item)
            r['stage'] = 'loading'
        if time.monotonic() - r['probe'] > 0.4:
            self._socket.sendto(osc('/quinta_probe', r['id']), ('127.0.0.1', 9009))
            r['probe'] = time.monotonic()

    def _has_receiver(self, devices):
        for device in devices:
            if str(device.name) == 'QUINTA Receiver':
                return True
            for chain in getattr(device, 'chains', ()):
                if self._has_receiver(chain.devices):
                    return True
        return False

    def _cleanup(self):
        r = self._request
        track = r.get('track')
        if track is None:
            return
        song = self.song()
        for index, candidate in enumerate(song.tracks):
            if candidate == track:
                # Preserve anything the user added while waiting.
                devices = list(track.devices)
                unexpected = devices and (len(devices) != 1 or str(devices[0].name) not in ('Quinta MIDI Reciever', 'Quinta MIDI Reciever.adg', 'QUINTA Receiver'))
                if track.name != 'QUINTA Receiver' or len(track.arrangement_clips) or any(s.has_clip for s in track.clip_slots) or unexpected:
                    raise RuntimeError('La pista receptora cambió; se conserva para no borrar tu trabajo.')
                song.delete_track(index)
                break
        r['track'] = None
