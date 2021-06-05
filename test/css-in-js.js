'use strict';

const autoprefixer = require('autoprefixer');
const cases = require('postcss-parser-tests');
const JSON5 = require('json5');
const objectStringify = require('../object-stringify');
const postcss = require('postcss');
const syntax = require('../');

describe('CSS in JS', () => {
	it('basic js', () => {
		const document = syntax.parse('x().y(z => {});', {
			from: '/fixtures/basic.js',
		});

		expect(document.nodes).toHaveLength(0);
	});
	it('glamorous', () => {
		const code = `
			import glm from 'glamorous';
			const Component1 = glm.a({
				"::placeholder": {
					color: "gray",
				},
			});
		`;
		const out = `
			import glm from 'glamorous';
			const Component1 = glm.a({
				"::webkitInputPlaceholder": {
					color: "gray",
				},
				"::placeholder": {
					color: "gray",
				},
			});
		`;

		return postcss([
			autoprefixer({
				overrideBrowserslist: ['Chrome > 10'],
			}),
		])
			.process(code, {
				syntax,
				from: '/fixtures/glamorous-prefix.jsx',
			})
			.then((result) => {
				expect(result.content).toBe(out);
			});
	});

	it('leaves kebab-case and camelCase in media query params untouched', () => {
		// In previous versions, at-rule properties were converted from camelCase to kebab-case
		// during parsing, and back to camelCase during stringifying. This is however not correct,
		// params should not be changed. Also see:
		// https://github.com/stylelint/postcss-css-in-js/issues/38
		const code = `
		import glm from 'glamorous';
		const Component1 = glm.a({
			"@media (max-width: 1000px)": {
				color: "red",
			},
			"@media (maxWidth: 1000px)": {
				color: "red",
			},
		});
		`;

		expect(syntax.parse(code).toString()).toBe(code);
	});

	describe('setter for object literals', () => {
		it('decl.raws.prop.raw & decl.raws.value.raw', () => {
			const decl = syntax.parse(
				`
				import glm from 'glamorous';
				const Component1 = glm.a({
					borderRadius: '5px'
				});
			`,
				{
					from: '/fixtures/glamorous-atRule.jsx',
				},
			).first.first.first;

			decl.raws.prop.raw = 'WebkitBorderRadius';
			expect(decl.prop).toBe('-webkit-border-radius');
			decl.raws.value.raw = '15px';
			expect(decl.value).toBe('15px');
		});
		it('atRule.raws.params.raw', () => {
			const atRule = syntax.parse(
				`
				import glm from 'glamorous';
				const Component1 = glm.a({
					'@media (max-width: 500px)': {
						borderRadius: '5px'
					}
				});
			`,
				{
					from: '/fixtures/glamorous-atRule.jsx',
				},
			).first.first.first;

			atRule.raws.params.raw = "(min-width: ' + minWidth + ')";
			expect(atRule.params).toBe("(min-width: ' + minWidth + ')");
		});
	});

	it('empty object literals', () => {
		const code = `
			import glm from 'glamorous';
			const Component1 = glm.a({
			});
		`;
		const root = syntax.parse(code, {
			from: '/fixtures/glamorous-empty-object-literals.jsx',
		});

		expect(root.toString()).toBe(code);

		root.first.first.raws.after = '';
		expect(root.toString()).toBe(`
			import glm from 'glamorous';
			const Component1 = glm.a({});
		`);
	});

	it('cssFloat', () => {
		const code = `
			import glm from 'glamorous';
			const Component1 = glm.a({
				cssFloat: "left",
			});
		`;

		const root = syntax.parse(code, {
			from: '/fixtures/glamorous-float.jsx',
		});

		expect(root.first.first.first).toHaveProperty('prop', 'float');

		expect(root.toString()).toBe(`
			import glm from 'glamorous';
			const Component1 = glm.a({
				cssFloat: "left",
			});
		`);
	});

	it('float', () => {
		const code = `
			const component = styled(Btn)({
				float: "left",
			});
		`;

		const root = syntax.parse(code, {
			from: '/fixtures/styled-float.jsx',
		});

		expect(root.first.first.first).toHaveProperty('prop', 'float');

		expect(root.toString()).toBe(`
			const component = styled(Btn)({
				float: "left",
			});
		`);
	});

	describe('objectify for css', () => {
		cases.each((name, css) => {
			if (name === 'bom.css') return;

			if (name === 'custom-properties.css') return;

			it(`objectStringifier ${name}`, () => {
				const root = postcss.parse(css);
				const jsSource = root.toString(objectStringify).trim();
				const jsonSource = `{\n${jsSource.replace(/,$/, '').replace(/[\s;]+$/gm, '')}\n}`;

				expect(JSON5.parse(jsonSource)).toBeTruthy();
			});
		});
	});

	it('incomplete code', () => {
		const filename = 'fixtures/incomplete- react-native.mjs';
		const code = [
			`StyleSheet.create({
				box: { padding: 10 },
				text: { fontWeight: "bold" },
			});`,
			'styled.div`a{display: block}`',
		].join('\n');

		const document = syntax.parse(code, {
			from: filename,
		});

		expect(document.nodes).toHaveLength(2);
	});
});
