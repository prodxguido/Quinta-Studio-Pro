import importlib.util
import json
import sys
import types
import unittest
from pathlib import Path
from types import SimpleNamespace as NS

sys.modules['_Framework'] = types.ModuleType('_Framework')
framework = types.ModuleType('_Framework.ControlSurface')
framework.ControlSurface = object
sys.modules['_Framework.ControlSurface'] = framework
spec = importlib.util.spec_from_file_location('quinta', Path(__file__).parent / 'Remote Scripts/QUINTA/control_surface.py')
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)

class Socket:
    def __init__(self): self.sent = []
    def sendto(self, data, peer): self.sent.append((data, peer))

class Song:
    def __init__(self):
        self.tracks = [NS(name='Original')]
        self.view = NS(selected_track=self.tracks[0])
    def create_midi_track(self, index):
        self.tracks.append(NS(name='', devices=[], arrangement_clips=[], clip_slots=[]))
        return None
    def delete_track(self, index): self.tracks.pop(index)

def surface(missing=False, load_error=False):
    q = module.QUINTA.__new__(module.QUINTA)
    song = Song(); song.tracks[0].devices = []
    leaf = NS(name=module.RACK_PATH[-1], children=[], is_loadable=True)
    item = leaf
    for name in reversed(('User Library',) + module.RACK_PATH[:-1]):
        item = NS(name=name, children=[item])
    if missing: item.children = []
    def load(preset):
        assert song.view.selected_track == song.tracks[-1]
        if load_error: raise RuntimeError('load_item failed')
        song.tracks[-1].devices.append(NS(name='Quinta MIDI Reciever', chains=[NS(devices=[NS(name='QUINTA Receiver')])]))
    browser = NS(user_library=item, load_item=load, hotswap_target='old')
    q.song = lambda: song; q.application = lambda: NS(browser=browser)
    q._socket = Socket(); q._request = None; q.log_message = lambda s: None
    q._begin('q-test', ('127.0.0.1', 50000)); q._request['start'] -= 2
    return q, song

class Tests(unittest.TestCase):
    def poll_with_errors(self, q, errors):
        events = iter(errors)
        def receive(size):
            event = next(events, BlockingIOError())
            if isinstance(event, BaseException):
                raise event
            return event
        q._socket.recvfrom = receive
        q._closed = False
        scheduled = []
        q.schedule_message = lambda *args: scheduled.append(args)
        q._poll()
        self.assertEqual(len(scheduled), 1)

    def test_windows_closed_receiver_port_still_loads_rack(self):
        q,s = surface()
        error = ConnectionResetError('UDP port unreachable')
        error.winerror = 10054
        self.poll_with_errors(q, [error])
        self.assertEqual(q._request['stage'], 'loading')
        self.assertEqual(len(s.tracks), 2)
        # A delayed ICMP error must not consume a subsequent valid Max ACK.
        ack = (module.osc('/quinta_status', 'q-test', 'ready', 'quinta-live-v2'), ('127.0.0.1', 43210))
        self.poll_with_errors(q, [error, ack])
        self.assertEqual(q._request['stage'], 'ready')
        self.assertEqual(len(s.tracks), 2)

    def test_other_socket_errors_are_reported(self):
        q,s = surface()
        error = OSError('socket failure')
        error.winerror = 10038
        self.poll_with_errors(q, [error])
        self.assertEqual(q._request['stage'], 'error')
        self.assertIn('socket failure', q._request['detail'])
        self.assertEqual(len(s.tracks), 1)

    def test_repeated_icmp_does_not_bypass_timeout(self):
        q,s = surface()
        q._request['start'] -= 18
        error = ConnectionResetError('UDP port unreachable')
        error.winerror = 10054
        self.poll_with_errors(q, [error] * 64)
        self.assertEqual(q._request['stage'], 'error')
        self.assertIn('no respondió', q._request['detail'])
        self.assertEqual(len(s.tracks), 1)

    def test_sender_vectors(self):
        vectors = json.loads(sys.stdin.read())
        for v in vectors:
            result = module.decode(bytes.fromhex(v['hex']))
            self.assertEqual(list(result), [v['address'], v['tags'], v['args']])
        with self.assertRaises(ValueError): module.decode(b'/bad')
        with self.assertRaises(ValueError): module.decode(module.osc('/x', 'y')+b'\0'*4)
    def test_load_and_confirm(self):
        q,s = surface(); q._advance()
        self.assertEqual(len(s.tracks),2)
        self.assertEqual(q._request['stage'],'loading')
        self.assertTrue(q._has_receiver(s.tracks[-1].devices))
        q._reply('ready','2')
        self.assertEqual(s.view.selected_track,s.tracks[0])
        q._begin('q-test',('127.0.0.1',50000))
        self.assertEqual(len(s.tracks),2)
    def test_missing_does_not_create(self):
        q,s=surface(missing=True)
        with self.assertRaisesRegex(RuntimeError,'Presets'):q._advance()
        self.assertEqual(len(s.tracks),1)
    def test_failed_load_rollback(self):
        q,s=surface(load_error=True)
        try:q._advance()
        except Exception as e:q._fail(e)
        self.assertEqual(len(s.tracks),1)
        self.assertEqual(q._request['stage'],'error')
    def test_timeout_cleanup(self):
        q,s=surface();q._advance();q._request['start']-=18;q._advance()
        self.assertEqual(len(s.tracks),1)
        self.assertEqual(q._request['stage'],'error')
    def test_preserve_user_changes(self):
        q,s=surface();q._advance();s.tracks[-1].name='User edits';q._fail('timeout')
        self.assertEqual(len(s.tracks),2)
        self.assertIn('conserva',q._request['detail'])
    def test_nested_old_receiver(self):
        q,s=surface();s.tracks[0].devices=[NS(name='Rack',chains=[NS(devices=[NS(name='QUINTA Receiver')])])]
        q._advance()
        self.assertEqual(q._request['stage'],'loading')
        self.assertEqual(len(s.tracks),1)

if __name__=='__main__':unittest.main()
