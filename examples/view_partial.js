var view_partial = {
  greeting: function() {
    return "Welcome";
  },

  farewell: function() {
    return "Fair enough, right?";
  }
};

var simple = {
  name: "Chris",
  value: 10000,
  taxed_value: function() {
    return this.value - (this.value * 0.4);
  },
  in_ca: true
};

var simple_template = "Hello {{name}}\n" +
"You have just won ${{value}}!\n" +
"{{#in_ca}}\n" +
"Well, ${{ taxed_value }}, after taxes.\n" +
"{{/in_ca}}\n";
