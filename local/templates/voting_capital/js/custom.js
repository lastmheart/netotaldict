var chLocation = function(loc) {
    try {
      history.pushState({}, '', loc);
      return;
    } catch(e) {}
//    location.hash = '#' + loc;
};
var openPopupWhithHachCode = function () {
    var hash = window.location.hash;
    if(hash.length > 2){
        var $modal = $('.modal[data-code="'+hash+'"]');
        if($modal.length > 0){
            $modal.modal('toggle');
        }
    }
    if(hash.length === 0){
        $('.modal').each(function(){
            var $this = $(this);
            if($this.is(':visible') && $this.data('code') !== undefined){
                $this.modal('toggle');
            }
        });
    }
};
function number_format( number, decimals, dec_point, thousands_sep ) {	// Format a number with grouped thousands
	//
	// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +	 bugfix by: Michael White (http://crestidg.com)

	var i, j, kw, kd, km;

	// input sanitation & defaults
	if( isNaN(decimals = Math.abs(decimals)) ){
		decimals = 2;
	}
	if( dec_point == undefined ){
		dec_point = ",";
	}
	if( thousands_sep == undefined ){
		thousands_sep = ".";
	}

	i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

	if( (j = i.length) > 3 ){
		j = j % 3;
	} else{
		j = 0;
	}
	km = (j ? i.substr(0, j) + thousands_sep : "");
	kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
	//kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).slice(2) : "");
	kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");
	return km + kw + kd;
}
$(function(){
    openPopupWhithHachCode();
    $(window).on('popstate', function(event){
        openPopupWhithHachCode();
    });
    $('.modal').on('show.bs.modal', function (e) {
        if (typeof (e.relatedTarget) !== "undefined"
                && $(e.relatedTarget).attr('href') !== '#') {
            var hash = $(e.relatedTarget).attr('href');
            var $modal = $('.modal[data-code="'+hash+'"]');
            var $graph = $('.modal[data-code="'+hash+'"] .chartContainer');
            if($modal.length > 0){
                chLocation(window.location.href.split('#')[0] + hash);
            }
            if($graph.length > 0){
                var chart;
//                chart.render();
            }
        }
    });
    $('.modal').on('hide.bs.modal', function () {
        chLocation(window.location.href.split('#')[0]);
    });
    $('.open-modal-in-modal').on('click', function(){
        var $this = $(this);
        var selector = '#' + $this.closest('.modal').attr('id');
        var href = $this.attr('href');
        $(selector).on('hidden.bs.modal', function(){
            $(href).modal('show');
            $(selector).off('hidden.bs.modal');
        });
        $(selector).modal('hide');
        if($(href).data('code') !== undefined){
            chLocation(window.location.href.split('#')[0] + $(href).data('code'));
        }
        return false;
    });
    $('a.modal-header-tabs-link').on('click', function(){
        var $this = $(this);
        var $curTab = $($this.attr('href'));
        var $wrap = $this.closest('.modal');
        $wrap.find('a.modal-header-tabs-link').not($this).removeClass('active');
        $this.addClass('active');
        $wrap.find('.modal-header-tabs-tab').not($curTab).hide();
        $curTab.show();
        return false;
    });
    $('.vote_process').on('click', function(){
        var $this = $(this);
        var $vote_error = $this.closest('.modal-header').find('.vote_error');
        var data = {
            sessid: BX.bitrix_sessid(),
            id: $this.data('id')
        };
        $vote_error.fadeOut();
        $.ajax({
            dataType: "json",
            url: '/voting_capital/',
            data: data,
            method: 'POST',
            success: function(json){
                if(json.result){
                    $this.closest('.modal-header').find('.sucess-vote-text').fadeIn();
                    $this.hide();
                } else {
                    $vote_error.text(json.error).fadeIn();

                }
            }
        });
        return false;
    });
    $('form.send_vote_form').on('submit', function(){
        var $form = $(this);
        var $inputs = $form.find('.form-control');
        var $vote_error = $form.find('.vote_error');
        var error = '';
        var $modal = $form.closest('.capcthaModal');
        var id = $modal.attr('id').split('capcthaModal_')[1];
        var $city_modal = $('#city_' + id);
        $form.find('.form-group').removeClass('has-error');
        $inputs.each(function(){
            var $this = $(this);
            if($this.val() === ''){
                error = 'Заполните поле';
                $this.closest('.form-group').addClass('has-error');

            }
        });
        if(error === ''){
            var data = $form.serializeArray();
            data.push({name: 'sessid', value: BX.bitrix_sessid()});
            $vote_error.fadeOut();
            $.ajax({
                dataType: "json",
                url: '/voting_capital/',
                data: data,
                method: 'POST',
                success: function(json){
                    if(json.result){
                        $('a.captcha-update:first').trigger('click');
                        $modal.modal('hide');

                        $city_modal.find('.sucess-vote-text').fadeIn();
                        $city_modal.find('.btn-vote-process').hide();


                    } else {
                        $('a.captcha-update:first').trigger('click');
                        $vote_error.text(json.error).fadeIn();

                    }
                }
            });
        }
        return false;
    });
    $('.scrollTo').on('click',function(){
        var $this = $(this);
        var href = $this.attr('href');
        $("html, body").delay(100).animate({scrollTop: $(href).offset().top }, 1000, undefined, function(){
//            location.hash = href;
        });

        return false;
    });
    $('.owl-carousel').owlCarousel({
        loop:true,
        nav:true,
        items:1,
        lazyLoad:true,
        dots: false,
        navText: ['Назад', 'Вперед']

    });
    $('#main_vote_description').on('hide.bs.collapse', function (e) {
        $('#icon_main_vote_description').removeClass('icon-up').addClass('icon-down');
    }).on('show.bs.collapse', function () {
        $('#icon_main_vote_description').removeClass('icon-down').addClass('icon-up');
    });
    var g_width = 748;
    var g_height = 90;
    var f_width = 748;
    var f_height = 367;
    if(typeof(GRAPH_DATA) != "undefined"){
        var colors = [
            '#0885db',
            '#26ac1e',
            '#7c0c0c',
            '#856d11',
            '#13baa7',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000'
        ];
        var months = [
            'января',
            'февраля',
            'марта',
            'апреля',
            'мая',
            'июня',
            'июля',
            'августа',
            'сентября',
            'октября',
            'ноября',
            'декабря'
        ];
        var $fullGraphCotainer = $('#fullGraphCotainer');
        var $fullGraphLine = $('#fullGraphLine .inner');
        var $canvas_f = $('<canvas width="'+f_width+'" height="'+f_height+'" id="fullGraph" />');
        $fullGraphCotainer.append($canvas_f);
        var canvas_f = document.getElementById('fullGraph');
        var ctxF = canvas_f.getContext("2d");
        var f_max = 0;
        var arPlaces = [];
        var f_dates = true;
        var line_max = 13;
        var step_gl = 1;
        $.each(GRAPH_DATA, function(key, val){
            var value = 0;
            var length = val.length;
            $.each(val, function(j, item){
                var cnt = parseInt(item.CNT);
                value += cnt;
            });
            arPlaces.push(value);
            if(value > f_max){
               f_max = value;
            }
            if(f_dates && length > 1){                
                var i;
                
                if(length > step_gl){
                    step_gl = Math.ceil(length/line_max);
                }
                var l_step_gl = Math.round(f_width / (length - step_gl) );
                var lastMonth;

                for(i = step_gl; i < length-step_gl; i += step_gl){
                    if(val[i] === undefined){
                        continue;
                    }
                    var $item = $('<div/>');
                    var left = i * l_step_gl;
                    var date = val[i].DATE.split('.');
                    var day = parseInt(date[0]);
                    var month = parseInt(date[1]);
                    var textDate = day;
                    if(month !== lastMonth){
                        textDate += ' ' + months[month-1];
                    }
                    lastMonth = month;
                    $item.addClass('item').css('left', left + 'px').text(textDate);
                    $fullGraphLine.append($item);
                }
                f_dates = false;
            }
        });        
        var drawFullGraph = function(){
            ctxF.clearRect(0, 0, f_width, f_height);
            $.each(GRAPH_DATA, function(count, val){
                var key = val.length > 0 ? val[0].UF_VALUE : 0;
                if(!$('#checkGraph_' + key).is(':checked')){
                    return true;
                }
                var length = val.length;
                var f_step = Math.ceil(f_width/(length-1));
                var f_val = 0;
                var textY = 0;
                var step = Math.ceil(f_width/(length-1));
                ctxF.strokeStyle = colors[count];
                ctxF.lineCap = 'butt';
                ctxF.lineWidth = 2;
                $.each(val, function(j, item){

                    var x1f = f_step * j;
                    var x2f = x1f + step;
                    f_val += parseInt(item.CNT);
                    var y1f = Math.round(f_val * f_height / f_max);
                    if(val[j+1] === undefined){
                        return false;
                    }
                    var y2f = Math.round((f_val + parseInt(val[j+1].CNT)) * f_height / f_max);

                    ctxF.beginPath();
                    ctxF.moveTo(x1f, f_height - y1f);
                    ctxF.lineTo(x2f, f_height - y2f);
                    ctxF.stroke();
                    ctxF.closePath();

                    if(j === length - ( 2 * step_gl)){
                        textY = f_height - y2f;
                    }
                });
                ctxF.fillStyle = colors[count];
                ctxF.font = "12px Arial";
                ctxF.fillText(number_format(f_val, 0, '.',' '), f_width - (f_step * step_gl), textY + 14);

            });

        };
        var $cheboxes = $('#fullGraphCheboxes');
        $.each(GRAPH_DATA, function(count, val){
            var key = val.length > 0 ? val[0].UF_VALUE : 0;
            var $checkbox = $('<div/>');
            var $label = $('<label for="checkGraph_' + key + '" />');
            var $input = $('<input type="checkbox" id="checkGraph_' + key + '" />');
            var name = '';
            var $box = $('<span class="box-checked" />');
            var color = colors[count];
            if(typeof(GRAPH_DATA_NAMES) !== "undefined" && GRAPH_DATA_NAMES[key] !== undefined){
                name = GRAPH_DATA_NAMES[key];
            }
            var $text = $('<span class="text-checked">' + name + '</span>');
            $box.css('background-color', color);
            $text.css('color', color);
            $checkbox.addClass('checkbox-colored pull-left');
            if(count < 5){
                $input.prop('checked', true);
            }
            $checkbox.append($input);
            $label.append('<span class="box"></span>');
            $label.append($box);
            $label.append('<i class="icon check"></i>');
            $label.append('<span class="text">' + name + '</span>');
            $label.append($text);
            $checkbox.append($label);
            $cheboxes.append($checkbox);
            $checkbox.on('change', drawFullGraph);
        });



        drawFullGraph();


        $.each(GRAPH_DATA, function(count, val){
            var key = val.length > 0 ? val[0].UF_VALUE : 0;
            var $area = $('#chartContainer_' + key);
            if(val.length > 0 && $area.length > 0){
                var $wrap = $area.parent();
                var $canvas = $('<canvas width="'+g_width+'" height="'+g_height+'" id="graph_'+key+'" />');
                $area.append($canvas);
                var canvas = document.getElementById('graph_' + key);
                var ctx = canvas.getContext("2d");
                var grd = ctx.createLinearGradient(0, g_height-1, 0, 0);
                var max = 0;
                var length = val.length;
                var step = Math.ceil(g_width/(length-1));
                var color1 = '#ffffff';
                grd.addColorStop(0, "#56b2ba");
                grd.addColorStop(1, "#6956ec");
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, g_width, g_height);
                $.each(val, function(j, item){
                    var cnt = parseInt(item.CNT);
                    if(cnt > max){
                       max = cnt;
                    }
                });
                ctx.strokeStyle = 'white';
                ctx.lineCap = 'butt';
                ctx.lineWidth = 1;
                ctx.fillStyle = color1;





                $.each(val, function(j, item){
                    var $p = $('<div/>');
                    var $p_inner_wrap = $('<div/>');
                    var $p_inner = $('<div/>');
                    var $p_info = $('<div/>');
                    var i;
                    var x1 = step * j;
                    var x2 = x1 + step;
                    var y1 = Math.round(parseInt(item.CNT) * g_height / max);
                    var left_shift = Math.round(step/2);



                    $p.addClass('graph-point');
                    $p_inner_wrap.addClass('inner_wrap');
                    $p_inner.addClass('inner');
                    $p_info.addClass('info');

                    if(j === 0){
                       $p.addClass('first');
                    }
                    if(j === length-1){
                       $p.addClass('last');
                    }
                    if(x1 < 102){
                        $p.addClass('right');
                    }

                    $p_info.html('<div>Голосов: '+item.CNT+'</div><div>'+item.DATE+'</div>');
                    $p_inner.css('top', (g_height - y1) + 'px');
                    $p.css('left', (x1 - left_shift) + 'px');
                    $p.css('width', step + 'px');
                    $p_inner_wrap.append($p_inner);
                    $p_inner_wrap.append($p_info);
                    $p.append($p_inner_wrap);
                    $wrap.append($p);

                    if(val[j+1] === undefined){
                        return false;
                    }
                    var y2 = Math.round(parseInt(val[j+1].CNT) * g_height / max);

                    for(i = 0; i < step; i++){
                        var x = x1 + i;
                        var y;
                        if(i === 0){
                            y = y1;
                        } else {
                            y = Math.round((-(y1-y2)*x-(x1*y2-x2*y1))/(x2-x1));
                        }
                        var Y = g_height - y;
                        ctx.fillRect(x, 0, 1, Y);
                    }
                    ctx.beginPath();
                    ctx.moveTo(x1, g_height - y1);
                    ctx.lineTo(x2, g_height - y2);
                    ctx.stroke();
                    ctx.closePath();

                });
                count++;
            }
        });
    }
    $('.short-list-wrap .short-btn').on('click', function(){
        var $this = $(this);
        if($this.hasClass('hover')){
            $this.removeClass('hover');
            return false;
        }
        $this.addClass('hover');
        return false;
    });
    $('a.captcha-update').on('click', function(){
        var $this = $(this);
        $.ajax({
            url: '/ajax/captcha.php',
            dataType: 'json',
            data: {
                sessid: BX.bitrix_sessid()
            },
            success: function (jsonObject) {
                var $img = $('a.captcha-update img.not-visible-img')
                        .attr('src', '/bitrix/tools/captcha.php?captcha_sid=' + jsonObject.captcha_sid);
                var $img2 = $('a.captcha-update img.visible-img');
                $img.load(function () {
                    $img.addClass('visible-img').removeClass('not-visible-img');
                    $img2.addClass('not-visible-img').removeClass('visible-img');
                    $img2.fadeOut();
                    $img.fadeIn();
                    $('.captcha_sid').val(jsonObject.captcha_sid);

                });
            }
        });

        return false;
    });
});

