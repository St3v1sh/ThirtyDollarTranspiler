// TrackPieces types: Section and Segment.

/**
 * @abstract
 */
class TrackPiece {
  constructor() {
    if (new.target === TrackPiece)
      throw new TypeError('Cannot instantiate an abstract class');
  }

  /** @abstract */
  addData() {
    throw new Error('Abstract method is not implemented');
  }

  /**
   * @abstract
   * @returns {string}
   */
  toString() {
    throw new Error('Abstract method is not implemented');
  }
}

class Section extends TrackPiece {
  /** @type {TrackData[]} */
  data = [];

  constructor() {
    super();
  }

  /**
   * @param {TrackData} trackData
   */
  addData(trackData) {
    this.data.push(trackData);
  }

  /**
   * @returns {boolean}
   */
  hasData() {
    return this.data.length !== 0;
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.data.map(trackData => trackData.toString()).join(SYMBOLS.TRANSLATION.NOTE_DELIMITER);
  }
}

class Segment extends TrackPiece {
  /** @type {Section[]} */
  data = [];

  /** @type {string} */
  alias;

  /** @type {number} */
  label;

  /** @type {Label[]} */
  prepend = [];

  /** @type {Goto[]} */
  append = [];

  constructor() {
    super();
  }

  /**
   * @param {Section} section
   */
  addData(section) {
    this.data.push(section);
  }

  /**
   * @param {Label} label
   */
  addPrepend(label) {
    this.prepend.push(label)
  }

  /**
   * @param {Goto} goto
   */
  addAppend(goto) {
    this.append.push(goto)
  }

  /**
   * @returns {string}
   */
  toString() {
    let pieces = [];

    pieces.push((new Goto(this.label)).toString());
    this.prepend.forEach(label => pieces.push(label.toString()));
    pieces.push(new Divider().toString());

    this.data.forEach(section => pieces.push(section.toString()));

    pieces.push(new Divider().toString());
    this.append.forEach(goto => pieces.push(goto.toString()));
    pieces.push((new Label(this.label)).toString());

    return pieces.join(SYMBOLS.TRANSLATION.NOTE_DELIMITER);
  }
}

// TrackData types: Divider, InstrumentTrack, Goto, and Label.

/**
 * @abstract
 */
class TrackData {
  constructor() {
    if (new.target === TrackData)
      throw new TypeError('Cannot instantiate an abstract class');
  }

  /**
   * @abstract
   * @returns {string}
   */
  toString() {
    throw new Error('Abstract method is not implemented');
  }
}

class Override extends TrackData {
  /**
   * @param {string} data
   */
  constructor(data) {
    super();
    this.data = data;
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.data;
  }
}

class Divider extends TrackData {
  constructor() {
    super();
  }

  /**
   * @returns {string}
   */
  toString() {
    return SYMBOLS.TRANSLATION.DIVIDER;
  }
}

class InstrumentTrack extends TrackData {
  /** @type {{ config: Config, instrumentNotes: InstrumentNotes[], globalVolume: string[], clear: string[], tempo: string[] }} */
  data = { config: undefined, instrumentNotes: [], globalVolume: [], clear: [], tempo: [] };

  /**
   * @param {Config} config
   */
  constructor(config) {
    super();
    this.data.config = config;
  }

  /**
   * @param {InstrumentNotes} instrumentNotes
   */
  addInstrumentNotes(instrumentNotes) {
    this.data.instrumentNotes.push(instrumentNotes);
  }

  /**
   * @returns {InstrumentNotes | undefined}
   */
  getLastInstrumentNotes() {
    return this.data.instrumentNotes.length === 0 ? undefined : this.data.instrumentNotes[this.data.instrumentNotes.length - 1];
  }

  /**
   * @param {string[]} globalVolume
   */
  setGlobalVolume(globalVolume) {
    this.data.globalVolume = globalVolume;
  }

  /**
   * @returns {string[]}
   */
  getGlobalVolume() {
    return this.data.globalVolume;
  }

  /**
   * @param {string[]} clear
   */
  setClear(clear) {
    this.data.clear = clear;
  }

  /**
   * @returns {string[]}
   */
  getClear() {
    return this.data.clear;
  }

