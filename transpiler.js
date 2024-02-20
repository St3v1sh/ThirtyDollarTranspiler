function transpile() {
  const input = document.getElementById('input').value;
  const lines = input.split('\n').map((line) => line.trim()).filter((line) => (line.length > 0 && !line.startsWith(SYMBOLS.COMMENT)));

  const songStartIndex = lines.indexOf(SYMBOLS.SONG.START);
  if (songStartIndex === -1) {
    reportError(`No song found. Use the "${SYMBOLS.SONG.START}" keyword to define the song.`);
    return;
  }

  const configLines = lines.slice(0, songStartIndex);
  const songLines = lines.slice(songStartIndex + 1);

  // Config setup.
  const config = new Config();

  configLines.forEach(line => {
    const pieces = line.split(' ');
    // Configs need at least two parameters.
    if (pieces.length < 2) {
      reportWarning(`Invalid config line "${line}" ignored.`);
      return;
    }

    const [command, ...args] = pieces;
    switch (command) {
      case SYMBOLS.CONFIG.NAME: {
        config.name = args[0];
        break;
      }
      case SYMBOLS.CONFIG.BPM: {
        config.bpm = args[0];
        break;
      }
      case SYMBOLS.CONFIG.TRANSPOSE: {
        config.transpose = parseInt(args[0]);
        break;
      }
      case SYMBOLS.CONFIG.SHARP: {
        if (config.flat.length > 0) {
          reportWarning(`Flats config are already defined, sharps config "${args}" ignored.`);
          break;
        }
        if (args.some((note) => !REGEX.PITCH_WITHOUT_OCTAVE_LOWERCASE.test(note))) {
          reportWarning(`Invalid pitch in sharps config "${args}", all notes ignored.`);
          break;
        }
        config.sharp = args;
        break;
      }
      case SYMBOLS.CONFIG.FLAT: {
        if (config.sharp.length > 0) {
          reportWarning(`Sharps config are already defined, flats config "${args}" ignored.`);
          break;
        }
        if (args.some((note) => !REGEX.PITCH_WITHOUT_OCTAVE_LOWERCASE.test(note))) {
          reportWarning(`Invalid pitch in flats config "${args}", all notes ignored.`);
          break;
        }
        config.flat = args;
        break;
      }
      case SYMBOLS.INSTRUMENTS.INSTRUMENT: {
        // inst configs must have exactly 3 arguments.
        if (args.length !== 3) {
          reportWarning(`Invalid instrument config "${line}" ignored.`);
          break;
        }

        const [instrumentName, instrumentCommand, instrumentValue] = args.map((symbol) => symbol.trim());
        const parseResult = parseInstrumentConfig(config, instrumentName, instrumentCommand, instrumentValue);
        if (!parseResult.success)
          reportWarning(parseResult.message);
        break;
      }
      default: {
        reportWarning(`Invalid config option "${command}" ignored.`);
      }
    }
  });
  console.log(config.name, config.bpm, config.sharp, config.flat, config.transpose, config.instrumentConfigs);

  reportOK('Song successfully transpiled.');
}

/**
 * @param {Config} config 
 * @param {string} name 
 * @param {string} command 
 * @param {string} value 
 * @returns {{
 *  success: boolean,
 *  message: string,
 * }}
 */
function parseInstrumentConfig(config, name, command, value) {
  switch (command) {
    case SYMBOLS.INSTRUMENTS.SET: {
      if (config.instrumentConfigs.some((instrumentConfig) => instrumentConfig.name === name))
        return { success: false, message: `Repeated setting of instrument name "${name}" ignored.` };

      const instrumentConfig = new InstrumentConfig();
      instrumentConfig.name = name;
      instrumentConfig.instrument = value;
      config.instrumentConfigs.push(instrumentConfig);
      break;
    }
    case SYMBOLS.INSTRUMENTS.VOLUME: {
      const instrumentConfig = config.findInstrument(name);
      if (!instrumentConfig)
        return { success: false, message: `No instrument named "${name}", default volume config ignored.` };
      if (!REGEX.NON_NEGATIVE_DECIMAL_NUMBER.test(value))
        return { success: false, message: `Invalid volume "${value}", default volume config ignored.` };

      instrumentConfig.defaultVolume = value;
      break;
    }
    case SYMBOLS.INSTRUMENTS.PITCH: {
      const instrumentConfig = config.findInstrument(name);
      if (!instrumentConfig)
        return { success: false, message: `No instrument named "${name}", default pitch config ignored.` };
      if (!REGEX.PITCH_WITH_OCTAVE.test(value))
        return { success: false, message: `Invalid pitch "${value}", default pitch config ignored.` };

      instrumentConfig.defaultPitch = value;
      break;
    }
    default: {
      return { success: false, message: `Unrecognized instrument command "${command}" ignored.` };
    }
  }
  return { success: true, message: '' };
}
