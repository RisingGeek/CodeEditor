import TextDiffBinding from './textDiffBinding';

class StringBinding extends TextDiffBinding {
  setup = () => {
    this.update(true);
    let state = this.compoThis.state;
    let docData = this.doc.data;
    this.updateInput(state.input, docData.input[0]);
    this.updateOutput(state.output, docData.output[0]);
    this.attachDoc();
    this.attachElement();
  };

  destroy = () => {
    this.doc.removeListener('op', this._opListener);
  };

  attachElement = () => {
    // Editor onChange listener
    this._inputListener = (newValue, e) => {
      this.onInput(newValue, e);
    };
    // Output onChange listener
    this._outListener = (before, output) => {
      this._insertOut(before, output);
    }
    // Input onChange listener
    this._inListener = (before, input) => {
      this._insertIn(before, input);
    }
  };

  attachDoc = () => {
    this.doc.on('op', this.onListener);
  };

  onListener = (op, source) => {
    if (source === this) return;
    if (op.length === 0) return;
    if (op.length > 1) {
      throw new Error('Op with multiple components emitted');
    }
    console.log(op, source);
    var component = op[0];
    if (component.p[0] === 'output') {
      this.updateOutput(component.ld, component.li);
    }
    else if (component.p[0] === 'input') {
      this.updateInput(component.ld, component.li);
    }
    else if (this.isSubpath(this.path, component.p)) {
      this._parseInsertOp(component);
      this._parseRemoveOp(component);
    } else if (this.isSubpath(component.p, this.path)) {
      this._parseParentOp();
    }
  };

  _parseInsertOp = (component) => {
    if (!component.si) return;
    let rangeOffset = component.rangeOffset;
    let length = component.si.length;
    this.onInsert(rangeOffset, length);
  };

  _parseRemoveOp = (component) => {
    if (!component.sd) return;
    let rangeOffset = component.rangeOffset;
    let length = component.sd.length;
    this.onRemove(rangeOffset, length);
  };

  _parseParentOp = () => {
    this.update();
  };


  _insertOut = (before, output) => {
    let path = ['output', 0];
    let op = { p: path, ld: before, li: output };
    this.doc.submitOp(op, { source: this });
  }

  _insertIn = (before, input) => {
    let path = ['input', 0];
    let op = { p: path, ld: before, li: input };
    this.doc.submitOp(op, { source: this });
  }

  isSubpath = (path, testPath) => {
    for (var i = 0; i < path.length; i++) {
      if (testPath[i] !== path[i]) return false;
    }
    return true;
  }

  updateInput = (oldInput, newInput) => {
    if (oldInput === newInput) return;
    this.compoThis.setState({ input: newInput });
  }

  updateOutput = (oldOutput, newOutput) => {
    if (oldOutput === newOutput) return;
    this.compoThis.setState({ output: newOutput });
  }
}

export default StringBinding;

// This code has been modified according to the needs.
// Original code of StringBinding is present at https://github.com/share/sharedb-string-binding
