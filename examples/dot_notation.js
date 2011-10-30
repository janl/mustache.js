var dot_notation = {
  name: "A Book",
  authors: ["John Power", "Jamie Walsh"],
  price:{
    value: 200,
    vat: function() {
      return this.value * 0.2;
    },
    currency: {
      symbol: '&euro;',
      name: 'Euro'
    }
  },
  availability:{
    status: true,
    text: "In Stock"
  }
};
