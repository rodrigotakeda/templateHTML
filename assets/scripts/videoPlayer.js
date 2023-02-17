(function ( $ ) {
	$.fn.video_TAE = function(options) {		
		//var intervalo;
		var defaults = {
			acao: 'tempo',
			aspect: '16:9',
			auto: false,
			capa: null,
			capitulos: null,
			hd: false,
			id: null,
			legenda: true,
			tipo: 'retratil',
			video: null,
			volume: 0.35
		};
		defaults = $.extend( {}, defaults, options );
		
		return this.each(function(vIndex) {
			var _this = $(this);

			if (defaults.id == null) defaults.id = 'playerVideo_' + vIndex;
			if (defaults.capitulos != null) { carregaCapitulos(); }
			
			// VARIAVEIS
			let $divMenu,
				$ulMenu,
				$btnMenu,
				menuOpen = false,
				videoStart,
				playerVideo,
				videoLinks = new Array(),
				timeRange = new Array();

			// CARREGAR O XML | MENU DE CAPITULOS
			function carregaCapitulos(){
				$.ajax({
					type: "GET",
					url: 'files/video/' + defaults.capitulos + '.xml',
					dataType: "xml",
					success: function(xml) {
						$divMenu = $('<div>').addClass('menu-chapter').attr('id', 'menu_' + defaults.id);
						$ulMenu = $('<ul>').attr('id', 'ulCapitulos_' + defaults.id).addClass('ul-chapter');
						$btn_fechar = $('<div>').attr('id', 'btn-fecharUl_' + defaults.id).addClass('btn-fecharUl').html('[X] Fechar').on('click', openMenuChapter);

						$(xml).find('chapter').each(function(i) {
							let $name = $(this).children('nome').text(),
								$time = $(this).children('tempo').text(),
								$video = $(this).children('video').text(),
								$li = $('<li>').addClass('btn-chapter').attr('id', 'btn_' + i + '_' + defaults.id).html($name).on('click', chapterClick);
							
							if (defaults.acao == "tempo") {
								$li.data('start', $time);
								timeRange.push($time);
							} else if (defaults.acao == "link") {
								if (i == 0) { videoStart = i; defaults.video = $video; }
								$li.data('video', $video);
								videoLinks.push($video);
							}

							$ulMenu.append($li);
						});

						$divMenu.append($btn_fechar).append($ulMenu);
						_this.append($divMenu);

						$btnMenu = $('<button>').addClass('nav-chapter').attr('type', 'button').on('click', openMenuChapter);
						_this.append($btnMenu);
					}
				});
			}

			$(document).ajaxComplete(function(event, XMLHttpRequest, ajaxOptions) {	
				if (ajaxOptions.url === 'files/video/' + defaults.capitulos + '.xml') { playerEvents(); }
			});

			// EVENTOS DO PLAYER
			function playerEvents() {
				videoSource = $('<source>').attr('src', 'files/video/'+ defaults.video + '.mp4').attr('type', 'video/mp4');
				videoPlacement = $('<video>').attr('id', defaults.id).addClass('video-js').html(videoSource);
				videoPlacement.attr('controls', true).attr("autoplay", defaults.auto).attr("preload", "none").attr('poster', 'files/video/' + defaults.capa);
				videoContent = $('<div>').attr('id', 'divVideo_' + vIndex).addClass('narradaContent').html(videoPlacement);
	
				if(defaults.legenda) {
					videoTrack = $('<track>').attr('src', 'files/video/'+ defaults.video + '.vtt').attr('kind', 'captions').attr('srclang', 'pt-br');
					videoPlacement.append(videoTrack);
				}
	
				_this.append(videoContent).addClass(defaults.tipo);

				playerVideo = videojs(defaults.id);
				playerVideo.on('ready', function(evt) {
					getBreakpoint();

					this.volume(defaults.volume);

					if (defaults.capitulos != null) {
						if (defaults.acao == "link") { 
							$ulMenu.find('.btn-chapter').first().off().addClass('selected');
						};

						$heightVideo = _this.outerHeight(true);
						$divMenu.css('height', $heightVideo + 'px');
						$ulMenu.css('height', $heightVideo + 'px');
					}
				});

				playerVideo.on('timeupdate', function(evt) {
					let tempoVideo = Math.floor(this.currentTime());

					if (defaults.capitulos != null) {
						if (defaults.acao == "tempo") {
							$.each(timeRange, function(i,v){
								if (i === (timeRange.length - 1)) { 
									if (tempoVideo >= v) { 
										$ulMenu.find('.btn-chapter').removeClass('selected').off().on('click', chapterClick);
										$ulMenu.find('.btn-chapter').last().off().addClass('selected');
									}
								} else {
									if (tempoVideo >= v && tempoVideo < timeRange[i+1]) { 
										$ulMenu.find('.btn-chapter').removeClass('selected').off().on('click', chapterClick);
										$ulMenu.find('.btn-chapter').eq(i).off().addClass('selected');
									}
								}
							})
						}
					}
				});

				playerVideo.on('play', function() {
					if (menuOpen) {
						openMenuChapter(); }
				});
				
				playerVideo.on('ended', function() {
					videoStart++;

					if (videoStart <= videoLinks.length) {
						$ulMenu.find('.btn-chapter').eq(videoStart).trigger('click'); }
				});
			}

			/*************************/
			// FUNÇÃO CAPITULOS
			if (defaults.capitulos != null) {
				function openMenuChapter() { 
					if (!menuOpen) {
						_this.find('.nav-chapter').addClass('esconde').animate({ 'opacity': '1' }, 300, function(){
							_this.find('.menu-chapter').removeClass('esconde').addClass('aberto');
						});
						playerVideo.pause();
						menuOpen = true;
					} else {
						_this.find('.menu-chapter').removeClass('aberto').animate({ 'opacity': '1' }, 300, function(){ 
							_this.find('.nav-chapter').removeClass('esconde');
						});
						playerVideo.play();
						menuOpen = false;
					}
				}

				function chapterClick() {
					if (defaults.acao == 'tempo') {
						playerVideo.currentTime($(this).data('start'));
					} else {
						videoStart = $(this).index('.btn-chapter');
						srcVideo = 'files/video/'+ $(this).data('video') + '.mp4';
						$ulMenu.find('.btn-chapter').removeClass('selected').off().on('click', chapterClick);
						playerVideo.poster('');
						playerVideo.src({"type": "video/mp4", "src": srcVideo });
						playerVideo.play();
					}
					$(this).off().addClass('selected');

					if (menuOpen) {
						openMenuChapter(); }
				}
			}

			// Breakpoint
			function getBreakpoint(){
				_this.w = $(document).innerWidth();
				
				if (_this.w < 576) {
					_this.view = 'phone';
				} else if (_this.w >= 576 && _this.w < 993) {
					_this.view = 'tablet';
				} else {	
					_this.view = 'desktop';
				}
			}

			// RESIZE PLAYER 
			function resizePlayer() {
				clearTimeout(window.resizeEvt);

				getBreakpoint();

				window.resizeEvt = setTimeout(function(){
					_this.height('auto');
					$('.menu-chapter').removeAttr('style').height('auto');

					$heightVideo = _this.outerHeight(true);
					
					$('.menu-chapter').css('height', $heightVideo + 'px');
					$('.ul-chapter').removeAttr('style').css('height', $heightVideo + 'px');
            		
					clearTimeout(window.resizeEvt);
				}, 250);
			}

			// ATUALIZAR AO REDIMENSIONAR A JANELA
			$(window).resize(function(){
				resizePlayer();
			});
		});
	};
}(jQuery));