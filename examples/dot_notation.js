var dot_notation = {
	name: "A Book",
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
  in_stock: true
};