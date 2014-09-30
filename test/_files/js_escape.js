({ string: "This is my\u2028string\"'."
, breaker: "This is my string with a </script> tag."
, array: ["abc\u2028", 1.1, [2, 3, true], "z"]
, object: {"key\u2028": false, "otherkey": true, "finalkey": 3}
, nil: null
})
