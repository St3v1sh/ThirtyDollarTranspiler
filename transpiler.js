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
    const pieces = line.split(' ').filter(piece => piece.length > 0);
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
        reportWarning(`Unrecognized config option "${command}" ignored.`);
      }
    }
  });

  // Generate song data structures.

  /** @type {TrackPiece[]} */
  var track = [];

  var section = new Section();
  var instrumentTrack = new InstrumentTrack(config);
  var segment;
  var isInSegment = false;
  var gotoCounter = 1;

  const finalizeInstrumentTrack = () => {
    if (!instrumentTrack.getLastInstrumentNotes())
      return;

    section.addData(instrumentTrack);
    instrumentTrack = new InstrumentTrack(config);
  };

  for (const line of songLines) {
    const [commands, ...trackArgs] = line.split(SYMBOLS.SONG.DELIMITER).map(arg => arg.trim());

    // Handle non-delimiter symbols.
    if (trackArgs.length === 0) {
      const [first, ...rest] = commands.split(' ').filter(command => command.length > 0);
      switch (first) {
        // div.
        case SYMBOLS.SONG.DIVIDER: {
          if (rest.length !== 0) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.DIVIDER} expects no parameters.`);
            return;
          }

          finalizeInstrumentTrack();
          section.addData(new Divider());
          break;
        }

        // segstart [alias].
        case SYMBOLS.SONG.SEGMENT_START: {
          if (rest.length !== 1) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT_START} expects exactly one label.`);
            return;
          }
          if (isInSegment) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT_START} cannot be nested.`);
            return;
          }

          const [alias] = rest;
          if (findSegment(track, alias)) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT_START} ${alias} has already been already defined.`);
            return;
          }

          isInSegment = true;
          finalizeInstrumentTrack();

          if (section.hasData()) {
            track.push(section);
            section = new Section();
          }

          segment = new Segment();

          segment.alias = alias;
          segment.label = gotoCounter;
          gotoCounter++;
          break;
        }

        // segend.
        case SYMBOLS.SONG.SEGMENT_END: {
          if (rest.length !== 0) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT_END} expects no parameters.`);
            return;
          }
          if (!isInSegment) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT_END} has no ${SYMBOLS.SONG.SEGMENT_START} to end.`);
            return;
          }
          isInSegment = false;
          finalizeInstrumentTrack();

          if (section.hasData()) {
            segment.addData(section);
            section = new Section();
          }
          track.push(segment);
          break;
        }

        // seg [alias].
        case SYMBOLS.SONG.SEGMENT: {
          if (rest.length !== 1) {
            reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.SEGMENT} expects exactly one label.`);
            return;
          }
          if (isInSegment) {
            reportError(`Invalid track at "${commands}", Cannot play segments inside segments.`);
            return;
          }

          const [alias] = rest;
          const foundSegment = findSegment(track, alias);
          if (!foundSegment) {
            reportError(`Invalid track at "${commands}", no segment with alias "${alias}" found.`);
            return;
          }

          finalizeInstrumentTrack();
          section.addData(new Goto(gotoCounter));
          foundSegment.addPrepend(new Label(gotoCounter));
          gotoCounter++;
          section.addData(new Label(gotoCounter));
          foundSegment.addAppend(new Goto(gotoCounter));
          gotoCounter++;
          break;
        }

        default: {
          reportError(`Invalid track at "${commands}", unrecognized symbol "${first}" found.`);
          return;
        }
      }
      continue;
    }

    if (trackArgs.length !== 1) {
      reportError(`Invalid track at "${line}", stray ${SYMBOLS.SONG.DELIMITER} symbol found.`);
      return;
    }

    // Handle delimiter symbols.
    const [first, ...rest] = commands.split(' ').filter(command => command.length > 0);
    switch (first) {
      // inst.
      case SYMBOLS.SONG.INSTRUMENT: {
        if (rest.length !== 1) {
          reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.INSTRUMENT} expects exactly one instrument name.`);
          return;
        }

        const [instrumentName] = rest;
        const instrument = config.findInstrument(instrumentName);
        if (!instrument) {
          reportError(`Invalid track at "${commands}", unrecognized instrument name "${instrumentName}" cannot be played.`);
          return;
        }

        const [rawNotes] = trackArgs;
        const notes = rawNotes.split(' ').filter(note => note.length > 0);
        if (notes.some(note => !(REGEX.PITCH_WITH_OCTAVE.test(note) || note === SYMBOLS.NOTES.REST || note === SYMBOLS.NOTES.DEFAULT))) {
          reportError(`Invalid track at "${line}", unrecognized note found.`);
          return;
        }

        const lastInstrumentNotes = instrumentTrack.getLastInstrumentNotes();
        if (lastInstrumentNotes && lastInstrumentNotes.getPitchData().length !== notes.length) {
          reportError(`Invalid track at "${line}", notes length does not match with the previous instrument's notes length.`);
          return;
        }

        const instrumentNotes = new InstrumentNotes();
        instrumentNotes.setInstrumentConfig(instrument);
        instrumentNotes.setPitchData(notes);
        instrumentTrack.addInstrumentNotes(instrumentNotes);
        break;
      }

      // vol.
      case SYMBOLS.SONG.VOLUME: {
        if (rest.length !== 0) {
          reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.VOLUME} does not expect these additional parameters "${rest.join(', ')}".`);
          return;
        }

        const lastInstrumentNotes = instrumentTrack.getLastInstrumentNotes();
        if (!lastInstrumentNotes) {
          reportError(`Invalid track at "${commands}", there is no instrument to modify.`);
          return;
        }

        const [rawNotes] = trackArgs;
        const notes = rawNotes.split(' ').filter(note => note.length > 0);
        if (notes.some(note => !(REGEX.NON_NEGATIVE_DECIMAL_NUMBER.test(note) || note === SYMBOLS.NOTES.REST || note === SYMBOLS.NOTES.DEFAULT))) {
          reportError(`Invalid track at "${line}", invalid volume specified.`);
          return;
        }

        if (lastInstrumentNotes.getVolumeData().length !== 0)
          reportWarning(`Volume data is being overridden for instrument "${lastInstrumentNotes.getInstrumentConfig()}" on line "${line}".`);

        const pitchesLength = lastInstrumentNotes.getPitchData().length;
        lastInstrumentNotes.setVolumeData([...notes.slice(0, pitchesLength), ...Array(Math.max(0, pitchesLength - notes.length)).fill(SYMBOLS.NOTES.REST)]);
        break;
      }

      // gvol.
      case SYMBOLS.SONG.GLOBAL_VOLUME: {
        if (rest.length !== 0) {
          reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.GLOBAL_VOLUME} does not expect these additional parameters "${rest}".`);
          return;
        }

        const lastInstrumentNotes = instrumentTrack.getLastInstrumentNotes();
        if (!lastInstrumentNotes) {
          reportError(`Invalid track at "${commands}", there is no instrument to modify.`);
          return;
        }

        const [rawNotes] = trackArgs;
        const notes = rawNotes.split(' ').filter(note => note.length > 0);
        if (notes.some(note => !(REGEX.DECIMAL_NUMBER_OR_MULTIPLIER.test(note) || note === SYMBOLS.NOTES.REST || note === SYMBOLS.NOTES.DEFAULT))) {
          reportError(`Invalid track at "${line}", invalid global volume specified.`);
          return;
        }

        if (instrumentTrack.getGlobalVolume().length !== 0)
          reportWarning(`Global volume data is being overridden for instrument "${lastInstrumentNotes.getInstrumentConfig()}" on line "${line}".`);

        const pitchesLength = lastInstrumentNotes.getPitchData().length;
        instrumentTrack.setGlobalVolume([...notes.slice(0, pitchesLength), ...Array(Math.max(0, pitchesLength - notes.length)).fill(SYMBOLS.NOTES.REST)]);
        break;
      }

      // clear.
      case SYMBOLS.SONG.CLEAR: {
        if (rest.length !== 0) {
          reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.CLEAR} does not expect these additional parameters "${rest}".`);
          return;
        }

        const lastInstrumentNotes = instrumentTrack.getLastInstrumentNotes();
        if (!lastInstrumentNotes) {
          reportError(`Invalid track at "${commands}", there is no instrument to modify.`);
          return;
        }

        const [rawNotes] = trackArgs;
        const notes = rawNotes.split(' ').filter(note => note.length > 0);
        if (notes.some(note => !(note === SYMBOLS.NOTES.REST || note === SYMBOLS.NOTES.DEFAULT))) {
          reportError(`Invalid track at "${line}", invalid clear specified.`);
          return;
        }

        if (instrumentTrack.getClear().length !== 0)
          reportWarning(`Clear notes are being overridden for instrument "${lastInstrumentNotes.getInstrumentConfig()}" on line "${line}".`);

        const pitchesLength = lastInstrumentNotes.getPitchData().length;
        instrumentTrack.setClear([...notes.slice(0, pitchesLength), ...Array(Math.max(0, pitchesLength - notes.length)).fill(SYMBOLS.NOTES.REST)]);
        break;
      }

      // tempo.
      case SYMBOLS.SONG.TEMPO: {
        if (rest.length !== 0) {
          reportError(`Invalid track at "${commands}", ${SYMBOLS.SONG.TEMPO} does not expect these additional parameters "${rest}".`);
          return;
        }

        const lastInstrumentNotes = instrumentTrack.getLastInstrumentNotes();
        if (!lastInstrumentNotes) {
          reportError(`Invalid track at "${commands}", there is no instrument to modify.`);
          return;
        }

        const [rawNotes] = trackArgs;
        const notes = rawNotes.split(' ').filter(note => note.length > 0);
        if (notes.some(note => !(REGEX.DECIMAL_NUMBER_OR_MULTIPLIER.test(note) || note === SYMBOLS.NOTES.REST || note === SYMBOLS.NOTES.DEFAULT))) {
          reportError(`Invalid track at "${line}", invalid tempo specified.`);
          return;
        }

        if (instrumentTrack.getTempo().length !== 0)
          reportWarning(`Tempo data is being overridden for instrument "${lastInstrumentNotes.getInstrumentConfig()}" on line "${line}".`);

        const pitchesLength = lastInstrumentNotes.getPitchData().length;
        instrumentTrack.setTempo([...notes.slice(0, pitchesLength), ...Array(Math.max(0, pitchesLength - notes.length)).fill(SYMBOLS.NOTES.REST)]);
        break;
      }

      default: {
        reportError(`Invalid track at "${commands}", unrecognized symbol "${first}" found.`);
        return;
      }
    }
  }

  if (isInSegment) {
    reportError(`Invalid track, end of file reached but the last segment was never ended.`);
    return;
  }

  finalizeInstrumentTrack();
  if (section.hasData())
    track.push(section);

  // Transpile the song to moyai format.
  const output = track.map(trackPiece => trackPiece.toString()).join(SYMBOLS.TRANSLATION.NOTE_DELIMITER);
  console.log(output);

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
      if (config.findInstrument(name))
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

/**
 * @param {TrackPiece[]} track 
 * @param {string} alias 
 * @returns {Segment | undefined}
 */
function findSegment(track, alias) {
  const segment = track.filter(trackPiece => trackPiece instanceof Segment && trackPiece.alias === alias);
  return segment.length > 0 ? segment[0] : undefined;
}
