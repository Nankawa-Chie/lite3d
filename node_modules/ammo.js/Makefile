VERSION?=2.83.7

build:
	@curl -L -so source.tgz \
		https://github.com/bulletphysics/bullet3/archive/$(VERSION).tar.gz
	@tar -xzf source.tgz
	@rm -fr source source.tgz
	@mv bullet3-$(VERSION) source
	@cd source && \
		python $(EMSCRIPTEN_ROOT)/tools/webidl_binder.py ../ammo.idl glue && \
		(cd src && \
			find . -name '*.h' | grep -Ev 'Bullet3|gim_|clew' | \
				sed 's/\.\//#include "/' | sed 's/$$/"/' > ../manifest.cpp) && \
		echo '#include "glue.cpp"' >> manifest.cpp && \
		emcc \
			`find src -name '*.cpp' | grep -Ev 'Bullet3|gim_|clew'` \
			manifest.cpp \
			-s NO_EXIT_RUNTIME=1 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
			-s NO_DYNAMIC_EXECUTION=1 \
			-s NO_FILESYSTEM=1 \
			-s TOTAL_MEMORY=67108864 \
			-s EXPORT_NAME=\"Ammo\" \
			-s MODULARIZE=1 \
			-O3 \
			--llvm-lto 1 \
			--memory-init-file 0 \
			-I src \
			--post-js glue.js \
			-o ammo.js
	@cat ammo.js.start source/ammo.js ammo.js.end > ammo.js
