// initialize board object
global.board.name = "pico:ed";
global.board.LED = 25;
global.board.A = 20;
global.board.B = 21;
global.board.Buzzer = 3;
global.board.P0 = 26;
global.board.P1 = 27;
global.board.P2 = 28;
global.board.P3 = 29;
global.board.P4 = 4;
global.board.P5 = 5;
global.board.P6 = 6;
global.board.P7 = 7;
global.board.P8 = 8;
global.board.P9 = 9;
global.board.P10 = 10;
global.board.P11 = 11;
global.board.P12 = 12;
global.board.P13 = 13;
global.board.P14 = 14;
global.board.P15 = 15;
global.board.P16 = 16;
global.board.P19 = 19;
global.board.P20 = 18;

// mount lfs on "/"
const fs = require("fs");
const { VFSLittleFS } = require("vfs_lfs");
const { Flash } = require("flash");
fs.register("lfs", VFSLittleFS);
// fs block starts after 4(storage) + 128(program)
const bd = new Flash(132, 128);
fs.mount("/", bd, "lfs", true);

// class BuzzerMusic
const NOTE_FREQ = [
  // C    C#     D    D#     E     F    F#     G    G#     A    A#     B
  [8, 9, 9, 10, 10, 11, 12, 12, 13, 14, 15, 15], // -1
  [16, 17, 18, 19, 21, 22, 23, 24, 26, 28, 29, 31], // 0
  [33, 35, 37, 39, 41, 44, 46, 49, 52, 55, 58, 62], // 1
  [65, 69, 73, 78, 82, 87, 93, 98, 104, 110, 117, 123], // 2
  [131, 139, 147, 156, 165, 175, 185, 196, 208, 220, 233, 247], // 3
  [262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494], // 4
  [523, 554, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988], // 5
  [1042, 1109, 1175, 1245, 1319, 1397, 1480, 1568, 1661, 1760, 1865, 1976], // 6
  [2093, 2217, 2349, 2489, 2637, 2794, 2960, 3136, 3322, 3520, 3729, 3951], // 7
  [4186, 4435, 4699, 4978, 5274, 5588, 5920, 6272, 6645, 7040, 7459, 7902], // 8
  [8372, 8870, 9397, 9956, 10548, 11175, 11840, 12544, 13290, NaN, NaN, NaN], // 9
];
const NOTES = "cCdDefFgGaAb";

class BuzzerMusic {
  constructor(pin, rhythm = 4, tempo = 120, toneInversion = -1) {
    this.pin = pin;
    this.pos = -1;
    this.octave = 4;
    this.duration = 4;
    this.loop = false;
    this.playing = false;
    this.tempo = tempo; // default 120bpm
    this.rhythm = rhythm; // default is quarter note
    this.toneOption = toneInversion > -1 ? { inversion: toneInversion } : {};
  }

  get DADADADUM() {
    return "r4:2,g,g,g,D:8,r:2,f,f,f,d:8".split(',');
  }

  get WAWAWAWAA() {
    return "e3:3,r:1,D:3,r:1,d:4,r:1,C:8".split(',');
  }

  get ENTERTAINER() {
    return "d4:1,D,e,c5:2,e4:1,c5:2,e4:1,c5:3,c:1,d,D,e,c,d,e:2,b4:1,d5:2,c:4".split(',');
  }

  get PRELUDE() {
    return "c4:1,e,g,c5,e,g4,c5,e,c4,e,g,c5,e,g4,c5,e,c4,d,g,d5,f,g4,d5,f,c4,d,g,d5,f,g4,d5,f,b3,d4,g,d5,f,g4,d5,f,b3,d4,g,d5,f,g4,d5,f,c4,e,g,c5,e,g4,c5,e,c4,e,g,c5,e,g4,c5,e".split(',');
  }

  get ODE() {
    return "e4,e,f,g,g,f,e,d,c,c,d,e,e:6,d:2,d:8,e:4,e,f,g,g,f,e,d,c,c,d,e,d:6,c:2,c:8".split(',');
  }

