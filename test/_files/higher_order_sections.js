({
  name: "Tater",
  helper: "To tinker?",
  bolder: function () {
    return function (text, render) {
      return "<b>" + render(text) + '</b> ' + this.helper;
    }
  }
})
