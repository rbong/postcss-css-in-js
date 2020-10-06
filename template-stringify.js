'use strict';

const substitutions = require('./substitute-javascript');
const TemplateStringifier = require('./template-stringifier');

module.exports = function TemplateStringify(node, builder) {
	if (node.unstable_substitute) {
		substitutions.removeSubstitutions(node);
	}

	const str = new TemplateStringifier(builder);

	str.stringify(node);

	if (node.unstable_substitute) {
		substitutions.addSubstitutions(node);
	}
};
