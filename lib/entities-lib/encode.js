'use strict';
const inverseXML = getInverseObj(require('../entities-maps/xml.json')),
    xmlReplacer = getInverseReplacer(inverseXML);

exports.XML = getInverse(inverseXML, xmlReplacer);

const inverseHTML = getInverseObj(require('../entities-maps/entities.json')),
    htmlReplacer = getInverseReplacer(inverseHTML);

exports.HTML = getInverse(inverseHTML, htmlReplacer);

function getInverseObj(obj){
	return Object.keys(obj).sort().reduce(function(inverse, name){
		inverse[obj[name]] = '&' + name + ';';
		return inverse;
	}, {});
}

function getInverseReplacer(inverse){
	const single = [],
	    multiple = [];

	Object.keys(inverse).forEach(function(k){
		if(k.length === 1){
			single.push('\\' + k);
		} else {
			multiple.push(k);
		}
	});

	//TODO add ranges
	multiple.unshift('[' + single.join('') + ']');

	return new RegExp(multiple.join('|'), 'g');
}

const re_nonASCII = /[^\0-\x7F]/g,
    re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

function singleCharReplacer(c){
	return '&#x' + c.charCodeAt(0).toString(16).toUpperCase() + ';';
}

function astralReplacer(c){
	// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	const high = c.charCodeAt(0);
	const low  = c.charCodeAt(1);
	const codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
	return '&#x' + codePoint.toString(16).toUpperCase() + ';';
}

function getInverse(inverse, re){
	function func(name){
		return inverse[name];
	}

	return function(data){
		return data
				.replace(re, func)
				.replace(re_astralSymbols, astralReplacer)
				.replace(re_nonASCII, singleCharReplacer);
	};
}

const re_xmlChars = getInverseReplacer(inverseXML);

function escapeXML(data){
	return data
			.replace(re_xmlChars, singleCharReplacer)
			.replace(re_astralSymbols, astralReplacer)
			.replace(re_nonASCII, singleCharReplacer);
}

exports.escape = escapeXML;
