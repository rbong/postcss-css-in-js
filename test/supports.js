'use strict';

const fs = require('fs');
const path = require('path');
const syntax = require('../');

function clean(node) {
	if (node.raws) {
		delete node.raws.node;
		delete node.raws.beforeStart;
		delete node.raws.afterEnd;
	}

	if (node.source) {
		delete node.source.opts;
		delete node.source.input.css;
		delete node.source.input.hasBOM;
		delete node.source.input.parseOptions;
		delete node.source.input.templateLiteralStyles;
		node.source.input.file = path.basename(node.source.input.file);
	}

	delete node.indexes;
	delete node.lastEach;
	delete node.rawCache;
	delete node.document;

	if (node.nodes) {
		node.nodes = node.nodes.map(clean);
	}

	return node;
}

describe('should support for each CSS in JS package', () => {
	[
		'emotion-10.jsx',
		'glamorous.jsx',
		'interpolation-content.mjs',
		'jsx.jsx',
		'lit-css.mjs',
		'react-emotion.jsx',
		'react-native.mjs',
		'styled-components-nesting-expr.js',
		'styled-components-nesting.js',
		'styled-components-nesting2.js',
		'styled-components-nesting3.js',
		'styled-components-nesting-nesting.js',
		'styled-components-nesting-template-literal.js',
		'styled-components.js',
		'styled-opts.mjs',
		'styled-props.jsx',
		'tpl-decl.mjs',
		'tpl-in-tpl.mjs',
		'tpl-selector.mjs',
		'tpl-special.mjs',
		'material-ui.jsx',
	].forEach((file) => {
		it(file, () => {
			file = require.resolve('./fixtures/' + file);
			const code = fs.readFileSync(file);
			const document = syntax.parse(code, {
				from: file,
			});

			expect(document.source).toHaveProperty('lang', 'jsx');
			expect(document.toString()).toBe(code.toString());
			expect(document.nodes.length).toBeGreaterThan(0);
			const parsed = JSON.stringify(clean(document), 0, '\t');

			// fs.writeFileSync(file + ".json", parsed + "\n");
			expect(parsed).toBe(fs.readFileSync(file + '.json', 'utf8').trim());
		});
	});
});
