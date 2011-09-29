/*
 * jQuery Snappy v1.0
 * http://med.ucf.edu
 *
 * Copyright (c) 2010, Justin Sisley
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

(function($){
	$.fn.snappy = function(options){
		//default settings
		var defaults = {
			width				: '500',//set width
			height				: '300',//set height
			slideClass			: '.slide',//class that the plugin will associate slides with
			fullWidth			: false,//stretches the slideshow across the entire screen width, does not hide any horizontal overflow
			fullHeight			: false,//stretches the slideshow across the entire screen height, does not hide any vertical overflow
			fullScreen			: false,//stretches the slideshow across the entire screen width and height
			autoResize			: false,//automatically resets the size of the slideshow based on the size of the browser - happens dynamically on broswer resize
			autoSize			: false,//automatically set width and height based on slider content - checks all content and changes slider shape to fit each slide
			autoPlay			: false,//start playing the slideshow automatically - pressing a control stops this
			interval			: 5000,//amount of time each slide is visible during autoPlay
			speed				: 500,//speed of the slide transition
			startingSlide		: 1,//slide to begin on
			noNav				: false,//if set to true, there is no user navigation - only use this with autoPlay turned on
			leftBtn				: '',//previous button normal state
			leftBtnOver			: '',//previous button over state
			leftBtnDown			: '',//previous button down state
			rightBtn			: '',//next button normal state
			rightBtnOver		: '',//next button over state
			rightBtnDown		: '',//next button down state
			playOnMouseOver		: false,//only when the user's mouse is over the slideshow
			autoHideNav			: false,//automatically hide the nav when the mouse is not over the slideshow
			autoHideNavSpeed	: 500,//speed of the hiding and showing of the nav when autoHideNav is set to true
			effect				: 'slide',//the transition effect of the slideshow - slide left or right, or fade from slide to slide
			slideDirection		: 'horizontal',//direction of the slide transition - can be 'horizontal' (left to right) or 'vertical' (up and down)
			keyboardControl		: false,//enables user to control slides using the left and right arrow keys
			parallax			: false,//slides controlled by mouse movement
			invertMouse			: false,//by default, parallax effect makes the slides move left as the mouse moves right, this reverses the effect
			easing				: 'linear',//easing type - extensible via jquery easing plugins
			tableOfContents		: false,//adds an interactive control panel listing the titles of each slide - pulls titles from alt tag - clicking the title goes to that slide
			tableOfContentsCols	: 1,//sets the number of columns created for the table of contents
			autoTable			: true,//if tableOfContents is activated, the table will be created automatically using the alt tags of the slideshow images
			boldCurrent			: false,//makes the current table of contents selection text bold
			captions			: false,//add caption for each slide - semi-transparent background - pulls caption from alt tag
			captionText			: '#fff',//caption text color
			captionBg			: '#000',//caption background color
			captionOpacity		: '0.85',//caption background opacity
			captionPosition		: 'bottom',//vertical position of the caption box - can be 'top', 'bottom', 'middle'
			captionEffect		: 'none',//how the caption is displayed - can be 'none', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'fade'
			captionEffectSpeed	: 500,//the speed of the caption effect
			slideCounter		: false,//shows a stylable box that display the current slide vs total slides
			queue				: false,//build a queue of animations based on how many times the user clicks the nav
			getCurrentPosition	: function(cp){}//public method for getting the current slide position
		};
		var o = $.extend(defaults, options);//comSlider options
		
		//------------------------------------------------------
		//global variables, properties, and objects
		var p = this;//parent div
		var w = p.find('div:first');//wrapper
		var s = w.find(o.slideClass);//all slides
		
		var sw = o.width;//slide width
		var sh = o.height;//slide height
		
		var ts = (s.length);//total number of slides
		var tw = ts * sw;//total width of all slides
		
		var cp = o.startingSlide;//current position of slides *NOTE: THIS IS ONLY THE POSITION, NOT THE ELEMENT ITSELF*
		
		var cs;//current slide
		var ns;//next slide
		var san;//slide after next
		var ps;//previous slide
		var sbp;//slide before previous
		
		var ap;//autoPlay timeout global
		
		var c;//counter
		
		var atc;//alt tag contents
		var ltc;//link to create
		var stt;//slide to target
		
		var tl;//table of contents link
		var tcc = o.tableOfContentsCols;//number of table of contents columns
		var str;//starting point for columnizing
		var fin;//ending point for columnizing
		var ms;//matched set for columnizing
		var rem;//remainder for columnizing
		var mc;//matched columns for columnizing
		
		var nw;//user-defined nav image width
		var nh;//user-defined nav image height
				
		//------------------------------------------------------
		//this method determines current slide, previous slide, next slide, slide before previous, and slide after next
		function getSlidePos(){			
			//current slide
			cs = s.slice(cp - 1, cp);
			
			//next slide
			if(cp + 1 > ts){
				ns = s.slice(0, 1);
			}else{
				ns = s.slice(cp, cp + 1);	
			}
			
			//slide after next
			if(cp + 2 === ts + 1){
				san = s.slice(0, 1);
			}else if(cp + 2 === ts + 2){
				san = s.slice(1, 2);
			}else{
				san = s.slice(cp + 1, cp + 2);	
			}
			
			//previous slide
			if(cp - 1 <= 0){
				ps = s.slice(ts - 1, ts);
			}else{
				ps = s.slice(cp - 2, cp - 1);	
			}
			
			//slide before previous
			if(cp - 2 === 0){
				sbp = s.slice(ts - 1, ts);
			}else if(cp - 2 === -1){
				sbp = s.slice(ts - 2, ts - 1);
			}else{
				sbp = s.slice(cp - 3, cp - 2);
			}
		}
		
		//------------------------------------------------------
		//full width
		if(o.fullWidth === true){
			sw = window.innerWidth;
		}
		
		//full height
		if(o.fullHeight === true){
			// subtract 40 pixels to make up for the UCF header
			sh = window.innerHeight - 40;
		}
		
		//full screen
		if(o.fullScreen === true){
			sw = window.innerWidth;
			// subtract 40 pixels to make up for the UCF header
			sh = window.innerHeight - 40;
		}
		
		//------------------------------------------------------
		//set css properties to make the slideshow function properly, if javascript is not enabled, these will fall back to css
		p.css({
			'background'	: 'none',
			'position'		: 'relative',
			'display'		: 'block',
			'overflow'		: 'hidden',
			'width'			: sw + 'px',
			'height'		: sh + 'px'
		});
		
		//------------------------------------------------------
		//set up navigation
		if(o.leftBtn != '' || o.rightBtn != ''){
			var ni = new Image();//navigation image
			ni.src = o.leftBtn;
			nw = ni.width;//navigation width
			nh = ni.height;//navigation height
			
			var ln = $('<img src="' + o.leftBtn + '" id="leftBtn" />');//left nav
			var rn = $('<img src="' + o.rightBtn + '" id="rightBtn" />');//right nav
		}else{
			//use markup-based buttons
			var ln = $('<div id="leftBtn">Left</div>');
			var rn = $('<div id="rightBtn">Right</div>');
			ln.css({
				'width'			: '30px',
				'height'		: '30px',
				'background'	: '#000',
				'color'			: '#fff'
			});
			
			rn.css({
				'width'			: '30px',
				'height'		: '30px',
				'background'	: '#000',
				'color'			: '#fff'
			});
		}
		
		rn.insertAfter(w);
		rn.css({
			'position'	: 'relative',
			'float'		: 'right',
			'top'		: (sh / 2) - (nh / 2) + 'px',
			'cursor'	: 'pointer',
			'z-index'	: '1000'
		});
		
		ln.insertAfter(w);
		ln.css({
			'position'	: 'relative',
			'float'		: 'left',
			'top'		: (sh / 2) - (nh / 2) + 'px',
			'cursor'	: 'pointer',
			'z-index'	: '1000'
		});
		
		//initialize navigation
		function inav(){
			rn.bind('click', function(){
				if(o.effect === 'slide'){
					slidePrev();
				}
				if(o.effect === 'fade'){
					fadePrev();
				}
				if(o.autoPlay === true){
					clearInterval(ap);
				}
			});
			
			ln.bind('click', function(){
				if(o.effect === 'slide'){
					slideNext();
				}
				if(o.effect === 'fade'){
					fadeNext();
				}
				if(o.autoPlay === true){
					clearInterval(ap);
				}
			});
			
			//keyboardControl
			if(o.keyboardControl === true){
				$('html').bind('keydown', function(e){
					if(e.keyCode === 37){
						slidePrev();
					}else if(e.keyCode === 39){
						slideNext();
					}
				});
			}
		}
		
		//kill navigation
		function knav(){
			ln.unbind();
			rn.unbind();
			
			if(o.keyboardControl === true){
				$('html').unbind();	
			}
		}

		inav();
		
		//------------------------------------------------------
		//if there is only one slide disable options and navigation
		if(ts === 1){
			o.effect = '';
			o.autoPlay = false;
			knav();
			ln.css({'display':'none'});
			rn.css({'display':'none'});
		}
		
		//**************************************************************************************
		//OPTIONAL PARAMETERS
		//**************************************************************************************
		//effect type: slide
		if(o.effect === 'slide'){
			w.css({
				'position'		: 'absolute',
				'overflow'		: 'hidden',
				'width'			: sw + 'px',
				'height'		: '100%',
				'margin'		: '0',
				'padding'		: '0'	
			});
			
			s.css({
				'float'			: 'left',
				'position'		: 'absolute',
				'top'			: '0',
				'left'			: '0',
				'display'		: 'none',
				'width' 		: sw + 'px',
				'height'		: sh + 'px',
				'padding'		: '0'
			});
			
			//set up current slide - as determined by the startingSlide parameter
			s.slice(cp - 1, cp).css({
				'display'		: 'block'
			});
			
			if(ts > 2){
				getSlidePos();
				//set up next slide based on current slide
				ns.css({
					'display'		: 'block',
					'left'			: sw + 'px'
				});
				
				//set up previous slide based on current slide
				ps.css({
					'display'		: 'block',
					'left'			: '-' + sw + 'px'
				});
			}else if(ts === 2){//does not function properly with only 2 slides, so clones are made
				s.slice(cp - 1, cp).clone().css({'display':'none'}).appendTo(w);
				s.slice(cp, cp + 1).clone().appendTo(w);
				
				//get new amount of slides
				s = w.find('.slide');
				ts = (s.length);
				
				getSlidePos();
				//set up next slide based on current slide
				ns.css({
					'display'		: 'block',
					'left'			: sw + 'px'
				});
				
				//set up previous slide based on current slide
				ps.css({
					'display'		: 'block',
					'left'			: '-' + sw + 'px'
				});
			}
		}
		//------------------------------------------------------
		//effect type: fade
		if(o.effect === 'fade'){
			w.css({
				'position'		: 'absolute',
				'width'			: sw + 'px',
				'height'		: '100%',
				'margin'		: '0',
				'padding'		: '0'	
			});
			
			s.css({
				'float'			: 'left',
				'position'		: 'absolute',
				'top'			: '0',
				'left'			: '0',
				'display'		: 'none',
				'width' 		: sw + 'px',
				'height'		: sh + 'px',
				'padding'		: '0',
				'z-index'		: '500'
			});
			
			//set up current slide - as determined by the startingSlide parameter
			s.slice(cp - 1, cp).css({
				'display'		: 'block',
				'z-index'		: '501'
			});	
		}
		//------------------------------------------------------
		//navigation over and down states
		if(o.leftBtnOver !== ''){
			ln.mouseover(function(){
				ln.attr('src', o.leftBtnOver);	
			});
			ln.mouseout(function(){
				ln.attr('src', o.leftBtn);	
			});
		}
		if(o.leftBtnDown !== ''){
			ln.mousedown(function(){
				ln.attr('src', o.leftBtnDown);	
			});
			ln.mouseup(function(){
				ln.attr('src', o.leftBtnOver);	
			});
		}
		
		if(o.rightBtnOver !== ''){
			rn.mouseover(function(){
				rn.attr('src', o.rightBtnOver);	
			});
			rn.mouseout(function(){
				rn.attr('src', o.rightBtn);	
			});
		}
		if(o.rightBtnDown !== ''){
			rn.mousedown(function(){
				rn.attr('src', o.rightBtnDown);	
			});
			rn.mouseup(function(){
				rn.attr('src', o.rightBtnOver);	
			});
		}
		//------------------------------------------------------
		//autoPlay
		if(o.autoPlay === true){
			if(o.effect === 'slide'){
				ap = setInterval(slideNext, o.interval);	
			}
			if(o.effect === 'fade'){
				ap = setInterval(fadeNext, o.interval);
			}
		}
		//------------------------------------------------------
		//playOnMouseOver
		if ( true === o.playOnMouseOver ) {
			if(o.effect === 'fade'){
				p.bind( 'mouseover', function( e ) {
					ap = setInterval( fadeNext, o.interval );	
				} );
				
				p.bind( 'mouseout', function( e ) {
					clearInterval( ap );	
				} );
			}
		}
		
		//------------------------------------------------------
		//autoHideNav
		if(o.autoHideNav === true){
			rn.css({
				'opacity'	: '0'
			});
			ln.css({
				'opacity'	: '0'
			});
			
			p.mouseover(function(){
				rn.stop().fadeTo(o.autoHideNavSpeed, 1);
				ln.stop().fadeTo(o.autoHideNavSpeed, 1);	
			});
			p.mouseout(function(){
				rn.stop().fadeTo(o.autoHideNavSpeed, 0);
				ln.stop().fadeTo(o.autoHideNavSpeed, 0);	
			});
		}
		//------------------------------------------------------
		//counter	
		if(o.counter === true){
			var cmta = '<div id="counter"></div>';//counter markup to append
			p.append(cmta);
			c = $('#counter');
			updateCounter();
		}
		
		function updateCounter(){
			var cd = cp + ' of ' + ts;//latest counter data
			c.html(cd);
		}
		//------------------------------------------------------
		//tableOfContents		
		if(o.tableOfContents === true){
			if(o.autoTable === true){
				var tmta = $('<div id="tableOfContents"></div>');//table markup to append
				tmta.insertAfter(p);
				tmta.css({
					'width'			: sw + 'px'
				});
				
				//create columns if there are more than one
				if(tcc > 1){
					//add proper amount of columns
					for(i = 0; i < tcc; i++){
						var cta = $('<div id="tocColumn-' + i + '"></div>');//column to append
						tmta.append(cta);
					}
					
					//evenly distribute contents to columns
					res = ts / tcc;//number of slides divided by number of columns
					
					if(res > Math.floor(res)){
						//the result is not a whole number
						ms = Math.ceil(res);//common set of same-number dividends
						rem = ts - (ms * (tcc - 1));//remainder dividend
						
						for(i = 0; i < tcc; i++){
							mc = ts / ms;//number of columns with matching numbers
							
							fin = ms * (i + 1);
							str = fin - (ms - 1);
							
							for(j = 0; j < ts; j++){
								if(j < fin && j > (str - 2)){
									atc = s.slice(j, j + 1).find('img').attr('alt');
									ltc = $('<a href="#" class="tocLink-' + j + '">' + atc + '</a>');
									$('#tocColumn-' + i).append(ltc);
								}
							}
						}
					}else{
						//the result is a whole number, distribute evenly
						for(i = 0; i < tcc; i++){
							fin = res * (i + 1);
							str = fin - (res - 1);
							
							for(j = 0; j < ts; j++){
								if(j < fin && j > (str - 2)){
									atc = s.slice(j, j + 1).find('img').attr('alt');
									ltc = $('<a href="#" class="tocLink-' + j + '">' + atc + '</a>');
									$('#tocColumn-' + i).append(ltc);
								}
							}
						}
					}
				}else{
					//if there is only 1 column just insert the data
					for(i = 0; i < ts; i++){
						atc = s.slice(i, i + 1).find('img').attr('alt');
						ltc = $('<a href="#" class="tocLink-' + i + '">' + atc + '</a>');
						tmta.append(ltc);
					}
				}
			}
			
			$('#tableOfContents').css({display: 'block'});
			
			tl = $('a[class^="tocLink-"]');
			
			if(o.boldCurrent === true){
					tl.slice(cp - 1, cp).css({'font-weight':'bold'});
			}
			
			tl.bind('click', function(e){
				e.preventDefault(e);
				
				cs.css({'display':'none', 'left':'0'});
				ns.css({'display':'none', 'left':'0'});
				ps.css({'display':'none', 'left':'0'});
				
				if(o.boldCurrent === true){
					tl.css({'font-weight':'normal'});
					$(this).css({'font-weight':'bold'});
				}
				
				stt = $(this).attr('class');
				stt = stt.replace('tocLink-', '');
				stt = Number(stt);
				
				s.slice(stt, stt + 1).css({
					'display'	: 'block',
					'left'		: '0'	
				});
				
				cp = stt + 1;				
				getSlidePos();
				
				ns.css({
					'display'		: 'block',
					'left'			: sw + 'px'
				});
				
				ps.css({
					'display'		: 'block',
					'left'			: '-' + sw + 'px'
				});
			});
		}
		//------------------------------------------------------
		//noNav
		if(o.noNav === true){
			ln.css({'display':'none'});
			rn.css({'display':'none'});
		}
		
		//**************************************************************************************
		//TRANSITION EFFECTS
		//**************************************************************************************
		//------------------------------------------------------
		//slide
		function slideNext(){
			knav();
			getSlidePos();
			
			cs.animate({left: '-=' + sw + 'px'}, o.speed, o.easing);
			ns.animate({left: '-=' + sw + 'px'}, o.speed, o.easing);
			ps.animate({left: '-=' + sw + 'px'}, o.speed, o.easing, setNext);
		}
		
		function slidePrev(){
			knav();
			getSlidePos();
			
			cs.animate({left: '+=' + sw + 'px'}, o.speed, o.easing);
			ns.animate({left: '+=' + sw + 'px'}, o.speed, o.easing);
			ps.animate({left: '+=' + sw + 'px'}, o.speed, o.easing, setPrev);
		}
		
		//callback for slideNext
		function setNext(){
			ps.css({'left': '0', 'display': 'none'});
			san.css({'display': 'block', 'left': sw + 'px'});
			
			inav();
				
			cp++;
			if(cp > ts){
				cp = 1;
			}
			
			o.getCurrentPosition(cp);
			
			if(o.tableOfContents === true && o.boldCurrent === true){
				tl.css({'font-weight':'normal'});
				if(cp === ts + 1){
					tl.slice(0, 1).css({'font-weight':'bold'});
				}else{
					tl.slice(cp - 1, cp).css({'font-weight':'bold'});
				}
			}
			
			if(o.counter === true){
				updateCounter();	
			}
		}
		
		//callback for slidePrev
		function setPrev(){
			ns.css({'left': '0', 'display': 'none'});
			sbp.css({'display': 'block', 'left': '-' + sw + 'px'});
			
			inav();
			
			cp--;
			if(cp < 1){
				cp = ts;
			}
			
			o.getCurrentPosition(cp);
						
			if(o.tableOfContents === true && o.boldCurrent === true){
				tl.css({'font-weight':'normal'});			
				if(cp === ts){
					tl.slice(ts - 1, ts).css({'font-weight':'bold'});
				}else{
					tl.slice(cp - 1, cp).css({'font-weight':'bold'});
				}
			}
			
			if(o.counter === true){
				updateCounter();	
			}
		}
				
		//------------------------------------------------------
		//fade
		function fadeNext(){
			knav();
			
			if(cp < ts){
				//set all slides to the lowest index
				s.css({'z-index':'500'});
				
				//lower the current slide's index
				s.slice(cp - 1, cp).css({'z-index':'501'}).fadeTo(o.speed, 0);
				
				//raise the z-index and fade in the next slide
				s.slice(cp, cp + 1).css({'z-index':'502', 'opacity':'0'}).fadeTo(o.speed, 1, inav);
				
				cp++;
			}
			//if next is pressed on final slide, go to slide 1
			else if(cp == ts){
				//set all slides to the lowest index
				s.css({'z-index':'500'});
				
				//lower the current slide's index
				s.slice(cp - 1, cp).css({'z-index':'501'}).fadeTo(o.speed, 0);
				
				//fade in slide 1
				s.slice(0, 1).css({'z-index':'502', 'opacity':'0'}).fadeTo(o.speed, 1, inav);
				
				cp = 1;
			}
			
			if(o.counter === true){
				updateCounter();	
			}
		}
		
		function fadePrev(){
			knav();
			
			if(cp > 1){
				//set all slides to the lowest index
				s.css({'z-index':'500'});
				
				//lower the current slide's index
				s.slice(cp - 1, cp).css({'z-index':'501'}).fadeTo(o.speed, 0);
				
				//fade in the previous slide
				s.slice(cp - 2, cp - 1).css({'z-index':'502', 'opacity':'0'}).fadeTo(o.speed, 1, inav);
				
				cp--;
			}
			//if previous is pressed on slide 1, go to final slide
			else if(cp == 1){
				//set all slides to the lowest index
				s.css({'z-index':'500'});
				
				//lower the current slide's index
				s.slice(cp - 1, cp).css({'z-index':'501'}).fadeTo(o.speed, 0);
				
				//fade in final slide
				s.slice(ts - 1, ts).css({'z-index':'502', 'opacity':'0'}).fadeTo(o.speed, 1, inav);
				
				cp = ts;	
			}
			
			if(o.counter === true){
				updateCounter();	
			}
		}
		
		o.getCurrentPosition(cp);
	};
})(jQuery);