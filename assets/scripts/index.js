let isTouchDevice = navigator.userAgent.match(
  /(iPhone|iPod|iPad|Android|BlackBerry|Windows Phone)/
);
let iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
let scorm = parent.lms != undefined ? true : false;

let pagesScorm = new Array(),
  namePage,
  dados = "";

// ADD ZERO
function addZero(n) {
  return n < 10 ? "0" + n : "" + n;
}

// RANDOM WITH BLACKLIST
function getRandomExclude(min, max, blacklist) {
  blacklist = Array.isArray(blacklist) ? blacklist : [blacklist];
  let num = Math.floor(Math.random() * (max - min + 1)) + min;
  return blacklist.includes(num) ? getRandomExclude(min, max, blacklist) : num;
}

// Calcula Porcentagem
function calcPercByNumber(num, per) {
  return Math.round((num / per) * 100) + "%";
}
function calcPercByPerc(num, per) {
  return (num / 100) * per;
}

// GET VALUE BY KEY
function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

$.fn.scrollEnd = function (callback, timeout) {
  $(this).scroll(function () {
    var $this = $(this);

    if ($this.data("scrollTimeout")) {
      clearTimeout($this.data("scrollTimeout"));
    }

    $this.data("scrollTimeout", setTimeout(callback, timeout));
  });
};

