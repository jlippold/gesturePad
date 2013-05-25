module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: ['www/scripts/gesturePad/*.js']
		},
		uglify: {
			options: {
				banner: '/*!  <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				compress: true,
				beautify: false,
				preserveComments: false,
				mangle: true
			},
			build: {
				files: [{
						src: ['www/scripts/gesturePad/*.js'],
						dest: 'www/scripts/gesturePad.min.js'
					}, {
						src: 'www/scripts/phonegap.plugins/*.js',
						dest: 'www/scripts/phonegap.plugins.min.js'
					}, {
						src: ['www/scripts/lib/cordova-2.2.0.js', 'www/scripts/lib/jQuery.ajaxQueue.js', 'www/scripts/lib/jQuery.fastClick.js', 'www/scripts/lib/jQuery.gestures.js'],
						dest: 'www/scripts/lib.min.js'
					},
				]
			}
		}
	});
	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	// Default task(s).
	grunt.registerTask('default', ['jshint', 'uglify']);
};