all: ansi_up.min.css ansi_up.min.js

ansi_up.min.css: ansi_up.css
	cleancss -o ansi_up.min.css --rounding-precision=4 -s ansi_up.css

ansi_up.css: ansi_up.less
	lessc -sm=on -su=on ansi_up.less > ansi_up.css.tmp
	[ ! -e ansi_up.css ] || rm -f ansi_up.css
	mv ansi_up.css.tmp ansi_up.css

ansi_up.min.js: ansi_up.js
	uglifyjs ansi_up.js -o ansi_up.min.js -b beautify=false,ascii-only -m -c --comments

.PHONY:	all
