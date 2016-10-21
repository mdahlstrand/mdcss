function randomname() {
	return 'r' + (~~(Math.random() * 100000000)).toString(16);
}
var uniqname = (function() {
	var index = {};
	function uniqname(name) {
		name = name || randomname();
		if(name in index) {
			return name + '-' + (++index[name]);
		}
		index[name] = 0;
		return name;
	}
	return uniqname;
}());

function slug(str) {
	return (str || '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-\_]/gi, '')
		.toLowerCase();
}

module.exports = {
	randomname: randomname,
	uniqname: uniqname,
	slug: slug,
};