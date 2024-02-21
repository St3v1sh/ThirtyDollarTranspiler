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
  /** @type {{ instrumentNotes: InstrumentNotes[], globalVolume: GlobalVolume, clear: Clear, tempo: Tempo }} */
  data = { instrumentNotes: [], globalVolume: undefined, clear: undefined, tempo: undefined };

  constructor () {
    super();
  }

  /**
   * @param {InstrumentNotes} instrumentNotes 
   */
  addInstrumentNotes (instrumentNotes) {
    this.data.instrumentNotes.push(instrumentNotes);
  }

  /**
   * @returns {InstrumentNotes | undefined}
   */
  getLastInstrumentNotes () {
    return this.data.instrumentNotes.length === 0 ? undefined : this.data.instrumentNotes[this.data.instrumentNotes.length - 1];
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

// InstrumentTracks contain InstrumentNotes, GlobalVolume, Clear, and Tempo.

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
}

class GlobalVolume extends TrackData {
  /** @type {number[]} */
  data = [];

  constructor () {
    super();
  }
}

class Clear extends TrackData {
  /** @type {string[]} */
  data = [];

  constructor () {
    super();
  }
}

class Tempo extends TrackData {
  /** @type {string[]} */
  data = [];

  constructor () {
    super();
  }
}