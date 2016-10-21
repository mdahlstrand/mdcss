[sgcss](https://github.com/mdahlstrand/sgcss) is based on [Jonathan Neal's mdcss](https://github.com/jonathantneal/mdcss). You should probably use it instead of this.

The aim of sgcss was to simplify things, and to infer more structure from the markdown instead of having yaml-like definitions.

## Usage

sgcss is a [PostCSS](https://github.com/postcss/postcss) plugin, and used through Grunt it could look something like this:

```javascript
// This would be part of your grunt initConfig:
postcss: {
	styleguide: {
		src: 'site.css',
		options: {
			processors: [
				require('sgcss')({
					theme: require('sgcss-theme-default'),
					logo: 'logo.png',
					assets: {
						css: ['site.css'],
						img: ['logo.png'],
						js: ['main.js']
					},
					destination: 'styleguide'
				})
			]
		}
	}
}
```

**Documentation is written like so:**

```css
/*?
# Forms

## Field

` ` `html
<label class="field">
	<input class="field__input">
</label>
` ` `
*/
```
The example places spaces between the triple ticks as I can't figure out how to escape them. Use tripple ticks without spaces for things to work.
Notice the `?` after the opening comment.

Markdown h1's become sections, h2's become titles. All other markdown is just rendered as is.

Code blocks of type `html` are rendered in iframes using [html5's srcdoc](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-srcdoc).

You probably want some assets loaded in this iframe - they're defined using the `assets` option, see the example with Grunt above.