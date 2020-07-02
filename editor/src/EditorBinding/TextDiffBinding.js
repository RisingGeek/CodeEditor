class TextDiffBinding {
  constructor(compoThis, doc, path, localPresence) {
    this.compoThis = compoThis || null;
    this.doc = doc;
    this.path = path || [];
    this.localPresence = localPresence;
    this.decorations = [];
    this.range = null;
  }

  onInput = (newValue, e) => {
    let previous = this.doc.data[this.path[0]];
    // Monaco Editor considers new line as \r\n.
    let value = newValue;
    if (previous === value) return;

    let start = 0;
    let end = 0;
    while (previous.charAt(start) === value.charAt(start)) {
      start++;
    }
    while (
      previous.charAt(previous.length - 1 - end) === value.charAt(value.length - 1 - end) &&
      end + start < previous.length &&
      end + start < value.length
    ) {
      end++;
    }
    if (previous.length !== start + end) {
      let removed = previous.slice(start, previous.length - end);
      this._remove(start, removed, e.changes[0].rangeOffset);
    }
    if (value.length !== start + end) {
      let inserted = value.slice(start, value.length - end);
      this._insert(start, inserted, e.changes[0].rangeOffset);
    }
  };

  _insert = (index, text, rangeOffset) => {
    let path = this.path.concat(index);
    let op = { p: path, si: text, rangeOffset: rangeOffset };
    this.doc.submitOp(op, { source: this });
  };

  _remove = (index, text, rangeOffset) => {
    let path = this.path.concat(index);
    let op = { p: path, sd: text, rangeOffset: rangeOffset };
    this.doc.submitOp(op, { source: this });
  };

  onInsert = (rangeOffset, length) => {
    this._transformSelectionAndUpdate(rangeOffset, length, this.insertCursorTransform);
  };
  insertCursorTransform = (rangeOffset, currStartOffset, currEndOffset, length) => {
    //rangeOffset->rangeOffset of editor which actually edited
    //cursorOffset->rangeOffset of my editor
    let offset = null;
    if (rangeOffset < currStartOffset) {
      offset = {
        startOffset: currStartOffset + length,
        endOffset: currEndOffset + length
      }
    }
    else {
      offset = {
        startOffset: currStartOffset,
        endOffset: currEndOffset > rangeOffset ? currEndOffset + length : currEndOffset
      }
    }
    return offset;
  }

  onRemove = (rangeOffset, length) => {
    this._transformSelectionAndUpdate(rangeOffset, length, this.removeCursorTransform);
  };
  removeCursorTransform = (rangeOffset, currStartOffset, currEndOffset, length) => {
    // rangeOffset, cursorOffset same as insertCursorTransform()
    // Taking minimum because if one user deletes text written by other(cursor position), 
    // cursorOffset will become -ve if we do cursorOffset-length
    let offset = null;
    if (rangeOffset < currStartOffset) {
      offset = {
        startOffset: currEndOffset < rangeOffset + length ? rangeOffset : currStartOffset - length,
        endOffset: currEndOffset < rangeOffset + length ? rangeOffset : currEndOffset - length
      }
    }
    else {
      offset = {
        startOffset: currStartOffset,
        endOffset: currEndOffset > rangeOffset ? rangeOffset : currEndOffset
      }
    }
    return offset;
  }

  _transformSelectionAndUpdate = (rangeOffset, length, transformCursor) => {
    let editor = this.compoThis.state.editor;
    let selection = editor.getSelection();
    let currStartOffset = editor.getModel().getOffsetAt({
      lineNumber: selection.startLineNumber,
      column: selection.startColumn
    });
    let currEndOffset = editor.getModel().getOffsetAt({
      lineNumber: selection.endLineNumber,
      column: selection.endColumn
    });

    let offset = transformCursor(rangeOffset, currStartOffset, currEndOffset, length);
    this.update();
    editor.setSelection(new this.compoThis.state.monaco.Range(
      editor.getModel().getPositionAt(offset.startOffset).lineNumber,
      editor.getModel().getPositionAt(offset.startOffset).column,
      editor.getModel().getPositionAt(offset.endOffset).lineNumber,
      editor.getModel().getPositionAt(offset.endOffset).column)
    );
  };

  update = (isSetup) => {
    let value = this.doc.data[this.path[0]];
    this.compoThis.setState({ code: value }, () => {
      // Update peer cursor
      if (this.range) {
        // let range = this.compoThis.state.range;
        let isPos = this.range.startLineNumber === this.range.endLineNumber &&
          this.range.startColumn === this.range.endColumn;
        this.decorations = this.compoThis.state.editor.deltaDecorations(this.decorations, [
          {
            range: new this.compoThis.state.monaco.Range(this.range.startLineNumber, 
              this.range.startColumn,this.range.endLineNumber, this.range.endColumn),
            options: { className: isPos ? 'cursor-position' : 'cursor-selection' }
          }
        ]);
      }
    });
  };

}
export default TextDiffBinding;

// This code has been modified to support Monaco Editor.
// Original code of StringBinding is present at https://github.com/share/text-diff-binding