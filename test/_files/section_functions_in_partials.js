({
  bold: function (){
    return function (text, render) {
      return '<b>' + render(text) + '</b>';
    };
  }
});
