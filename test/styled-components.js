'use strict';

const fs = require('fs');
const syntax = require('../');

describe('styled-components', () => {
	it('basic', () => {
		const file = require.resolve('./fixtures/styled-components');
		let code = fs.readFileSync(file);

		const document = syntax.parse(code, {
			from: file,
		});

		code = code.toString();
		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');

		expect(document.nodes).toHaveLength(1);
		expect(document.first.nodes).toHaveLength(8);

		const lines = code
			.match(/^.+$/gm)
			.slice(3)
			.map((line) => line.replace(/^\s*(.+?);?\s*$/, '$1'));

		document.first.nodes.forEach((decl, i) => {
			if (i) {
				expect(decl).toHaveProperty('type', 'decl');
			} else {
				expect(decl).toHaveProperty('type', 'comment');
			}

			expect(decl.toString()).toBe(lines[i]);
		});
	});

	it('interpolation with css template literal', () => {
		const code = [
			"import styled, { css } from 'styled-components';",

			'const Message = styled.p`',
			'	padding: 10px;',

			'	${css`',
			'		color: #b02d00;',
			'	`}',
			'`;',
		].join('\n');
		const document = syntax.parse(code, {
			from: undefined,
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
	});

	it('interpolation with two css template literals', () => {
		const code = [
			"import styled, { css } from 'styled-components';",

			'const Message = styled.p`',
			'	padding: 10px;',

			'	${(props) => css`',
			'		color: #b02d00;',
			'	`}',

			'	${(props2) => css`',
			'		border-color: red;',
			'	`}',
			'`;',
		].join('\n');
		const document = syntax.parse(code, {
			from: undefined,
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
	});

	it('empty template literal', () => {
		// prettier-ignore
		const code = [
			"function test() {",
			"  alert`debug`",
			"  return ``;",
			"}",
			"",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'empty_template_literal.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(0);
	});

	it('skip javascript syntax error', () => {
		const code = '\\`';
		const document = syntax.parse(code, {
			from: 'syntax_error.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(0);
	});

	it('skip @babel/traverse error', () => {
		const code = 'let a;let a';
		const document = syntax.parse(code, {
			from: 'traverse_error.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(0);
	});

	it('illegal template literal', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div`$\n{display: block}\n${g} {}`",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'illegal_template_literal.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
		expect(document.first.nodes).toHaveLength(2);
		expect(document.first.first).toHaveProperty('type', 'rule');
		expect(document.first.first).toHaveProperty('selector', '$');
		expect(document.last.last).toHaveProperty('type', 'rule');
		expect(document.last.last).toHaveProperty('selector', '${g}');
	});

	it('styled.img', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"const Image1 = styled.img.attrs({ src: 'url' })`",
			"  bad-selector {",
			"    color: red;",
			"  }",
			"`;",
		].join("\n");
		const root = syntax.parse(code, {
			from: 'styled.img.js',
		});

		expect(root.toString()).toBe(code);
	});

	it('throw CSS syntax error', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div`a{`;",
		].join("\n");

		expect(() => {
			syntax.parse(code, {
				from: 'css_syntax_error.js',
			});
		}).toThrow('css_syntax_error.js:2:12: Unclosed block');
	});

	it('not skip empty template literal', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div``;",
		].join("\n");
		const root = syntax.parse(code, {
			from: 'empty_template_literal.js',
		});

		expect(root.toString()).toBe(code);
		expect(root.nodes).toHaveLength(1);
	});

	it('fix CSS syntax error', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div`a{`;",
		].join("\n");
		const document = syntax({
			css: 'safe-parser',
		}).parse(code, {
			from: 'postcss-safe-parser.js',
		});

		// prettier-ignore
		expect(document.toString()).toBe([
			"const styled = require(\"styled-components\");",
			"styled.div`a{}`;",
		].join("\n"));
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
		expect(document.first.nodes).toHaveLength(1);
		expect(document.first.first).toHaveProperty('type', 'rule');
		expect(document.first.first).toHaveProperty('selector', 'a');
	});

	it('fix styled syntax error', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div`${ a } {`",
		].join("\n");
		const document = syntax({
			css: 'safe-parser',
		}).parse(code, {
			from: 'styled-safe-parse.js',
		});

		// prettier-ignore
		expect(document.toString()).toBe([
			"const styled = require(\"styled-components\");",
			"styled.div`${ a } {}`",
		].join("\n"));
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
		expect(document.first.nodes).toHaveLength(1);
		expect(document.first.first).toHaveProperty('type', 'rule');
		expect(document.first.first).toHaveProperty('selector', '${ a }');
	});

	it('template literal in prop', () => {
		// prettier-ignore
		const code = [
			"const styled = require(\"styled-components\");",
			"styled.div`margin-${/* sc-custom 'left' */ rtlSwitch}: 12.5px;`",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'template_literal_in_prop.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
		expect(document.first.first).toHaveProperty(
			'prop',
			"margin-${/* sc-custom 'left' */ rtlSwitch}",
		);
	});

	it('lazy assignment', () => {
		// prettier-ignore
		const code = [
			"let myDiv;",
			"myDiv = require(\"styled-components\").div;",
			"myDiv`a{}`;",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'lazy_assign.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
	});

	it('lazy assignment without init', () => {
		// prettier-ignore
		const code = [
			"myDiv = require(\"styled-components\").div;",
			"myDiv`a{}`;",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'lazy_assign_no_init.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
	});

	it('array destructuring assignment', () => {
		// prettier-ignore
		const code = [
			"const [",
			"\tstyledDiv,",
			"\t...c",
			"] = require(\"styled-components\");",
			"styledDiv`a{}`;",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'arr_destructuring.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(1);
	});

	it('object destructuring assignment', () => {
		// prettier-ignore
		const code = [
			"const {",
			"\t// commit",
			"\t['div']: styledDiv,",
			"\ta,",
			"\t...styled",
			"} = require(\"styled-components\");",
			"styledDiv`a{}`;",
			"styled.div`a{}`;",
			"a`a{}`;",
		].join("\n");
		const document = syntax.parse(code, {
			from: 'obj_destructuring.js',
		});

		expect(document.toString()).toBe(code);
		expect(document.source).toHaveProperty('lang', 'jsx');
		expect(document.nodes).toHaveLength(3);
	});
});
