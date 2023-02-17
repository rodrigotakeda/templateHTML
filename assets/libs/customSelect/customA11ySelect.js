(function($) {
  $.fn.customA11ySelect = function(params) {

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Silk|Opera Mini/i.test(navigator.userAgent);
    var keyTimeout;
    var keyMap = '';
    var down = 40;
    var up = 38;
    var spacebar = 32;
    var enter = 13;
    var escape = 27;
    var pageUp = 33;
    var pageDown = 34;
    var endKey = 35;
    var homeKey = 36;
    var tabKey = 9;

    return this.each(function() {

      var $menu = $(this); // the original <select> element
      var menuID = $menu.attr('id'); // ID of the original <select> input

      // creates the dropdown menu
      function menuConstructor() {

        var $label = $('label[for="'+menuID+'"]');
        $label.attr('id',menuID+'-label');

        // create the new custom-a11yselect HTML
        var selectMenu = $('<div class="custom-a11yselect-container">').attr('id', menuID + '_sel');
        buildMenu(selectMenu);
      }

      function setParams(list) {
        // if overlay parameter is defined, set overlay scroll on dropdown menu
        if (params.overlay) {
          var overlaySize = params.overlay+'px';
          list.addClass('custom-a11yselect-overflow').css('max-height',overlaySize);
        }
      }

      function buildMenu(selectMenu) {

        // put all <option>'s in an array
        var options = new Array;
        $menu.find('option').each(function() {
          options.push($(this));
        });

        var button = $('<button type="button" id="'+menuID+'-button" class="custom-a11yselect-btn" aria-expanded="false" aria-haspopup="true"><span class="custom-a11yselect-text" id="'+menuID+'-selected"></span><i class="custom-a11yselect-icon icon-carrat-down"></i></button>');
        var list = $('<ul class="custom-a11yselect-menu" id="'+menuID+'-menu" role="menu">');

        // create each option <li> for the custom-a11yselect
        for (i=0;i<options.length;i++) {
          // add an image to the option text if the data-iconurl attribute is present
          var optionText = (options[i].attr('data-iconurl')) ? '<i class="custom-a11yselect-img" style="background-image:url('+options[i].attr('data-iconurl')+')"> </i>'+options[i].text() : options[i].text();
          // if the current option is selected
          if (options[i].is(':selected')) {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-a11yselect-option custom-a11yselect-focused custom-a11yselect-selected" data-val="'+options[i].val()+'"><button type="button" role="menuitem">'+optionText+'</button></li>');
            button.attr('aria-labelledby',menuID+'-selected '+menuID+'-label').attr('aria-activedescendant','custom-a11yselect-'+i);
            button.find('.custom-a11yselect-text').text(options[i].text());
          // if the current option is disabled
          } else if (options[i].is(':disabled')) {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-a11yselect-option custom-a11yselect-disabled" data-val="'+options[i].val()+'" aria-disabled="true"><button type="button" role="menuitem">'+optionText+'</button></li>');
          // normal options
          } else {
            list.append('<li id="'+menuID+'-option-'+i+'" class="custom-a11yselect-option" data-val="'+options[i].val()+'"><button type="button" role="menuitem">'+optionText+'</button></li>');
          }
        }
        // if there are more than 5 options, set an overflow class
        if (options.length > 5) {
          list.addClass('custom-a11yselect-overflow');
        }

        selectMenu.append(button,list); // append the button and option list to the custom-a11yselect-container

        if (!$menu.is('[data-custom-a11yselect]')) {
          $menu.after(selectMenu); // insert the custom-a11yselect after the original <select> element
          $menu.attr('data-custom-a11yselect',menuID+'-menu'); // apply data attribute to original select element
        }

        // if on mobile or tablet, use native mobile OS select controls by inserting original <select> inside button
        if (isMobile) {
          $menu.appendTo(selectMenu).addClass('custom-a11yselect-mobile');
          list.addClass('custom-a11yselect-hidden');
          mobileEventHandlers(button,$menu);
        // if on desktop, hide original <select>
        } else {
          $menu.hide();
          eventHandlers(selectMenu); // set eventHandlers for this custom-a11yselect
          // if special parameters are defined
          if (typeof params != 'undefined') {
            setParams(list);
          }
        }
      }

      // refresh options within an existing custom select menu
      function refreshOptions() {
        var selectMenu = $('#'+$menu.attr('data-custom-a11yselect')).parent('.custom-a11yselect-container');
        selectMenu.find('.custom-a11yselect-btn, .custom-a11yselect-menu').remove(); // remove the existing button and dropdown list
        buildMenu(selectMenu);
      }

      // if the select does not already have a custom select menu applied
      if (!$menu.is('[data-custom-a11yselect]')) {
        menuConstructor();
      }

      // if the select already has a custom select menu AND the 'refresh' parameter is passed AND it's not a mobile device
      // if the select already has a custom select menu AND the 'refresh' parameter is passed
      if ($menu.is('[data-custom-a11yselect]') && params == 'refresh') {
        // if mobile, then only update the button text
        if (isMobile) {
          var $btn = $('button#'+menuID+'-button');
          var valText = $menu.find('option:selected').text();
          $btn.find('.custom-a11yselect-text').text(valText);
        // if not mobile, then rebuild the select dropdown
        } else {
          refreshOptions();
        }
    }
    });

    function eventHandlers(selectMenu) {
      var $button = selectMenu.find('.custom-a11yselect-btn');
      var $option = selectMenu.find('.custom-a11yselect-option > button');
      var $original = selectMenu.prev('select');

      // clicking the menu button opens/closes the dropdown
      $button.on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        // if the keyMap variable from the keySearch function is empty, toggle the dropdown
        if (keyMap == '') {
          toggleDropdown($(this));
          $(this).siblings('.custom-a11yselect-menu').find('.custom-a11yselect-focused > button').trigger('focus');
        }
      });

      // key event handlers for the main dropdown button
      $button.on('keydown',function(e) {
        var $dropdown = $(this).siblings('.custom-a11yselect-menu');
        switch(e.keyCode) {
          // escape key closes the dropdown
          case escape:
            e.preventDefault();
            closeDropdown($dropdown);
            break;
          // up and down arrow keys open/close the dropdown
          case up:
          case down:
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown($(this));
            $(this).siblings('.custom-a11yselect-menu').find('.custom-a11yselect-focused > button').trigger('focus');
            break;
        }
      });

      // Keypress event handlers to support searching for select options by typing in option text
      $button.on('keypress',function(e) {
        var keyp = e.keyCode;
        var dropdown = $(this).siblings('.custom-a11yselect-menu');
        keySearch(keyp,dropdown);
      });
      $option.on('keypress',function(e) {
        var keyp = e.keyCode;
        var dropdown = $(this).parents('.custom-a11yselect-menu');
        keySearch(keyp,dropdown);
      });

      // key event handlers for option buttons within the dropdown
      $option.on('keydown',function(e) {
        var $li = $(this).parent('.custom-a11yselect-option');
        switch(e.keyCode) {
          // up arrow key focuses to previous option
          case up:
            e.preventDefault();
            e.stopPropagation();
            $li.prev('.custom-a11yselect-option').children('button').trigger('focus');
            break;
          // down arrow key focuses on next option
          case down:
            e.preventDefault();
            e.stopPropagation();
            $li.next('.custom-a11yselect-option').children('button').trigger('focus');
            break;
          // page up and home keys focus on first option
          case pageUp:
          case homeKey:
            e.preventDefault();
            e.stopPropagation();
            $li.siblings('.custom-a11yselect-option:first').children('button').trigger('focus');
            break;
          // page down and end keys focus on last option
          case pageDown:
          case endKey:
            e.preventDefault();
            e.stopPropagation();
            $li.siblings('.custom-a11yselect-option:last').children('button').trigger('focus');
            break;
          case escape:
            e.preventDefault();
            closeDropdown($(this).parents('.custom-a11yselect-menu'));
            break;
          // tab key is disabled when focused on any option
          case tabKey:
            e.preventDefault();
            break;
        }
      });

      // hover & focus on menu options toggles active/hover state
      $option.on('mouseover focus',function(e) {
        var $dropdown = $(this).parents('.custom-a11yselect-menu');
        $dropdown.find('.custom-a11yselect-option.custom-a11yselect-focused').removeClass('custom-a11yselect-focused');
        $(this).parent('.custom-a11yselect-option').addClass('custom-a11yselect-focused');
        $dropdown.siblings('.custom-a11yselect-btn').attr('aria-activedescendant',$(this).attr('id'));
      });

      // clicking on menu option sets option as selected
      $option.on('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $li = $(this).parent('.custom-a11yselect-option');
        if (!$li.hasClass('custom-a11yselect-disabled')) {
          selectOption($li, true);
          // if the keyMap variable from the keySearch function is empty, close the dropdown
          if (keyMap == '') {
            closeDropdown($(this).parents('.custom-a11yselect-menu'));
          }
        }
      });

      // clicking outside the dropdown closes it
      $('body').on('click',function() {
        closeDropdown();
      });
      // if the original/hidden <select> value is changed, update the selected option in the custom select
      $original.change(function() {
        var selectedOptionIndex = $(this).find('option:selected').index();
        var customSelectedOption = selectMenu.find('.custom-a11yselect-option').eq(selectedOptionIndex);
        selectOption(customSelectedOption, false);
      });
    }

    // Search for select options matching a string of characters typed while focused on the element
    function keySearch(keyp,dropdown) {
      var $options = dropdown.find('.custom-a11yselect-option');
      var $currOption = dropdown.find('.custom-a11yselect-selected');

      if (keyp !== down &&
          keyp !== up &&
          keyp !== enter &&
          keyp !== escape &&
          keyp !== pageUp &&
          keyp !== pageDown &&
          keyp !== homeKey &&
          keyp !== endKey &&
          keyp !== tabKey) {

        var character = String.fromCharCode(keyp).toLowerCase();

        // if the first key is spacebar and keyMap is empty, don't do anything (to prevent conflict with click event)
        if (keyp == spacebar && keyMap == '') {
          return;
        }
        
        if (keyMap === '') {
          keyMap = character;
        } else {
          keyMap += character;
        }

        // timeout to wait until user has finished typing to check for option matching keyMap string
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(function() {

          keyMap = keyMap.trim();

          var $nextOpt = $currOption.nextAll('.custom-a11yselect-option').filter(function() {
            return $(this).text().toLowerCase().indexOf(keyMap) == 0;
          });

          // if one of the options after the currently-selected option is a match, select it
          if ($nextOpt.length) {
            selectOption($nextOpt.first(), true);
            // close the dropdown if a match is found
            if ($nextOpt.first().length) {
              closeDropdown(dropdown);
            }
          // otherwise, check all of the options for a match
          } else {
            var $theOption = $options.filter(function() {
              return $(this).text().toLowerCase().indexOf(keyMap) == 0;
            });
            selectOption($theOption.first(), true);
            // close the dropdown if a match is found
            if ($theOption.first().length) {
              closeDropdown(dropdown);
            }
          }

          // reset keyMap to empty string
          keyMap = '';
        }, 300);

      }
    }

    // mobile-specific event handlers
    function mobileEventHandlers($button,$menu) {
      // changing the selected option in the native mobile OS controls updates the custom button text
      $menu.on('change',function() {
        var selectedText = $(this).find(':selected').text();
        $button.find('.custom-a11yselect-text').text(selectedText);
        $button.trigger('focus');
      });
      $button.on('click',function(e) {
        e.preventDefault();
        $menu.trigger('focus');
      })
    }
    // sets a menu option to be selected
    function selectOption($option, updateOriginal) {
      var selectedOption = $option.attr('data-val');
      var optionID = $option.attr('id');
      var optionText = $option.text();
      var $dropdown = $option.parents('.custom-a11yselect-menu');
      var $button = $dropdown.siblings('.custom-a11yselect-btn');
      var $original = $option.parents('.custom-a11yselect-container').prev('select');
      $dropdown.find('.custom-a11yselect-option.custom-a11yselect-selected').removeClass('custom-a11yselect-selected custom-a11yselect-focused');
      $option.addClass('custom-a11yselect-focused custom-a11yselect-selected');
      $button.attr('aria-activedescendant',optionID);
      $button.find('.custom-a11yselect-text').text(optionText);
      if (updateOriginal) {
        $original.val(selectedOption).change();
      }
    }
    // opens/closes the dropdown
    function toggleDropdown($button) {
      var $dropdown = $button.siblings('.custom-a11yselect-menu');
      var $icon = $button.children('.custom-a11yselect-icon');
      $('.custom-a11yselect-menu').not($dropdown).removeClass('opened');
      if ($dropdown.hasClass('opened')) {
        $button.attr('aria-expanded','false');
      } else {
        $button.attr('aria-expanded','true');
        // if select button is scrolled more than halfway down page, open on top of button, not below
        if (!isMobile) {
          var scrollTop = $(window).scrollTop();
          var topOffset = $button.offset().top;
          var relativeOffset = topOffset-scrollTop;
          var winHeight = $(window).height();
          if (relativeOffset > winHeight/2) {
            $dropdown.addClass('custom-a11yselect-reversed');
          } else {
            $dropdown.removeClass('custom-a11yselect-reversed');
          }
        }
      }
      $icon.toggleClass('icon-carrat-down').toggleClass('icon-carrat-up');
      $dropdown.toggleClass('opened');
      // if dropdown has overflow, scroll to the selected option
      if ($dropdown.hasClass('custom-a11yselect-overflow') && !isMobile) {
        var $selectedOption = $dropdown.find('.custom-a11yselect-selected').index();
        if ($selectedOption > 0) {
          var selectedScrollPos = ($selectedOption * 40) + 16; // each option is ~40px tall, with 16px top padding on dropdown
          $dropdown.scrollTop(selectedScrollPos);
        }
      }
    }
    // closes the dropdown
    function closeDropdown($menu) {
      var $openMenu = ($menu) ? $menu : $('.custom-a11yselect-menu.opened');
      var $button = $openMenu.siblings('.custom-a11yselect-btn');
      var $icon = $button.children('.custom-a11yselect-icon');
      var $currentlySelected = $openMenu.find('.custom-a11yselect-selected');
      $openMenu.find('.custom-a11yselect-option.custom-a11yselect-focused').removeClass('custom-a11yselect-focused');
      $openMenu.find('.custom-a11yselect-selected').addClass('custom-a11yselect-focused');
      $button.attr('aria-activedescendant',$currentlySelected.attr('id'));
      $button.find('.custom-a11yselect-text').text($currentlySelected.text());
      $icon.removeClass('icon-carrat-up').addClass('icon-carrat-down');
      $button.trigger('focus').attr('aria-expanded','false');
      $openMenu.removeClass('opened');
    }

  };
  $.fn.customA11ySelect.closeAllDropdowns = function() {
    if ($('.custom-a11yselect-menu.opened').length) {
      var $openMenu = $('.custom-a11yselect-menu.opened');
      var $button = $openMenu.siblings('.custom-a11yselect-btn');
      var $icon = $button.children('.custom-a11yselect-icon');
      var $currentlySelected = $openMenu.find('.custom-a11yselect-selected');

      $openMenu.find('.custom-a11yselect-option.custom-a11yselect-focused').removeClass('custom-a11yselect-focused');
      $openMenu.find('.custom-a11yselect-selected').addClass('custom-a11yselect-focused');
      $button.attr('aria-activedescendant',$currentlySelected.attr('id'));
      $button.find('.custom-a11yselect-text').text($currentlySelected.text());
      $icon.removeClass('icon-carrat-up').addClass('icon-carrat-down');
      $button.attr('aria-expanded','false');
      $openMenu.removeClass('opened');
    }
  };
})(jQuery);