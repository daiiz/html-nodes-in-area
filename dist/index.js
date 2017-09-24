'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTMLNodesInArea = function () {
  function HTMLNodesInArea(targetNode) {
    _classCallCheck(this, HTMLNodesInArea);

    this.targetNode = targetNode;
    this.TEXT = 3;
    this.mark = Math.floor(Math.random() * 10000);
    this.range = null;
    this.nodes = [];
    this.result = [];
    this.tagName = this.TEXT;
    this.detail = false;

    // Options
    this.options = {
      maxDepth: 20,
      excludeTagIds: [],
      excludeTagClassNames: [],
      excludeTagNames: ['meta', 'script', 'style', 'iframe', 'audio', 'video'],
      excludeInvisibles: true,
      minStrLength: 1,
      onlyInTopLayer: true
    };
  }

  _createClass(HTMLNodesInArea, [{
    key: 'setOptions',
    value: function setOptions() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      for (var key in options) {
        this.options[key] = options[key];
      }
    }
  }, {
    key: '_filterElems',
    value: function _filterElems(elems) {
      var _this = this;

      var res = [];
      for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var isExclude = false;
        if (this.options.excludeTagNames.indexOf(elem.nodeName.toLowerCase()) === -1) {
          if (this.options.excludeTagIds.indexOf(elem.id) !== -1) isExclude = true;
          var classList = elem.classList;
          if (classList) {
            classList.forEach(function (cn) {
              if (_this.options.excludeTagClassNames.indexOf(cn) !== -1) {
                isExclude = true;
              }
            });
          }
          if (!isExclude) res.push(elem);
        }
      }
      return res;
    }
  }, {
    key: '_dfs',
    value: function _dfs(node, mark, dep) {
      mark = '' + mark;

      if (node.nodeType === this.tagName || node.nodeName.toLowerCase() === this.tagName) {
        this._register(node);
      }

      if (node.nodeType === 3) return;
      if (dep > this.options.maxDepth) return;
      node.dataset.daiiz_visit = mark;

      var childNodes = this._filterElems(node.childNodes);
      for (var j = 0; j < childNodes.length; j++) {
        var child = childNodes[j];
        if (child.nodeType === 3 || child.dataset && child.dataset.daiiz_visit !== mark) {
          // 未訪問
          this._dfs(child, mark, dep + 1);
        }
      }
    }
  }, {
    key: '_register',
    value: function _register(node) {
      if (this.tagName === this.TEXT) {
        if (node.nodeValue.trim().length >= this.options.minStrLength) {
          // textNodeに対してgetBoundingClientRectを実行できないのでspanでwrapする
          var p = node.parentNode;
          if (p.className !== 'lemonpie_text_span') {
            var span = document.createElement('span');
            span.className = 'lemonpie_text_span';
            node.parentNode.insertBefore(span, node);
            span.appendChild(node);
            this.nodes.push(span);
          } else {
            this.nodes.push(p);
          }
        }
      } else {
        this.nodes.push(node);
      }
    }
  }, {
    key: '_isInvolvedIn',
    value: function _isInvolvedIn(position) {
      if (!this.range) return true;
      var X = this.range.left;
      var Y = this.range.top;
      var Xw = this.range.right || this.range.left + this.range.width;
      var Yh = this.range.bottom || this.range.top + this.range.height;
      if (X <= position.left && position.right <= Xw && Y <= position.top && position.bottom <= Yh) return true;
      return false;
    }
  }, {
    key: '_isTheTopLayer',
    value: function _isTheTopLayer(node) {
      var points = [[node.position.left + 1, node.position.top + 1], [node.position.right - 1, node.position.top + 1], [node.position.right - 1, node.position.bottom - 1], [node.position.left + 1, node.position.bottom - 1]];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = points[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var elem = document.elementFromPoint(point[0] - window.pageXOffset, point[1] - window.pageYOffset);
          if (elem === node.self || $(elem).find(node.self).length > 0 || $(node.self).find(elem).length > 0) return true;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return false;
    }
  }, {
    key: 'extract',
    value: function extract() {
      var range = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var tagName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.TEXT;

      if (range && range.top !== undefined && range.left !== undefined) this.range = range;
      if (tagName && typeof tagName === 'string') {
        this.tagName = tagName.toLowerCase();
        this.detail = true;
      }
      // 試行のたびに訪問済みのmarkを変更する
      var x = this.mark + 1;
      this._dfs(this.targetNode, x, 0);

      for (var i = 0; i < this.nodes.length; i++) {
        var textSpan = this.nodes[i];
        var rect = textSpan.getBoundingClientRect();
        if (this.options.excludeInvisibles && rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0) {
          continue;
        }
        var res = {
          'text': textSpan.innerText.trim(),
          'position': {
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY
          }
        };
        if (this.detail) {
          res.self = textSpan;
          res.parent = textSpan.parentNode;
        }

        // 範囲内に存在しないものを無視
        if (!this._isInvolvedIn(res.position)) continue;
        // 最上層に存在しないものを無視
        if (this.options.onlyInTopLayer && !this._isTheTopLayer(res)) continue;
        this.result.push(res);
      }
      return this.result;
    }
  }]);

  return HTMLNodesInArea;
}();

exports.default = HTMLNodesInArea;