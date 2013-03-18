({
  "beatles": [
    { "firstName": "John", "lastName": "Lennon" },
    { "firstName": "Paul", "lastName": "McCartney" },
    { "firstName": "George", "lastName": "Harrison" },
    { "firstName": "Ringo", "lastName": "Starr" }
  ],
  "name": function () {
    return function () {
      return "{{firstName}} {{lastName}}";
    };
  },
  "name2": function (ctx) {
    return ctx.firstName + " " + ctx.lastName + " " + this.beatles.length;
  }
})