function Container() {
  _this = this;

  $.getJSON("data/curso.json", function (data) {
    carregaData(data);
  });

  function saveScorm() {
    if (parent.lms) {
      parent.lms.suspend_data.set(pagesScorm);
    }

    let pageViews = 0;
    $.each(pagesScorm, function (i, v) {
      if (v == 1) {
        pageViews++;
      }
    });

    if (pageViews == pagesScorm.length) {
      if (parent.lms) {
        parent.lms.lesson_status.set("completed");
      }
    }
  }

  function iniciaScorm() {
    if (parent.lms) {
      let stringSeta = parseInt(qualPage).toString();
      let paginaSalva = parent.lms.lesson_location.get();

      if (stringSeta > paginaSalva) {
        parent.lms.lesson_location.set(stringSeta);
      }

      if (parent.lms.suspend_data.get() != "null") {
        console.log("data from scorm");
        dados = parent.lms.suspend_data.get();
      }
    }

    if (
      dados != null &&
      dados != undefined &&
      dados != "undefined" &&
      dados != ""
    ) {
      pagesScorm = dados.split(",");
    } else {
      for (i = 0; i < pageNames.length; i++) {
        pagesScorm.push(0);
      }
    }
  }

  let qualPage,
    pageNames = new Array();

  function carregaData(data) {
    _this.template = data.curso.template;
    _this.menu = data.curso.menu;
    _this.loader = data.curso.loader;

    if (!_this.loader) {
      $("body").removeClass("overflow");
      $(".loadingContent").fadeOut(100);
    } else {
      _this.preloadContent();
    }

    $("body").addClass(_this.template);
    $('#changeTemplate option[value="' + _this.template + '"]').attr(
      "selected",
      true
    );

    if (_this.menu != "") {
      _this.menuInterno();
    } else {
      _this.telas = data.curso.conteudo.telas;
      $.each(_this.telas, function (i, val) {
        pageNames.push(val.url);
        $(".ulMenu").append(
          '<li><a id="btnMenu' +
            i +
            '" href="' +
            val.url +
            '">' +
            val.titulo +
            "</a></li>"
        );
      });
      selecionaMenuAtivo();
    }
  }

  // MENU POSITION
  function clickMenuPosition(e) {
    //console.log($(this));
    e.preventDefault();
    $(window).trigger("menuToggle");

    $(".lnkMenu").parent().removeClass("active");
    $(".lnkMenu").off().on("click", clickMenuPosition);
    $(this).off().parent().addClass("active");

    btnIndex = $(this).index(".lnkMenu");
    $("html, body").animate(
      { scrollTop: Number(Math.round(menuPosition[btnIndex])) },
      1000
    );
  }

  function selecionaMenuPosition() {
    clearTimeout($.data(this, "scrollTimer"));
    var eqBtn;

    var scrollHeight = $(document).height();
    var scrollPosition = $(window).height() + $(window).scrollTop();
    var endPosition = false;
    if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
      endPosition = true;
    }

    $.each(menuPosition, function (i, e) {
      var alt = $(window).scrollTop();

      if ([i + 1] == menuPosition.length) {
        if (alt >= menuPosition[i]) {
          eqBtn = i;
        }
      } else {
        if (alt >= menuPosition[i] && alt < menuPosition[i + 1]) {
          eqBtn = i;
        }
      }
    });

    if (eqBtn == undefined) {
      eqBtn = 0;
    }

    $.data(
      this,
      "scrollTimer",
      setTimeout(function () {
        $(".lnkMenu")
          .off()
          .on("click", clickMenuPosition)
          .parent()
          .removeClass("active");

        if (endPosition) {
          $(".lnkMenu").last().off().parent().addClass("active");
          endPosition = false;
        } else {
          $(".lnkMenu").eq(eqBtn).off().parent().addClass("active");
        }
      }, 100)
    );
  }

  $(window).scrollEnd(function () {
    selecionaMenuPosition();
  }, 10);

  function resizeMenuPosition() {
    menuPosition = new Array();
    $(_this.menu).each(function (i, val) {
      menuPosition.push(
        $(this).offset().top - $("header").outerHeight(true) - 10
      );
    });
  }
  $(window).resize(function (e) {
    resizeMenuPosition();
  });

  // MENU CARREGADO
  function selecionaMenuAtivo() {
    let sURL = window.location.pathname,
      arrayURL = sURL.split("/");
    namePage = arrayURL[arrayURL.length - 1];

    qualPage = jQuery.inArray(namePage, pageNames);

    if (scorm) {
      $(".ulMenu").find("li").css("opacity", "0.5");
      $(".ulMenu").find("li").css("pointer-events", "none");

      iniciaScorm();

      $(".ulMenu")
        .find("li")
        .each(function (index, value) {
          if (index <= qualPage || pagesScorm[index] == 1) {
            $(this).css({ opacity: "1", "pointer-events": "auto" });
          }
        });

      pagesScorm[qualPage] = 1;
      saveScorm();
    }

    controlaNavegacao();
  }

  // BOTAO MENU
  let flagMenu = false;
  $(".botaoMenu").bind("click", function (e) {
    //console.log('ENTER')
    e.preventDefault();
    $(window).trigger("menuToggle");
  });
  $(window).bind("menuToggle", function () {
    $(".botaoMenu").toggleClass("ativo");
    abreMenu();
  });

  function abreMenu() {
    if (!flagMenu) {
      $("nav").removeClass("menu-fechado").addClass("menu-aberto");
      $("body").addClass("overflow");
      flagMenu = true;
    } else {
      $("nav").removeClass("menu-aberto").addClass("menu-fechado");
      $("body").removeClass("overflow");
      flagMenu = false;
    }
  }

  function fechaMenu(e) {
    e.preventDefault();

    if (e.target.getAttribute("href")) {
      window.location = e.target.href;
    } else {
      $(this).off("click");
      $(window).trigger("menuToggle");

      setTimeout(function () {
        $(".menuBG, .conteudoMenu").off().on("click", fechaMenu);
      }, 350);
    }
  }
  $(".menuBG, .conteudoMenu").on("click", fechaMenu);

  // CONTROLA NAVEGAÇÃO
  function controlaNavegacao() {
    let prevPage, nextPage;

    if (qualPage == 0) {
      $('.setaNavegacao[data-page="ant"]').attr("disabled", "disabled");
      nextPage = pageNames[qualPage + 1].split(".");
      abrePagina({
        item: '.setaNavegacao[data-page="prox"]',
        page: nextPage[0],
      });
    } else if (qualPage == pageNames.length - 1) {
      $('.setaNavegacao[data-page="prox"]').attr("disabled", "disabled");
      prevPage = pageNames[qualPage - 1].split(".");
      abrePagina({
        item: '.setaNavegacao[data-page="ant"]',
        page: prevPage[0],
      });
    } else {
      prevPage = pageNames[qualPage - 1].split(".");
      nextPage = pageNames[qualPage + 1].split(".");
      abrePagina({
        item: '.setaNavegacao[data-page="ant"]',
        page: prevPage[0],
      });
      abrePagina({
        item: '.setaNavegacao[data-page="prox"]',
        page: nextPage[0],
      });
    }

    // CONTROLE POR TECLADO
    $(document).bind("keyup", function (evt) {
      if (evt.ctrlKey && evt.shiftKey && evt.keyCode == 37) {
        if (qualPage == 0) {
          $.noop();
        } else {
          abrePagina({ page: prevPage[0] });
        }
      } else if (evt.shiftKey && evt.ctrlKey && evt.keyCode == 39) {
        if (qualPage == pageNames.length) {
          $.noop();
        } else {
          abrePagina({ page: nextPage[0] });
        }
      }
    });
  }
}