  get NYAN() {
    return "F5:2,G,C:1,D:2,b4:1,d5:1,C,b4:2,b,C5,d,d:1,C,b4:1,C5:1,D,F,G,D,F,C,d,b4,C5,b4,D5:2,F,G:1,D,F,C,D,b4,d5,D,d,C,b4,C5,d:2,b4:1,C5,D,F,C,d,C,b4,C5:2,b4,C5,b4,F:1,G,b:2,F:1,G,b,C5,D,b4,e5,D,e,F,b4:2,b,F:1,G,b,F,e5,D,C,b4,F,D,e,F,b:2,F:1,G,b:2,F:1,G,b,b,C5,D,b4,F,G,F,b:2,b:1,A,b,F,G,b,e5,D,e,F,b4:2,C5".split(',');
  }

  get RINGTONE() {
    return "c4:1,d,e:2,g,d:1,e,f:2,a,e:1,f,g:2,b,c5:4".split(',');
  }

  get FUNK() {
    return "c2:2,c,D,c:1,f:2,c:1,f:2,F,g,c,c,g,c:1,F:2,c:1,F:2,f,D".split(',');
  }

  get BLUES() {
    return "c2:2,e,g,a,A,a,g,e,c2:2,e,g,a,A,a,g,e,f,a,c3,d,D,d,c,a2,c2:2,e,g,a,A,a,g,e,g,b,d3,f,f2,a,c3,D,c2:2,e,g,e,g,f,e,d".split(',');
  }

  get BIRTHDAY() {
    return "c4:3,c:1,d:4,c:4,f,e:8,c:3,c:1,d:4,c:4,g,f:8,c:3,c:1,c5:4,a4,f,e,d,A:3,A:1,a:4,f,g,f:8".split(',');
  }

  get WEDDING() {
    return "c4:4,f:3,f:1,f:8,c:4,g:3,e:1,f:8,c:4,f:3,a:1,c5:4,a4:3,f:1,f:4,e:3,f:1,g:8".split(',');
  }

  get FUNERAL() {
    return "c3:4,c:3,c:1,c:4,D:3,d:1,d:3,c:1,c:3,b2:1,c3:4".split(',');
  }

  get PUNCHLINE() {
    return "c4:3,g3:1,F,g,G:3,g,r,b,c4".split(',');
  }

  get PYTHON() {
    return "d5:1,b4,r,b,b,A,b,g5,r,d,d,r,b4,c5,r,c,c,r,d,e:5,c:1,a4,r,a,a,G,a,F5,r,e,e,r,c,b4,r,b,b,r,c5,d:5,d:1,b4,r,b,b,A,b,b5,r,g,g,r,d,C,r,a,a,r,a,a:5,g:1,F:2,a:1,a,G,a,e:2,a:1,a,G,a,d,r,C,d,r,C,d:2,r:3".split(',');
  }

  get BADDY() {
    return "c3:3,r,d:2,D,r,c,r,F:8".split(',');
  }

  get CHASE() {
    return "a4:1,b,c5,b4,a:2,r,a:1,b,c5,b4,a:2,r,a:2,e5,D,e,f,e,D,e,b4:1,c5,d,c,b4:2,r,b:1,c5,d,c,b4:2,r,b:2,e5,D,e,f,e,D,e".split(',');
  }

  get BA_DING() {
    return "b5:1,e6:3".split(',');
  }

  get JUMP_UP() {
    return "c5:1,d,e,f,g".split(',');
  }

  get JUMP_DOWN() {
    return "g5:1,f,e,d,c".split(',');
  }

  get POWER_UP() {
    return "g4:1,c5,e,g:2,e:1,g:3".split(',');
  }

  get POWER_DOWN() {
    return "g5:1,D,c,g4:2,b:1,c5:3".split(',');
  }

  _playNote(octave, i, option) {
    tone(this.pin, NOTE_FREQ[octave][i], option);
  }

