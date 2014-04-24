
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

    }

    // module win
    var win = ( function() {

        var winEl;
        var winScrollTop;
        var _winScrollTop;
        var winHeight;
        var splash;

        var scrollSpeed = 1.5; // 2 px/ms

        var resizeDelay;

        var init = function() {
            debuglog( 'site.win.init()' );
            winEl = $( window );
            winHeight = winEl.height();
            splash = false;
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

            var _splash = splash;
            if( winScrollTop > ( winHeight / 4 ) ) {
                splash = false;
            } else {
                splash = true;
            }

            if( _splash != splash ) {
                debuglog( 'splash state changed: ' + splash );

                if( splash ) {
                    $( 'body' ).addClass( 'home' );
                } else {
                    $( 'body' ).removeClass( 'home' );
                }

            }
        
        }

        var scrollTo = function( el, offset ) {
            debuglog( 'site.win.scrollTo' )

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
            nav.init();
            sections.init();
            init();
            scroll();
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

            // only set path if it's NOT the first deeplink of this visit
            if( _current && !isJumping ) {
                path.set( slug );
            }

        }

        return {
            init: function() { init(); },
            check: function( scrollTop, winHeight ) { return check( scrollTop, winHeight ); }
        }

    } )();

    // module nav
    var nav = ( function() {
        
        var navEl;

        var current;
        var _current;

        var init = function() {
            debuglog( 'site.nav.init()' );
            navEl = $( 'nav' );

            _current = undefined;
            
            bindEventHandlers();
        }

        var bindEventHandlers = function() {

        }


        var mark = function( slug ) {
            debuglog( 'site.nav.mark( ' + slug + ' )' );

            if( slug != _current ) {

                // debuglog( 'padding: ' + padding );

                navEl
                    .find( 'a' )
                    .not( '[href$="#/' + slug + '"]' )
                    .closest( 'li' )
                    .removeClass( 'current' );

                navEl
                    .find( '[href$="#/' + slug + '"]' )
                    .closest( 'li' )
                    .addClass( 'current' );

                var index = navEl.find( 'li' ).index( navEl.find( '.current' ) ) + 1;

                navEl.find( 'ul' )
                    .attr( 'class', '' )
                    .addClass( 'current-' + index );


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
                var target = $( '#' + section );
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

$( document ).ready( function () {

    debuglog( 'site-larger.js loaded...' );
    debuglog( config['blogurl'] );

    site.init();

} ); /* end document ready */