Container.prototype.preloadContent = function (type, data) {
  let $content = $("body");
  let $images = $content.find("img").add($content.filter("img"));
  let queue = new createjs.LoadQueue(true);
  let propsLoaded = [];

  queue.on("fileload", handleFileLoaded);

  $content.find("*").each(function (index, element) {
    let bg = $(this).css("background-image");

    if (
      bg !== "" &&
      bg.indexOf("linear-gradient") == -1 &&
      bg !== "none" &&
      bg.indexOf("svg+xml") == -1
    ) {
      bg = bg.replace("url(", "").replace(")", "").split('"').join("");

      let img = new Image();
      img.src = bg;

      $image = { id: "bgImg_" + index, src: bg };
      queue.loadFile($image);
    }
  });

  $images.each(function (index, el) {
    $image = { id: "img_" + index, src: this.src };
    $id = "img_" + index;
    $div = $("<div>").attr("id", $id);

    let attributes = $(el).prop("attributes"),
      arrAttr = [];
    $.each(attributes, function () {
      if (this.name != "src") {
        nome = this.name;
        valor = this.value;

        arrAttr.push({ nome, valor });
      }
    });

    propsLoaded.push({ id: $id, attr: arrAttr });
    $(el).wrap($div);

    queue.loadFile($image);
  });

  function handleFileLoaded(event) {
    let result = event.result,
      item = event.item,
      id = item.id,
      myObj = propsLoaded.findIndex(function (key) {
        return key.id == id;
      });

    let imgWrap = document.getElementById(id);
    if (imgWrap == null) {
      return;
    }

    switch (item.type) {
      case createjs.Types.IMAGE:
        imgWrap.innerHTML = "";
        imgWrap.appendChild(result);

        $.each(propsLoaded[myObj].attr, function (i, v) {
          $(result).attr(v.nome, v.valor);
        });

        $(result).unwrap();

        break;
    }
  }

  queue.on(
    "complete",
    function (event) {
      //console.log(propsLoaded);
      $("body").removeClass("overflow");
      $(".loadingContent").fadeOut(600, function () {
        // $('body').addClass('animaConteudo').trigger('classChange');
      });
    },
    this
  );

  if ($images.length == 0) {
    $("body").removeClass("overflow");
    $(".loadingContent").fadeOut(600);
  }
};