  /**
   * @param {string[]} tempo
   */
  setTempo(tempo) {
    this.data.tempo = tempo;
  }

  /**
   * @returns {string[]}
   */
  getTempo() {
    return this.data.tempo;
  }

  /**
   * @returns {string}
   */
  toString() {
    let pieces = [];

    // Order of operations: Tempo > Global Volume > Instruments > Clear.

    let lastVolumes = [];
    const zippedInstrumentNotes = zip(this.data.instrumentNotes.map((instrumentNotes => instrumentNotes.getZippedData())));
    zip([
      this.data.tempo.length === 0 ?
        Array(zippedInstrumentNotes.length).fill(SYMBOLS.NOTES.REST) : this.data.tempo,

      this.data.globalVolume.length === 0 ?
        Array(zippedInstrumentNotes.length).fill(SYMBOLS.NOTES.REST) : this.data.globalVolume,

      zippedInstrumentNotes,

      this.data.clear.length === 0 ?
        Array(zippedInstrumentNotes.length).fill(SYMBOLS.NOTES.REST) : this.data.clear
    ]).forEach(([tempo, globalVolume, zippedNotes, clear]) => {
      // Tempo.
      if (tempo === SYMBOLS.NOTES.DEFAULT) {
        pieces.push(SYMBOLS.TRANSLATION.TEMPO + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + this.data.config.bpm);
      } else if (tempo.slice(-1) === SYMBOLS.NOTES.MULTIPLY_TAG) {
        pieces.push(SYMBOLS.TRANSLATION.TEMPO + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + tempo.slice(0, -1) + SYMBOLS.TRANSLATION.TEMPO_MULTIPLY_TAG);
      } else if (tempo !== SYMBOLS.NOTES.REST) {
        pieces.push(SYMBOLS.TRANSLATION.TEMPO + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + tempo);
      }

      // Global Volume.
      if (globalVolume === SYMBOLS.NOTES.DEFAULT) {
        pieces.push(SYMBOLS.TRANSLATION.GLOBAL_VOLUME + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + '100');
      } else if (globalVolume.slice(-1) === SYMBOLS.NOTES.MULTIPLY_TAG) {
        pieces.push(SYMBOLS.TRANSLATION.GLOBAL_VOLUME + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + globalVolume.slice(0, -1) + SYMBOLS.TRANSLATION.TEMPO_MULTIPLY_TAG);
      } else if (globalVolume !== SYMBOLS.NOTES.REST) {
        pieces.push(SYMBOLS.TRANSLATION.GLOBAL_VOLUME + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + globalVolume);
      }

      // Instruments.
      if (lastVolumes.length === 0)
        lastVolumes = Array(zippedNotes.length).fill('');

      let notePieces = [];
      let ghostPieces = 0;
      zippedNotes.forEach(([instrumentConfig, pitch, volume, ghostLevel], index) => {
        if (lastVolumes[index] === '')
          lastVolumes[index] = instrumentConfig.defaultVolume;

        let semitone;
        if (pitch === SYMBOLS.NOTES.DEFAULT) {
          semitone = pitchToSemitone(this.data.config, instrumentConfig.defaultPitch, instrumentConfig.defaultTranspose);
        } else if (pitch !== SYMBOLS.NOTES.REST) {
          semitone = pitchToSemitone(this.data.config, pitch, instrumentConfig.defaultTranspose);
        }

        let finalVolume = lastVolumes[index];
        if (volume === SYMBOLS.NOTES.DEFAULT) {
          finalVolume = instrumentConfig.defaultVolume;
          lastVolumes[index] = finalVolume;
        } else if (volume !== SYMBOLS.NOTES.REST) {
          finalVolume = volume;
          lastVolumes[index] = finalVolume;
        }

        if (semitone === undefined)
          return;

        const outputVolumeText = (finalVolume === '100' ? '' : (SYMBOLS.TRANSLATION.VOLUME_DELIMITER + finalVolume));
        if (ghostLevel > 0) {
          const ghostPrefix = SYMBOLS.TRANSLATION.GOTO + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + g_gotoCounter + SYMBOLS.TRANSLATION.NOTE_DELIMITER;
          const ghostPostfix = SYMBOLS.TRANSLATION.NOTE_DELIMITER + SYMBOLS.TRANSLATION.COMBINE + SYMBOLS.TRANSLATION.NOTE_DELIMITER + SYMBOLS.TRANSLATION.LABEL + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + g_gotoCounter;
          notePieces.push(ghostPrefix + instrumentConfig.instrument + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + semitone.toString() + outputVolumeText + ghostPostfix);
          g_gotoCounter++;
          ghostPieces++;
        } else {
          notePieces.push(instrumentConfig.instrument + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + semitone.toString() + outputVolumeText);
        }
      });

      if (notePieces.length === 0) {
        pieces.push(SYMBOLS.TRANSLATION.REST);
      } else {
        const ghostRest = notePieces.length === ghostPieces ? SYMBOLS.TRANSLATION.NOTE_DELIMITER + SYMBOLS.TRANSLATION.REST + SYMBOLS.TRANSLATION.NOTE_DELIMITER : '';
        pieces.push(notePieces.join(SYMBOLS.TRANSLATION.NOTE_DELIMITER + SYMBOLS.TRANSLATION.COMBINE + SYMBOLS.TRANSLATION.NOTE_DELIMITER) + ghostRest);
      }

      // Clear.
      if (clear === SYMBOLS.NOTES.DEFAULT) {
        pieces.push(SYMBOLS.TRANSLATION.CLEAR);
      }
    });

    return pieces.join(SYMBOLS.TRANSLATION.NOTE_DELIMITER);
  }
}

