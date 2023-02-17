(function( $ ){
	$.fn.svgLoader = function() {
		let _svg = $(this);

		_svg.w = '';
		_svg.lastView = '';

		// DEFINE O TAMANHO DA JANELA
		defineHW();
		createContent();

		function createContent() {
			_svg.each(function(i,v){
				let _this = this;

				_this.image = $(this).data('image');
				_this.responsive = false;
				if ($(this).data('responsive')) _this.responsive = $(this).data('responsive'); 

				//console.log(_this.responsive);

				$contentSvg = $('<div>').addClass('divInteractive').attr('id', 'content-interactive_' + i);
				$container = $('<div>').addClass('divInteractive_Container').html($contentSvg);
				$(this).html($container).attr('aria-hidden', 'true').attr('tabindex', '-1');

				loadContent($(this), _this.image, _this.responsive);
			})
		}

		function loadContent(obj, img, resp) {
			let objContent = obj.find('.divInteractive')
			objContent.empty();
			
			if(resp) {
				if (_svg.lastView == 'desktop') {
					imgURL = img + '.svg';
				} else if (_svg.lastView == 'tablet') {
					imgURL = img + '_sm.svg';
				} else if (_svg.lastView == 'phone') {
					imgURL = img + '_xs.svg';
				}
			} else {
				imgURL = img + '.svg';
			}
	
			$.get(imgURL, function(data) {
				let $svg = $(data).find('svg');
	
				if(typeof imgID !== 'undefined') { $svg = $svg.attr('id', imgID); }
				
				$svg = $svg.removeAttr('xmlns:a');
				$svg_viewBox = $svg.attr('viewBox').split(' ');
				$svg.css('width', '100%');
				
				objContent.html($svg).css({ 'width': '100%', 'padding-bottom': 100 * ($svg_viewBox[3]/$svg_viewBox[2])  + '%' });
				objContent.parents('.svgInterativo').trigger('svgFunction');
			}, 'xml');
		}
	
		$(window).resize(function(){
			resizeSVG();
		});
	
		function resizeSVG() {
			clearTimeout(window.resizeEvt);
	
			_svg.w = $(window).width();
			defineHW();
	
			window.resizeEvt = setTimeout(function(){
				createContent();
				
				clearTimeout(window.resizeEvt);
			}, 250);
		}

		function defineHW() {
			_svg.w = $(window).width();

			if (_svg.w < 576) {
				_svg.lastView = 'phone';
			} else if (_svg.w >= 576 && _svg.w < 993) {
				_svg.lastView = 'tablet';
			} else {	
				_svg.lastView = 'desktop';
			}
		}

		return _svg;
	}
}(jQuery));