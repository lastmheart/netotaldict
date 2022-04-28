
; /* Start:"a:4:{s:4:"full";s:63:"/bitrix/components/bitrix/search.title/script.js?15911097429847";s:6:"source";s:48:"/bitrix/components/bitrix/search.title/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
function JCTitleSearch(arParams)
{
	var _this = this;

	this.arParams = {
		'AJAX_PAGE': arParams.AJAX_PAGE,
		'CONTAINER_ID': arParams.CONTAINER_ID,
		'INPUT_ID': arParams.INPUT_ID,
		'MIN_QUERY_LEN': parseInt(arParams.MIN_QUERY_LEN)
	};
	if(arParams.WAIT_IMAGE)
		this.arParams.WAIT_IMAGE = arParams.WAIT_IMAGE;
	if(arParams.MIN_QUERY_LEN <= 0)
		arParams.MIN_QUERY_LEN = 1;

	this.cache = [];
	this.cache_key = null;

	this.startText = '';
	this.running = false;
	this.runningCall = false;
	this.currentRow = -1;
	this.RESULT = null;
	this.CONTAINER = null;
	this.INPUT = null;
	this.WAIT = null;

	this.ShowResult = function(result)
	{
		if(BX.type.isString(result))
		{
			_this.RESULT.innerHTML = result;
		}

		_this.RESULT.style.display = _this.RESULT.innerHTML !== '' ? 'block' : 'none';
		var pos = _this.adjustResultNode();

		//adjust left column to be an outline
		var res_pos;
		var th;
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl)
		{
			th = BX.findChild(tbl, {'tag':'th'}, true);
		}

		if(th)
		{
			var tbl_pos = BX.pos(tbl);
			tbl_pos.width = tbl_pos.right - tbl_pos.left;

			var th_pos = BX.pos(th);
			th_pos.width = th_pos.right - th_pos.left;
			th.style.width = th_pos.width + 'px';

			_this.RESULT.style.width = (pos.width + th_pos.width) + 'px';

			//Move table to left by width of the first column
			_this.RESULT.style.left = (pos.left - th_pos.width - 1)+ 'px';

			//Shrink table when it's too wide
			if((tbl_pos.width - th_pos.width) > pos.width)
				_this.RESULT.style.width = (pos.width + th_pos.width -1) + 'px';

			//Check if table is too wide and shrink result div to it's width
			tbl_pos = BX.pos(tbl);
			res_pos = BX.pos(_this.RESULT);
			if(res_pos.right > tbl_pos.right)
			{
				_this.RESULT.style.width = (tbl_pos.right - tbl_pos.left) + 'px';
			}
		}

		var fade;
		if(tbl) fade = BX.findChild(_this.RESULT, {'class':'title-search-fader'}, true);
		if(fade && th)
		{
			res_pos = BX.pos(_this.RESULT);
			fade.style.left = (res_pos.right - res_pos.left - 18) + 'px';
			fade.style.width = 18 + 'px';
			fade.style.top = 0 + 'px';
			fade.style.height = (res_pos.bottom - res_pos.top) + 'px';
			fade.style.display = 'block';
		}
	};

	this.onKeyPress = function(keyCode)
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(!tbl)
			return false;

		var i;
		var cnt = tbl.rows.length;

		switch (keyCode)
		{
		case 27: // escape key - close search div
			_this.RESULT.style.display = 'none';
			_this.currentRow = -1;
			_this.UnSelectAll();
		return true;

		case 40: // down key - navigate down on search results
			if(_this.RESULT.style.display == 'none')
				_this.RESULT.style.display = 'block';

			var first = -1;
			for(i = 0; i < cnt; i++)
			{
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					if(first == -1)
						first = i;

					if(_this.currentRow < i)
					{
						_this.currentRow = i;
						break;
					}
					else if(tbl.rows[i].className == 'title-search-selected')
					{
						tbl.rows[i].className = '';
					}
				}
			}

			if(i == cnt && _this.currentRow != i)
				_this.currentRow = first;

			tbl.rows[_this.currentRow].className = 'title-search-selected';
		return true;

		case 38: // up key - navigate up on search results
			if(_this.RESULT.style.display == 'none')
				_this.RESULT.style.display = 'block';

			var last = -1;
			for(i = cnt-1; i >= 0; i--)
			{
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					if(last == -1)
						last = i;

					if(_this.currentRow > i)
					{
						_this.currentRow = i;
						break;
					}
					else if(tbl.rows[i].className == 'title-search-selected')
					{
						tbl.rows[i].className = '';
					}
				}
			}

			if(i < 0 && _this.currentRow != i)
				_this.currentRow = last;

			tbl.rows[_this.currentRow].className = 'title-search-selected';
		return true;

		case 13: // enter key - choose current search result
			if(_this.RESULT.style.display == 'block')
			{
				for(i = 0; i < cnt; i++)
				{
					if(_this.currentRow == i)
					{
						if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
						{
							var a = BX.findChild(tbl.rows[i], {'tag':'a'}, true);
							if(a)
							{
								window.location = a.href;
								return true;
							}
						}
					}
				}
			}
		return false;
		}

		return false;
	};

	this.onTimeout = function()
	{
		_this.onChange(function(){
			setTimeout(_this.onTimeout, 500);
		});
	};

	this.onChange = function(callback)
	{
		if (_this.running)
		{
			_this.runningCall = true;
			return;
		}
		_this.running = true;

		if(_this.INPUT.value != _this.oldValue && _this.INPUT.value != _this.startText)
		{
			_this.oldValue = _this.INPUT.value;
			if(_this.INPUT.value.length >= _this.arParams.MIN_QUERY_LEN)
			{
				_this.cache_key = _this.arParams.INPUT_ID + '|' + _this.INPUT.value;
				if(_this.cache[_this.cache_key] == null)
				{
					if(_this.WAIT)
					{
						var pos = BX.pos(_this.INPUT);
						var height = (pos.bottom - pos.top)-2;
						_this.WAIT.style.top = (pos.top+1) + 'px';
						_this.WAIT.style.height = height + 'px';
						_this.WAIT.style.width = height + 'px';
						_this.WAIT.style.left = (pos.right - height + 2) + 'px';
						_this.WAIT.style.display = 'block';
					}

					BX.ajax.post(
						_this.arParams.AJAX_PAGE,
						{
							'ajax_call':'y',
							'INPUT_ID':_this.arParams.INPUT_ID,
							'q':_this.INPUT.value,
							'l':_this.arParams.MIN_QUERY_LEN
						},
						function(result)
						{
							_this.cache[_this.cache_key] = result;
							_this.ShowResult(result);
							_this.currentRow = -1;
							_this.EnableMouseEvents();
							if(_this.WAIT)
								_this.WAIT.style.display = 'none';
							if (!!callback)
								callback();
							_this.running = false;
							if (_this.runningCall)
							{
								_this.runningCall = false;
								_this.onChange();
							}
						}
					);
					return;
				}
				else
				{
					_this.ShowResult(_this.cache[_this.cache_key]);
					_this.currentRow = -1;
					_this.EnableMouseEvents();
				}
			}
			else
			{
				_this.RESULT.style.display = 'none';
				_this.currentRow = -1;
				_this.UnSelectAll();
			}
		}
		if (!!callback)
			callback();
		_this.running = false;
	};

	this.onScroll = function ()
	{
		if(BX.type.isElementNode(_this.RESULT)
			&& _this.RESULT.style.display !== "none"
			&& _this.RESULT.innerHTML !== ''
		)
		{
			_this.adjustResultNode();
		}
	};

	this.UnSelectAll = function()
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl)
		{
			var cnt = tbl.rows.length;
			for(var i = 0; i < cnt; i++)
				tbl.rows[i].className = '';
		}
	};

	this.EnableMouseEvents = function()
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl)
		{
			var cnt = tbl.rows.length;
			for(var i = 0; i < cnt; i++)
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					tbl.rows[i].id = 'row_' + i;
					tbl.rows[i].onmouseover = function (e) {
						if(_this.currentRow != this.id.substr(4))
						{
							_this.UnSelectAll();
							this.className = 'title-search-selected';
							_this.currentRow = this.id.substr(4);
						}
					};
					tbl.rows[i].onmouseout = function (e) {
						this.className = '';
						_this.currentRow = -1;
					};
				}
		}
	};

	this.onFocusLost = function(hide)
	{
		setTimeout(function(){_this.RESULT.style.display = 'none';}, 250);
	};

	this.onFocusGain = function()
	{
		if(_this.RESULT.innerHTML.length)
			_this.ShowResult();
	};

	this.onKeyDown = function(e)
	{
		if(!e)
			e = window.event;

		if (_this.RESULT.style.display == 'block')
		{
			if(_this.onKeyPress(e.keyCode))
				return BX.PreventDefault(e);
		}
	};

	this.adjustResultNode = function()
	{
		if(!(BX.type.isElementNode(_this.RESULT)
			&& BX.type.isElementNode(_this.CONTAINER))
		)
		{
			return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
		}

		var pos = BX.pos(_this.CONTAINER);

		_this.RESULT.style.position = 'absolute';
		_this.RESULT.style.top = (pos.bottom + 2) + 'px';
		_this.RESULT.style.left = pos.left + 'px';
		_this.RESULT.style.width = pos.width + 'px';

		return pos;
	};

	this._onContainerLayoutChange = function()
	{
		if(BX.type.isElementNode(_this.RESULT)
			&& _this.RESULT.style.display !== "none"
			&& _this.RESULT.innerHTML !== ''
		)
		{
			_this.adjustResultNode();
		}
	};
	this.Init = function()
	{
		this.CONTAINER = document.getElementById(this.arParams.CONTAINER_ID);
		BX.addCustomEvent(this.CONTAINER, "OnNodeLayoutChange", this._onContainerLayoutChange);

		this.RESULT = document.body.appendChild(document.createElement("DIV"));
		this.RESULT.className = 'title-search-result';
		this.INPUT = document.getElementById(this.arParams.INPUT_ID);
		this.startText = this.oldValue = this.INPUT.value;
		BX.bind(this.INPUT, 'focus', function() {_this.onFocusGain()});
		BX.bind(this.INPUT, 'blur', function() {_this.onFocusLost()});
		this.INPUT.onkeydown = this.onKeyDown;

		if(this.arParams.WAIT_IMAGE)
		{
			this.WAIT = document.body.appendChild(document.createElement("DIV"));
			this.WAIT.style.backgroundImage = "url('" + this.arParams.WAIT_IMAGE + "')";
			if(!BX.browser.IsIE())
				this.WAIT.style.backgroundRepeat = 'none';
			this.WAIT.style.display = 'none';
			this.WAIT.style.position = 'absolute';
			this.WAIT.style.zIndex = '1100';
		}

		BX.bind(this.INPUT, 'bxchange', function() {_this.onChange()});

		var fixedParent = BX.findParent(this.CONTAINER, BX.is_fixed);
		if(BX.type.isElementNode(fixedParent))
		{
			BX.bind(window, 'scroll', BX.throttle(this.onScroll, 100, this));
		}
	};
	BX.ready(function (){_this.Init(arParams)});
}

/* End */
;
; /* Start:"a:4:{s:4:"full";s:89:"/local/templates/.default/components/bitrix/search.title/.default/script.js?1590057174217";s:6:"source";s:75:"/local/templates/.default/components/bitrix/search.title/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(function(){
    $('.searchbtn').bind('click', function(){
        $('body').toggleClass('overflow');
        $('.search_window').fadeToggle();
        $('.title-search-result').toggleClass('active')
    });
})
/* End */
;
; /* Start:"a:4:{s:4:"full";s:79:"/local/components/gtx/cities.picker/templates/.default/script.js?15774392401411";s:6:"source";s:64:"/local/components/gtx/cities.picker/templates/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(function(){
    $('.federal_window .district').bind('click', function(){
        $('.federal_window .district p').removeClass('active')
        $(this).find('p').addClass('active');
        var target_id = $(this).attr('data-target');

        $('.federal_window .region, .federal_window .city').addClass('hidden');

        $('.federal_window .region[data-district="'+target_id+'"]').each(function(){
            $(this).removeClass('hidden');
            var target = $(this).attr('data-target');
            $('.federal_window .city[data-region="'+target+'"]').removeClass('hidden');
        });
    });

    $('.federal_window .region').bind('click', function(){
        $('.federal_window .region').removeClass('active');
        $(this).addClass('active');
        var target_id = $(this).attr('data-target');

        $('.federal_window .city').addClass('hidden');
        $('.federal_window .city[data-region="'+target_id+'"]').removeClass('hidden');
    });

    $('.federal_window .columns-2 > div.column-1 .district:first-of-type').trigger('click')

    $(document).on('click', '.location__toolbar .federal', function(){
        console.log('test');
        $('.federal_window').fadeIn(200);
    });
    
    $('.federal_close').bind('click', function(){
        $('.federal_window').fadeOut(200);
        $('.federal_window [data-child]').slideUp(0);
    });
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:60:"/local/js/reaspekt/reaspekt.geobase/script.js?14909521864682";s:6:"source";s:45:"/local/js/reaspekt/reaspekt.geobase/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
(function(window, document, $, undefined){
    "use strict";
   
    var paramsDefault = {
        height : "250",
        width : "500",
        ajax  : {
            dataType : 'html',
            headers  : { 'X-reaspektPopupBox': true }
        },
        content : null,
        fixedPosition : false
    };
    var params = {
        htmlPopup : '<div class="ReaspektPopupOverlay"></div><div id="ReaspektPopupBody"><div class="ReaspektClosePosition"><div id="ReaspektCloseBtn"></div></div><div id="ReaspektPopupContainer">Загрузка...</div></div>',
        objPopupIdBody : '#ReaspektPopupBody',
        objPopupIdOverlay : '.ReaspektPopupOverlay',
        objPopupIdCloseBtn : '#ReaspektCloseBtn',
        objPopupIdContainer : '#ReaspektPopupContainer',
		activeClassBodyReaspekt : 'activeClassBodyReaspekt'
    };
    var methods = {
        init : function( options ) {
            
            
            return this.click(function(element){
                var obClass = $(this);
				paramsDefault['href'] = obClass.data('reaspektmodalbox-href') || obClass.attr('href');
				
				var settings = $.extend($.ReaspektModalBox, paramsDefault, options);
                
                methods.addHtmlTemplate(settings);
                
                
                if (!settings.fixedPosition) {
                    $(window).bind('resize.ReaspektPopupOverlay', $.proxy( methods.rePosition, this) );
                    methods.rePosition();
                }
            });
        },
        
        //Добавляем Div`s
        addHtmlTemplate : function(settings) {
            methods.closeReaspektPopup();
			$('body').append(params.htmlPopup);
            $('body').addClass(params.activeClassBodyReaspekt);
            methods.addContainerData(settings);
        },
        
        //Add data in popup html
        addContainerData : function(settings) {
            //Add event click close button
            $(params.objPopupIdCloseBtn).bind("click", function(e){
                e.preventDefault();
                
                methods.closeReaspektPopup();
            });
            
            //Add event click overlay
            $(params.objPopupIdOverlay).bind("click", function(e){
                e.preventDefault();
                
                methods.closeReaspektPopup();
            });
            
            methods._loadAjax(settings);
        },
        
        //Close popup
        closeReaspektPopup : function() {
            $(window).unbind('resize.ReaspektPopupOverlay');
            $('body').removeClass(params.activeClassBodyReaspekt);
            $(params.objPopupIdBody).remove();
            $(params.objPopupIdOverlay).remove();
        },
        
        rePosition : function() {
            
            $(params.objPopupIdBody).css("top", Math.max(0, (($(window).height() - $(params.objPopupIdBody).outerHeight()) / 2) + $(window).scrollTop()) + "px");
            
            $(params.objPopupIdBody).css("left", Math.max(0, (($(window).width() - $(params.objPopupIdBody).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
        },
        
        _loadAjax: function (settings) {
           if (settings.href) {
                $.ajax($.extend({}, settings.ajax, {
                    url: settings.href,
                    error: function (jqXHR, textStatus) {
                        console.log(jqXHR);
                        console.log(textStatus);
                    },
                    success: function (data, textStatus) {
                        if (textStatus === 'success') {
                            settings.content = data;

                            methods._afterLoad(settings);
                        }
                    }
                }));
           } else {
               console.log('Error, not atribute href or data-reaspektmodalbox-href');
           }
		},
        
        _afterLoad: function (settings) {
            $(params.objPopupIdContainer).html(settings.content);
            
            methods.rePosition();
        }
    };

    $.fn.ReaspektModalBox = function( method ) {

        // логика вызова метода
        if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Метод с именем ' +  method + ' не существует для jQuery.ReaspektModalBox' );
        } 
    };
    
})(window, document, jQuery);
/* End */
;; /* /bitrix/components/bitrix/search.title/script.js?15911097429847*/
; /* /local/templates/.default/components/bitrix/search.title/.default/script.js?1590057174217*/
; /* /local/components/gtx/cities.picker/templates/.default/script.js?15774392401411*/
; /* /local/js/reaspekt/reaspekt.geobase/script.js?14909521864682*/
