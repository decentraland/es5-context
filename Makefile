HOST_FILES := $(wildcard src/*.ts)

dist/index.js: $(SCENE_SYSTEM) $(HOST_FILES)
	NODE_ENV=production node_modules/.bin/ncc build index.ts -e util -e inspector -e fs -e ws -e node-fetch -e path

clean:
	rm -rf dist

build: clean
	node_modules/.bin/tsc -p tsconfig.json

test:
	

.PHONY: build clean