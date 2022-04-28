$(function(){
    $('a.js-anchor-item').on('click', function(){
        var $this = $(this);
        var href = '#' + $this.attr('href').split('#')[1];
        $("html, body").delay(100).animate({scrollTop: $(href).offset().top - 100}, 1000, undefined, function () {

        });
        return false;
    });
    if($('#ltiLaunchForm').length > 0){
        $('#ltiLaunchForm').submit();
    }


    $(document).on('click', '.events_more_gtx', function(){
        $(this).hide();
        $('.news-item.event.hidden').removeClass('hidden');
    });


    $('.gototown').attr('href', $('.city__name').attr('href'));


    $('body').on('mousedown' , '.courses-carousel__slider', function(){
        var $this = $(this);
        $this.addClass('dragnow');

    }).on('mouseup' , '.courses-carousel__slider', function(){
        var $this = $(this);
        $this.removeClass('dragnow');
    });
    $('body').on('click','.news-item.event .but', function(){
        var $this = $(this);
        var $area = $this.closest('.news-item.event').find('.more-info');
        if($this.hasClass('close')){
            $area.show();
            $this.removeClass('close');
        } else {
            $area.hide();
            $this.addClass('close');
        }
    });

    $(document).on('click', '.showtip', function(){
        $('[data-tip="'+$(this).attr('data-target')+'"]').slideToggle();
    });

    $(document).on('click', '.button_reject_reg, .stage-right .cancel-reg, .stage-right .reg-btn.ng-scope', function(e){
        e.preventDefault();
        if(confirm('Вы уверены?')){
            document.location.href = $(this).attr('href');
        }
    });


    Stickyfill.add($('.sticky'));

    $('.city-menu a, a.hashLink').on('click', function(){
        var $this = $(this);
        var href = $this.attr('href');
        var $obj = $('#' + href.split('#')[1]);
        if($obj.length > 0){
           $("html, body").delay(100).animate({scrollTop: $obj.offset().top }, 1000, undefined, function(){
                location.hash = href.split('#')[1];
            });
        }
        return false;
    });
    $('.stage-reg-open').on('click', function(){
        if($('.register-popup').length === 0){
            return false;
        }
        $('.register-popup.closed').removeClass('closed');
        $('.register-popup-bg').addClass('show');
        $('body').addClass('stopScroll');
        if(!/\/stages\/[0-9]+\/$/.test(location.hash)){
            location.hash = '#/stages';
        }
        return false;
    });
    $('.register-popup-close').on('click', function(){
        $('.register-popup').not('.closed').addClass('closed');
        $('.register-popup-bg').removeClass('show');
        $('body').removeClass('stopScroll');
        location.hash = '';
       return false;
    });

    $('body').on('click','.reg-btn.needPassport', function(){
        var $this = $(this);
        var $stagesList = $('#stages-list');
        var $tooltip = $this.closest('.item').find('.reg-tooltip');
        var href = $this.attr('href');
        if(!$tooltip.is(':visible')){
            $('.reg-tooltip').not($tooltip).hide();
            $tooltip.removeClass('down');
            $tooltip.show();
            if($tooltip.offset().top < $stagesList.offset().top){
                $tooltip.addClass('down');
            }
            $('#overlay-stg').addClass('show');
        }
        return false;
    });

    $('body').on('click','.close-reg-tooltip', function(){
        var $this = $(this);
        var $tooltip = $this.closest('.reg-tooltip');
        $tooltip.hide();
        $('#overlay-stg').removeClass('show');
        return false;
    });
    $('body').on('click','.change-stage', function(){
        var $this = $(this);
        var href = $this.attr('href');
        $.get('/profile/unregister/',{},function(data){
            location.href = href;
        });
        return false;
    });
    $('body').on('keyup', '.orfgrmka_b #textarea', function(){
        var $this = $(this);
        var id = $('#dictant_id').val();
        localStorage.setItem('dictant_' + id, $this.val());
    });
    $('body').on('mouseover', '.stages-list .trud-logo-wrap', function(){
        var $this = $(this);
        var $bText = $this.find('.text-b');
        var $item = $this.closest('.item');
        var $stagesList = $('#stages-list');

        $this.addClass('hover');
        $bText.removeClass('down');
        $bText.css('margin-left', false);

        var left = $item.offset().left;
        var top = $bText.offset().top;
        var bLeft = $bText.offset().left;
        var padL = bLeft - left;
        var marginLeft = parseInt($bText.css('margin-left'));
        var sTop = $stagesList.offset().top;
        var padT = top - sTop;

        if(padL < 0){
            $bText.css('margin-left', marginLeft + (-1 * padL));
        }
        if(padT < 0){
            $bText.addClass('down');
        }
    });
    $('body').on('mouseleave', '.stages-list .trud-logo-wrap', function(){
        var $this = $(this);
        var $bText = $this.find('.text-b');
        $this.removeClass('hover');

    });
    $('body').on('click','.filter-btn > .filter-btn-text', function(){
        var $this = $(this);
        var $parent = $this.parent();
        var filterBtnWindow = $parent.find('.filter-btn-window');
        $('.filter-btn > .filter-btn-window').not(filterBtnWindow).removeClass('open');
        if(!filterBtnWindow.hasClass('open')){
            $('.filter-more > .filter-more-window').removeClass('open');
            filterBtnWindow.addClass('open');
        }
        return false;
    });
    $('body').on('click','.filter-more .filter-btn-text', function(){
        var $this = $(this);
        var $parent = $this.parent();
        var filterBtnWindow = $parent.find('.filter-more-window');

        if(!filterBtnWindow.hasClass('open')){
            $('.filter-btn > .filter-btn-window').removeClass('open');
            filterBtnWindow.addClass('open');
        } else {
            filterBtnWindow.removeClass('open');
        }
        return false;
    });
    $('body').on('click', function(e){
        if($(e.target).closest('.filter-btn').length === 0){
            $('.filter-btn > .filter-btn-window').removeClass('open');
        }
        if($(e.target).closest('.filter-more').length === 0){
            $('.filter-more > .filter-more-window').removeClass('open');
        }
    });
    $('body').on('click','.cancel-oline-reg-link', function(){
        if(confirm('Вы уверены?')){
            var $this = $(this);
            var data = {
            action: 'unreg',
            id: $this.data('id')
            };
            $.ajax({
                url: '/online/',
                data: data,
                dataType: 'json',
                method: 'POST',
                success: function(json){
                    if(json.is_success){
                        location.reload(true);
                    }
                }
            });
        }
        return false;
    });
    var locHash = location.hash;
    if(locHash === '#/stages' || locHash === '#stages' || /\/stages\/[0-9]+\/$/.test(locHash)){
        $('.stage-reg-open:first').trigger('click');
    };
    $('body').on('click','.js-start-test', function(e){
        e.preventDefault();
        $(this).hide();
        $(this).closest('.online-dictant').find('.js-stepic').show();
    });
});


