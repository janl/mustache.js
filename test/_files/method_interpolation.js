({
  a: function() { return {
    b: function() { return {
      c: function() { return 'a.b.c'; }
    };}
  };},
  d: {
    _p: 'd.e',
    e: function() { return this._p; },
    f: {
      _p: 'd.f.g',
      g: function() { return this._p; }
    }
  }
})