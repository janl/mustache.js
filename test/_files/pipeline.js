({
  name: 'name',
  job: {
    name: 'Developer'
  },
  attributes:[
    {
      name: 'good',
      options: [
        'outgoing',
        'shy'
      ]
    }
  ],
  numbers:[1,2,3],
  sumOne:(value)=>{
    return value + 1;
  },
  upper:(value)=>{
    return value.toUpperCase()
  },
  lower: (value)=>{
    return value.toLowerCase()
  },
  firstUpper:(value) =>{
    value = value.split('')
    value[0] = value[0].toUpperCase()
    value = value.join('')
    return value;
  },
  setNameFuncion:(value)=>{
    return value + ": This is a value"
  }
})
