all: src/node-map.js test

src/node-map.js: author/node-map.pl
	perl author/node-map.pl > src/node-map.js

test:
	./node_modules/.bin/tap t

.PHONY: test