  _play(notes, pos) {
    if (pos >= notes.length) {
      if (this.loop) {
        this.reset();
      } else {
        this.stop();
      }
      return;
    }
    const note = notes[pos];
    const n = note.indexOf(":");
    if (n !== -1) {
      this.duration = parseInt(note[n + 1], 10);
    }
    if (note.length > 1 && note[1] !== ":") {
      this.octave = parseInt(note[1], 10);
    }
    if (note[0] === "r") {
      noTone(this.pin);
      return;
    }
    const i = NOTES.indexOf(note[0]);
    if (i >= 0) {
      this._playNote(this.octave + 1, i, this.toneOption);
    }
  }

  play(notes, loop = false) {
    this.stop();
    this.reset();
    this.loop = loop;
    this.playing = true;
    return new Promise((resolve, reject) => {
      const play = () => {
        if (!this.playing) {
          return resolve();
        }
        try {
          this.pos++;
          this._play(notes, this.pos);
        } catch (e) {
          reject(e);
        }
        setTimeout(() => {
          play();
        }, Math.round(this.duration * (60000 / this.tempo / this.rhythm)));
      };
      play();
    });
  }

  stop() {
    noTone(this.pin);
    this.playing = false;
  }

  reset() {
    this.duration = 4;
    this.octave = 4;
    this.pos = -1;
  }
}

// class Display
const MODE_REGISTER = 0x00;
const FRAME_REGISTER = 0x01;
const AUDIOSYNC_REGISTER = 0x06;
const SHUTDOWN_REGISTER = 0x0a;

const CONFIG_BANK = 0x0b;
const BANK_ADDRESS = 0xfd;

const PICTURE_MODE = 0x00;

const ENABLE_OFFSET = 0x00;
const COLOR_OFFSET = 0x24;

const DEFAULT_FRAME = 0;

