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
    pieces = line.split(' ');
    // Configs need at least two parameters.
    if (pieces.length < 2) {
      reportWarning(`Bad config "${line}" ignored.`);
      return;
    }

    [command, ...args] = pieces;
    switch (command) {
      case SYMBOLS.CONFIG.NAME:
        config.name = args[0];
        break;
      case SYMBOLS.CONFIG.BPM:
        break;
      case SYMBOLS.CONFIG.TRANSPOSE:
        break;
      case SYMBOLS.CONFIG.SHARP:
        break;
      case SYMBOLS.CONFIG.FLAT:
        break;
      case SYMBOLS.INSTRUMENTS.INSTRUMENT:
        break;
      default:
        reportWarning(`Bad config "${line}" ignored.`);
    }
  });

  reportOK('Song successfully transpiled.');
}