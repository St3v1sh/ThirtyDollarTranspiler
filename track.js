// TrackPieces types: Section, Segment, and Singleton.

/**
 * @abstract
 */
class TrackPiece {
  constructor () {
    if (new.target === TrackPiece)
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

class Section extends TrackPiece {
  /** @type {TrackData[]} */
  data;

  constructor () {
    super();
  }
}

class Segment extends TrackPiece {
  /** @type {Section[]} */
  data;

  /** @type {string} */
  alias;

  /** @type {number} */
  label;

  /** @type {number[]} */
  prepend;

  /** @type {number[]} */
  append;

  constructor () {
    super();
  }
}

class Singleton extends TrackPiece {
  /** @type {TrackData} */
  data;

  constructor () {
    super();
  }
}

// TrackData types: Div, Instrument, GlobalVolume, Clear, Tempo, Goto, Label

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

class Div extends TrackData {
  /** @type {string} */
  data;

  constructor () {
    super();
  }
}

class Instrument extends TrackData {
  /** @type {{ pitchData: string[], volumeData: number[] }} */
  data = { pitchData, volumeData }

  constructor () {
    super();
  }
}

class GlobalVolume extends TrackData {
  /** @type {number[]} */
  data;

  constructor () {
    super();
  }
}

class Clear extends TrackData {
  /** @type {string[]} */
  data;

  constructor () {
    super();
  }
}

class Tempo extends TrackData {
  /** @type {string[]} */
  data;

  constructor () {
    super();
  }
}

class Goto extends TrackData {
  /** @type {number} */
  data;

  constructor () {
    super();
  }
}

class Label extends TrackData {
  /** @type {number} */
  data;

  constructor () {
    super();
  }
}
