// global debug switch
debugmode = true; 

// debuglog
debuglog = function( log ) {
    if( debugmode && typeof console != 'undefined' ) console.log( log );
}

// requestAnimationFrame polyfill
requestAnimationFramePolyfill = 
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function( callback ) { window.setTimeout( callback, 1000/60 ) }

// global vars
config = new Array();


// app
var site = ( function() {

    var isJumping;
    var isScrolling;

    var init = function() {
        debuglog( 'site.init()' );
        bindEventHandlers();

        path.init();
        sections.init();
        nav.init();
        win.init();
    }

    var bindEventHandlers = function() {

        $( document ).on( 'keypress', function( e ) {
            if( e.keyCode == 37 || e.keyCode == 38 ) {
                debuglog( 'prev' );
                e.preventDefault();
                if( sections.getPrev() ) {
                    location.hash = '/' + sections.getPrev() + '/';
                }
            }

            if( e.keyCode == 39 || e.keyCode == 40 ) {
                debuglog( 'next' );
                e.preventDefault();

                if( sections.getNext() ) { 
                    location.hash = '/' + sections.getNext() + '/';
                }
            }
        } )

    }

    // module win
    var win = ( function() {

        var winEl;
        var winScrollTop;
        var _winScrollTop;
        var winHeight;

        var scrollSpeed = 1.5; // 2 px/ms

        var resizeDelay;

        var init = function() {
            debuglog( 'site.win.init()' );
            winEl = $( window );
            winHeight = winEl.height();
            isJumping = false;
            isScrolling = false;
            bindEventHandlers()
            scrollLoop();
        }

        var bindEventHandlers = function() {

            // throttle resize event
            winEl.on( 'resize', function() {
                
                if( resizeDelay ) { 
                    clearTimeout( resizeDelay );
                }

                resizeDelay = setTimeout( resize, 1000 );
            } );

        }

        var scrollLoop = function() {
            var _winScrollTop = winScrollTop;
            winScrollTop = winEl.scrollTop();

            // debuglog( winScrollTop + ' / ' + _winScrollTop );

            if( winScrollTop != _winScrollTop ) {
                isScrolling = true;
                scroll();
            } else {
                isScrolling = false;
            }

            requestAnimationFramePolyfill( scrollLoop );
        }

        var scroll = function() {
            debuglog( 'site.win.scroll()' );

            sections.check( winScrollTop, winHeight );
        
        }

        var scrollTo = function( el, offset ) {
            debuglog( 'site.win.scrollTo( ' + el + ', ' + offset + ' )' );

            if( el.length > 0 && !isScrolling ) { 

                var offset = offset || 0;
                var position = el.position().top - offset;

                var distance = Math.floor( Math.abs( position - winScrollTop ) );
                var duration = Math.floor( distance / scrollSpeed );

                debuglog( 'position: ' + position );
                debuglog( 'duration: ' + duration );

                isJumping = true;
                $( 'html,body' ).animate( {
                    scrollTop: position
                }, duration, 'easeInOutQuart', function() {
                    isJumping = false;
                } );

            }

        } 

        var resize = function() {
            // nav.init();
            sections.init();
            init();
            // scroll();
        }

        return {
            init: function() { init(); },
            scrollTo: function( el, offset ) { scrollTo( el, offset ); },
            resize: function() { resize(); }
        }

    } )();

   // module sections
    var sections = ( function() {

        var cache = new Array();
        var current;
        var _current;

        var init = function() {
            debuglog( 'site.sections.init()' );
            bindEventHandlers();

            createCache();
        }

        var bindEventHandlers = function() {

        }

        var createCache = function() {

            $( 'section' ).each( function() {

                var section = new Array();
                section['slug'] = $( this ).attr( 'data-section' );
                section['title'] = $( this ).attr( 'data-title' );
                section['offset'] = Math.floor( $( this ).position().top );

                cache.push( section );

            } );

            debuglog( cache );
        }

        var check = function( scrollTop, winHeight ) {

            for( var i = 0; i < cache.length; i++ ) {

                if( scrollTop > cache[i]['offset'] - ( winHeight * 2 / 3 ) ) {
                    current = cache[i]['slug']
                }

            }

            if( current != _current ) {
                change( current );
            }

            _current = current;

        }

        var change = function( slug ) {
            debuglog( 'site.sections.change( ' + slug + ' )' );

            nav.mark( slug );
            mark( slug );

            // only set path if it's NOT the first deeplink of this visit
            if( _current && !isJumping ) {
                path.set( slug );
            }

        }

        var mark = function( slug ) {
            debuglog( 'site.sections.mark( ' + slug + ' )' );

            $( 'section' ).removeClass( 'current' );
            $( 'section[data-section="' + slug + '"]' ).addClass( 'current' );

        }

        var getNext = function() {

            var index;

            for( i = 0; i < cache.length; i++ ) {
                if( cache[i]['slug'] == current ) {
                    index = i;
                }
            }

            if( index < cache.length - 1 ) {
                var next = cache[index + 1]['slug'];
                return next;
            } else {
                return false;
            }
        }

        var getPrev = function() {

            var index;

            for( i = 0; i < cache.length; i++ ) {
                if( cache[i]['slug'] == current ) {
                    index = i;
                }
            }

            if( index > 0 ) {
                var prev = cache[index - 1]['slug'];
                return prev;
            } else {
                return false;
            } 
        }
        
        var getSections = function() {
            debuglog( 'site.sections.getSections()' );

            return cache;
        }
        

        return {
            init:        function() { init(); },
            getSections: function() { return getSections(); },
            getNext:   function() { return getNext(); },
            getPrev:   function() { return getPrev(); },
            check:       function( scrollTop, winHeight ) { return check( scrollTop, winHeight ); }
        }

    } )();

    // module nav
    var nav = ( function() {
        
        var navEl;

        var current;
        var _current;

        var init = function() {
            debuglog( 'site.nav.init()' );
            navEl = build();

            _current = undefined;
            
            bindEventHandlers();
        }

        var bindEventHandlers = function() {

        }

        var build = function() {
            debuglog( 'site.nav.build()' );

            if( $( 'nav' ).length > 0 ) {
                $( 'nav' ).remove();
            }

            var html = $( '<nav><h1>post-prism.net</h1><span><ul></ul></span></nav>' );
            var ul = html.find( 'ul' );

            var s = sections.getSections();

            for( var i = 0; i < s.length; i++ ) {

                item = $( '<li><a href="#/' + s[i]['slug'] + '/">' + s[i]['title'] + '</a></li>' );
                ul.append( item );

            }

            html.prependTo( $( 'body' ) );

            return html;

        }

        var mark = function( slug ) {
            debuglog( 'site.nav.mark( ' + slug + ' )' );

            if( slug != _current ) {

                // debuglog( 'padding: ' + padding );

                var liHeight = navEl
                    .find( 'li' )
                    .first()
                    .height();

                navEl
                    .find( 'a' )
                    .not( '[href$="#/' + slug + '/"]' )
                    .closest( 'li' )
                    .removeClass( 'current' );

                navEl
                    .find( '[href$="#/' + slug + '/"]' )
                    .closest( 'li' )
                    .addClass( 'current' );

                var index = navEl.find( 'li' ).index( navEl.find( '.current' ) ) + 1;

                var marginTop = parseInt( liHeight ) * ( index - 1 ) * -1;
                navEl
                    .find( 'li' )
                    .first()
                    .css( {
                        'marginTop': marginTop + 'px' 
                    } );


                _current = slug;

                }
        }

        return {
            init: function() { init(); },
            mark: function( slug ) { mark( slug ); }
        }

    } )();

    // module path
    var path = ( function() {

        var section;
        var linksEl;

        var init = function() {
            linksEl = $( '[href^="#"]' );
            saveLinks();
            rewriteLinks();
            bindEventHandlers();
            checkPath( $.address.value() );
        }

        var bindEventHandlers = function() {
            $.address.externalChange( function( e ) {
                checkPath( $.address.value() );
            } );
        }

        var saveLinks = function() {
            debuglog( 'site.path.saveLinks()' );
            
            linksEl
                .not( '[data-url]' )
                .each( function() {
                    $( this ).attr( 'data-url', $( this ).attr( 'href' ) );
                } );
        }

        var rewriteLinks = function() {
            debuglog( 'site.path.rewriteLinks()' );

            linksEl
                .each( function() {
                    var link =  $( this );
                    var url = link.attr( 'href' ).replace( '#', '' );
                    url = '#/' + url;
                    link.attr( 'href', url );
                } );
        }

        var set = function( path ) {
            debuglog( 'site.path.set( ' + path + ' )' );

            $.address.path( path );
        }

        var checkPath = function( path ) {
            debuglog( 'path.checkPath(' + path + ')' );

            var path = path || '';

            path = path.split( '/' );

            section = path[1] || 'home';
            
            if( section ) {
                var target = $( '[data-section="' + section + '"]' );
                win.scrollTo( target );
            }

        }

        return {
            init: function() { init(); },
            set:  function( path ) { set( path ) }
        }

    } )();


    // module 
    var module = ( function() {

        var init = function() {
            debuglog( 'site.module.init()' );
            bindEventHandlers();
        }

        var bindEventHandlers = function() {


        }

        return {
            init: function() { init(); }
        }

    } )();

    return {
        init: function() { init(); }
    }

} )();

// document ready
$( document ).ready( function () {

    // init config vars
    config['blogurl'] = location.protocol + '//' + location.hostname + location.pathname;
    config['breakpoint'] = $( 'title' ).css( 'width' );
    config['mediaquery'] = $( 'title' ).css( 'fontFamily' )
        .replace( /'/g, '' )
        .replace( /"/g, '' );

    debuglog( 'site-global.js loaded...' );
    debuglog( config['blogurl'] );
    debuglog( config['mediaquery'] );

    site.init();

    $( 'html' ).removeClass( 'no-js' );

} );
