/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
    /**
     * The `build_dir` folder is where our projects are compiled during
     * development and the `compile_dir` folder is where our app resides once it's
     * completely built.
     */
    build_dir: 'build',
    app_dir: 'app',
    app_all_files: ['src/**/*', 'assets/packages/**/*'],

    /**
     * This is a collection of file patterns that refer to our app code (the
     * stuff in `src/`). These file paths are used in the configuration of
     * build tasks. `js` is all project javascript, less tests. `ctpl` contains
     * our reusable components' (`src/common`) template HTML files, while
     * `atpl` contains the same, but for our app's code. `html` is just our
     * main HTML file, `less` is our main stylesheet, and `unit` contains our
     * app's unit tests.
     */
    app_files: {
        js: ['src/*.js', 'src/**/*.js'],
        jsunit: ['src/**/*.spec.js'],
        js_common: ['src/app/common/**/*.js'],
        js_app: ['src/app/modules/**/*.js', 'src/app/modules/**/**/*.js'],
        views: ['src/**/*.tpl.html'],
        json: ['src/**/*.json'],

        html: ['src/index.html'],
        less: 'assets/less/main.less',
        less_files: 'assets/less/*.less',
        css: ['assets/css/main.css'],

        lang: ['src/app/**/assets/data/*.json'],
        templates: ['src/**/*.tpl.html'],
        images: ['src/app/**/assets/images/*.*']
    },

    assets_files: {
        css: ['assets/**/*.css', '!assets/css/main.css'],
        js: ['assets/**/*.js'],
        fonts: [
            'assets/packages/next-ui/fonts/*.*',
            'assets/packages/iconfont/*.*'
        ],
        package_fonts: ['assets/**/fonts/*.*']
    },

    web_info_files: ['WEB-INF/*.*'],

    /**
     * This is a collection of files used during testing only.
     */


    /**
     * This is the same as `app_files`, except it contains patterns that
     * reference vendor code (`vendor/`) that we need to place into the build
     * process somewhere. While the `app_files` property ensures all
     * standardized files are collected for compilation, it is the user's job
     * to ensure non-standardized (i.e. vendor-related) files are handled
     * appropriately in `vendor_files.js`.
     *
     * The `vendor_files.js` property holds files to be automatically
     * concatenated and minified with our project source files.
     *
     * The `vendor_files.css` property holds any CSS files to be automatically
     * included in our app.
     *
     * The `vendor_files.assets` property holds any assets to be copied along
     * with our app's assets. This structure is flattened, so it is not
     * recommended that you use wildcards.
     */
    vendor_files: {
        js: [
            'angular/angular.min.js',
            'requirejs/require.js',
            'angular-translate/angular-translate.min.js',
            'angular-translate-loader-partial/angular-translate-loader-partial.min.js',
            'angular-route/angular-route.min.js',
            'angular-material/angular-material.min.js',
            'angular-animate/angular-animate.min.js',
            'angular-aria/angular-aria.min.js',
            'restangular/dist/restangular.min.js',
            'lodash/dist/lodash.min.js',
            'angular-material-data-table/dist/md-data-table.min.js',
            'angular-json-tree/build/angular-json-tree.min.js',
            'angular-messages/angular-messages.min.js',
			'NeXt/js/next.min.js'
        ],
        css: [
            'angular-material/angular-material.min.css',
            'font-awesome/css/font-awesome.min.css',
            'roboto-fontface/css/roboto-fontface.css',
            'angular-material-data-table/dist/md-data-table.min.css',
            'angular-json-tree/build/angular-json-tree.css',
			'NeXt/css/next.min.css'
        ],
        images: [],
        assets: [],
        fonts: [
            'vendor/font-awesome/fonts/*.*',
            'vendor/roboto-fontface/fonts/*.*',
            'vendor/NeXt/fonts/*.*'
        ],
        cisco_fonts: [
            'vendor/NeXt/fonts/cisco/*.*'
        ]
    }

};
