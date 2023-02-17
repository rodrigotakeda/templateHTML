var audio;

audiojs.events.ready(function() { 
	//audiojs.createAll();
	var as = audiojs.createAll(),
		createdStyle = false,
		numVolume = $('input[type=range]').first().val() / 100;

	$.each(as, function(i, el){
		audio = as[i],
		$audio = $('#' + el.element.id).parent();

		var audioLink = audio.element.src;
		if (audio.element.readyState != 0){
			audio.element.src = audioLink;
			audio.element.load();
		}
		
		audio.setVolume(numVolume);
		
		arrayFile = audio.element.src.split("/");
		audioFile = arrayFile[arrayFile.length-1];
		transcFile = arrayFile[arrayFile.length-1].split(".");
		arrayFile.pop(); 
		transcSrc = arrayFile.join('/') + '/' + transcFile[0] + '.pdf';

		$audio.find('.btn-download').attr('href', audio.element.src).attr('download', audioFile).attr('target', '_blank');
		$audio.find('.btn-transcricao').attr('href', transcSrc).attr('download', transcFile[0]).attr('target', '_blank').attr('title', 'Transcrição do áudio');

		$audio.find('input[type=range]').attr('id', 'volumeBar_' + i);
		$audio.find('input[type=range]').on('change', function() {
			numVolume = $(this).val() / 100;
			styles[0].textContent = '';

			$.each(as, function(j, elem) {
				as[j].setVolume(numVolume);
				$('#' + as[j].element.id).parent().find('input[type=range]').val(numVolume * 100);

				var barVolumeJS = document.getElementById('volumeBar_' + j);
				var trackStyle = getTrackStyleStr(barVolumeJS, j);
				styles[0].textContent += trackStyle;
			});
		});
	});

	var r = document.querySelectorAll('input[type=range]'), 
			prefs = ['webkit-slider-runnable', 'moz-range'], 
			styles = [], 
			l = prefs.length,
			n = r.length;

	verifyVolume();

	function verifyVolume() {
		if (!createdStyle) {
			createdStyle = true;

			var s = document.createElement('style');
					document.body.appendChild(s);
					styles.push(s);

			for(var h = 0; h < n; h++) {
				r[h].setAttribute('data-rangeId', h);
				classInput = r[h].className;

				var str = '';
				for(var g = 0; g < l; g++) { 
					str += "input[type=range]." + classInput + "::-" + prefs[g] + '-track{background-size:' + (numVolume * 100)  + '% 100% }';
				}
				styles[0].textContent = str;
			}
		}
	}

	function getTrackStyleStr(el, j) {
		var str = '', 
		min = el.min || 0, 
		perc = (el.max) ? ~~(100*(el.value - min)/(el.max - min)) : el.value, 
		val = perc + '% 100%';
		classInput = el.className;
		
		for(var i = 0; i < l; i++) {
			str += "input[type=range][data-rangeId='" + j + "']." + classInput + "::-" + prefs[i] + '-track{background-size:' + val + '} ';
		}

		return str;
	};
});