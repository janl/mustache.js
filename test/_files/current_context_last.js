({
    items:[1,2,3],
    last: function() {
        var ctx = Mustache.currentContext;
        return (ctx.array.length === ctx.index+1);
    }
})
