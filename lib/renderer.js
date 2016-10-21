var _ = require('lodash');
var marked = require('marked');
var chroma = require('chroma-js');

var util = require('./util');

function Renderer(opts) {
	marked.Renderer.call(this);
	this.classPrefix = opts.classPrefix || '';
	this.assets = opts.assets || {js:[], css:[]};
}
Renderer.prototype = Object.create(marked.Renderer.prototype);

Renderer.prototype.heading = function(text, level) {
	return '<h' + level + ' name="' + util.slug(text) + '">' +
		text + '</h' + level + '>';
};
Renderer.prototype.code = function(code, language) {
	if(language === 'variables') {
		return this.printVariables(code);
	}
	else if(language === 'html') {
		return this.printExample(code);
	}
	console.log(language, code);
	return marked.Renderer.prototype.code.call(this, code, language);
};
Renderer.prototype.printVariables = function(code) {
	return code.split(/[\r\n]+/).map(this.processVariableLine.bind(this)).join('');
};
Renderer.prototype.processVariableLine = function(line) {
	var split = line.trim().match(/^([^:]+)\s*:\s*([^:]+)\s*;?$/);
	var key, val, color;
	if(split) {
		key = split[1];
		val = split[2];
		try {
			color = chroma(val);
			if(color) {
				return this.printSwatch(key, val, color);
			}
		} catch(err) {
			// not a color
		}
		return marked.Renderer.prototype.code.call(this, line);
	}
};
Renderer.prototype.printSwatch = function(name, raw, color) {
	var fg = color.get('hsl.l') > 0.5 ? 'black' : 'white';
	return '<div class="' + this.classPrefix + 'swatch" style="background-color: ' + raw + '; color: ' + fg + '">' +
		'<span class="' + this.classPrefix + 'swatch__name">' + name + '</span>' +
		'<span class="' + this.classPrefix + 'swatch__color">' + raw + '</span>' +
	'</div>';
};
Renderer.prototype.printExample = function(code) {
	return '<div class="' + this.classPrefix + 'example">' +
		'<iframe class="' + this.classPrefix + 'example__iframe" allowtransparency="true" srcdoc="' + this.codeToDocument(code) + '"></iframe>' +
		'<pre class="' + this.classPrefix + 'example__source ' + this.classPrefix + 'source"><code>' + _.escape(code) + '</code></pre>' +
	'</div>';
};
Renderer.prototype.codeToDocument = function(code) {
	return _.escape('<!doctype html><html><head><meta charset="utf-8"><title>Example</title>' +
		this.cssAssets() +
		'<style>body {background:transparent;padding:15px;}body:after{content:"";clear:both;display:table;}</style>' +
		'</head><body>' + code +
		this.jsAssets() +
		'<script>function postSize() { window.top.postMessage({height: document.body.offsetHeight, width: document.body.offsetWidth}, "*")} window.onload = postSize()</script>' +
		'<span style="clear:both;"></span>' +
		'</body></html>');
};
Renderer.prototype.cssAssets = function() {
	return _.map(this.assets.css, function(src) {
		return '<link href="' + src + '" rel="stylesheet">';
	}).join('');
};
Renderer.prototype.jsAssets = function() {
	return _.map(this.assets.js, function(src) {
		return '<script src="' + src + '"></script>';
	}).join('');
};
module.exports = Renderer;