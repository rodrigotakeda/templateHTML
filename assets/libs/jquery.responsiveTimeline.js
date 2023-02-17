(function( $ ){
	$.fn.timeline = function() {
		var timeline = $(this)
		var current_group = 1;
		var group_itens = $(timeline).find(".group-timeline");
	
		var total_group = group_itens.length;
		if(total_group == 1) {		
			$('#arrow-right-timeline').css('display' ,'none');	
			$('#arrow-left-timeline').css('display' ,'none');
		}
		
		closeAllTabs();
		
		$(timeline).find('ul li').click(function(event){
			closeAllTabs();
			
			$(this).addClass('tab-timeline-selected')
			var tab = $(this).attr('href');

			$(timeline).find(tab).removeClass('tab-timeline-disabled');
			$(timeline).find(tab).addClass('tab-timeline-active');
		});
		
		$('#arrow-right-timeline').click(function(event){
			
			if(current_group == total_group) {			
				return;
			} else if((current_group+1) == total_group) {
				$('#arrow-right-timeline').css('display' ,'none');	
				$('#arrow-left-timeline').css('display' ,'block');			
			}  else {
				$('#arrow-right-timeline').css('display' ,'block');
				$('#arrow-left-timeline').css('display' ,'block');
			}
			
			current_group++;
			loadTabs();		
		});
		
		$('#arrow-left-timeline').click(function(event){
			if(current_group == 1) {			
				return;
			} else if((current_group-1) == 1) {
				$('#arrow-left-timeline').css('display' ,'none');	
				$('#arrow-right-timeline').css('display' ,'block');			
			}  else {
				$('#arrow-right-timeline').css('display' ,'block');
				$('#arrow-left-timeline').css('display' ,'block');
			}
			
			current_group--;
			loadTabs();		
		});
		
		function closeAllTabs() {
			$(timeline).find('.horizontalTimeline-content').each(function(index, div){
				$(div).addClass('tab-timeline-disabled');
				$(div).removeClass('tab-timeline-active');
			});
			$(timeline).find('li').each(function(index, li){
				$(li).removeClass('tab-timeline-selected');
			});
		}
		function loadTabs() {
			$(timeline).find(".group-timeline").filter(function(){
				if($(this).attr('number') == current_group) {
					$(this).css('display' , 'block');
					return true;
				}
				$(this).css('display' , 'none');
				return false;
			})
		}
		function setIdTimeLine(){
			$(".horizontalTimeline").each(function (index) {
				$(this).find('li').each(function (z) {
					$(this).attr('href', "#time_" + index + "_" + z);
					$(this).find('a').attr('href', "#time_" + index + "_" + z);
				})
				$(this).find('div[class*=tab-timeline]').each(function (z) {
					$(this).attr('id', "time_" + index + "_" + z);
				});
			})
		}

		function startTimeline() {
			$(timeline).find('.horizontalTimeline-content').eq(current_group - 1).removeClass('tab-timeline-disabled').addClass('tab-timeline-active');
			$(timeline).find('li').eq(current_group - 1).addClass('tab-timeline-selected');
		}
		
		loadTabs();	
		setIdTimeLine();
		startTimeline();

		return timeline;
   }; 
})( jQuery );