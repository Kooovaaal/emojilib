/* global phantom */

var fs = require('fs')
var rawData = fs.read('emojis.json').toString()
var buildFailed = false
var passed = function () { console.log('\x1B[92mPASSED\x1B[0m\n') }
var failed = function () {
  console.log('\x1B[91mFAILED\x1B[0m\n')
  buildFailed = true
}
var reveal = function () {
  if (buildFailed) {
    console.log(':cry: \x1B[91mNo good, something failed.\x1B[0m :boom:\n')
    phantom.exit(buildFailed)
  } else {
    console.log(':sparkles: \x1B[96mWho\'s awesome? You\'re awesome!\x1B[0m :+1:\n')
    phantom.exit()
  }
}

var categories = {
  people: 326,
  animals_and_nature: 167,
  food_and_drink: 98,
  activity: 89,
  travel_and_places: 119,
  objects: 180,
  symbols: 273,
  flags: 250,
  _custom: 15
}

// Calculate numbeer of emojis from categories
var numberOfEmojis = Object.keys(categories).map(function (key) { return categories[key] }).reduce(function (a, b) { return a + b })

//
console.log('\nTEST: Correct JSON format')

try {
  var data = JSON.parse(fs.read('emojis.json'))
  var orderd_keys = JSON.parse(fs.read('ordered.json'))
  var keys = Object.keys(data)
  passed()
} catch (e) {
  console.log('Invalid JSON format. See the CONTRIBUTING doc for reference.')
  failed()
  reveal()
}

//
console.log('TEST: Correct number of emojis')

if (keys.length !== numberOfEmojis) {
  console.log('There are ' + numberOfEmojis + ' emojis, but emojis.json has ' + keys.length + ' entries.')
  failed()
} else {
  passed()
}

//
console.log('TEST: Ordered keys are up to date')

ordered_keys_not_in_keys = orderd_keys.filter(function(key) { return keys.indexOf(key) < 0})
if (orderd_keys.length !== numberOfEmojis) {
  console.log('There are ' + numberOfEmojis + ' emojis, but keys contains ' + orderd_keys.length + ' emojis.')
  failed()
} else if (ordered_keys_not_in_keys.length > 0) {
  console.log('Failed to find ' + ordered_keys_not_in_keys.join(', ') + ' in emojis.json.')
  failed()
} else {
  passed()
}

//
console.log('TEST: Correct number of emojis in each category')

var counter = []

Object.keys(categories).forEach(function (category) {
  var count = keys.map(function (key) {
    return data[key]['category']
  }).filter(function (mojicategory) {
    return mojicategory === category
  }).length

  if (count !== categories[category]) {
    counter.push([category, count])
  }
})

if (counter.length > 0) {
  counter.forEach(function (result) {
    console.log('There are ' + result[1] + ' emojis in \'' + result[0] + '\', but the expected number is ' + categories[result[0]])
  })
  failed()
} else {
  passed()
}

//
console.log('TEST: No duplicated entries')

var arr = []
var dups = []
var keysFromRawData = rawData.match(/\".+\": {/g)

keysFromRawData.forEach(function (key) {
  key = key.replace(/\"|\:|\s|\{/g, '')
  if (arr.indexOf(key) < 0) {
    arr.push(key)
  } else {
    dups.push(key)
  }
})

var charsFromRawData = rawData.match(/"char": ".+"/g)

charsFromRawData.forEach(function (character) {
  character = character.replace(/:|"|(char)|\s/g, '')
  if (arr.indexOf(character) < 0) {
    arr.push(character)
  } else {
    dups.push(character)
  }
})

if (dups.length > 0) {
  dups.forEach(function (key) {
    console.log('There is more than one "' + key + '" in emojis.json.')
  })
  failed()
} else {
  passed()
}

//
console.log('TEST: No unnecessary keywords')

var unnecessities = []
var unnecessitiesInKeywords = []

keys.forEach(function (key) {
  data[key]['keywords'].forEach(function (keyword) {
    if (key === keyword) {
      unnecessities.push([key, keyword])
    }

    var otherKeywords = data[key]['keywords'].slice()
    otherKeywords.splice(data[key]['keywords'].indexOf(keyword), 1)

    otherKeywords.forEach(function (otherKeyword) {
      if (otherKeyword === keyword) {
        unnecessitiesInKeywords.push([otherKeyword, keyword, key])
      }
    })
  })
})

if (unnecessities.length > 0 || unnecessitiesInKeywords.length > 0) {
  unnecessities.forEach(function (arr) {
    console.log('"' + arr[1] + '" is unnecessary as the key is already "' + arr[0] + '".')
  })
  unnecessitiesInKeywords.forEach(function (arr) {
    console.log('"' + arr[1] + '" is unnecessary as a "' + arr[2] + '" already has a keyword "' + arr[0] + '".')
  })

  failed()
} else {
  passed()
}

//
console.log('TEST: Line format')

var offenses = []
var lines = rawData.replace(/^{\n([\s\S]*)\n}\n$/, '$1').split('\n')
var baseRegex = '^    "keywords": \\["[^\"]+"(, "[^\"]+")*\\]'
var contentRegex = new RegExp(baseRegex + ',$')
lines.forEach(function (line, index) {
  if (line.match(/keywords/) && !line.match(contentRegex)) {
    offenses.push(index + 2)
  }
})

if (offenses.length > 0) {
  offenses.forEach(function (lineNo) {
    console.log('Line ' + lineNo + ' has the wrong format.')
  })

  failed()
} else {
  passed()
}

//
console.log('TEST: Properties')

var properties = ["keywords", "char", "fitzpatrick_scale", "category"]
var emojiWithWrongKeys = []
keys.forEach(function (key) {
  if (Object.keys(data[key]).join() !== properties.join()) {
    emojiWithWrongKeys.push(key)
  }
})
if (emojiWithWrongKeys.length > 0) {
  emojiWithWrongKeys.forEach(function (emoji) {
    console.log(emoji + ' has keys "' + Object.keys(data[emoji]).join(', ') + '", expect: "' + properties.join(', ') + '"')
  })

  failed()
} else {
  passed()
}

reveal()
