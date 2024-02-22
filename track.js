// TrackPieces types: Section and Segment.

/**
 * @abstract
 */
class TrackPiece {
  constructor () {
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

  constructor () {
    super();
  }

  /**
   * @param {TrackData} trackData 
   */
  addData(trackData) {
    this.data.push(trackData);
  }
}

class Segment extends TrackPiece {
  /** @type {Section[]} */
  data = [];

  /** @type {string} */
  alias;

  /** @type {number} */
  label;

  /** @type {number[]} */
  prepend = [];

  /** @type {number[]} */
  append = [];

  constructor () {
    super();
  }

  /**
   * @param {Section} section 
   */
  addData(section) {
    this.data.push(section);
  }

  /**
   * @param {number} label 
   */
  addPrepend(label) {
    this.prepend.push(label)
  }

  /**
   * @param {number} label 
   */
  addAppend(label) {
    this.append.push(label)
  }
}

// TrackData types: Divider, InstrumentTrack, Goto, and Label.

/**
 * @abstract
 */
class TrackData {
  constructor () {
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

class Divider extends TrackData {
  constructor () {
    super();
  }
}

class InstrumentTrack extends TrackData {
  /** @type {{ instrumentNotes: InstrumentNotes[], globalVolume: string[], clear: string[], tempo: string[] }} */
  data = { instrumentNotes: [], globalVolume: [], clear: [], tempo: [] };

  constructor () {
    super();
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
}

class Goto extends TrackData {
  /**
   * @param {number} data 
   */
  constructor (data) {
    super();
    this.data = data;
  }
}

class Label extends TrackData {
  /**
   * @param {number} data 
   */
  constructor (data) {
    super();
    this.data = data;
  }
}

// InstrumentTracks contain InstrumentNotes.

class InstrumentNotes extends TrackData {
  /** @type {{ name: string, pitchData: string[], volumeData: string[] }} */
  data = { name: undefined, pitchData: [], volumeData: [] };

  constructor () {
    super();
  }

  /**
   * @param {string} name 
   */
  setName(name) {
    this.data.name = name;
  }

  /**
   * @returns {string}
   */
  getName() {
    return this.data.name;
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
}
