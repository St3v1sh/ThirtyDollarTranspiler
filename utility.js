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
    OVERRIDE: 'override',
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

const PITCH_OCTAVE = 12;

const REGEX = {
  DECIMAL_NUMBER: /^((-?\d+)?(\.\d+)?|(\d+)?(-?\.\d+)?)$/,
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
 * @param {string} textData
 * @param {string} fileName
 * @param {string} fileExtension
 */
async function saveToFile(textData, fileName, fileExtension) {
  const suggestedName = `${fileName}.${fileExtension}`;
  var filePickerSupported = window.showSaveFilePicker ? true : false;

  if (filePickerSupported) {
    await window.showSaveFilePicker({ suggestedName: suggestedName })
      .then(file => {
        file.createWritable()
          .then(writable => {
            writable.write(textData).then(() => writable.close());
          })
      })
      .catch((err) => { throw err });
  } else {
    const blob = new Blob([textData], { type: 'text/plain' });
    const downloadLink = document.createElement('a');

    downloadLink.download = suggestedName;
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.onclick = ((e) => document.body.removeChild(e.target));
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
  }
}

/**
 * @param {Array<Array>} arrays
 * @returns {Array<Array>}
 */
function zip(arrays) {
  return arrays.reduce((zipped, array) => array.map(
    (value, index) => [...(zipped[index] || []), value]
  ), [])
};

/**
 * @param {Config} config
 * @param {string} pitch
 * @returns {number}
 */
function pitchToSemitone(config, pitch) {
  const pitchAsFloat = parseFloat(pitch);
  if (!isNaN(pitchAsFloat)) {
    return pitchAsFloat.toFixed(2);
  }

  var letter;
  var octave;
  if (pitch.length > 1) {
    letter = pitch.slice(0, 1);
    octave = parseInt(pitch.slice(1));
  } else {
    letter = pitch;
    octave = 0;
  }

  const inSharp = config.sharp.includes(letter.toLowerCase());
  const inFlat = config.flat.includes(letter.toLowerCase());
  const delta = inSharp ? 1 : (inFlat ? -1 : 0);

  if (Object.keys(PITCHES).map(key => key.toLowerCase()).includes(letter))
    return PITCHES[letter.toUpperCase()] + config.transpose + octave * PITCH_OCTAVE + delta;

  if (Object.keys(PITCHES).includes(letter))
    return PITCHES[letter] + config.transpose + octave * PITCH_OCTAVE + (delta === 0 ? 1 : 0);

  throw new TypeError('Unrecognized pitch');
}
