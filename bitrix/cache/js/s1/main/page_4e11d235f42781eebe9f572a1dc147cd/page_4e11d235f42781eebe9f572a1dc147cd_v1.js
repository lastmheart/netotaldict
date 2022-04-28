
; /* Start:"a:4:{s:4:"full";s:79:"/local/components/totaldict/faq/templates/faq_page_new/script.js?15752979731242";s:6:"source";s:64:"/local/components/totaldict/faq/templates/faq_page_new/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(function(){
    $('.faq_tabs .tab .question .head .expand').bind('click', function(e){
        $(this).toggleClass('active');
        if($(this).hasClass('active')){
            $(this).text('Свернуть');
        } else {
            $(this).text('Развернуть');
        }

        $(this).parents('.question').find('.answer').slideToggle(200);
        
    });

    $('.faq_tabs .tab .question .head').bind('click', function(e){
        if(!$(this).find('.expand').is(e.target)){
            $(this).find('.expand').toggleClass('active');
            if($(this).find('.expand').hasClass('active')){
                $(this).find('.expand').text('Свернуть');
            } else {
                $(this).find('.expand').text('Развернуть');
            }

            $(this).parents('.question').find('.answer').slideToggle(200);
        }
    });

    $('.faq_sections .section').bind('click', function(){
        var index = $(this).index() + 1;
        $('.faq_sections .section').removeClass('active');
        $(this).addClass('active');
        $('.faq_tabs .tab').removeClass('active');
        $('.faq_tabs .tab:nth-child('+index+')').addClass('active');
    });
});
/* End */
;; /* /local/components/totaldict/faq/templates/faq_page_new/script.js?15752979731242*/
