'use strict';
const convert = require('./convert');
 const func = convert('forInRight', require('../forInRight'));

func.placeholder = require('./placeholder');
module.exports = func;
