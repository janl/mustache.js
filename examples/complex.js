var complex = {
  header: function() {
    return "Colors";
  },
  item: [
      {name: "red", current: true, url: "#Red"},
      {name: "green", current: false, url: "#Green"},
      {name: "blue", current: false, url: "#Blue"}
  ],
  link: function() {
    var v = this["current"] === true;
    // print("link() returns " + v);
    return v;
  },
  list: function() {
    var v = this.item.length !== 0;
    // print("list() returns " + v);
    return v;
  },
  empty: function() {
    var v = this.item.length === 0;
    // print("empty() returns " + v);
    return v;
  }
};