Container.prototype.menuInterno = function (type, data) {
  let _this = this;
  menuPosition = new Array();

  $(".ulMenu").empty();

  $(_this.menu)
    .not(".notListed")
    .each(function (i, val) {
      $a = $("<a>")
        .attr("id", "btnMenu" + i)
        .attr("href", "javascript:void(0)")
        .addClass("lnkMenu")
        .html($(this).html())
        .on("click", clickMenuPosition);
      $li = $("<li>").append($a);
      $(".ulMenu").append($li);
      // menuPosition.push(
      //   $(this).offset().top - $("header").outerHeight(true) - 10
      // );
    });

  alturaMenuPosition();

  selecionaMenuPosition();

  function alturaMenuPosition(e) {
    let elementoMenu = document.querySelectorAll(
      _this.menu + ":not(.notListed)"
    );

    if (menuPosition == "") {
      for (let index = 0; index < elementoMenu.length; index++) {
        menuPosition.push(elementoMenu[index].parentElement.offsetTop);
      }
    }
  }

  // MENU POSITION
  function clickMenuPosition(e) {
    // console.log($(this));
    e.preventDefault();
    $(window).trigger("menuToggle");

    $(".lnkMenu").parent().removeClass("active");
    $(".lnkMenu").off().on("click", clickMenuPosition);
    $(this).off().parent().addClass("active");

    btnIndex = $(this).index(".lnkMenu");

    menuPosition = new Array();
    alturaMenuPosition();

    $("html, body").animate(
      {
        scrollTop: Number(
          Math.round(menuPosition[btnIndex]) - $("header").outerHeight(true)
        ),
      },
      1000
    );
  }

  function selecionaMenuPosition() {
    clearTimeout($.data(this, "scrollTimer"));
    var eqBtn;

    var scrollHeight = $(document).height();
    var scrollPosition = $(window).height() + $(window).scrollTop();
    var endPosition = false;
    if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
      endPosition = true;
    }

    $.each(menuPosition, function (i, e) {
      var alt = $(window).scrollTop() + $("header").outerHeight(true);

      if ([i + 1] == menuPosition.length) {
        if (alt >= menuPosition[i]) {
          eqBtn = i;
        }
      } else {
        if (alt >= menuPosition[i] && alt < menuPosition[i + 1]) {
          eqBtn = i;
        }
      }
    });

    if (eqBtn == undefined) {
      eqBtn = 0;
    }

    $.data(
      this,
      "scrollTimer",
      setTimeout(function () {
        $(".lnkMenu")
          .off()
          .on("click", clickMenuPosition)
          .parent()
          .removeClass("active");

        if (endPosition) {
          $(".lnkMenu").last().off().parent().addClass("active");
          endPosition = false;
        } else {
          $(".lnkMenu").eq(eqBtn).off().parent().addClass("active");
        }
      }, 100)
    );
  }

  $(window).scrollEnd(function () {
    selecionaMenuPosition();
  }, 10);

  function resizeMenuPosition() {
    menuPosition = new Array();
  }
  $(window).resize(function (e) {
    resizeMenuPosition();
  });
};

// LOAD CONTAINER
let container = new Container();

//AOS
AOS.init({
  startEvent: "load",
});
/////////////////

$("#changeTemplate").change(function () {
  let valor = $(this).val();
  $("body").removeAttr("class").attr("class", valor);
});

/////////////////
// FLIPCARD
$(".card-selector .fcard").on("click", function () {
  $(this).toggleClass("active");
});

// PARALLAX
$(".img-parallax").each(function () {
  $image = $(this).data("image");
  $(this).css("background-image", "url(" + $image + ")");
});

// CAROUSEL
$(".carousel").each(function (e) {
  let startCount = $(this).find(".carousel-inner .carousel-item").length,
    startIndex = $(this).find(".carousel-item.active").index();
  $(this)
    .find(".carousel-counter")
    .html(startIndex + 1 + " de " + startCount);

  //////////////////////////

  myCarousel = document.querySelector("#" + $(this).attr("id"));
  carousel = new bootstrap.Carousel(myCarousel, {
    interval: false,
  });
  myCarousel.addEventListener("slid.bs.carousel", function (e) {
    let slidesCount = $(this).find(".carousel-inner .carousel-item").length,
      activeIndex = $(this).find(".carousel-item.active").index();

    $(this)
      .find(".carousel-counter")
      .html(activeIndex + 1 + " de " + slidesCount);
  });
});

