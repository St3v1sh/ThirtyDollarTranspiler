const MOYAI = '🗿';

const SYMBOLS = {
  COMMENT: '-',
  CONFIG: {
    NAME: 'name',
    BPM: 'bpm',
    SHARP: 'sharp',
    FLAT: 'flat',
    TRANSPOSE: 'transpose',
  },
  INSTRUMENTS: {
    INSTRUMENT: 'inst',
    SET: 'set',
    VOLUME: 'volume',
    PITCH: 'pitch',
  },
  SONG: {
    DELIMITER: ':',

    // Delimiter symbols.
    START: 'start',
    INSTRUMENT: 'inst',
    VOLUME: 'vol',
    GLOBAL_VOLUME: 'gvol',
    CLEAR: 'clear',
    TEMPO: 'tempo',

    // Non-delimiter symbols.
    DIVIDER: 'div',
    SEGMENT: 'seg',
    SEGMENT_START: 'segstart',
    SEGMENT_END: 'segend',
  }
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function reportError(message) {
  const output = document.getElementById('status');
  output.style.color = '#fa4d56';
  output.innerHTML = `${dateFormatter.format(Date.now())} | Error: ${message}`;
}

function reportWarning(message) {
  const output = document.getElementById('status');
  output.style.color = '#f1c21b';
  output.innerHTML = `${dateFormatter.format(Date.now())} | Warning: ${message}`;
}

function reportOK(message) {
  const output = document.getElementById('status');
  output.style.color = '#24a148';
  output.innerHTML = `${dateFormatter.format(Date.now())} | OK: ${message}`;
}