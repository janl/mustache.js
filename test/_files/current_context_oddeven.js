({
    rows: [1,2,3],
    oddeven: function() {
        var ctx = Mustache.currentContext;
        return (ctx.index % 2) ? 'even' : 'odd';
    }
})
