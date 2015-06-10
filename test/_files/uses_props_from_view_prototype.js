var Aaa = (function () {
  function Aaa(x, y) {
    this.x = x;
    this._y = y;
  }
  Object.defineProperty(Aaa.prototype, "y", {
    get: function () {
      return this._y;
    },
    set: function (value) {
      this._y = value;
    },
    enumerable: true,
    configurable: true
  });
  return Aaa;
})();
var Bbb = (function () {
  function Bbb() {
  }
  return Bbb;
})();

var b = new Bbb();
b.item = new Aaa("0", "00");
b.items = [];
b.items.push({ a: new Aaa("1", "2") });
b.items.push({ a: new Aaa("3", "4") });

(b)
