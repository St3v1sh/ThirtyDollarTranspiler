class InstrumentConfig {
  /**
   * @param {{
   *  name: string,
   *  instrument: string,
   *  defaultVolume: string,
   *  defaultPitch: string,
   * } | {}} config 
   */
  constructor(config) {
    const { name = '', instrument = '', defaultVolume = '100', defaultKey: defaultPitch = 'c' } = config || {};
    /** @type {string} */
    this.name = name;

    /** @type {string} */
    this.instrument = instrument;

    /** @type {string} */
    this.defaultVolume = defaultVolume;

    /** @type {string} */
    this.defaultPitch = defaultPitch;
  }
}

class Config {
  /**
   * @param {{
   *  name: string,
   *  bpm: string,
   *  sharp: string[],
   *  flat: string[],
   *  transpose: number,
   *  instrumentConfigs: InstrumentConfig[],
   * } | {}} config 
   */
  constructor(config) {
    const { name = 'untitled', bpm = '140', sharp = [], flat = [], transpose = 0, instrumentConfigs = [] } = config || {};
    /** @type {string} */
    this.name = name;

    /** @type {string} */
    this.bpm = bpm;

    /** @type {string[]} */
    this.sharp = sharp;

    /** @type {string[]} */
    this.flat = flat;

    /** @type {number} */
    this.transpose = transpose;
    
    /** @type {InstrumentConfig[]} */
    this.instrumentConfigs = instrumentConfigs;
  }

  /**
   * @param {string} name
   * @returns {InstrumentConfig | undefined}
   */
  findInstrument(name) {
    const filterResult = this.instrumentConfigs.filter(instrumentConfig => instrumentConfig.name === name)
    return filterResult.length > 0 ? filterResult[0] : undefined;
  }
}
