var fs     = require('fs'),
	fsp     = require('fs-promise'),
	marked = require('marked'),
	path   = require('path'),
	_ = require('lodash');

var Renderer = require('./lib/renderer'),
	util = require('./lib/util');

var isDoc = /^\/*\?\s*/;

module.exports = require('postcss').plugin('sgcss', function (opts) {
	// set options object
	opts = Object(opts);

	/* set options */
	opts.index = opts.index || 'index.html'; // index file
	opts.theme = opts.theme || require('sgcss-theme-default'); // theme or default
	opts.destination = path.join(process.cwd(), opts.destination || 'styleguide'); // destination path
	opts.assets = opts.assets || {js: [], css: []};
	if (typeof opts.theme !== 'function') throw Error('The theme failed to load'); // throw if theme is not a function
	if (opts.theme.type === 'sgcss-theme') opts.theme = opts.theme(opts); // conditionally set theme as executed theme

	var renderer = new Renderer({
		classPrefix: 'sg-',
		assets: opts.assets
	});

	// return plugin
	return function (css, result) {
		// set current css directory or current directory
		var dir = css.source.input.file ? path.dirname(css.source.input.file) : process.cwd();

		// set documentation list, hash, and unique identifier
		var list = [];
		var hash = {};

		// walk comments
		css.walkComments(function (comment) {
			// if comment is documentation
			if (isDoc.test(comment.text)) {
				var text = comment.text.replace(isDoc, '');
				// console.log(text);
				// set documentation object
				var doc = {};

				var tokens = marked.lexer(text);

				tokens.map(function(token) {
					if(token.type === 'heading') {
						if(token.depth === 1) {
							doc.section = token.text;
						}
						else if(token.depth === 2) {
							doc.title = token.text;
						}
						return;
					}
				});
				doc.content = marked.parser(tokens, {renderer: renderer});

				// set documentation context
				doc.context = comment;

				var name = doc.section || doc.title;
				var uniq = util.uniqname(name);
				if(name) {
					doc.name = util.slug(name);
				}
				// push documentation to hash using an unique name
				hash[uniq] = doc;
			}
		});

		// console.log(Object.keys(hash));

		// walk hashes
		var section;
		Object.keys(hash).forEach(function (name) {
			// set documentation
			var doc = hash[name];

			if('section' in doc) {
				section = doc;
				doc.children = doc.children || [];
				list.push(doc);
			}
			else {
				section.children.push(doc);
			}
		});

		// return theme executed with parsed list, destination
		return opts.theme({
			list: list,
			opts: opts
		}).then(function (docs) {
			// empty the destination directory
			return fsp.emptyDir(opts.destination)
			// then copy the theme assets into the destination
			.then(function (assets) {
				return fsp.copy(docs.assets, opts.destination);
			})
			// then copy the compiled template into the destination
			.then(function () {
				return fsp.outputFile(path.join(opts.destination, opts.index), docs.template);
			})
			// construct full asset paths
			.then(function () {
				return _.concat(
					_.map(opts.assets.img, constructFullAssetPath),
					_.map(opts.assets.js, constructFullAssetPath),
					_.map(opts.assets.css, constructFullAssetPath)
				);
			})
			// then copy any of the additional assets into the destination
			.then(function (assets) {
				return Promise.all(assets.map(function (src) {
					return fsp.copy(src, path.join(opts.destination, path.basename(src)));
				}));
			});
		});
	};
});

function titleToName(title) {
	return title.replace(/\s+/g, '-').replace(/[^A-z0-9_-]/g, '').toLowerCase();
}

function constructFullAssetPath(src) {
	return path.join(process.cwd(), src);
}