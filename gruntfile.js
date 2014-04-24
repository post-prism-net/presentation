module.exports = function(grunt){

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

		less: {
		  development: {
		    files: {
		      'css/style.css': 'css/style.less',
		    }
		  }
		},

		autoprefixer: {
		    style: {
		      src: 'css/style.css',
		      dest: 'css/style.css'
		    }
		},

		modernizr: {
		    dist: {
		        'devFile' : 'remote',
		        'outputFile' : 'js/src/modernizr.js',
		        'extra' : {
		            'shiv' : true,
		            'printshiv' : false,
		            'load' : true,
		            'mq' : true,
		            'cssclasses' : true
		        },
		        'uglify' : false,
		        'parseFiles' : true,
		        'files' : {
            		'src': ['js/**/*.js', '**/*.css', '!node_modules/**/*', '!js/**/*.min.js']
        		},
		        'matchCommunityTests' : false
		    }
		},


		uglify: {
			options: {
				mangle: false
			},
			dependencies: {
			  files: {
			    'js/dependencies-global.min.js': ['js/src/dependencies-global/*.js']
			  }
			},
			site: {
				files: {
					'js/site-global.min.js': ['js/src/site-global.js']
				}
			}

		},

		imagemin: {
			all: {                        
				files: [{
					expand: true,  
					cwd: 'img/src',
					src: ['**/*.{png,jpeg,jpg,gif}'],
					dest: 'img/'
		     	}]
		    }
	    },

	    svgmin: {                      
	        options: {                 
	            plugins: [
	              { removeViewBox: false },
	              { removeUselessStrokeAndFill: false }
	            ]
	        },
	        dist: {                    
	            files: [{              
	                expand: true,       
	                cwd: 'img/src',     
	                src: ['**/*.svg'],  
	                dest: 'img/'       
	            }]
	        }
	    },

	    svg2png: {
	        all: {
	            files: [{ 
	            	src: ['img/*.svg'], 
	            	dest: 'img/' 
	            }]
	        }
	    },

		watch: {
		    css: {
		        files: ['css/**/*.less'],
		        tasks: ['buildcss']
		    },
		    js: {
		    	files: ['js/**/*.js','!js/**/*.min.js'],
		    	tasks: ['buildjs']
		    },
		    img_raster: {
		    	files: ['img/src/**.{jpg,jpeg,gif,png}'],
		    	tasks: ['buildimages_raster']
		    },
		    img_vector: {
		    	files: ['img/src/**.svg'],
		    	tasks: ['buildimages_vector']
		    }
		}


    });

    grunt.registerTask( 'default', ['build'] );

	grunt.registerTask( 'buildcss',  ['less', 'autoprefixer'] );
	grunt.registerTask( 'buildmodernizr', ['modernizr'] );
	grunt.registerTask( 'buildjs',  ['uglify'] );
	grunt.registerTask( 'buildimages',  ['imagemin', 'svgmin', 'svg2png'] );
	grunt.registerTask( 'buildimages_raster',  ['imagemin'] );
	grunt.registerTask( 'buildimages_vector',  ['svgmin', 'svg2png'] );

	grunt.registerTask( 'build',  ['buildcss', 'buildmodernizr', 'buildjs', 'buildimages'] );
};