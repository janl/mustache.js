var higher_order_sections = {
  "name": "Tater",
  "helper": "To tinker?",
  "bolder": function() {
    return function(text, render) {
      return "<b>" + render(text) + '</b> ' + this.helper;
    }
  }
}