class Goto extends TrackData {
  /**
   * @param {number} data
   */
  constructor(data) {
    super();
    this.data = data;
  }

  /**
   * @returns {string}
   */
  toString() {
    return SYMBOLS.TRANSLATION.GOTO + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + this.data.toString();
  }
}

class Label extends TrackData {
  /**
   * @param {number} data
   */
  constructor(data) {
    super();
    this.data = data;
  }

  /**
   * @returns {string}
   */
  toString() {
    return SYMBOLS.TRANSLATION.LABEL + SYMBOLS.TRANSLATION.GENERAL_DELIMITER + this.data.toString();
  }
}

// InstrumentTracks contain InstrumentNotes.

class InstrumentNotes {
  /** @type {{ instrumentConfig: InstrumentConfig, pitchData: string[], volumeData: string[], ghostLevel: number }} */
  data = { instrumentConfig: undefined, pitchData: [], volumeData: [], ghostLevel: 0 };

  constructor() { }

  /**
   * @param {InstrumentConfig} instrumentConfig
   */
  setInstrumentConfig(instrumentConfig) {
    this.data.instrumentConfig = instrumentConfig;
  }

  /**
   * @returns {InstrumentConfig | undefined}
   */
  getInstrumentConfig() {
    return this.data.instrumentConfig;
  }

  /**
   * @param {string[]} pitchData
   */
  setPitchData(pitchData) {
    this.data.pitchData = pitchData;
  }

  /**
   * @returns {string[]}
   */
  getPitchData() {
    return this.data.pitchData;
  }

  /**
   * @param {string[]} volumeData
   */
  setVolumeData(volumeData) {
    this.data.volumeData = volumeData;
  }

  /**
   * @returns {string[]}
   */
  getVolumeData() {
    return this.data.volumeData;
  }

  /**
   * @param {number} ghostLevel
   */
  setGhostLevel(ghostLevel) {
    this.data.ghostLevel = ghostLevel;
  }

  /**
   * @returns {number}
   */
  getGhostLevel() {
    return this.data.ghostLevel;
  }

  /**
   * @returns {[InstrumentConfig[], string[], string[], number[]]}
   */
  getZippedData() {
    return zip([
      Array(this.data.pitchData.length).fill(this.data.instrumentConfig),

      this.data.pitchData,

      this.data.volumeData.length === 0 ?
        Array(this.data.pitchData.length).fill(SYMBOLS.NOTES.REST) : this.data.volumeData,

      Array(this.data.pitchData.length).fill(this.data.ghostLevel)
    ]);
  }
}
