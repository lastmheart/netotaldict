
; /* Start:"a:4:{s:4:"full";s:78:"/local/components/gtx/elements.list/templates/.default/script.js?1582119731863";s:6:"source";s:64:"/local/components/gtx/elements.list/templates/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(function(){
    $('.sponsorsslider').slick({
        slidesToShow: 5,
        slidesToScroll: 5,
        prevArrow: '<button class="slick-prev slick-arrow"><div class="gicon slide-prev"></div></button>',
        nextArrow: '<button class="slick-next slick-arrow"><div class="gicon slide-next"></div></button>',
        responsive: [
            {
              breakpoint: 992,
              settings: {
                slidesToShow: 4,
                slidesToScroll: 3,
              }
            },
            {
              breakpoint: 767,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
        ]
    });
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:85:"/local/templates/main/components/gtx/elements.list/mainslider/script.js?1593794736113";s:6:"source";s:71:"/local/templates/main/components/gtx/elements.list/mainslider/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(function(){
    $('.newmainslider').slick({
        autoplay: true,
        autoplaySpeed: 6000
    });
})
/* End */
;; /* /local/components/gtx/elements.list/templates/.default/script.js?1582119731863*/
; /* /local/templates/main/components/gtx/elements.list/mainslider/script.js?1593794736113*/