// SLIDER IMAGE
$(".juxtapose").each(function (index, element) {
  var $juxtaposeContainer = $(this).parent();
  var juxtaposeRatio;

  $(window).on("load", function (event) {
    juxtaposeRatio = $(element).outerHeight() / $(element).outerWidth();
  });

  $(window).on("resize", function (event) {
    var newWidth = $juxtaposeContainer.outerWidth();
    var newHeight = newWidth * juxtaposeRatio;
    $(element).css({ width: newWidth, height: newHeight });
  });
});

// TIMELINE VERTICAL
$(".verticalTimeline")
  .find("li")
  .on("click", function () {
    $(this).addClass("selected");
  });

// TIMELINE HORIZONTAL
if ($(".horizontalTimeline").length != 0) {
  $(".horizontalTimeline").timeline();
}

// SVG
if ($(".svgInterativo").length != 0) {
  $(".svgInterativo").svgLoader();
}

// LEITORES DE TELA
$(".leitorTela").attr("tabindex", "0").attr("aria-hidden", "false");
$(".wrapper")
  .find("h1, h2, h3, h4, p, li")
  .not(".visuallyhidden, .nav-item, .noTabindex")
  .attr("tabindex", "0")
  .attr("role", "text");

// VIDEO ( SET VOLUME )
$(".video-js").each(function (i, v) {
  let videoId = $(this).attr("id"),
    options = {
      controlBar: {
        children: [
          "playToggle",
          "progressControl",
          "volumePanel",
          "qualitySelector",
          "subsCapsButton",
          "fullscreenToggle",
        ],
      },
    };

  videojs(videoId, options).volume(0.3);
});

// ESCONDE E MOSTRA HEADER SCROLL
var prevScrollpos = window.pageYOffset;
window.addEventListener("scroll", function () {
  let currentScrollPos = window.pageYOffset;
  let topo = document.querySelector(".headerAnimado");

  if (topo == null) return;

  if (prevScrollpos < currentScrollPos) {
    topo.style.top = -topo.offsetHeight + "px";
  } else {
    topo.style.top = "0";
  }

  prevScrollpos = currentScrollPos;
});

//DEFINI PRA ONDE DAR SCROLL CONFORME O data-scroll
function scrollTo(objeto, headerFixed, tempoAnima = 800) {
  if (headerFixed) headerHeigth = $("header").height() + 10;
  else headerHeigth = 0;

  let scrollToElement = $(objeto).offset().top - headerHeigth;
  $("html, body")
    .stop(true, true)
    .animate({ scrollTop: scrollToElement }, tempoAnima);
}

$("#btnScroll").on("click", function (e) {
  scrollTo("#secBotoes", true, 800);

  nomeElem = "#secBotoes";
  setFocus(nomeElem);
});

//SETA O FOCO NO ELEMENTO PASSADO - ACESSIBILIDADE
function setFocus(elemento) {
  $(elemento).attr("tabindex", 1);
  $(elemento)[0].focus({ preventScroll: true });
  //elemento.setAttribute("tabindex", 1);
  //elemento.focus({ preventScroll: true });
  console.log(document.activeElement);
}

// ABRE PAGINA
function abrePagina(param) {
  (item = param.item),
    (page = param.page),
    (funcao = param.func),
    (target = param.target);

  $(item).on("click", function () {
    if (funcao) funcao();

    if (target) {
      window.open(page + ".html");
    } else {
      window.location.href = page + ".html";
    }
  });
}

// Let the document know when the mouse is being used
document.body.addEventListener("mousedown", function () {
  document.body.classList.remove("using-keyboard");
});

document.body.addEventListener("keydown", function (evt) {
  document.body.classList.add("using-keyboard");

  // let keyPressed = evt.which || evt.keyCode;
  // if (keyPressed === 9) {
  // 	document.body.classList.add('using-keyboard');
  // }
});
