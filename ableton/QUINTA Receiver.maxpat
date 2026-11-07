{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 1,
      "revision": 2,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      65.0,
      399.0,
      385.0,
      229.0
    ],
    "openrect": [
      0.0,
      0.0,
      0.0,
      169.0
    ],
    "bglocked": 0,
    "openinpresentation": 0,
    "default_fontsize": 10.0,
    "default_fontface": 0,
    "default_fontname": "Arial Bold",
    "gridonopen": 1,
    "gridsize": [
      8.0,
      8.0
    ],
    "gridsnaponopen": 1,
    "objectsnaponopen": 1,
    "statusbarvisible": 2,
    "toolbarvisible": 1,
    "lefttoolbarpinned": 0,
    "toptoolbarpinned": 0,
    "righttoolbarpinned": 0,
    "bottomtoolbarpinned": 0,
    "toolbars_unpinned_last_save": 0,
    "tallnewobj": 0,
    "boxanimatetime": 500,
    "enablehscroll": 1,
    "enablevscroll": 1,
    "devicewidth": 0.0,
    "description": "Recibe proyectos de QUINTA y crea pistas MIDI en Arrangement",
    "digest": "",
    "tags": "",
    "style": "",
    "subpatcher_template": "",
    "title": "QUINTA Receiver",
    "boxes": [
      {
        "box": {
          "id": "obj-5",
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            42.0,
            136.0,
            58.0,
            18.0
          ],
          "text": "MIDI to Live",
          "textjustification": 0
        }
      },
      {
        "box": {
          "id": "obj-4",
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            33.0,
            16.0,
            69.0,
            18.0
          ],
          "text": "MIDI from Live",
          "textjustification": 0
        }
      },
      {
        "box": {
          "id": "obj-3",
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            63.0,
            75.0,
            122.0,
            18.0
          ],
          "text": "Build your MIDI effect here",
          "textjustification": 0
        }
      },
      {
        "box": {
          "fontname": "Ableton Sans Medium Regular",
          "fontsize": 11.0,
          "hidden": 1,
          "id": "obj-9",
          "maxclass": "comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            0.0,
            170.0,
            133.0,
            20.0
          ],
          "text": "Device vertical limit"
        }
      },
      {
        "box": {
          "fontname": "Arial Bold",
          "fontsize": 10.0,
          "id": "obj-2",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            48.0,
            114.0,
            47.0,
            20.0
          ],
          "text": "midiout"
        }
      },
      {
        "box": {
          "fontname": "Arial Bold",
          "fontsize": 10.0,
          "id": "obj-1",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "int"
          ],
          "patching_rect": [
            48.0,
            34.0,
            40.0,
            20.0
          ],
          "text": "midiin"
        }
      },
      {
        "box": {
          "id": "quinta-udp",
          "maxclass": "newobj",
          "text": "udpreceive 9009 @defer 1",
          "patching_rect": [
            330.0,
            120.0,
            190.0,
            22.0
          ]
        }
      },
      {
        "box": {
          "id": "quinta-js",
          "maxclass": "newobj",
          "text": "js quinta_receiver.js",
          "patching_rect": [
            330.0,
            170.0,
            150.0,
            22.0
          ]
        }
      },
      {
        "box": {
          "id": "quinta-live",
          "maxclass": "newobj",
          "text": "live.thisdevice",
          "patching_rect": [
            330.0,
            220.0,
            120.0,
            22.0
          ]
        }
      },
      {
        "box": {
          "id": "quinta-label",
          "maxclass": "live.comment",
          "text": "QUINTA Receiver Â· listo para enviar al Arrangement",
          "patching_rect": [
            20.0,
            20.0,
            300.0,
            25.0
          ]
        }
      },
      {
        "box": {
          "id": "quinta-status",
          "maxclass": "newobj",
          "text": "udpsend 127.0.0.1 9010",
          "patching_rect": [
            330.0,
            270.0,
            190.0,
            22.0
          ]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "destination": [
            "obj-2",
            0
          ],
          "source": [
            "obj-1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "quinta-udp",
            0
          ],
          "destination": [
            "quinta-js",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "quinta-live",
            0
          ],
          "destination": [
            "quinta-js",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "quinta-js",
            0
          ],
          "destination": [
            "quinta-status",
            0
          ]
        }
      }
    ],
    "dependency_cache": [
      {
        "name": "quinta_receiver.js",
        "type": "TEXT",
        "implicit": 1
      }
    ],
    "latency": 0,
    "project": {
      "version": 1,
      "creationdate": 3590052786,
      "modificationdate": 3590052786,
      "viewrect": [
        0.0,
        0.0,
        300.0,
        500.0
      ],
      "autoorganize": 1,
      "hideprojectwindow": 1,
      "showdependencies": 1,
      "autolocalize": 0,
      "contents": {
        "patchers": {}
      },
      "layout": {},
      "searchpath": {},
      "detailsvisible": 0,
      "amxdtype": 1835887981,
      "readonly": 0,
      "devpathtype": 0,
      "devpath": ".",
      "sortmode": 0,
      "viewmode": 0
    },
    "autosave": 0
  }
}
