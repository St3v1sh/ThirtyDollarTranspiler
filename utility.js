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
    VOLUME: 'vol',
    PITCH: 'pit',
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

  NOTES: {
    DEFAULT: '/',
    REST: '.',
    MULTIPLY_TAG: 'x',
  },

  TRANSLATION: {
    NOTE_DELIMITER: '|',
    GENERAL_DELIMITER: '@',
    VOLUME_DELIMITER: '%',
    GLOBAL_VOLUME: '!volume', // GENERAL_DELIMITER + number + MULTIPLY_TAG.
    REST: '_pause',
    CLEAR: '!cut',
    TEMPO: '!speed', // GENERAL_DELIMITER + number + MULTIPLY_TAG.
    TEMPO_MULTIPLY_TAG: '@x',
    COMBINE: '!combine',
    LABEL: '!target', // GENERAL_DELIMITER + number.
    GOTO: '!jump', // GENERAL_DELIMITER + number.
    DIVIDER: '!divider',
  }
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

const REGEX = {
  NON_NEGATIVE_DECIMAL_NUMBER: /^(\d+)?(\.\d+)?$/,
  DECIMAL_NUMBER_OR_MULTIPLIER: new RegExp(`^(\\d+)?(\\.\\d+)?${SYMBOLS.NOTES.MULTIPLY_TAG}?$`),
  PITCH_WITHOUT_OCTAVE_LOWERCASE: /^[a-g]$/,
  PITCH_WITH_OCTAVE: /^[a-gA-G](-?\d+)?$/,
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

var warnings = [];

/**
 * @param {string} message 
 */
function reportWarning(message) {
  warnings.push(message);
}

/**
 * @param {string} message 
 */
function reportError(message) {
  const output = document.getElementById('status');
  output.style.color = '#fa4d56';
  output.textContent = `${dateFormatter.format(Date.now())} | Error: ${message}` + (warnings.length > 0 ? (' | Warnings: ' + warnings.join(' | ')) : '');
  warnings = [];
}

/**
 * @param {string} message 
 */
function reportOK(message) {
  const output = document.getElementById('status');
  output.style.color = warnings.length > 0 ? '#f1c21b' : '#24a148';
  output.textContent = `${dateFormatter.format(Date.now())} | ${MOYAI}: ${message}` + (warnings.length > 0 ? (' | Warnings: ' + warnings.join(' | ')) : '');
  warnings = [];
}

/**
 * @param {Array<Array>} arrays 
 * @returns {Array<Array>}
 */
function zip(arrays) {
  return arrays.reduce((zipped, array) => array.map(
    (value, index) => [...(zipped[index] || []), value]
  ), [])}