const DEFAULT_FONT = {
  bitmap: Uint8Array.from([
    0x00, 0x00, 0x5f, 0x00, 0x00, 0x00, 0x07, 0x00, 0x07, 0x00, 0x14, 0x7f,
    0x14, 0x7f, 0x14, 0x24, 0x2a, 0x7f, 0x2a, 0x12, 0x23, 0x13, 0x08, 0x64,
    0x62, 0x36, 0x49, 0x55, 0x22, 0x50, 0x00, 0x05, 0x03, 0x00, 0x00, 0x00,
    0x1c, 0x22, 0x41, 0x00, 0x00, 0x41, 0x22, 0x1c, 0x00, 0x08, 0x2a, 0x1c,
    0x2a, 0x08, 0x08, 0x08, 0x3e, 0x08, 0x08, 0x00, 0x50, 0x30, 0x00, 0x00,
    0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x60, 0x60, 0x00, 0x00, 0x20, 0x10,
    0x08, 0x04, 0x02, 0x3e, 0x51, 0x49, 0x45, 0x3e, 0x00, 0x42, 0x7f, 0x40,
    0x00, 0x42, 0x61, 0x51, 0x49, 0x46, 0x21, 0x41, 0x45, 0x4b, 0x31, 0x18,
    0x14, 0x12, 0x7f, 0x10, 0x27, 0x45, 0x45, 0x45, 0x39, 0x3c, 0x4a, 0x49,
    0x49, 0x30, 0x01, 0x71, 0x09, 0x05, 0x03, 0x36, 0x49, 0x49, 0x49, 0x36,
    0x06, 0x49, 0x49, 0x29, 0x1e, 0x00, 0x36, 0x36, 0x00, 0x00, 0x00, 0x56,
    0x36, 0x00, 0x00, 0x00, 0x08, 0x14, 0x22, 0x41, 0x14, 0x14, 0x14, 0x14,
    0x14, 0x41, 0x22, 0x14, 0x08, 0x00, 0x02, 0x01, 0x51, 0x09, 0x06, 0x32,
    0x49, 0x79, 0x41, 0x3e, 0x7e, 0x11, 0x11, 0x11, 0x7e, 0x7f, 0x49, 0x49,
    0x49, 0x36, 0x3e, 0x41, 0x41, 0x41, 0x22, 0x7f, 0x41, 0x41, 0x22, 0x1c,
    0x7f, 0x49, 0x49, 0x49, 0x41, 0x7f, 0x09, 0x09, 0x01, 0x01, 0x3e, 0x41,
    0x41, 0x51, 0x32, 0x7f, 0x08, 0x08, 0x08, 0x7f, 0x00, 0x41, 0x7f, 0x41,
    0x00, 0x20, 0x40, 0x41, 0x3f, 0x01, 0x7f, 0x08, 0x14, 0x22, 0x41, 0x7f,
    0x40, 0x40, 0x40, 0x40, 0x7f, 0x02, 0x04, 0x02, 0x7f, 0x7f, 0x04, 0x08,
    0x10, 0x7f, 0x3e, 0x41, 0x41, 0x41, 0x3e, 0x7f, 0x09, 0x09, 0x09, 0x06,
    0x3e, 0x41, 0x51, 0x21, 0x5e, 0x7f, 0x09, 0x19, 0x29, 0x46, 0x46, 0x49,
    0x49, 0x49, 0x31, 0x01, 0x01, 0x7f, 0x01, 0x01, 0x3f, 0x40, 0x40, 0x40,
    0x3f, 0x1f, 0x20, 0x40, 0x20, 0x1f, 0x7f, 0x20, 0x18, 0x20, 0x7f, 0x63,
    0x14, 0x08, 0x14, 0x63, 0x03, 0x04, 0x78, 0x04, 0x03, 0x61, 0x51, 0x49,
    0x45, 0x43, 0x00, 0x00, 0x7f, 0x41, 0x41, 0x02, 0x04, 0x08, 0x10, 0x20,
    0x41, 0x41, 0x7f, 0x00, 0x00, 0x04, 0x02, 0x01, 0x02, 0x04, 0x40, 0x40,
    0x40, 0x40, 0x40, 0x00, 0x01, 0x02, 0x04, 0x00, 0x20, 0x54, 0x54, 0x54,
    0x78, 0x7f, 0x48, 0x44, 0x44, 0x38, 0x38, 0x44, 0x44, 0x44, 0x20, 0x38,
    0x44, 0x44, 0x48, 0x7f, 0x38, 0x54, 0x54, 0x54, 0x18, 0x08, 0x7e, 0x09,
    0x01, 0x02, 0x08, 0x14, 0x54, 0x54, 0x3c, 0x7f, 0x08, 0x04, 0x04, 0x78,
    0x00, 0x44, 0x7d, 0x40, 0x00, 0x20, 0x40, 0x44, 0x3d, 0x00, 0x00, 0x7f,
    0x10, 0x28, 0x44, 0x00, 0x41, 0x7f, 0x40, 0x00, 0x7c, 0x04, 0x18, 0x04,
    0x78, 0x7c, 0x08, 0x04, 0x04, 0x78, 0x38, 0x44, 0x44, 0x44, 0x38, 0x7c,
    0x14, 0x14, 0x14, 0x08, 0x08, 0x14, 0x14, 0x18, 0x7c, 0x7c, 0x08, 0x04,
    0x04, 0x08, 0x48, 0x54, 0x54, 0x54, 0x20, 0x04, 0x3f, 0x44, 0x40, 0x20,
    0x3c, 0x40, 0x40, 0x20, 0x7c, 0x1c, 0x20, 0x40, 0x20, 0x1c, 0x3c, 0x40,
    0x30, 0x40, 0x3c, 0x44, 0x28, 0x10, 0x28, 0x44, 0x0c, 0x50, 0x50, 0x50,
    0x3c, 0x44, 0x64, 0x54, 0x4c, 0x44, 0x00, 0x08, 0x36, 0x41, 0x00, 0x00,
    0x00, 0x7f, 0x00, 0x00, 0x00, 0x41, 0x36, 0x08, 0x00, 0x18, 0x04, 0x18,
    0x20, 0x18,
  ]),
  width: 5,
  first: 33,
  find(charCode) {
    if (this.font === undefined) {
      this.font = fs.stat("/font.i") && fs.stat("/font.b");
      if (this.font) {
        this._decoder = new TextDecoder();
        this._font = fs.open("/font.b");
        this.font = this._decoder.decode(fs.readFile("/font.i"));
      }
    }
    if (this.font) {
      const index = this.font.indexOf(String.fromCharCode(charCode));
      if (index === -1) return;
      let data = new Uint8Array(10);
      fs.read(this._font, data, 0, data.length, index * 10);
      data = Array.from(atob(`${this._decoder.decode(data)}==`));
      let len = data.length;
      for (let i = 0; i < len; i++) {
        if (data[0] !== 0) break;
        data.shift();
      }
      len = data.length;
      for (let i = 0; i < len; i++) {
        if (data[data.length - 1] !== 0) break;
        data.pop();
      }
      return Uint8Array.from(data);
    }
    const start = (charCode - this.first) * this.width;
    const end = start + this.width;
    return this.bitmap.slice(start, end);
  },
};

