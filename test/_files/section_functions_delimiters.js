({
    value: 'hello world',
    func: function () {
        return function (text, render) {
            return '!' + render(text);
        }
    }
})