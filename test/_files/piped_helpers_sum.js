({
    numbers: [1,2,3,4],
    sum: function() {
        var total = 0;
        for (var i=0,len=this.length; i<len; i++) {
            total += this[i];
        }
        return total;
    }
})