const fillUint8 = (value, length) => {
  const uint8 = new Uint8Array(length);
  uint8.fill(value);
  return uint8;
};

class Display {
  static get WIDTH() {
    return 17;
  }

  static get HEIGHT() {
    return 7;
  }

  /**
   * translates an x, y coordinate to a pixel index
   * @param {number} x
   * @param {number} y
   * @returns
   */
  static GetPixel(x, y) {
    if (x > 8) {
      x = 17 - x;
      y += 8;
    } else {
      y = 7 - y;
    }
    return x * 16 + y;
  }

  constructor(i2c, address = 0x74) {
    this.i2c = i2c;
    this.address = address;
    this._frame = DEFAULT_FRAME;
    this._font = DEFAULT_FONT;
    this._init();
  }

  get frame() {
    return this._frame;
  }

  set frame(frame) {
    this._frame = frame % 2;
  }

  get font() {
    return this._font;
  }

  set font(font) {
    this._font = font;
  }

  NO(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x41, 0x22, 0x14, 0x08, 0x14, 0x22, 0x41,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  SQUARE(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3e, 0x22, 0x22, 0x22, 0x3e, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  RECTANGLE(color) {
    return this.image(
      Uint8Array.from([
        0xff, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
        0x41, 0x41, 0x41, 0x41, 0xff,
      ]),
      color
    );
  }

  RHOMBUS(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x14, 0x22, 0x41, 0x22, 0x14, 0x08,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  TARGET(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x1c, 0x36, 0x63, 0x36, 0x1c, 0x08,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  CHESSBOARD(color) {
    return this.image(
      Uint8Array.from([
        0x2a, 0x55, 0x2a, 0x55, 0x2a, 0x55, 0x2a, 0x55, 0x2a, 0x55, 0x2a, 0x55,
        0x2a, 0x55, 0x2a, 0x55, 0x2a,
      ]),
      color
    );
  }

  HAPPY(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x10, 0x20, 0x46, 0x40, 0x40, 0x40, 0x46, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  SAD(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x40, 0x22, 0x12, 0x10, 0x10, 0x10, 0x12, 0x22,
        0x40, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  YES(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x10, 0x20, 0x10, 0x08, 0x04,
        0x02, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  HEART(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x1f, 0x3f, 0x7e, 0x3f, 0x1f, 0x0e,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  TRIANGLE(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x40, 0x60, 0x50, 0x48, 0x44, 0x42, 0x41, 0x42, 0x44, 0x48,
        0x50, 0x60, 0x40, 0x00, 0x00,
      ]),
      color
    );
  }

  CHAGRIN(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x22, 0x14, 0x08, 0x40, 0x40, 0x40, 0x08, 0x14,
        0x22, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  SMILING_FACE(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x36, 0x50, 0x50, 0x50, 0x36, 0x06,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  CRY(color) {
    return this.image(
      Uint8Array.from([
        0x60, 0x70, 0x70, 0x38, 0x02, 0x02, 0x64, 0x50, 0x50, 0x50, 0x64, 0x02,
        0x02, 0x38, 0x70, 0x70, 0x60,
      ]),
      color
    );
  }

  DOWNCAST(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x02, 0x0a, 0x11, 0x08, 0x40, 0x40, 0x40, 0x08, 0x11,
        0x0a, 0x02, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  LOOK_RIGHT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x26, 0x2f, 0x06, 0x00, 0x06,
        0x0f, 0x06, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  LOOK_LEFT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x06, 0x0f, 0x06, 0x00, 0x06, 0x2f, 0x26, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  TONGUE(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x00, 0x04, 0x12, 0x14, 0x70, 0x70, 0x70, 0x16, 0x16,
        0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  PEEK_RIGHT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x04, 0x04, 0x04, 0x0c, 0x0c, 0x40, 0x40, 0x40, 0x04, 0x04,
        0x04, 0x0c, 0x0c, 0x00, 0x00,
      ]),
      color
    );
  }

  PEEK_LEFT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x0c, 0x0c, 0x04, 0x04, 0x04, 0x40, 0x40, 0x40, 0x0c, 0x0c,
        0x04, 0x04, 0x04, 0x00, 0x00,
      ]),
      color
    );
  }

  TEAR_EYES(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x06, 0x7f, 0x06, 0x20, 0x40, 0x40, 0x40, 0x20, 0x06,
        0x7f, 0x06, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  PROUD(color) {
    return this.image(
      Uint8Array.from([
        0x01, 0x07, 0x0f, 0x0f, 0x0f, 0x0f, 0x47, 0x41, 0x41, 0x41, 0x27, 0x0f,
        0x0f, 0x0f, 0x0f, 0x07, 0x01,
      ]),
      color
    );
  }

  SNEER_LEFT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x0c, 0x08, 0x0c, 0x2c, 0x40, 0x40, 0x40, 0x2c, 0x08,
        0x0c, 0x0c, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  SNEER_RIGHT(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x0c, 0x0c, 0x08, 0x2c, 0x40, 0x40, 0x40, 0x2c, 0x0c,
        0x08, 0x0c, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  SUPERCILIOUS_LOOK(color) {
    return this.image(
      Uint8Array.from([
        0x00, 0x00, 0x00, 0x0e, 0x0c, 0x0e, 0x00, 0x20, 0x20, 0x20, 0x00, 0x0e,
        0x0c, 0x0e, 0x00, 0x00, 0x00,
      ]),
      color
    );
  }

  EXCITED(color) {
    return this.image(
      Uint8Array.from([
        0x60, 0x70, 0x70, 0x3e, 0x01, 0x06, 0x30, 0x50, 0x50, 0x50, 0x30, 0x06,
        0x01, 0x3e, 0x70, 0x70, 0x60,
      ]),
      color
    );
  }

  _bank(bank = null) {
    if (bank !== null) {
      this.i2c.write(Uint8Array.from([BANK_ADDRESS, bank]), this.address);
    }
  }

  _register(bank, register, value = null) {
    this._bank(bank);
    if (value !== null) {
      this.i2c.write(Uint8Array.from([register, value]), this.address);
    }
  }

  _init() {
    this.reset();
    // clear config; sets to Picture Mode, no audio sync, maintains sleep
    this._bank(CONFIG_BANK);
    this._register(CONFIG_BANK, MODE_REGISTER, PICTURE_MODE);
    this._register(CONFIG_BANK, FRAME_REGISTER, this.frame);
    this._register(CONFIG_BANK, AUDIOSYNC_REGISTER, 0);

    // Initialize requested frames, or all 8 if unspecified
    const enableData = fillUint8(255, 19);
    const fillData = fillUint8(0, 25);
    enableData[0] = ENABLE_OFFSET;
    for (let frame = 0; frame < 2; frame++) {
      this._bank(frame);
      this.i2c.write(enableData, this.address); // set all enable bits
      for (let row = 0; row < 6; row++) {
        // barebones quick fill() w/0
        fillData[0] = COLOR_OFFSET + row * 24;
        this.i2c.write(fillData, this.address);
      }
    }
  }

  /**
   * kill the display for 10ms
   */
  reset() {
    this.sleep(true);
    delay(10);
    this.sleep(false);
  }

  /**
   * set the software shutdown register bit
   * @param {bool} value - true to set software shutdown bit; false unset
   */
  sleep(value) {
    this._register(CONFIG_BANK, SHUTDOWN_REGISTER, !value);
  }

  /**
   * fill the display with a brightness level
   * @param {number} color - brightness 0->255
   */
  fill(color) {
    this._bank(this.frame);
    color = color % 256;
    let data = fillUint8(color, 25);
    for (let row = 0; row < 6; row++) {
      data[0] = COLOR_OFFSET + row * 24;
      this.i2c.write(data, this.address);
    }
  }

  /**
   * brightness for x-pixel, y-pixel
   * @param {number} x
   * @param {number} y
   * @param {number} color - brightness 0->255
   */
  pixel(x, y, color) {
    x = x % Display.WIDTH;
    y = y % Display.HEIGHT;
    color = color % 256;
    const pixel = Display.GetPixel(x, y);
    this._register(this.frame, COLOR_OFFSET + pixel, color);
  }

  /**
   * brightness image on the LED display
   * @param {Uint8Array|string} image - image
   * @param {number} color - brightness 0->255
   * @returns
   */
  image(image, color = 30) {
    this.frame++;
    this.fill(0);
    color = color % 256;
    if (image instanceof Uint8Array) {
      for (let x = 0; x < Display.WIDTH; x++) {
        const col = image[x];
        for (let y = 0; y < Display.HEIGHT; y++) {
          const bit = (1 << y) & col;
          if (bit) {
            this.pixel(x, y, color);
          }
        }
      }
    } else if (typeof image === "string") {
      image = image.replace(/:/g, "").replace(/\s/g, "");
      for (let i in image) {
        const x = i % Display.WIDTH;
        const y = Math.floor(i / Display.WIDTH);
        const bit = parseInt(image[i], 10);
        if (bit) {
          this.pixel(x, y, Math.max(color, Math.round((bit * 255) / 9)));
        }
      }
    }
    this._register(CONFIG_BANK, FRAME_REGISTER, this.frame);
  }

  /**
   * scrolls numbers or text on the LED display
   * @param {string} value - numbers ro text
   * @param {number} color - brightness 0->255
   */
  scroll(value, color = 30) {
    const text = `${value}`;
    const chars = [];
    const buffer = new Uint8Array(Display.WIDTH);
    return new Promise((resolve, reject) => {
      for (const i in text) {
        const charCode = text.charCodeAt(i);
        if (charCode === 0x20) {
          chars.push(0, 0, 0, 0, 0);
        } else {
          if (i > 0) chars.push(0);
          const uint8 = this.font.find(charCode);
          if (uint8) {
            chars.push(...uint8);
          } else {
            chars.push(0x7f, 0x41, 0x41, 0x41, 0x7f);
          }
        }
      }
      if (chars.length <= Display.WIDTH) {
        try {
          for (const i in chars) {
            buffer[i] = chars[i];
          }
          this.image(buffer, color);
          resolve();
        } catch (e) {
          reject(e);
        }
      } else {
        const len = chars.length + Display.WIDTH;
        try {
          this.scrolling = true;
          const showText = (i) => {
            setTimeout(() => {
              if (this.scrolling && i < len) {
                for (let col = 0; col < buffer.length - 1; col++) {
                  buffer[col] = buffer[col + 1];
                }
                buffer[buffer.length - 1] = i < chars.length ? chars[i] : 0;
                this.image(buffer, color);
                showText(i + 1);
              } else {
                resolve();
                this.scrolling = false;
              }
            }, 0);
          };
          showText(0);
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  /**
   * clears the LED display
   */
  clear() {
    this.scrolling = false;
    this.fill(0);
  }
}

global.picoed = {};
// led
global.picoed.led = global.board.led(global.board.LED);
// buttons
global.picoed.buttonA = global.board.button(global.board.A);
global.picoed.buttonB = global.board.button(global.board.B);
// music
global.board.buzzer = (pin) => new BuzzerMusic(pin);
global.picoed.music = global.board.buzzer(global.board.Buzzer);
// display
global.picoed.display = new Display(global.board.i2c(0, { scl: 1, sda: 0 }));
