import TextDiffBinding from './textDiffBinding';

function StringBinding(element, compoThis, doc, path) {
  TextDiffBinding.call(this, element);
  this.doc = doc;
  this.path = path || [];
  this._opListener = null;
  this._inputListener = null;
  this.compoThis = compoThis || null;
}
StringBinding.prototype = Object.create(TextDiffBinding.prototype);
StringBinding.prototype.constructor = StringBinding;

StringBinding.prototype.setup = function(compoThis) {
  this.update(compoThis);
  this.attachDoc(compoThis);
  this.attachElement();
};

StringBinding.prototype.destroy = function() {
  this.detachElement();
  this.detachDoc();
};

StringBinding.prototype.attachElement = function() {
  var binding = this;
  this._inputListener = function(prevValue, newValue, e) {
    binding.onInput(prevValue, newValue, e);
  };
  // this.element.addEventListener('input', this._inputListener, false);
};

StringBinding.prototype.detachElement = function() {
  // this.element.removeEventListener('input', this._inputListener, false);
};

StringBinding.prototype.attachDoc = function(compoThis) {
  var binding = this;
  this._opListener = function(op, source) {
    binding._onOp(op, source, compoThis);
  };
  this.doc.on('op', this._opListener);
};

StringBinding.prototype.detachDoc = function() {
  this.doc.removeListener('op', this._opListener);
};

StringBinding.prototype._onOp = function(op, source, compoThis) {
  if (source === this) return;
  if (op.length === 0) return;
  if (op.length > 1) {
    throw new Error('Op with multiple components emitted');
  }
  var component = op[0];
  if (isSubpath(this.path, component.p)) {
    this._parseInsertOp(component);
    this._parseRemoveOp(component);
  } else if (isSubpath(component.p, this.path)) {
    this._parseParentOp(compoThis);
  }
};

StringBinding.prototype._parseInsertOp = function(component) {
  if (!component.si) return;
  var rangeOffset = component.rangeOffset;
  var length = component.si.length;
  this.onInsert(rangeOffset, length, this.compoThis);
};

StringBinding.prototype._parseRemoveOp = function(component) {
  if (!component.sd) return;
  var rangeOffset = component.rangeOffset;
  var length = component.sd.length;
  this.onRemove(rangeOffset, length, this.compoThis);
};

StringBinding.prototype._parseParentOp = function(compoThis) {
  this.update(compoThis);
};

StringBinding.prototype._get = function() {
  var value = this.doc.data;
  for (var i = 0; i < this.path.length; i++) {
    var segment = this.path[i];
    value = value[segment];
  }
  return value;
};

StringBinding.prototype._insert = function(index, text, rangeOffset) {
  var path = this.path.concat(index);
  var op = {p: path, si: text, rangeOffset: rangeOffset};
  this.doc.submitOp(op, {source: this});
};

StringBinding.prototype._remove = function(index, text, rangeOffset) {
  var path = this.path.concat(index);
  var op = {p: path, sd: text, rangeOffset: rangeOffset};
  this.doc.submitOp(op, {source: this});
};

function isSubpath(path, testPath) {
  for (var i = 0; i < path.length; i++) {
    if (testPath[i] !== path[i]) return false;
  }
  return true;
}

export default StringBinding;
