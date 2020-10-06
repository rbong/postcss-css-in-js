'use strict';

const literalsKey = Symbol('Literals');
const replacementsKey = Symbol('Replaced properties');

function addSubstitution(item, key, literals) {
	item[replacementsKey] = item[replacementsKey] || [];

	literals.forEach((literal) => {
		const position = item[key].indexOf(literal);

		if (position !== -1) {
			const substitution = '$dummyValue' + position;

			item[replacementsKey].push({
				key,
				original: literal,
				substitution,
			});

			item[key] = item[key].replace(literal, substitution);
		}
	});
}

function addSubstitutions(node, css, opts) {
	if (typeof node.walk !== 'function') return;

	if (css && opts) {
		const offset = opts.quasis[0].start;

		node[literalsKey] = [];

		opts.expressions.forEach(({ start, end }) => {
			node[literalsKey].push('${' + css.substring(start - offset, end - offset) + '}');
		});
	}

	if (!node[literalsKey]) return;

	node.walk((item) => {
		if (item.type === 'atrule') {
			addSubstitution(item, 'name', node[literalsKey]);
			addSubstitution(item, 'params', node[literalsKey]);
		} else if (item.type === 'rule') {
			addSubstitution(item, 'selector', node[literalsKey]);
		} else if (item.type === 'decl') {
			addSubstitution(item, 'prop', node[literalsKey]);
			addSubstitution(item, 'value', node[literalsKey]);
		} else if (item.type === 'root') {
			addSubstitutions(item);
		}
	});
}

exports.addSubstitutions = addSubstitutions;

exports.removeSubstitutions = (node) => {
	if (typeof node.walk !== 'function') return;

	node.walk((item) => {
		if (!item[replacementsKey]) {
			return;
		}

		item[replacementsKey].forEach((replacement) => {
			item[replacement.key] = item[replacement.key].replace(
				replacement.substitution,
				replacement.original,
			);
		});

		delete item[replacementsKey];
	});
};
