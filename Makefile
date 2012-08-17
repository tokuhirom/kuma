all: src/token-map.js src/node-map.js test

src/token-map.js: author/token-map.pl
	perl author/token-map.pl > src/token-map.js

src/node-map.js: author/node-map.pl
	perl author/node-map.pl > src/node-map.js

test:
	./node_modules/.bin/tap t

.PHONY: test
