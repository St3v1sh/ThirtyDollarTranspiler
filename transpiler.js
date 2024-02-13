function transpile() {
    const input = document.getElementById('input').value;
    const lines = input.split('\n').map((line) => line.trim()).filter((line) => (line.length > 0 && !line.startsWith(SYMBOLS.COMMENT)));
    console.log(lines);
  }