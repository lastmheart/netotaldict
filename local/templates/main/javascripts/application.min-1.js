function sklonenie(n, forms) {
  return n % 10 === 1 && n % 100 !== 11 ? forms[0] : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? forms[1] : forms[2]);
}

function showOtherInput() {
  document.getElementById('city-have').style.display = "none";
  document.getElementById('city-nothave').style.display = "block";
}

(function () {
  var e, t, n, r, a, i, o, DictantListControllerN;
  angular.module("App", ["ui.select", "ui.mask", "facebook", "ngMessages", "ngSanitize", "angular-bind-html-compile", "angular-cache", "timer"]).config(["FacebookProvider", function (e) {
    return e.init("255337807932878"), "undefined" != typeof VK && null !== VK && (VK.init({
      apiId: "3385741"
    }), document.getElementById("vk_comments")) ? VK.Widgets.Comments("vk_comments", {
      limit: 15,
      height: 729,
      attach: "photo,link",
      autoPublish: 0
    }) : void 0
  }]), angular.module("App").run(["$rootScope", "CacheFactory", function (e, t) {
    e.searchActivated = !1, t("cache", {
      maxAge: 36e5,
      storageMode: "localStorage",
      deleteOnExpire: "aggressive"
    })
  }]), angular.module("App").filter("trusted", ["$sce", function (e) {
    return function (t) {
      return e.trustAsHtml(t)
    }
  }]),
    angular.module("App").controller("SearchController", ["$scope", "$http", "$rootScope", "CacheFactory", function (e, t, n, r) {
      var a;
      return e.loading = true,
        e.cities = [],
        e.has_popular = true,
        e.is = {
          popular: true
        },
        e.current_country = "Россия",
        e.current_continent = "Россия",
        e.submit = function ($event) {
          var find = false;
          if (e.search_cities_query.length > 0) {
            $.each(e.cities, function (i, city) {
              if (city.name.toUpperCase().indexOf(e.search_cities_query.toUpperCase()) === 0) {
                location.href = city.url + '?city=' + city.id + (city.satelit ? '&satelit=y' : '');
                find = true;
                return false;
              }
            });
          }
          if (!find) {
            $.magnificPopup.open({
              items: {
                src: '#toOnlineWindow'
              },
              type: 'inline'
            });
          }
          $event.preventDefault();
          return false;
        },
        a = function () {
          var path = '/ajax/cities_selector.php';
          var nowDate = new Date();
          var dKey = 'c' + nowDate.getHours() + '';
          dKey += (nowDate.getMonth() + 1) + '';
          dKey += (nowDate.getMonth() + 1) + '';
          dKey += nowDate.getFullYear();
          dKey += '=' + dKey;

          $.each(r.get('cache').keys(), function (i, val) {
            var arKey = val.split('?');
            if (arKey[0] === path && arKey[1] !== dKey) {
              r.get('cache').remove(val);
            }
          });

          return t.get(path + "?" + dKey, {
            cache: r.get("cache")
          }).then(function (t) {
              e.current_city = t.data.current;
              var getParentUrl = function (id) {
                var ret = '';
                $.each(t.data.list, function (i, list) {
                  if (list.id == id) {
                    ret = list.detail_page_url;
                    return false;
                  }
                });
                return ret;
              };
              e.cities = _.map(t.data.list, function (e) {
                var t0;
                var satelit = e.property_totaldict_geo_cities_base_city > 0;
                return {
                  id: satelit ? e.property_totaldict_geo_cities_base_city : e.id,
                  name: e.name,
                  is_popular: null != (t0 = "1" === e.property_city_is_popular) ? t0 : {
                    "true": false
                  },
                  country_id: e.property_totaldict_geo_cities_country_id,
                  country_name: e.property_totaldict_geo_cities_country_name,
                  continent_name: e.property_totaldict_geo_cities_country_property_country_continent,
                  url: satelit ? getParentUrl(e.property_totaldict_geo_cities_base_city) : e.detail_page_url,
                  cup: e.property_capital_dictation,
                  satelit: satelit
                };
              });
              e.continents = _.uniq(e.cities, function (e) {
                return e.continent_name
              });
              e.continents = _.map(e.continents, function (e) {
                return {
                  name: e.continent_name
                }
              });
              e.countries = _.uniq(e.cities, function (e) {
                return e.country_name
              });
              e.countries = _.map(e.countries, function (e) {
                return {
                  name: e.country_name,
                  continent_name: e.continent_name
                }
              });
              e.loading = false;
            },
            function () {
              return console.error("error");
            });
        },
        n.$watch("searchActivated", function (e, t) {
          e === true && a()
        }),
        e.set_country = function (t) {
          e.current_country = t.name;
          _.where(e.cities, {
            country_name: t.name,
            is_popular: true
          }).length > 0 ? e.has_popular = true : (e.has_popular = false, e.is.popular = false);
        },
        e.set_continent = function (t) {
          return e.current_continent = t.name,
            1 === _.where(e.countries, {
              continent_name: t.name
            }).length ? e.set_country(t) : e.current_country = null
        },
        e.cities_filter = function (t) {
          return e.is.popular === true ? t.country_name === e.current_country && t.is_popular === e.is.popular : t.country_name === e.current_country
        }, e.search_cities_filter = function (t) {
        return t.name.match(new RegExp("^" + e.search_cities_query, "i"))
      },
        e.countries_filter = function (t) {
          return t.continent_name === e.current_continent
        }
    }]),
    angular.module("App").directive("forminput", function () {
      return {
        require: "^form",
        scope: {
          name: "@",
          type: "@",
          label: "@",
          model: "=ngModel"
        },
        replace: !0,
        transclude: !0,
        template: '<div class="form__r form__r_s_m" ng-class="{\'form__r_error\': !self.$valid, \'form__r_focusin\': focused}"> <div class="r r_s_m"> <div class="r__c r__c_s_3"><label class="form__label">{{label}}</label></div> <div class="r__c r__c_s_9"> <input class="form__input" type="{{type}}" name="{{name}}" ng-model="model" required ng-blur="focused = 0" ng-focus="focused = 1"> </div> </div> </div>',
        link: function (e, t, n, r) {
          return e.focused = 0, e.self = r["" + e.name]
        }
      }
    }), angular.module("App").directive("switcher", function () {
    return {
      scope: {
        ll: "@",
        lr: "@",
        checked: "=ngModel"
      },
      replace: !0,
      transclude: !0,
      template: "<div ng-class=\"{'switcher_off': !checked}\"> <span class='switcher__label' ng-class=\"{'switcher__label_on': checked}\" ng-bind='ll' ng-hide='!ll' ng-click='set(true)'></span> <label class='switcher__box'> <input type='checkbox' ng-model='checked' ng-hide='true' /> </label> <span class='switcher__label' ng-class=\"{'switcher__label_on': !checked}\" ng-bind='lr' ng-hide='!lr' ng-click='set(false)'></span> </div>",
      link: function (e, t, n) {
        return e.set = function (t) {
          return e.checked = t
        }
      }
    }
  }), angular.module("App").directive("orthographyError", function () {
    return {
      restrict: "C",
      link: function (e, t, n) {
        return null != n.orthographyRule ? ($(t).attr("title", n.orthographyRule), $(t).css({
          cursor: "pointer"
        }), $(t).qtip({
          content: {
            text: '<div class="tip" style="display: block;"> <div class="tip__content" style="width: 400px; text-align: left;"> <div class="wysiwyg"> <div class="wysiwyg__p wysiwyg__p_s_s"><b style="color: #13b34f;">Правильное написание: </b>' + n.orthographyCorrect + '</div> <div class="wysiwyg__p wysiwyg__p_s_s"><b>Правило: </b>' + n.orthographyRule + "</div> </div> </div> </div>"
          },
          position: {
            my: "bottom center",
            at: "top center",
            viewport: $(window)
          }
        })) : void 0
      }
    }
  }), angular.module("App").directive("moveTo", function () {
    return {
      link: function (e, t, n) {
        var r;
        r = $(t).attr("href"), $(t).on("click", function (e) {
          return e.preventDefault(), $("html, body").animate({
            scrollTop: $(r).offset().top - 90
          }, 500)
        })
      }
    }
  }), angular.module("App").directive("checkbox", function () {
    return {
      scope: {
        flag: "=flag"
      },
      replace: !0,
      transclude: !0,
      template: '<label class="form__checkbox" ng-class="{\'checked\': flag}"> <span class="icon icon_check"></span> <span ng-transclude></span> </label>'
    }
  }),
    angular.module("App").directive("coursesCarousel", function () {
      return {
        restrict: "C",
        link: function (e, t, n) {
          var r;
          return r = $(t).find(".courses-carousel__slider").slick({
            arrows: false,
            centerMode: false,
            infinite: false,
            variableWidth: true,
            slidesToShow: 1,
            slidesToScroll: 1
          }),
            $(t).find(".courses-carousel__arr").bind("click", function (e) {
              return e.preventDefault();
            }),
            $(t).find(".courses-carousel__arr_next").bind("click", function (e) {
              return r.slick("slickNext");
            }),
            $(t).find(".courses-carousel__arr_prev").bind("click", function (e) {
              return r.slick("slickPrev");
            });
        }
      };
    }),
    angular.module("App").directive("yashare", function () {
      return {
        replace: !0,
        link: function (e, t, n) {
          return Ya.share2(t[0], {
            content: {
              title: e.post.name,
              url: window.location.origin + "/" + e.post.link,
              description: e.post.text || String()
            }
          })
        },
        template: "<div></div>"
      }
    }), angular.module("App").directive("userAwards", function () {
    return {
      link: function (e, t, n) {
        return $(t).slick({
          arrows: !1,
          infinite: !1,
          variableWidth: !0
        })
      }
    }
  }), angular.module("App").directive("swipetab", function () {
    return {
      link: function (e, t, n) {
        return t.bind("click", function (e) {
          return e.preventDefault(), $(".window-tabs__pane").css({
            display: "none"
          }), $("" + t.attr("href")).css({
            display: "block"
          })
        })
      }
    }
  }), angular.module("App").directive("timing", function () {
    return {
      scope: {
        countdown: "@"
      },
      controller: ["$scope", "$interval", function (e, t) {
        var n;
        return moment.locale("ru"), n = e.countdown, t(function () {
          return n -= 1e3, e.time = humanizeDuration(n, {
            language: "ru",
            round: !0,
            units: ["d", "h", "m", "s"],
            delimiter: " "
          })
        }, 1e3)
      }],
      link: function (e, t, n) {
      },
      template: '<div ng-bind="time"></div>',
      replace: !0
    }
  }), angular.module("App").directive("participateButton", function () {
    return {
      replace: !0,
      scope: {
        text: "@"
      },
      link: function (e, t, n) {
        var r;
        return r = window.siteData.user, e["class"] = t.attr("class"), t.removeAttr("class"), r.is_authorized ? e.href = "/online" : void 0
      },
      template: '<div> <a href="{{href}}" ng-if="href" class="{{class}}"> <span class="button__text" ng-bind="text"></span> </a> <a href="#authorize" window ng-if="!href" class="{{class}}"> <span class="button__text" ng-bind="text"></span> </a> </div>'
    }
  }), angular.module("App").directive("compare", function () {
    return {
      require: "ngModel",
      scope: {
        otherModelValue: "=compare"
      },
      link: function (e, t, n, r) {
        return r.$validators.compare = function (t) {
          return t === e.otherModelValue
        }, e.$watch("otherModelValue", function () {
          return r.$validate()
        })
      }
    }
  }), angular.module("App").directive("qtip", function () {
    return {
      link: function (e, t, n) {
        var r;
        return r = $(t).next(), $(t).qtip({
          content: {
            text: r
          },
          position: {
            my: n.qtipMy,
            at: n.qtipAt
          }
        })
      }
    }
  }),
    angular.module("App").controller("UserSigninController", ["$scope", "$http", "Facebook", "$window", function (e, t, n, r) {
      return e.data = {},
        e.errors = [],
        e.loginFacebook = function () {
          return n.login(function (e) {
            var r;
            return "connected" === e.status ? (r = e.authResponse,
              n.api("/v2.0/me?fields=first_name,last_name,email,name,gender,link,picture", function (e) {
			console.log(e);
				  showWait();
                return t.post("/profile/auth/", {
                  app: "FB",
                  session: r,
                  user: e
                }).then(function (e) {
                    return e.data.is_authorized ? window.location.reload() : void 0
                  },
                  function () {
                    return console.error("error") 
                  })
              })) : void 0
          }, {scope: 'email,user_likes'})
        },
        e.loginOk = function () {
          //var params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=600,height=300,left=100,top=100`;
          document.location.href = 'https://connect.ok.ru/oauth/authorize?client_id=512000231778&scope=VALUABLE_ACCESS;GET_EMAIL&response_type=code&redirect_uri=https://totaldict.ru/profile/auth/&state=OK';
        },
        e.loginLi = function () {
          //var params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=600,height=300,left=100,top=100`;
          document.location.href = 'https://leader-id.ru/api/oauth/authorize?client_id=a97af2750d7a3126a1e921087cfe0228&redirect_uri=https://totaldict.ru/profile/auth/&response_type=code&state=LI';
        },
        e.loginVk = function () {
          document.location.href = 'https://oauth.vk.com/authorize?client_id=3385741&display=popup&redirect_uri=https://totaldict.ru/profile/auth/&scope=email&response_type=token&v=5.131&state=VK';
          
/*          return "undefined" != typeof VK && null !== VK ? (console.log("sf"), VK.Auth.login(function (e) {
            return e.session ? t.post("/profile/auth/", {
              app: "VK",
              session: e.session 
            }).then(function (e) {
              return e.data.is_authorized ? window.location.reload() : void 0
            }, function () {
              return console.error("error")
            }) : void 0
          }, 4194304)) : void 0*/
        },
			
          e.send = function () {
        return t.post("/profile/auth/", e.data).then(function (t) {
          return e.errors = _.toArray(t.data.fields), t.data.is_authorized ? window.location.reload() : void 0
        }, function () {
          return console.error("error")
        })
      }
    }]),
    angular.module("App").controller("UserSignupController", ["$scope", "$http", "Facebook", function (e, t, n) {
      return e.data = {},
        e.errors = [],
        e.send = function () {
          return t.post("/profile/register/", e.data).then(function (t) {
              if (t.data.sms_form === '1') {
                e.sms_form = '1';
              }
              e.errors = _.toArray(t.data.fields);
              if (t.data.is_success) {
                console.log(e);
                if ($('#signup_redirect').length > 0 && $('#signup_redirect').val() !== '') {
                  window.location = $('#signup_redirect').val();
                } else {
                  window.location = "/profile/";//?from=register
                }
              }
            },
            function () {
              return console.error("error")
            })
        }
    }]),
    angular.module("App").controller("SigninController", ["$scope", "$http", function (e, t) {
    }]),
    angular.module("App").controller("CityEventsListController", ["$scope", "$http", function ($scope, $http) {
      $scope.events = [];
      var data = {
        city: window.events_data.city
      };
      $scope.show_past = false;
      $scope.show = function () {
        $scope.show_past = true;
        $scope.show_more = false;
      };
      $http.post('/' + window.events_data.city_code + '/events/', data).then(function (json) {
        if (json.data.length > 0) {
          $scope.show_more = true;
          $scope.events = json.data;
        }
      });
      $scope.$watch('events', function () {
        $(".show_past .link_js_popup").magnificPopup({
          type: "inline",
          showCloseBtn: false
        });
      });
    }]),
    angular.module("App").controller("CityEventsForm", ["$scope", "$http", function ($scope, $http) {
      $scope.data = {};
      $scope.errors = [];
      $scope.saving = false;
      $scope.success = false;
      $scope.send = function (form, id) {
        //        console.log(id);
        $scope.saving = true;
        $scope.data.id = id;
        $scope.data.reg_action = 'y';
        $http.post('/education/calendar/', $scope.data).then(function (json) {
          $scope.saving = false;
          $scope.errors = json.data.errors;
          if (json.data.success) {
            $scope.success = true;
            $scope.registred = true;
            $scope.saving = true;
            $('#regEvent_' + id).hide();
            $('#regedEvent_' + id).show();
          }
        });
      };
    }]),
    angular.module("App").controller("EventsListController", ["$scope", "$http", function ($scope, t) {
      $scope.user = window.siteData.user;
      $scope.data = {};
      $scope.errors = [];
      $scope.cur_id = {
        id: 0
      };
      $scope.saving = false;
      $scope.switchCur = function (_event) {
        $scope.cur_id = {
          id: 0
        };
        var event = jQuery.extend(true, {}, _event);
        $scope.cur_id = event;
        $scope.data.id = event.id;
        $.magnificPopup.open({
          items: {
            src: $('#reg_event')
          },
          callbacks: {
            close: function () {
              $scope.cur_id = {
                id: 0
              };
            }
          },
          type: 'inline',
          showCloseBtn: false
        });
      };
      $scope.send = function (form) {
        $scope.saving = true;
        $scope.data.reg_action = 'y';
        t.post('/education/calendar/', $scope.data).then(function (json) {
          $scope.saving = false;
          $scope.errors = json.data.errors;
          if (json.data.success) {
            $scope.cur_id.success = true;
            $.each($scope.events, function (i, event) {
              if (parseInt(event.id) === parseInt($scope.data.id)) {
                event.registred = true;
                event.success = true;
                return false;
              }
            });
          }
        });
      };
      $scope.unregister = function (id) {
        var data = {
          id: id,
          reg_action: 'unreg'
        };
        t.post('/education/calendar/', data).then(function (json) {
          if (json.data.success) {
            $.each($scope.events, function (i, event) {
              if (parseInt(event.id) === parseInt(id)) {
                event.registred = false;
                event.success = false;
                return false;
              }
            });
          }
        });
      };
      window.stages_list.events_types.unshift({
        id: void 0,
        name: "Все мероприятия"
      });
      $scope.cities = window.stages_list.cities;
      $scope.events = window.stages_list.arItems;
      $scope.events_types = window.stages_list.events_types === undefined ? [] : window.stages_list.events_types;
      $scope.selected = {
        city: window.stages_list.city.id,
        events_type: void 0
      };
      $scope.filter_events = function (t) {
        return void 0 === $scope.selected.events_type || $scope.selected.events_type === t.type;
      };
      $scope.$watch("selected.city", function (n, r) {
        return n !== r ? t.get("/education/calendar/?city=" + n, {
          city: n
        }).then(function (t) {
          return $scope.events = t.data
        }) : void 0
      });
    }]),
    angular.module("App").controller("UserDataController", ["$scope", "$http", "$window", function (e, t, n) {
      return e.genders = [{
        id: "",
        name: "Не указан"
      },
        {
          id: "M",
          name: "Мужской"
        },
        {
          id: "F",
          name: "Женский"
        }
      ],
        e.changed = function (t) {
          var n;
          return n = new FileReader,
            n.onload = function (t) {
              return $(".upload-picture__preview img").attr("src", t.target.result),
                e.$apply(function () {
                  return e.form.$setDirty()
                })
            },
            n.readAsDataURL(t.files[0])
        },
        e.data = n.formData,
        e.errors = _.compact(_.map(n.formData, function (e) {
          return e.errors ? e.errors : void 0
        })),
        e.send = function (e) {
          return console.log("sending")
        },
        e.send_email_confirm = false,
        e.send_email_confirm_f = function () {
          e.send_email_confirm = true;
          console.log('sending confirm');
          t.get('/ajax/confirm_email.php').then(function (response) {
            console.log('return sending confirm');
          });
        }
    }]),
    angular.module("App").controller("GeographyController", ["$scope", "$http", "$window", function (e, t, n) {
      var r, a, i;
      return a = null, i = null, r = null, e.is = {
        full: !0
      }, e.$watch("is.full", function (e, t) {
        return e !== t ? e === !1 ? r.setFilter('properties.country == "Россия"') : r.setFilter("") : void 0
      }), n.ymaps.ready(function () {
        var e;
        return a = new n.ymaps.Map(angular.element(".map__canvas")[0], {
          center: [52.650555194, 90.1041272746],
          zoom: 5,
          controls: []
        }), r = new n.ymaps.ObjectManager({
          clusterize: !0,
          gridSize: 64
        }), e = n.ymaps.templateLayoutFactory.createClass('<div class="cluster-content">$[properties.geoObjects.length]</div>'), r.objects.options.set({
          iconLayout: "default#image",
          iconImageHref: "/local/templates/main/images/mappoint.png",
          iconImageSize: [20, 27],
          iconImageOffset: [-10, -27]
        }), r.clusters.options.set({
          clusterIcons: [{
            href: "../../local/templates/main/images/mapcluster.png",
            size: [64, 64],
            offset: [-32, -32]
          }],
          clusterIconContentLayout: e
        }), a.geoObjects.add(r), i = {
          type: "FeatureCollection",
          features: []
        }, t.get("/ajax/cities_selector.php", {}).then(function (e) {
          return _.map(e.data.list, function (e) {
            return "" !== e.property_totaldict_geo_cities_coords ? i.features.push({
              id: e.id,
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: e.property_totaldict_geo_cities_coords.split(",")
              },
              properties: {
                country: e.property_totaldict_geo_cities_country_name
              }
            }) : void 0
          }), r.add(i), a.setBounds(r.getBounds()), window.manager = r
        }, function () {
          return console.error("error")
        })
      })
    }]), angular.module("App").controller("CityStagesController", ["$scope", "$http", "$location", "$window", "$compile", "$filter", "CacheFactory", function (e, t, n, r, a, i, o) {
    var s, c;
    return e.user = window.siteData.user, e.limit = 5, e.showAll = function () {
      return e.limit = e.stages.length, e.selected = void 0
    }, s = null, c = null, e.PanToStage = function (e) {
      return s.panTo(e.coords)
    }, r.ymaps.ready(function () {
      var n, a, i, l;
      return s = new r.ymaps.Map(angular.element("#city-stages-map")[0], {
        center: [52.650555194, 90.1041272746],
        zoom: 13,
        controls: []
      }), l = new r.ymaps.ObjectManager({
        clusterize: !0
      }), i = r.ymaps.templateLayoutFactory.createClass('<div class="cluster-content">$[properties.geoObjects.length]</div>'), a = r.ymaps.templateLayoutFactory.createClass('<div class="balloon"> <div class="balloon__content"> $[[options.contentLayout observeSize maxWidth=405 maxHeight=350]] </div> </div>', {
        build: function () {
          this.constructor.superclass.build.call(this), this._$element = $(".balloon", this.getParentElement())
        },
        clear: function () {
          this.constructor.superclass.clear.call(this)
        },
        onSublayoutSizeChange: function () {
          a.superclass.onSublayoutSizeChange.apply(this, arguments), this._isElement(this._$element) && this.events.fire("shapechange")
        },
        getShape: function () {
          var e;
          return this._isElement(this._$element) ? (e = this._$element.position(), new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
            [e.left, e.top],
            [e.left + this._$element[0].offsetWidth, e.top + this._$element[0].offsetHeight]
          ]))) : a.superclass.getShape.call(this)
        },
        _isElement: function (e) {
          return e && e[0]
        }
      }), n = r.ymaps.templateLayoutFactory.createClass('<div class="wysiwyg"> <div class="wysiwyg__p wysiwyg__p_s_m">$[properties.name]</div> <div class="wysiwyg__p wysiwyg__p_s_s wysiwyg__p_meta">$[properties.address]</div> </div>'), l.objects.options.set({
        iconLayout: "default#image",
        iconImageHref: "/local/templates/main/images/mappoint.png",
        iconImageSize: [20, 27],
        iconImageOffset: [-10, -27],
        hideIconOnBalloonOpen: !1,
        balloonShadow: !1,
        balloonLayout: a,
        balloonContentLayout: n,
        balloonPanelMaxMapArea: 0,
        balloonOffset: [-40, -42]
      }), l.objects.events.add("click", function (t) {
        e.$apply(function () {
          return e.selected = {
            id: t.get("objectId")
          }
        })
      }), l.clusters.options.set({
        clusterIcons: [{
          href: "/local/templates/main/images/mapcluster.png",
          size: [64, 64],
          offset: [-32, -32]
        }],
        clusterIconContentLayout: i
      }), s.geoObjects.add(l), c = {
        type: "FeatureCollection",
        features: []
      }, o("stagesCache", {
        maxAge: 12e4,
        deleteOnExpire: "aggressive",
        storageMode: "localStorage"
      }), t.get(r.location.pathname + "stages/", {
        cache: o.get("stagesCache")
      }).then(function (t) {
        return e.stages = t.data, _.map(t.data, function (e) {
          return e.coords ? c.features.push({
            id: e.id,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: e.coords
            },
            properties: {
              name: e.name,
              address: e.address,
              href: e.link
            }
          }) : void 0
        }), l.add(c), c.features.length > 1 ? s.setBounds(l.getBounds()) : s.setCenter(c.features[0].geometry.coordinates)
      }, function () {
        return console.error("error")
      })
    })
  }]), angular.module("App").directive("tabs", function () {
    return {
      replace: !0,
      transclude: !0,
      controller: ["$scope", function (e) {
        var t;
        t = e.panes = [], e.select = function (e) {
          return _.each(t, function (e) {
            return e.selected = !1
          }), e.selected = !0
        }, this.add = function (n) {
          return 0 === t.length && e.select(n), t.push(n)
        }
      }],
      template: '<div class="ui-tabs"> <div class="ui-tabs__links"> <a class="ui-tabs__link" ng-repeat="pane in panes" ng-bind="pane.title" ng-class="{\'active\': pane.selected}" ng-click="select(pane)"></a> </div> <div class="ui-tabs__panes" ng-transclude></div> </div>'
    }
  }),
    angular.module("App").directive("activateLocations", function () {
      return {
        link: function (e, t, n) {
          return $(t).magnificPopup({
            type: "inline",
            showCloseBtn: !1,
            callbacks: {
              open: function () {
                e.$apply(function () {
                  return e.$root.searchActivated = !0
                })
              }
            }
          })
        }
      }
    }),
    angular.module("App").directive("activateLocationsnew", function () {
      return {
        link: function (e, t, n) {
          return e.$root.searchActivated = !0;
        }
      };
    }),
    angular.module("App").directive("window", function () {
      return {
        link: function (e, t, n) {
          return $(t).magnificPopup({
            type: "inline",
            showCloseBtn: !1
          })
        }
      }
    }), angular.module("App").directive("pane", function () {
    return {
      require: "^tabs",
      scope: {
        title: "@"
      },
      replace: !0,
      transclude: !0,
      link: function (e, t, n, r) {
        return r.add(e)
      },
      template: '<div class="ui-tabs__pane" ng-show="selected" ng-transclude> </div>'
    }
  }), angular.module("App").directive("score", function () {
    return {
      scope: {
        value: "="
      },
      replace: !0,
      link: function (e, t, n) {
        //console.log('e:',e, 't:',t, 'n:',n,'value', n.value);
        var r, a, i, o;
        if (parseInt(n.value) != 6) {
          return o = 2 * Math.PI, a = 100, r = d3.svg.arc().innerRadius(a / 2).outerRadius(a / 2 - 2).startAngle(0), i = d3.select(t[0]).append("svg").attr("width", a).attr("height", a).attr("class", "score__canvas").append("g").attr("transform", "translate(" + a / 2 + ", " + a / 2 + ")"), i.append("path").datum({
            endAngle: o * e.value / 5
          }).attr("d", r).style("fill", "#bf0000")
        } else {
          t[0].innerHTML = "<span style=\"font-size:15px;\">Проверено</span>";
          return '';
        }
      },
      template: '<div class="score" ng-class="{\'score_complete\': value == 5}"> <div class="score__value"><span ng-bind="value" style="vertical-align: -4px;"></span></div> </div>'
    }
  }), angular.module("App").directive("wysiwygSlider", function () {
    return {
      replace: !0,
      transclude: !0,
      link: function (e, t, n) {
        var r;
        return e.slideCurrent = 1, r = t.find(".wysiwyg-slider__carousel"), r.on("init", function (t, n) {
          return e.slideCount = n.slideCount
        }), r.on("beforeChange", function (t, n, r, a) {
          return e.$apply(function () {
            return e.slideCurrent = a + 1
          })
        }), r.slick({
          speed: 500,
          infinite: !0,
          slidesToShow: 1,
          prevArrow: t.find(".wysiwyg-slider__prev"),
          nextArrow: t.find(".wysiwyg-slider__next")
        })
      },
      template: '<div class="wysiwyg-slider"> <div class="wysiwyg-slider__carousel" ng-transclude></div> <div class="wysiwyg-slider__toolbar"> <a href="#" class="wysiwyg-slider__prev icon icon_slide_prev"></a><span class="wysiwyg-slider__reference">{{slideCurrent}}/{{slideCount}}</span><a href="#" class="wysiwyg-slider__next icon icon_slide_next"></a> </div> </div>'
    }
  }),
    angular.module("App").controller("CityBlogListController", ["$scope", "$http", "CacheFactory", function (e, t, n) {
      var r;
      e.blog_list = [];
      e.limit = 5;
      r = window.location.pathname;
      if (r[r.length - 1] !== '/') {
        r += '/';
      }
      t.get(r + "blog/" /*,{cache:n.get("cache")}*/).then(function (t) {
          return e.blog_list = t.data;
        },
        function () {
          return console.error("error");
        });
    }]),
    angular.module("App").controller("UserRestorePasswordController", ["$scope", "$http", function (e, t) {
      return e.errors = [],
        e.saving = !1,
        e.data = {
          email: window.siteData.info_form_data.fields.email.value,
          token: window.siteData.info_form_data.fields.token.value
        },
        e.send = function () {
          e.saving = !0,
            t.post("/profile/password_restore/", e.data).then(function (t) {
              if (t.data.is_success) {
                alert('Пароль был успешно изменён');
                window.location.href = "/";
              } else {
                e.errors = _.compact(_.map(t.data.fields, function (e) {
                  return e.errors;
                })),
                  e.saving = !1;
              }
            })
        }
    }]),
    angular.module("App").controller("UserResetPasswordController", ["$scope", "$http", function (e, t) {
      return e.data = {},
        e.errors = [],
        e.success = !1,
        e.saving = !1,
        e.send = function () {
          e.saving = !0,
            t.post("/profile/password_request/", e.data).then(function (t) {
              e.phone_mode = t.data.phone_mode,
                e.send_to_user = t.data.send_to_user,
                e.success = t.data.is_success,
                e.errors = _.compact(_.map(t.data.fields, function (e) {
                  return e.errors
                })), e.saving = !1
            })
        }
    }]),
    angular.module("App").controller("UserSubscribtionsController", ["$scope", "$http", function (e, t) {
      return e.saving = !1,
        e.success = !1,
        e.show_form = false,
        e.data = {
          uf_sb_news: window.siteData.info_form_data.subscribes.uf_sb_news.value,
          uf_sb_ready: window.siteData.info_form_data.subscribes.uf_sb_ready.value,
          uf_sb_region: window.siteData.info_form_data.subscribes.uf_sb_region.value
        },
        e.send = function () {
          e.saving = !0,
            t.post(window.location.pathname, {
              location: "subscribes",
              data: e.data
            }).then(function (t) {
              e.success = t.data.is_success, e.saving = !1,
              e.success && e.form.$setPristine()
            })
        }
    }]),
    angular.module("App").controller("UserChangePasswordController", ["$scope", "$http", function (e, t) {
      return e.saving = !1,
        e.success = !1,
        e.send = function () {
          e.saving = !0,
            t.post(window.location.pathname, {
              location: "password",
              data: e.data
            }).then(function (t) {
              e.success = t.data.is_success, e.saving = !1,
                e.errors = _.compact(_.map(t.data.fields, function (e) {
                  return e.errors
                })),
              e.success && e.form.$setPristine()
            })
        }
    }]),
    angular.module("App").factory("geoDataFactory", ["$http", "CacheFactory", function (e, t) {
      var n;
      return n = "/ajax", {
        getCountries: function () {
          console.log(0)
          return e.get(n + "/geo_countries.php", {
            cache: t.get("cache")
          })
        },
        getCurrentCountry: function () {
          return null
        },
        getCountryStates: function (r) {
          console.log(2)
          if (window.isCorp) r = '';
          return e.get(n + "/geo_states.php?country=" + r, {
            cache: t.get("cache")
          })
        },
        getCountryCities: function (r) {
          if (window.isCorp) r = '';
          return e.get(n + "/geo_cities.php?country=" + r, {
            cache: t.get("cache")
          })
        },
        getStateCities: function (r) {
          if (window.isCorp) r = '';
          return e.get(n + "/geo_cities.php?state=" + r, {
            cache: t.get("cache")
          })
        }
      }
    }]),
    angular.module("App").directive("geoLocationSelect", ["geoDataFactory", function (e) {
      return {
        require: "^form",
        replace: !0,
        transclude: !0,
        template: "<div class='form__r' ng-cloack ng-transclude> </div> f               ",
        link: function (t, n, r) {
          return t.$parent.location = {
            country: window.siteData.city.property_totaldict_geo_cities_country_id,
            state: window.siteData.city.property_totaldict_geo_cities_state_id,
            city: window.siteData.city.id
          },
            e.getCountries().success(function (e) {
              return t.countries = e
            }),
            t.$parent.$watch("location.country", function (n, r) {


              e.getCountryCities(n).success(function (e) {
                return t.cities = e
              })


              return null != n ? (n !== r && (t.$parent.location.city = t.$parent.location.state = null),
                e.getCountryStates(n).success(function (r) {
                  return t.states = r,
                    0 === r.length ? e.getCountryCities(n).success(function (e) {
                      return t.cities = e
                    }) : void 0
                })) : void 0
            }),
            t.$parent.$watch("location.state",
              function (n, r) {
                return null != n ? (n !== r && (t.$parent.location.city = null),
                  e.getStateCities(n).success(function (e) {
                    return t.cities = e
                  })) : void 0
              })
        }
      }
    }]),
    r = function (e, t) {
      e.rules = '{ "text": "Понимающие люди справедливо утверждают, что хороший флотский офицер должен уметь разнообразно сочетать различные виды сна со службой и уметь засыпать в любое время и в любой позе, чтобы урвать причитающиеся нормальному человеку восемь часов сна.", "variants": "П[о/1]н[и/2]ма[ю/3]щ[и/4][е/5] люди спр[а/6]в[е/7]длив[о/8] утв[е/9]ржда[ю/10]т{,/1} чт[о/11] х[о/12]рош[и/13]й{ /2}фло[т/14]ск[и/15]й [о/16]ф[и/17]ц[е/18]р долж[е/19]н уметь р[а/20]зн[о/21][о/22]бразн[о/23] с[о/24]ч[е/25]тать р[а/26]зли[ч/27]ны[е/28] виды сна с[о/29] служб[о/30]й{ /3}и уметь з[а/31]сыпать в любо[е/32] время{ /4}и в любой поз[е/33]{,/5} [ч/34]то[б/35]ы урвать{ /6}пр[и/36]ч[и/37]та[ю/38]щ[и/39][е/40]ся н[о/41]рмальн[о/42]му ч[е/43]л[о/44]веку{ /7}вос[е/45]мь ч[а/46]со[в/47] сна.", "orfograms": { "n1": { "value": "п[о]нимающие", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n2": { "value": "пон[и]мающие", "description": "В глаголах с общей частью {-нимать} (напр., {занимать, донимать, обнимать, отнимать, поднимать, снимать, понимать, унимать}), которым соответствуют глаголы совершенного вида на {-ня́ть} ({занять, принять, поднять, понять, унять} и т. п.), пишется после {н} на месте безударного гласного буква {и}. [ПАС.О.35]"}, "n3": { "value": "понима[ю]щие", "description": "Действительные причастия настоящего времени образуются от основы глагола настоящего времени при помощи суффиксов {-ущ- / -ющ-} (от глаголов I спряжения) и {-ащ- / -ящ-} (от глаголов II спряжения). [ПАС.О.58]"}, "n4": { "value": "понимающ[и]е", "description": "Написание буквы {и} в безударном окончании проверяется подбором других слов, в которых в том же окончании гласный стоит под ударением. Например: {какие, морские}. [ПАС.О.33] [ПАС.О.67]"}, "n5": { "value": "понимающи[е]", "description": "Всегда безударен конечный гласный окончаний им. п. прилагательных жен. рода {-ая (-яя): красная, большая, синяя}; сред, рода {-ое (-ее): красное, большое, синее}; мн. числа {-ые (-ие): красные, большие, синие}. [ПАС.О.69]"}, "n6": { "value": "спр[а]ведливо", "description": "Написание буквы {а} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: {правда}. [ПАС.О.33] [ПАС.О.34]"}, "n7": { "value": "справ[е]дливо", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n8": { "value": "справедлив[о]", "description": "Написание буквы {о} на месте безударного гласного в суффиксе проверяется подбором других слов, в которых в том же суффиксе гласный стоит под ударением, например: {далеко, хорошо, свежо}. [ПАС.О.33], [ПАС.О.42]"}, "n9": { "value": "утв[е]рждают", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n10": { "value": "утвержда[ю]т", "description": "В формах 2-го и 3-го лица ед. ч., 1-го и 2-го лица мн. ч. глаголов I спряжения пишется буква {ё} (без ударения - {е}), в тех же формах глаголов II спряжения пишется буква {и}; в форме 3-го лица мн. ч. глаголов I спряжения - буквы {у (ю)}, глаголов II спряжения - {а (я)}. [ПАС.О.74]"}, "n11": { "value": "чт[о]", "description": "В слове {что} пишется {ч}, а произносится обычно {ш} перед {т}. [ПАС.О.91]"}, "n12": { "value": "х[о]роший", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n13": { "value": "хорош[и]й", "description": "В форме им. п. ед. ч. муж. рода имен прилагательных (а также всех других слов, склоняющихся как прилагательные) без ударения пишется окончание {-ый} (после мягких парных согласных и шипящих - {-ий}), хотя ударное окончание - {-ой}.[ПАС.О.68]"}, "n14": { "value": "фло[т]ский", "description": "На стыке корня {-флот-} и суффикса {-ск-} возникает стечение согласных {тс}, которое произносится как {ц}. На письме каждая морфема записывается без изменений. [ПАС.О.85]"}, "n15": { "value": "флотск[и]й", "description": "В форме им. п. ед. ч. муж. рода имен прилагательных (а также всех других слов, склоняющихся как прилагательные) без ударения пишется окончание {-ый} (после мягких парных согласных и шипящих - {-ий}), хотя ударное окончание - {-ой}.[ПАС.О.68]"}, "n16": { "value": "[о]фицер", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n17": { "value": "оф[и]цер", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n18": { "value": "офиц[е]р", "description": "После {ц} для передачи ударного гласного [э] пишется буква {е}. [ПАС.О.22]"}, "n19": { "value": "долж[е]н", "description": "На месте беглого гласного после шипящих пишется буква {е}. [ПАС.О.64.2]"}, "n20": { "value": "р[а]знообразно", "description": "Написание буквы {а} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: разный. [ПАС.О.33] [ПАС.О.34]"}, "n21": { "value": "разн[о]образно", "description": "В слове {разнообразно} выделяется два корня - {-разн-} и {-образ-}, между которыми стоит соединительный гласный {о}. После твердых парных согласных соединительный гласный передается на письме буквой {о}. [ПАС.О.65]"}, "n22": { "value": "разно[о]бразно", "description": "Написание буквы {о} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: {образ}. [ПАС.О.33] [ПАС.О.34]"}, "n23": { "value": "разнообразн[о]", "description": "Написание буквы {о} на месте безударного гласного в суффиксе проверяется подбором других слов, в которых в том же суффиксе гласный стоит под ударением, например: {далеко, хорошо, свежо}. [ПАС.О.33], [ПАС.О.42]"}, "n24": { "value": "с[о]четать", "description": "Написание буквы {о} на месте безударного гласного в приставке {со-} проверяется подбором слов и форм с той же приставкой, в которых проверяемый гласный находится под ударением, ср.: {собранный}. [ПАС.О.33], [ПАС.О.38]"}, "n25": { "value": "соч[е]тать", "description": "В словах {сочетать, сочетание} пишется буква {е}. [ПАС.О.36. Примечание 1]"}, "n26": { "value": "р[а]зличные", "description": "Написание буквы {а} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: {разный}. [ПАС.О.33] [ПАС.О.34]"}, "n27": { "value": "разли[ч]ные", "description": "Сочетание {чн} пишется без мягкого знака. [ПАС.О.91]"}, "n28": { "value": "различны[е]", "description": "Всегда безударен конечный гласный окончаний им. п. прилагательных жен. рода {-ая (-яя): красная, большая, синяя}; сред, рода {-ое (-ее): красное, большое, синее}; мн. числа {-ые (-ие): красные, большие, синие}. [ПАС.О.69]"}, "n29": { "value": "с[о]", "description": "Написание буквы {о} на месте безударного гласного в корне проверяется подбором слова, в котором гласный стоит под ударением. Ср.: {со свету} [ПАС.О.33] [ПАС.О.34]"}, "n30": { "value": "служб[о]й", "description": "Написание буквы {о} в безударном окончании проверяется подбором других слов, в которых в том же окончании гласный стоит под ударением. Например: {мечтой}. [ПАС.О.33] [ПАС.О.67]."}, "n31": { "value": "з[а]сыпать", "description": "Написание буквы {а} на месте безударного гласного в приставке {за-} проверяется подбором слов и форм с той же приставкой, в которых проверяемый гласный находится под ударением, ср.: {заспанный}. [ПАС.О.33], [ПАС.О.38]"}, "n32": { "value": "любо[е]", "description": "Всегда безударен конечный гласный окончаний им. п. прилагательных жен. рода {-ая (-яя): красная, большая, синяя}; сред, рода {-ое (-ее): красное, большое, синее}; мн. числа {-ые (-ие): красные, большие, синие}. [ПАС.О.69]"}, "n33": { "value": "поз[е]", "description": "Написание буквы {е} в безударном окончании проверяется подбором других слов, в которых в том же окончании гласный стоит под ударением. Например: {земле}. [ПАС.О.33] [ПАС.О.67]."}, "n34": { "value": "[ч]тобы", "description": "В слове {чтобы} пишется {ч}, а произносится обычно {ш} перед {т}. [ПАС.О.91]"}, "n35": { "value": "чт[об]ы", "description": "Подчинительный целевой союз {чтобы} пишется слитно. Он используется в целевых придаточных, отвечающих на вопросы для чего?, зачем? Ср.: {Чтобы этого никто не заметил, я напускала на себя надменность} (И. Грекова. Без улыбок (1975)) Союз {чтобы} можно заменить на союз {для того чтобы, лишь бы} и др. Его надо отличать от сочетания местоимения {что} с частицей {бы}, например: {Я думал, что бы я сам стал делать, если б меня посадили под стеклянный колпак} (Юрий Коваль. Белозубка (1979)). В этом случае на местоимение {что} падает логическое ударение. Частицу {бы} можно перенести в другое место в предложении: {что я стал бы делать}. Это подтверждает раздельное написание. [ПАС.О.140.3]"}, "n36": { "value": "пр[и]читающиеся", "description": "Написание гласного {и} в приставке {при-} в данном случае надо проверять по словарю, так как значение приставки не вполне ясно.[ПАС.О.39]"}, "n37": { "value": "прич[и]тающиеся", "description": "В ряде корней глаголов имеется безударный беглый гласный, который передается на письме буквой {и} и (в части этих корней) буквой {е}. Буква {и} пишется, если сразу после корня стоит под ударением гласный {а}; в остальных случаях (при отсутствии ударного {а} после корня) на месте беглого гласного пишется буква {е}. [ПАС.О.36]."}, "n38": { "value": "причита[ю]щиеся", "description": "Действительные причастия настоящего времени образуются от основы глагола настоящего времени при помощи суффиксов {-ущ- / -ющ-} (от глаголов I спряжения) и {-ащ- / -ящ-} (от глаголов II спряжения). [ПАС.О.58]"}, "n39": { "value": "причитающ[и]еся", "description": "Написание буквы {и} в безударном окончании проверяется подбором других слов, в которых в том же окончании гласный стоит под ударением. Например: {какие, морские}. [ПАС.О.33] [ПАС.О.67]"}, "n40": { "value": "причитающи[е]ся", "description": "Всегда безударен конечный гласный окончаний им. п. прилагательных жен. рода {-ая (-яя): красная, большая, синяя}; сред, рода {-ое (-ее): красное, большое, синее}; мн. числа {-ые (-ие): красные, большие, синие}. [ПАС.О.69]"}, "n41": { "value": "н[о]рмальному", "description": "Написание буквы {о} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: {норма} [ПАС.О.33] [ПАС.О.34]"}, "n42": { "value": "нормальн[о]му", "description": "Написание буквы {о} в безударном окончании проверяется подбором других слов, в которых в том же окончании гласный стоит под ударением. Например: {какому, морскому, речному}. [ПАС.О.33], [ПАС.О.67]"}, "n43": { "value": "ч[е]ловеку", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n44": { "value": "чел[о]веку", "description": "Написание букв на месте безударных гласных корня, которое не может быть установлено по общему правилу (непроверяемых гласных), определяется по словарю. [ПАС.О.34]"}, "n45": { "value": "вос[е]мь", "description": "На месте беглого гласного после мягких согласных пишется буква {е}, ср.: {восемь - восмью}. [ПАС.О.64.2]"}, "n46": { "value": "ч[а]сов", "description": "Написание буквы {а} на месте безударного гласного в корне проверяется подбором другой формы того же слова или однокоренного слова, в котором гласный стоит под ударением. Ср.: {час}. [ПАС.О.33] [ПАС.О.34]"}, "n47": { "value": "часо[в]", "description": "В конце слова звонкий {в} оглушается. Написание окончания {-ов} в формах родительного падежа множественного числа имен существительных относится к числу непроверяемых. [ПАС.О.79], [ПАС.О.80]"}}, "punktograms": { "n1": { "value": ",", "description": "Запятая ставится между главной и придаточной частями в составе сложноподчиненного предложения. [ПАС.П.115]"}, "n2": { "value": "", "description": "Между неоднородными определениями {хороший} и {флотский} запятая не ставится, так как они обозначают разные признаки. [ПАС.П.37.2]"}, "n3": { "value": "", "description": "Между однородными членами, соединенными одиночным союзом {и}, запятая не ставится. [ПАС.П.27]"}, "n4": { "value": "", "description": "Между однородными членами, соединенными одиночным союзом {и}, запятая не ставится. [ПАС.П.27]"}, "n5": { "value": ",", "description": "Запятая ставится между частями сложноподчиненного предложения. [ПАС.П.115]"}, "n6": { "value": "", "description": "Согласованное определение, выраженное причастным оборотом, не обособляется, так как стоит перед определяемым словом. [ПАС.П.46.2]"}, "n7": { "value": "", "description": "Согласованное определение, выраженное причастным оборотом, не обособляется, так как стоит перед определяемым словом. [ПАС.П.46.2]"}}}',
        e.send = function () {
          var n;
          return n = window.siteData.dictant,
            e.result = processDict(e.data["in"], n.detail_text),
            t.post("/ajax/living_word_mark.php", {
              id: n.id,
              text: e.data["in"],
              score: e.result.score
            }).then(function (e) {
              console.log(e)
            })
        }
    },
    angular.module("App").controller("LiveWordController", ["$scope", "$http", r]), a = function (e, t, n) {
    e.dictant = n.siteData.dictant,
      e.saving = e.success = !1,
      e.send = function () {
        e.saving = !0,
          e.result = processDict(e.data.text, e.dictant.detail_text),
          console.log("LiveWordController-ajax/online_dictant_mark");
        t.post("/ajax/online_dictant_mark.php", {
          id: e.dictant.id,
          text: e.data.text,
          score: e.result.score,
          pe: e.result.punkto,
          oe: e.result.orfo
        }).then(function (t) {
          e.success = !0
        })
      }
  },
    a.$inject = ["$scope", "$http", "$window"],
    angular.module("App").controller("OnlineDictantControllerNew", ["$scope", "$http", function ($scope, $http) {
      var save_text = localStorage.getItem('dictant_' + $('#dictant_id').val());
      $scope.save_text = '';
      if (typeof save_text === 'string') {
        $scope.save_text = save_text;
      }
      $scope.showForm = false;

      $scope.result = window.siteData.dictant;

      //console.log($scope.result);


      $scope.showErrors = function () {
        if ($scope.result && !$scope.showForm && $scope.result.dictant_text) {console.log($scope.result);
          try {
            window.checkTextAndShowReport($scope.result.dictant_text, document.querySelector("#report-container-res"), function (score) {
				console.log("score",score);
            });
          } catch (err) {
            alert('Случилась какая-то ошибка'); 
          }
        }
      };
      $scope.check = function () {
        $.post('/ajax/save_td.php', {
          uid: $('#userid').val(),
          did: $('#dictant_id').val(),
          text: document.getElementById("textarea").value,
		  key: 'Zinich'
        }, function (ret) {
          console.log(ret);
        });
        try {
          window.checkTextAndShowReport(document.getElementById("textarea").value, document.querySelector("#report-container"), function (score) {
            if (score.isTotalDict) {
              var dictant_id = $('#dictant_id').val();
              var user_id = $('#userid').val();
              var data = {
                sessid: BX.bitrix_sessid(),
                dictant_id: dictant_id,
                user_id: user_id,
                corpdict: $('#corpdict').val(),
                orfo: score.errors.ORFO,
                punct: score.errors.PUNCT,
                typo: score.errors.TYPO,
                score: score.score,
                IsMobile: BX.browser.IsMobile(),
                text: $('#textarea').val()
              };
              //console.log(data);
              //return ;
              if (window.location.href.indexOf('/profile/') < 0) {
                console.log("check-send");
                $http.post(location.pathname, data).then(function (ret) {
                  if (ret.data.score != false && ret.data.score != 'false') {
                    ret.data.score = (parseInt(ret.data.score) == 6 ? "проверено" : ret.data.score);

                    $scope.result = {
                      score: ret.data.score,
                      orfo: score.errors.ORFO,
                      punkto: score.errors.PUNCT
                    };
                    $scope.showForm = true;
                    if (ret.data.score > 0) {
                      localStorage.removeItem('dictant_' + dictant_id);
                    }
                  } else {
                    $.post('/ajax/save_error.php', {'ret': ret.data, 'data': data}, function () {
                    });
                    //$http.post('/ajax/save_error.php', {'ret':ret.data, 'data':data}).then(function (ret) {});
                    //console.log('ret:',ret, 'data:',data);
                  }
                });
              }
            }
          });
        } catch (err) {
          alert('Случилась какая-то ошибка, отправьте текст на help@totaldict.ru, мы скоро всё исправим и проверим Ваш диктант.\n' + err);
        }
      };
      $scope.checkWithoutOrfgrmka = function () {
        if (document.getElementById("textarea").value.length > 10) {
          $.post('/ajax/save_td.php', {
            uid: $('#userid').val(),
            did: $('#dictant_id').val(),
            text: document.getElementById("textarea").value
          }, function (ret) {
            console.log(ret);
          });
        }
        try {
          if (document.getElementById("textarea").value.length > 10) {
            var dictant_id = $('#dictant_id').val();
            var data = {
              sessid: BX.bitrix_sessid(),
              dictant_id: dictant_id,
              corpdict: $('#corpdict').val(),
              orfo: 0,
              punct: 0,
              typo: 0,
              score: 0,
              nocheck: 1,
              IsMobile: BX.browser.IsMobile(),
              text: $('#textarea').val()
            };
            $http.post(location.pathname, data).then(function (ret) {
              $scope.result = {
                score: 0,
                orfo: 0,
                punkto: 0
              };
              $scope.showForm = false;
              localStorage.removeItem('dictant_' + dictant_id);
            });
          } else {
            alert('Напишите текст диктанта.');
          }
        } catch (err) {
          alert('Случилась какая-то ошибка, отправьте текст на help@totaldict.ru, мы скоро всё исправим и проверим Ваш диктант.\n' + err);
        }
      };
    }]),
    angular.module("App").controller("OnlineTrudController", ["$scope", "$http", function ($scope, $http) {
      $scope.userForm = window.siteData.userForm;
      $scope.user = window.siteData.user;
      $scope.saving = false;
      $scope.send = function (form) {
        var data = JSON.parse(JSON.stringify(form.data));
        data.action = 'regform';
        $scope.success = false;
        $scope.saving = true;
        console.log(data);
		if(typeof ym =='function')
			ym(931140,'reachGoal','register');
		if(typeof fbq =='function')
			fbq('track', 'CompleteRegistration');
        $http.post(location.pathname, data).then(function (json) {
          $scope.saving = false;
          if (json.data.is_success) {
            $scope.success = true;
          }
        });
      };
      $scope.data = {
        email: $scope.userForm.email,
        name: $scope.userForm.name,
        lname: $scope.userForm.lname,
        sname: $scope.userForm.sname,
        city: $scope.userForm.city
      };
    }]),
    angular.module("App").controller("OnlineDictantListController", ["$scope", "$http", function ($scope, $http) {
      $scope.dictants = window.siteData.dictants;
      $scope.userForm = window.siteData.userForm;
      $scope.user = window.siteData.user;
      $scope.saving = false;
      $scope.dictants_check = [];
      $scope.activeDictants = function () {
        $scope.dictants_check = [];
        $.each($scope.dictants, function (i, dictant) {
          if (dictant.registred) {
            return true;
          }
          $scope.dictants_check.push({
            value: dictant.id,
            name: dictant.name,
            timezone: dictant.timezone,
            checked: false
          });
        });
      };
      $scope.activeDictants();
      $scope.checkChoice = function () {
        var result = false;
        $.each($scope.dictants_check, function (i, dictant) {
          if (dictant.checked) {
            result = true;
          }
        });
        return result;
      };
      $scope.send = function (form) {
        var data = JSON.parse(JSON.stringify(form.data));
        data.action = 'regform'; 
        data.dictant_id = [];
        $scope.success = false;
        $.each($scope.dictants_check, function (i, dictant) {
          if (dictant.checked) {
            data.dictant_id.push(dictant.value);
          }
        }); 
        $scope.saving = true;
		if(typeof ym =='function')
			ym(931140,'reachGoal','register');
		if(typeof fbq =='function')
			fbq('track', 'CompleteRegistration');
        $http.post(location.pathname, data).then(function (json) {
          $scope.saving = false;
          if (json.data.is_success) {
            var i;
            for (i = 0; i < $scope.dictants.length; i++) {
              if ($.inArray($scope.dictants[i].id, data.dictant_id) > -1) {
                $scope.dictants[i].registred = true;
                $scope.dictants[i].unregistred = false;
              }
            }
            $scope.success = true;
          }
        });
      };
      $scope.unreg = function (dictant) {
        var data = {
          action: 'unreg',
          id: dictant.id
        };
        $http.post(location.pathname, data).then(function (json) {
          if (json.data.is_success) {
            dictant.registred = false;
            dictant.unregistred = true;
            $scope.activeDictants();
          }
        });
      };
      $scope.data = {
        email: $scope.userForm.email,
        name: $scope.userForm.name,
        lname: $scope.userForm.lname,
        sname: $scope.userForm.sname,
        city: $scope.userForm.city
      };
    }]),
    angular.module("App").controller("OnlineDictantController", a), t = function (e, t, n) {
    var r;
    r = window.siteData.dictant.form.url;
    e.data = {};
    e.frame = window.siteData.dictant.form;
    e.frameSrc = function () {
      return n.trustAsResourceUrl(r);
    };
    e.saving = false;
    e.success = false;
    //    e.result = window.siteData.dictant;
    //    console.log(e.result);
    e.send = function () {
      return e.success = true;
    };
  },
    o = function (e, t) {
      e.saving = !1,
        e.send = function () {
          return e.saving = !0,
            t.post(window.location.pathname, {
              location: "region",
              data: {
                uf_td_city_ib: e.location.city,
                region: e.location.state,
                country: e.location.country
              }
            }).then(function (t) {
              return e.saving = !1,
                t.data.is_success ? e.form.$setPristine() : void 0
            })
        }
    },
    i = function (e, t) {
      e.data = {},
        _.map(window.siteData.formData, function (t) {
          e.data[t.name] = t.value
        }),
        e.additionals = _.filter(window.siteData.formData, function (e) {
          return e.name.search("additional") > -1
        }),
        e.stage = window.siteData.stage,
        e.saving = e.success = !1,
        e.send = function () {
          e.saving = true,
            e.formError = false;
          t.post(window.location.pathname, e.data).then(function (t) {
            e.saving = false;
            if (t.data.is_succes) {
              window.location = "/profile/";
              e.success = true;
            } else {
              if (t.data.fields.errors) {
                e.formError = t.data.fields.errors;
              }
            }
          })
        }
    },
    i.$inject = ["$scope", "$http"],
    angular.module("App").controller("StageRegisterController", i),
    e = function (e, t) {
      e.data = {},
        e.saving = e.success = !1,
        e.checkAndSelect = function (popup) {
          var val = document.getElementById('sity_select').value;
          var cName = document.getElementById('city_text').value;

          //console.log("I'm OK! Show CitySelector", val, e.countries, e.cities);
          t.get("/ajax/check_is_exists.php?city_id=" + val + '&cityName=' + cName, {}).then(function (tr) {
            //$('#link_city').text(tr.data.name);
            $('#link_city').attr('href', tr.data.detail_page_url);
            if (tr.data.exists) {
              $('#form_2').show();
              $('#form_1').hide();
              $('#title_page_test').text("Город " + tr.data.name + " уже входит в число участников");
            } else {
              $('#form_1').show();
              $('#form_2').hide();
              $('#title_page_test').text("Отправить заявку");

              $block_cart = $('#title_page_test').closest('.card');
              //$block_cart.css('border', '1px solid red');
              $( ".page-topbar" ).after( $block_cart);
            }
            $('#title_page_test').show();
          });
          popup.close();
        },
        e.selectCity = function () {
          var $html = "<div id='city-have'><select ng-change='' id='sity_select' name='sity_select'>";
          $.each(e.cities, function (i, city) {
            $html += '<option value="' + city.id + '">' + city.name + '</option>';
          });
          $html += "<select><br/><a class='link link_blue' onclick=\"showOtherInput();\" href=\"javascript:void(0);\" style='margin-top: 0.5rem;'>Не нашли в списке свой город</a></div>";

          $html += '<div id="city-nothave" class="form__label" style="display:none;">Введите название города:<br/><input type="text" name="city_text" id="city_text"></div>';

          var addAnswer = new BX.PopupWindow(
            "city_select",
            null,
            {
              content: $html,
              titleBar: {
                content: BX.create("div", {
                  html: '<div class="form__name">Выберите Ваш город</div>',
                  'props': {'className': 'access-title-bar'}
                })
              },
              zIndex: 0,
              offsetLeft: 0,
              offsetTop: 0,
              draggable: {restrict: false},
              overlay: {backgroundColor: 'black', opacity: '80'},
              buttons: [
                new BX.PopupWindowButton({
                  text: "Выбрать",
                  className: "button",
                  events: {
                    click: function () {
                      e.checkAndSelect(this.popupWindow);
                    }
                  }
                }),
              ]
            });
          addAnswer.show();
        },
        e.showOk = function () {
          var oPopup = new BX.PopupWindow('call_feedback', null, {
            autoHide: true,
            offsetTop: 1,
            offsetLeft: 0,
            lightShadow: true,
            closeIcon: true,
            closeByEsc: true,
            overlay: {
              backgroundColor: 'green', opacity: '80'
            }
          });
          oPopup.setContent('Спасибо! Ваша заявка, принята. Пожалуйста, ожидайте, мы с Вами обязательно свяжемся.');
          oPopup.show();
        },
        e.send = function () {
          var n;
          return e.saving = !0,
            n = e.data,
            n.location = e.location,
            t.post("/ajax/form_organize.php", n).then(function (t) {
              return e.saving = !1, t.data.is_succes ? (e.data = {}, e.data.rf_resume = 'Спасибо! Ваша заявка, принята. Пожалуйста, ожидайте, мы с Вами обязательно свяжемся.', e.showOk()) : void 0
            })
        }
    },
    angular.module("App").controller("DictantPartController", ["$scope", "$http", "$sce", t]).controller("UserRegionController", ["$scope", "$http", o]).controller("BecomeOrganizerController", ["$scope", "$http", e]),
    n = function (e, t) {
      var d = new Date();
      e.saving = e.success = !1,
        e.data = {
          personal_year: window.siteData.userForm.birth_year,
          personal_gender: window.siteData.userForm.gender
        },
        e.identificationData = {
          year: d.getFullYear(),
          stagesError: !1
        },
        e.stages = [],
        e.genders = [{
          id: "",
          name: "Не указан"
        },
          {
            id: "M",
            name: "Мужской"
          },
          {
            id: "F",
            name: "Женский"
          }
        ],
        e.$watch("location.city", function (n) {
          e.stages = [],
          null != n && t.get("/ajax/geo_stages.php", {
            params: {
              city: n,
              year: e.identificationData.year
            }
          }).then(function (t) {
            e.stages = t.data,
              e.identificationData.stagesError = !0
          })
        }),
        e.$watch("identificationData.year", function (n) {
          e.stages = [],
          null != n && t.get("/ajax/geo_stages.php", {
            params: {
              city: e.location.city,
              year: e.identificationData.year,
              zz: e.identificationData.year
            }
          }).then(function (t) {
            e.stages = t.data,
              e.identificationData.stagesError = !0
          })
        }),
// start new code
        e.dataz_3 = [{
          id: 1,
          name: "Начальное, неполное среднее"
        },
          {
            id: 2,
            name: "Общее среднее"
          },
          {
            id: 3,
            name: "Среднее специальное"
          },
          {
            id: 4,
            name: "Неоконченное высшее"
          },
          {
            id: 5,
            name: "Высшее"
          },
          {
            id: 6,
            name: "Уч. Степень"
          }
        ],
        e.dataz_4 = [{
          id: 1,
          name: "Рабочий различных сфер промышленности, строительства, транспорта, связи"
        },
          {
            id: 2,
            name: "Работник торговли, общественного питания и бытового обслуживания"
          },
          {
            id: 3,
            name: "Работник сельского хозяйства (фермер, крестьянин и т.д.)"
          },
          {
            id: 4,
            name: "Инженерно-технический работник"
          },
          {
            id: 5,
            name: "Работник бюджетной сферы (образование, здравоохранение, культура и др.)"
          },
          {
            id: 6,
            name: "Военнослужащий, сотрудник правоохранительных органов (МВД, Прокуратура)"
          },
          {
            id: 7,
            name: "Предприниматель, собственник бизнеса"
          },
          {
            id: 8,
            name: "Государственный или муниципальный служащий"
          },
          ,
          {
            id: 9,
            name: "Студент, учащийся"
          },
          {
            id: 10,
            name: "Пенсионер"
          },
          {
            id: 11,
            name: "Безработный, домохозяйка"
          }
        ],
        e.dataz_5 = [{
          id: 1,
          name: "Новостные сайты в интернете, онлайн-СМИ"
        },
          {
            id: 2,
            name: "Интернет блоги, форумы, социальные сети"
          },
          {
            id: 3,
            name: "Радио"
          },
          {
            id: 4,
            name: "Печатная пресса"
          },
          {
            id: 5,
            name: "Друзья, знакомые"
          }
        ],
        e.dataz_6 = [{
          id: 1,
          name: "Участвую впервые и планирую участвовать в будущем"
        },
          {
            id: 2,
            name: "Участвую впервые и больше не планирую участвовать"
          },
          {
            id: 3,
            name: "Участвую не в первый раз и планирую участвовать в будущем"
          },
          {
            id: 4,
            name: "Участвую не в первый раз, но больше не планирую участвовать"
          }
        ],
        e.dataz_7 = [{
          id: 1,
          name: "Не удовлетворен качеством организации диктанта"
        },
          {
            id: 2,
            name: "Не удовлетворен результатом"
          },
          {
            id: 3,
            name: "Не нравится сама идея диктанта"
          },
          {
            id: 4,
            name: "Другое"
          }
        ],
        e.dataz_8 = [{
          id: 1,
          name: "Посещал подготовительные очные курсы"
        },
          {
            id: 2,
            name: "Проходил подготовительные онлайн-курсы"
          },
          {
            id: 3,
            name: "Готовился самостоятельно"
          },
          {
            id: 4,
            name: "Не готовился"
          }
        ],
        e.dataz_9 = [{
          id: 1,
          name: "Бесплатные общеобразовательные языковые курсы"
        },
          {
            id: 2,
            name: "Платные специализированные языковые курсы"
          },
          {
            id: 3,
            name: "Платные курсы с выдачей сертификатов государственного образца"
          },
          {
            id: 4,
            name: "Научно-популярные лекции и вебинары"
          },
          {
            id: 5,
            name: "Никакие"
          }
        ],
        e.dataz_10 = [{
          id: 1,
          name: "Существующая пятибалльная система"
        },
          {
            id: 2,
            name: "Десятибалльная система"
          },
          {
            id: 3,
            name: "Стобалльная система"
          }
        ],
        e.dataz_11 = [{
          id: 1,
          name: "менее 10 000 руб."
        },
          {
            id: 2,
            name: "от 10 000 до 20 000 руб."
          },
          {
            id: 3,
            name: "20 000 до 30 000 руб."
          },
          {
            id: 4,
            name: "30000 и более руб. на одного члена семьи"
          }
        ],
// end of new code
        e.occupations = [{
          id: 1,
          name: "Работаю"
        }, {
          id: 2,
          name: "Учусь"
        },
          {
            id: 3,
            name: "Учусь и подрабатываю"
          }, {
            id: 4,
            name: "Безработный, домохозяйка"
          },
          {
            id: 5,
            name: "На пенсии"
          }
        ],
        e.educations = [{
          id: 1,
          name: "Неполное среднее"
        },
          {
            id: 2,
            name: "Среднее, среднее специальное"
          },
          {
            id: 3,
            name: "Неоконченное высшее"
          },
          {
            id: 4,
            name: "Высшее"
          }, {
            id: 5,
            name: "Ученая степень"
          }
        ],
        e.participations = [{
          id: 1,
          name: "Впервые"
        },
          {
            id: 2,
            name: "Один раз"
          },
          {
            id: 3,
            name: "Два раза"
          },
          {
            id: 4,
            name: "Три раза и более"
          }
        ],
        e.steps = [{
          name: "Кодовое слово",
          active: !0,
          disabled: !1
        },
          {
            name: "Об участнике",
            disabled: !0
          },
          {
            name: "Оценка",
            disabled: !0
          }
        ],
        e.changeStep = function (t) {
          return t.disabled || t.completed ? void 0 : (_.each(e.steps, function (e) {
            e.active = !1
          }), t.active = !0)
        },
        e.submitDetailsForm = function () {
          var n;
          e.saving = !0,
            n = angular.copy(e.data),
            n.from = "details",
            n.uf_billboard = n.uf_billboard ? "Афиша" : "",
            n.uf_media = n.uf_media ? "СМИ" : "",
            n.uf_social_network = n.uf_social_network ? "Социальные сети" : "",
            n.uf_friends = n.uf_friends ? "Друзья или родственники" : "",
            n.uf_manager = n.uf_manager ? "Руководитель или преподаватель" : "",
            n.result_id = e.result.id,
            n.result_orph = e.result.uf_err_orph,
            n.result_gramm = e.result.uf_err_punct,
            n.result_itog = e.result.uf_dict_score,
            n.result_litera = e.result.uf_letter;

          t.post(window.location.pathname, n).then(function (t) {
			  if(!t.data.is_succes) alert("Вы не заполнили все поля!");
            return e.saving = !1,
              t.data.is_succes ? (e.steps[1].completed = !0, e.steps[2].disabled = !1,
                e.changeStep(e.steps[2])) : void 0
          })
        },
        e.submitIdentifyForm = function () {
          e.saving = !0,
            t.post(window.location.pathname, {
              from: "identification",
              name: window.document.getElementById("new_personal_name").value,
              code: window.document.getElementById("new_personal_code").value,
              //name:e.identificationData.personal_name,
              //code:e.identificationData.personal_code,
              stage: e.identificationData.stage,
              year: e.identificationData.year
            }).then(function (t) {
              if (t.data.already_exists) {
                var text = "У Вас уже есть прикрепленный диктант";
                e.steps[0].already_exists = true;
              } else {
                e.steps[0].already_exists = false;
                var text = "К сожалению, мы не нашли в базе результатов соответствия с введенными вами данными. Пожалуйста, убедитесь в том, что вы вводите имя и кодовое слово в точности так, как указали их на бланке. Прочитайте объявления и инструкции по узнаванию результатов, выложенные на вашей городской странице. Если ничего не помогло, обратитесь к вашему городскому координатору (контакты обычно можно найти на городской странице).";
              }
              console.log(t.data, e.steps[0]);
              return e.saving = !1,
                t.data.is_succes ? (
                  e.steps[0].completed = !0,
                    e.steps[0].success = !0,
                    e.steps[1].disabled = !1,
                    e.result = t.data.result,
                    _.isArray(t.data.quiz) ? e.changeStep(e.steps[1]) : (e.steps[1].completed = !0, e.steps[2].disabled = !1, e.changeStep(e.steps[2]))) : e.steps[0].success = !1
            })
        }
    },
    n.$inject = ["$scope", "$http"],
    angular.module("App").controller("DictantResultsController", n),
    m = function (e, t) {
      var d = new Date();
      e.saving = e.success = !1,
        e.identificationData = {
          year: '06.09.2018',
          stagesError: !1
        },
        //e.identificationData.personal_code = (e.identificationData.personal_code=='') ? e.identificationData.personal_name : e.identificationData.personal_code,
        e.stages = [],
        e.$watch("location.city", function (n) {
          e.stages = [],
          null != n && t.get("/ajax/geo_stages_corp.php", {
            params: {
              city: n,
              dat: e.identificationData.year,
              corp: e.corpcompanys[0].id
            }
          }).then(function (t) {
            e.stages = t.data,
              e.identificationData.stagesError = !0
          })
        }),
        e.getDicts = function () {
          var arr = [];
          var i = 0;
          $('.dictslist p').each(function () {
            var name = $(this).text().split(';')[0];
            var id = $(this).text().split(';')[1];
            arr[i] = {name, id};
            i = i + 1;
          });
          return arr;
        },
        e.corpcompanys = e.getDicts(),
        e.steps = [{
          name: "Кодовое слово",
          active: !0,
          disabled: !1
        },
          {
            name: "Оценка",
            disabled: !0
          }
        ],
        e.changeStep = function (t) {
          return t.disabled || t.completed ? void 0 : (_.each(e.steps, function (e) {
            e.active = !1
          }), t.active = !0)
        },
        e.submitDetailsForm = function () {
          var n;
          e.saving = !0,
            n = angular.copy(e.data),
            n.from = "details",
            t.post(window.location.pathname, n).then(function (t) {
              return e.saving = !1,
                t.data.is_succes ? (e.steps[1].completed = !0, e.steps[2].disabled = !1,
                  e.changeStep(e.steps[2])) : void 0
            })
        },
        e.submitIdentifyForm = function () {
          console.log(e);
          e.saving = !0,
            t.post(window.location.pathname, {
              from: "identification",
              name: e.identificationData.personal_name,
              code: e.identificationData.personal_code,
              stage: e.identificationData.stage,
              year: e.identificationData.year,
              corpcompany: e.identificationData.corpcompany
            }).then(function (t) {
              return e.saving = !1,
                t.data.is_succes ? (
                  e.steps[0].completed = !0,
                    e.steps[0].success = !0,
                    e.steps[1].disabled = !1,
                    e.result = t.data.result,
                    _.isArray(t.data.quiz) ? e.changeStep(e.steps[1]) : (e.steps[1].completed = !0, e.steps[2].disabled = !1, e.changeStep(e.steps[2]))) : e.steps[0].success = !1
            })
        }

    },
    m.$inject = ["$scope", "$http"],
    angular.module("App").controller("DictantCorpResultsController", m),
    angular.module("App").controller("FaqRequestController", ["$scope", "$http", function (e, t) {
      return e.data = {},
        e.saving = !1,
        e.success = !1,
        e.send = function () {
          var n;
          e.saving = !0,
            n = {
              rf_data: e.data
            },
          e.data.rf_location && (n.rf_location = e.location),
            t.post("/ajax/form_faq.php", n).then(function (t) {
              e.saving = !1,
              t.data.is_succes && (e.data.rf_question = "", e.data.rf_location = !1)
            })
        }
    }]),
    angular.element(document).ready(function () {
      return angular.bootstrap(document, ["App"])
    }),
    $(function () {
      var e, t;
      t = $(window),
        e = {
          replaceFeatures: function () {
            //                t.width()<=992&&1===$(".features .project-features").length&&(
            //                    $(".adaptive-fr .c").empty(),
            //                    $(".features .project-features").clone(!0).appendTo($(".adaptive-fr .c")),
            //                    $(".features").empty()
            //                ),
            //                t.width()>992&&0===$(".features .project-features").length&&(
            //                    $(".features").empty(),
            //                    $(".adaptive-fr .project-features").clone(!0).appendTo(".features"),
            //                    $(".adaptive-fr .c").empty()
            //                );
          },
          init: function () {
            e.replaceFeatures(),
              t.resize(function () {
                e.replaceFeatures(),
                  e.initTabScroll()
              }),
            0 !== $(".page-topbar__tabs .tabs__item").length && e.initTabScroll()
          },
          initTabScroll: function () {
            var e, n, r;
            n = 0, e = 0, r = t.width(),
              $.each($(".page-topbar__tabs .tabs__item"),
                function (t, r) {
                  return n += $(r).outerWidth(),
                    0 === $("a", r).length && 0 === e ? e = $(r) : void 0
                }),
              n += 18,
              n > r ? (
                  /*$(".page-topbar__tabs").css("min-width",n),
                             /* $(".page-topbar-wrapper").css("overflow","auto"),*/
                  setTimeout(function () {
                    n = 0 !== e ? e.offset().left - e.outerWidth() / 2 : 0,
                      $(".page-topbar-wrapper").scrollLeft(n),
                      $(".page-topbar-wrapper").scrollLeft(n)
                  }, 100)) :
                (
                  $(".page-topbar__tabs").removeAttr("style"),
                    $(".page-topbar-wrapper").removeAttr("style")
                )
          }
        },
        e.init()
    }),
    angular.module("App").directive('windowSize', function ($window) {
      return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
          return {
            'h': w.height(),
            'w': w.width()
          };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
          scope.windowHeight = newValue.h;
          scope.windowWidth = newValue.w;
          scope.style = function () {
            return {
              'height': (newValue.h - 100) + 'px',
              'width': (newValue.w - 100) + 'px'
            };
          };
        }, true);

        w.bind('resize', function () {
          scope.$apply();
        });
      }
    }),
    angular.module("App").directive('filterSize', function ($window) {
      return function (scope, element) {
        var w = angular.element($window);
        var f = angular.element('#stagesFilter');
        scope.getWindowDimensions = function () {
          return {
            h: f.height(),
            w: f.width()
          };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
          scope.filterHeight = newValue.h;
          scope.filterWidth = newValue.w;
          scope.style = function () {
            return {
              height: (newValue.h - 100) + 'px',
              width: (newValue.w - 100) + 'px'
            };
          };
        }, true);

        w.bind('resize', function () {
          scope.$apply();
        });
      }
    }),
    angular.module("App").controller("CitySectionStagesController", ["$scope", "$http", "$location", "$window", "$compile", "$filter", "CacheFactory", function (e, t, n, r, a, i, o) {
      var s, c;
      e.filterSizes = {
        tables: 640,
        filolog: 790,
        trud: 940,
        passport: 1065
      };
      e.search = {};
      e.user = window.siteData.user;
      e.limit = 5;
      e.showAll = function () {
        return e.limit = e.stages.length, e.selected = void 0;
      };
      e.showAllStages = function () {
        location.hash = '#/stages';
        e.search = {};
      };
      e.sklonenie = function (n, forms) {
        return sklonenie(n, forms);
      };
      s = null;
      c = null;
      if (/\/stages\/[0-9]+\/$/.test(location.hash)) {
        e.search.geo_id = location.hash.match(/\/stages\/([0-9]+)\/$/)[1];
      }
      e.PanToStage = function (e) {
        location.hash = '#/stages/' + e.geo_id + '/';
        return s.panTo(e.coords);
      };
      r.ymaps.ready(function () {
        var n, a, i, l, customBalloonContentLayout;
        return s = new r.ymaps.Map(angular.element("#city-stages-map")[0], {
          center: [52.650555194, 90.1041272746],
          zoom: 13,
          controls: ['zoomControl']
        }),
          s.events.add('click', function (e) {
            s.balloon.close();
          }),
          customBalloonContentLayout = r.ymaps.templateLayoutFactory.createClass([
            '<div>',
            // Выводим в цикле список всех геообъектов.
            '{% for geoObject in properties.geoObjects %}',
            '<div class="wysiwyg balloonWysiwyg"> <div class="wysiwyg__p wysiwyg__p_s_m">{{ geoObject.properties.name }}</div> <div class="wysiwyg__p wysiwyg__p_s_s wysiwyg__p_meta">{{ geoObject.properties.address }}</div></div>',
            '{% endfor %}',
            '</div>'
          ].join('')),
          l = new r.ymaps.ObjectManager({
            clusterize: true,
            clusterBalloonContentLayout: customBalloonContentLayout
          }),
          i = r.ymaps.templateLayoutFactory.createClass('<div class="cluster-content">$[properties.geoObjects.length]</div>'),
          a = r.ymaps.templateLayoutFactory.createClass('<div class="balloon"> <div class="balloon__content"> $[[options.contentLayout observeSize maxWidth=405 maxHeight=350]] </div> </div>', {
            build: function () {
              this.constructor.superclass.build.call(this);
              this._$element = $(".balloon", this.getParentElement());
              $('.balloon-close').click(function () {
                s.balloon.close();
              });
            },
            clear: function () {
              this.constructor.superclass.clear.call(this);
            },
            onSublayoutSizeChange: function () {
              a.superclass.onSublayoutSizeChange.apply(this, arguments);
              this._isElement(this._$element) && this.events.fire("shapechange");
            },
            getShape: function () {
              var e;
              return this._isElement(this._$element) ? (e = this._$element.position(), new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
                [e.left, e.top],
                [e.left + this._$element[0].offsetWidth, e.top + this._$element[0].offsetHeight]
              ]))) : a.superclass.getShape.call(this);
            },
            _isElement: function (e) {
              return e && e[0]
            }
          }),
          n = r.ymaps.templateLayoutFactory.createClass('<div class="wysiwyg balloonWysiwyg"> <div class="wysiwyg__p wysiwyg__p_s_m">$[properties.name]</div> <div class="wysiwyg__p wysiwyg__p_s_s wysiwyg__p_meta">$[properties.address]</div> <i class="gicon close-14-grey balloon-close"></i></div>'),
          l.objects.options.set({
            iconLayout: "default#image",
            iconImageHref: "/local/templates/main/images/mappoint_new.png",
            iconImageSize: [32, 40],
            iconImageOffset: [-16, -30],
            hideIconOnBalloonOpen: false,
            balloonShadow: false,
            balloonLayout: a,
            balloonContentLayout: n,
            balloonPanelMaxMapArea: 0,
            balloonOffset: [-40, -42]


          }),
          l.objects.events.add("click", function (t) {
            e.$apply(function () {
              var id = t.get("objectId");
              e.search.geo_id = id;
              location.hash = '#/stages/' + id + '/';

              return e.selected = {
                id: id
              }
            })
          }),
          l.clusters.options.set({
            clusterIcons: [{
              href: "/local/templates/main/images/mapcluster.png",
              size: [64, 64],
              offset: [-32, -32]
            }],
            clusterIconContentLayout: i
          }),
          s.geoObjects.add(l), c = {
          type: "FeatureCollection",
          features: []
        },
          /*o("stagesSectionsCache_new", {
                         maxAge: 12e4,
                         deleteOnExpire: "aggressive",
                         storageMode: "localStorage"
                     }),*/
          t.get(r.location.pathname + "stages/", {
            //                cache: o.get("stagesSectionsCache_new")
          }).then(function (t) {
            var map_stages = [];
            var allStages = [];
            $.each(t.data, function (j, item) {
              item.open = angular.isUndefined(item.flags.stage_mode) || item.flags.stage_mode === null;
              map_stages.push(item);
              if (item.sub_stages_length > 0) {
                allStages.push(item);
                $.each(item.sub_stages, function (n, subItem) {
                  allStages.push(subItem);
                });
              } else {
                allStages.push(item);
              }
            });
            /*$.each(t.data.sections, function(i, section){
               if(section.length > 0){
               }
            });*/
            e.allStages = allStages;
            return e.stages = t.data,
              _.map(map_stages, function (e) {
                return e.coords ? c.features.push({
                  id: e.id,
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: e.coords
                  },
                  properties: {
                    name: e.name,
                    address: e.address,
                    href: e.link
                  }
                }) : void 0
              }),
              l.add(c),
              c.features.length > 1 ? s.setBounds(l.getBounds()) : s.setCenter(c.features[0].geometry.coordinates);
          }, function () {
            return console.error("error");
          });
      });
      e.getStageById = function (id) {
        var find = {};
        $.each(e.allStages, function (i, item) {
          if (parseInt(item.id) === parseInt(id)) {
            find = item;
            return false;
          }
        });
        return find;
      };
      e.onStageHover = function (stage) {
        //            console.log('hover');
        //            console.log(stage);
      };
      e.onStageUnhover = function (stage) {
        //            console.log('unhover');
        //            console.log(stage);
      };
    }]),
    DictantListControllerN = function (e, t) {
      e.saving = e.success = !1,
        e.data = {
          personal_year: window.siteData.userForm.birth_year,
          personal_gender: window.siteData.userForm.gender
        },
        e.identificationData = {
          year: 2019,
          stagesError: !1
        },
        e.stages = [],
        e.genders = [{
          id: "",
          name: "Не указан"
        },
          {
            id: "M",
            name: "Мужской"
          },
          {
            id: "F",
            name: "Женский"
          }
        ],
        e.$watch("location.city", function (n) {
          e.stages = [],
          null != n && t.get("/ajax/geo_stages.php", {
            params: {
              city: n,
              year: e.identificationData.year
            }
          }).then(function (t) {
            e.stages = t.data,
              e.identificationData.stagesError = !0
          })
        }),
        e.occupations = [{
          id: 1,
          name: "Работаю"
        }, {
          id: 2,
          name: "Учусь"
        },
          {
            id: 3,
            name: "Учусь и подрабатываю"
          }, {
            id: 4,
            name: "Безработный, домохозяйка"
          },
          {
            id: 5,
            name: "На пенсии"
          }
        ],
        e.educations = [{
          id: 1,
          name: "Неполное среднее"
        },
          {
            id: 2,
            name: "Среднее, среднее специальное"
          },
          {
            id: 3,
            name: "Неоконченное высшее"
          },
          {
            id: 4,
            name: "Высшее"
          }, {
            id: 5,
            name: "Ученая степень"
          }
        ],
        e.participations = [{
          id: 1,
          name: "Впервые"
        },
          {
            id: 2,
            name: "Один раз"
          },
          {
            id: 3,
            name: "Два раза"
          },
          {
            id: 4,
            name: "Три раза и более"
          }
        ],
        e.steps = [{
          name: "Кодовое слово",
          active: !0,
          disabled: !1
        },
          {
            name: "Об участнике",
            disabled: !0
          },
          {
            name: "Оценка",
            disabled: !0
          }
        ],
        e.changeStep = function (t) {
          return t.disabled || t.completed ? void 0 : (_.each(e.steps, function (e) {
            e.active = !1
          }), t.active = !0)
        },
        e.submitDetailsForm = function () {
          var n;
          e.saving = !0,
            n = angular.copy(e.data),
            n.uf_billboard = n.uf_billboard ? "Афиша" : "",
            n.uf_media = n.uf_media ? "СМИ" : "",
            n.uf_social_network = n.uf_social_network ? "Социальные сети" : "",
            n.uf_friends = n.uf_friends ? "Друзья или родственники" : "",
            n.uf_manager = n.uf_manager ? "Руководитель или преподаватель" : "",
            t.post(window.location.pathname, n).then(function (t) {
              return e.saving = !1,
                t.data.is_succes ? (e.success = t.data.is_succes,
                  e.steps[1].completed = !0,
                  e.steps[2].disabled = !1,
                  e.changeStep(e.steps[2])) : void 0
            })
        }
    },
    DictantListControllerN.$inject = ["$scope", "$http"],
    angular.module("App").controller("DictantListController", DictantListControllerN)

}).call(this);
//# sourceMappingURL=application.min.js.map
