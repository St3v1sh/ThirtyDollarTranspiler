class InstrumentConfig {
    constructor (config) {
      const {name = '', instrument = '', defaultVolume = '100', defaultKey = PITCHES.C} = config || {};
      this.name = name;
      this.instrument = instrument;
      this.defaultVolume = defaultVolume;
      this.defaultKey = defaultKey;
    }
  }
  
  class Config {
    constructor (config) {
      const {name = 'untitled', bpm = '140', sharp = [], flat = [], transpose = 0, instrumentConfigs = []} = config || {};
      this.name = name;
      this.bpm = bpm;
      this.sharp = sharp;
      this.flat = flat;
      this.transpose = transpose;
      this.instrumentConfigs = instrumentConfigs;
    }
  }