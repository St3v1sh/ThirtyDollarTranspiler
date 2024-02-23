# ThirtyDollarTextTranspiler

This application assists in making [thirtydollar.website](https://thirtydollar.website/) songs by allowing the process to be done with a text editor instead of messing around with emojis on a website.

Paste the contents of dancing-in-the-moonlight.moyai into index.html to see an example.

## Text Editor Features
- Hide and show line numbers
- Visible highlighted space characters
- Adjustable undo stack size
- Adjustable font size
- Adjustable tab size
- New line indent preservation
- Line cut and line paste
- Intuitive block selection cursor positioning
- White space and word backspace delete
- Multi-line tab indenting and outdenting
- Space replacing (default off)
- Editor color themes

## Transpiler
The moyai file has two sections: configurations and song

### Note Syntax
Notes are a key followed optionally by a non-negative octave number. If no octave number is provided, it's assumed to be 0. For example:
- `c` `c0` `a5` `g10`

There is also the default note and the rest note, notated by `/` and `.`, to play the default pitch of an instrument and to signal no action, respectively.

Some instrument modifiers accept multipliers, notated by an integer or decimal number followed by an `x`. For example:
- `2x` `1.5x` `.5x`

### Configurations Section Symbols
General song configuration:
- `name [songname]` Define the song's name
- `bpm [value]` Define the song's BPM
- `sharp [f] [c] [...]` Define the song's scale using sharp notes
- `flat [a] [b] [e] [...]` Define the song's scale using flat notes
- `transpose [value]` Define the semitone offset

Instruments configuration:
- `inst [alias] set [instrument]` Define an alias for an instrument
- `inst [alias] vol [value]` Define the default volume for an instrument
- `inst [alias] pit [note]` Define the default pitch for an instrument

### Song Section Symbols
- `start` Defines the start of the song section
- `tempo: [vlaue] [or .] [or /] [or multiplier] [...]` Modifies the global tempo of the entire track
- `gvol: [value] [or .] [or /] [or multiplier] [...]` Modifies the global volume of the entire track
- `inst [alias]: [note] [or .] [or /] [...]` Defines an instrument track
- `vol: [value] [or .] [or /] [...]` Modifies the volume of the last instrument track
- `clear: [.] [or /] [...]` Defines when to clear any notes currently playing

Song section symbols have an order of operation:

`tempo > gvol > inst > clear`

Segments allow the reuse of repeated song sections. Segments cannot be nested or called within other segments.
- `segstart [label]` Defines the start of a segment
- `segend` Defines the end of the segment
- `seg [label]` Plays a previously defined segment

A divider is used only for organization purposes, defined alone on its own line as `div`.
