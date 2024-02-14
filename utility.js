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
  },
}

const PITCHES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

var warningCount = 0;

function reportWarning(message) {
  console.log(`${dateFormatter.format(Date.now())} | Warning: ${message}`);
  warningCount++;
}

function reportError(message) {
  const output = document.getElementById('status');
  output.style.color = '#fa4d56';
  output.innerHTML = `${dateFormatter.format(Date.now())} | Error: ${message} | Warnings: ${warningCount}`;
  warningCount = 0;
}

function reportOK(message) {
  const output = document.getElementById('status');
  output.style.color = '#24a148';
  output.innerHTML = `${dateFormatter.format(Date.now())} | ${MOYAI}: ${message} | Warnings: ${warningCount}`;
  warningCount = 0;
}