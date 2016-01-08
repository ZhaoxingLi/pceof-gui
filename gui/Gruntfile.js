module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-connect');

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      
      connect: {
        def: {
          options: {
            base: 'src/main/webapp',
            keepalive: true,
            port: 9000
          }
        }
      },
    });

    grunt.registerTask('default', ['connect:def']);

};