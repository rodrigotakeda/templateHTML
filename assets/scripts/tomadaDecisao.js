(function ($) {
  $.fn.tomadaDecisao = function (options) {
    let defaults = {
      randomAlternativa: false,
      imagemLateral: false,
      feedbackIcone: true,
      feedbackQuestao: true,
      feedbackPopup: false,
      botaoProxima: false,
      questaoInicial: null,
      maximoQuestoes: null,
      letters: "letras",
      quizFile: "assets/data/quiz.json",
      tipo: "tomada",
      scorm: false,
    };
    defaults = $.extend({}, defaults, options);

    // ADD ZERO
    function addZero(n) {
      return n <= 9 ? "0" + n : n;
    }

    // SORTEIO DE ARRAY
    Array.prototype.shuffleArray = function () {
      return this.sort(function () {
        return Math.random() - 0.5;
      });
    };

    // CONVERSAO DE TEMPO
    String.prototype.toHHMMSS = function () {
      let sec_num = parseInt(this, 10),
        hours = Math.floor(sec_num / 3600),
        minutes = Math.floor((sec_num - hours * 3600) / 60),
        seconds = sec_num - hours * 3600 - minutes * 60;

      if (hours < 10) {
        hours = "000" + hours;
      }
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      if (seconds < 10) {
        seconds = "0" + seconds;
      }

      let time = hours + ":" + minutes + ":" + seconds;

      return time;
    };

    let inLMS = false,
      dataInicio = 0,
      dataLms = {
        lessonLocation: 1,
        lessonStatus: "incomplete",
        sessionTime: "",
        scoreRaw: 0,
        suspendData: "",
      };

    return this.each(function () {
      let _this = $(this),
        z = _this.index(".quiz");

      let ajaxLoader = $.getJSON(defaults.quizFile)
        .done(function (data) {
          if (defaults.scorm) {
            inLMS = pipwerks.SCORM.init() ? true : false;

            dataInicio = new Date();

            if (inLMS) {
              let _lessonLocation = pipwerks.SCORM.get(
                "cmi.core.lesson_location"
              );
              if (
                _lessonLocation !== null &&
                _lessonLocation !== undefined &&
                _lessonLocation !== "null" &&
                _lessonLocation !== "undefined" &&
                _lessonLocation !== ""
              ) {
                dataLms.lessonLocation = pipwerks.SCORM.get(
                  "cmi.core.lesson_location"
                );
              } else {
                dataLms.lessonLocation = "";
              }

              let _lessonStatus = pipwerks.SCORM.get("cmi.core.lesson_status");
              if (
                _lessonStatus !== null &&
                _lessonStatus !== undefined &&
                _lessonStatus !== "null" &&
                _lessonStatus !== "undefined" &&
                _lessonStatus !== ""
              ) {
                dataLms.lessonStatus = pipwerks.SCORM.get(
                  "cmi.core.lesson_status"
                );
              } else {
                dataLms.lessonStatus = "";
              }

              let _suspendData = pipwerks.SCORM.get("cmi.suspend_data");
              if (
                _suspendData !== null &&
                _suspendData !== undefined &&
                _suspendData !== "null" &&
                _suspendData !== "undefined" &&
                _suspendData !== ""
              ) {
                dataLms.suspendData = pipwerks.SCORM.get("cmi.suspend_data");
              } else {
                dataLms.suspendData = "";
              }
            }
          }

          carregaData(data);
        })
        .fail(function () {
          console.log("Load File Error");
        });

      function carregaData(data) {
        _this.data = data;
        _this.totalQuestoes = null;

        switch (defaults.letters) {
          case "numeros":
            letters = "123456789".split("");
            break;
          case "letras":
            letters = "ABCDEFGHI".split("");
            break;
          case "romanos":
            letters = "I,II,III,IV,V,VI,VII,VIII,IX,X".split(",");
            break;
          default:
            letters = "ABCDEFGHI".split("");
        }

        renderGeneralTemplate();

        switch (defaults.tipo) {
          case "tomada":
            renderTemplate_Tomada();
            break;
          default:
            renderTemplate_Tomada();
        }
      }

      function renderGeneralTemplate() {
        // QUESTOES
        $questaosLoaded = $("<div>")
          .attr("id", "questaosLoaded_" + z)
          .addClass("questaoLoaded");
        _this.html($questaosLoaded);

        /////////////
        // RANDOM QUESTOES
        if (getVarSuspendData("entrada") != "") {
          dataEntrada = getVarSuspendData("entrada").split("|");
          dataSorteio = dataEntrada[0].split(",");
          _this.arraySorted = new Array();
          $.each(dataSorteio, function (i, v) {
            _this.arraySorted.push(_this.data.questoes[v - 1]);
          });
          _this.totalQuestoes = Number(dataEntrada[1]);
          _this.altSorteio = dataEntrada[2].split("!");
          defaults.imagemLateral = Boolean(
            JSON.parse(dataEntrada[3].toString().toLowerCase())
          );
          defaults.botaoProxima = Boolean(
            JSON.parse(dataEntrada[4].toString().toLowerCase())
          );
          defaults.feedbackIcone = Boolean(
            JSON.parse(dataEntrada[5].toString().toLowerCase())
          );
          defaults.feedbackQuestao = Boolean(
            JSON.parse(dataEntrada[6].toString().toLowerCase())
          );
        } else {
          _this.arraySorted = new Array();
          for (i = 0; i < _this.data.questoes.length; i++) {
            _this.arraySorted.push(_this.data.questoes[i]);
          }

          saveId = new Array();
          $.each(_this.arraySorted, function (i, v) {
            saveId.push(v.id);
          });
          _this.sorteioQuestoes = saveId;

          if (defaults.questaoInicial != null) {
            _this.arraySorted.splice(0, defaults.questaoInicial);
          }

          // VERIFICA SE TEM MAXIMO DE QUESTOES A SEREM DISPONIBILIZADAS
          if (defaults.maximoQuestoes != null)
            _this.totalQuestoes = defaults.maximoQuestoes;
          else _this.totalQuestoes = _this.arraySorted.length;
        }
      }

      ////////////////////////////////////////////////

      function renderTemplate_Tomada() {
        data = _this.data;
        _this.removeAttr("class").addClass("tomada").addClass("templateTomada");

        saveAlts = new Array();

        for (let i = 0; i != _this.totalQuestoes; i++) {
          questao = _this.arraySorted[i];

          $questaoWrapper = $("<div>").addClass("questao-wrapper");
          if (questao.introducao != "") {
            $introContent = $("<h3>").html(questao.introducao);
            $questaoWrapper.append($introContent);
          }
          if (questao.pergunta != "") {
            $questaoWrapper.append(questao.pergunta);
          }

          $audioPlayer = $("<audio>")
            .attr("src", "files/audio/" + questao.audio + ".mp3")
            .attr("data-title", questao.audio_texto)
            .attr("data-descricao", "")
            .attr("data-function", "pod_" + (i + 1))
            .attr("preload", "auto")
            .attr("id", "audioP" + (i + 1));
          $divAudioPlayer = $("<div>")
            .addClass("audio-player")
            .attr("id", "audioPlayer_" + (i + 1))
            .html($audioPlayer);

          imagemAudio = questao.audio_imagem;
          if (imagemAudio) {
            $imgAudio = $("<img>")
              .addClass("img-fluid")
              .attr("src", "files/images/" + questao.audio_imagem)
              .attr("aria-labelledby", "img" + i);
            $colImgAudio = $("<div>")
              .addClass("col-12 col-lg-4")
              .addClass("image-audio")
              .html($imgAudio);
            $colAltImage = $("<div>")
              .addClass("leitorTela")
              .attr("id", "img" + i)
              .html(questao.altImage);
            $colContentAudio = $("<div>")
              .addClass("col-12 col-lg-8")
              .addClass("content-audio")
              .html($divAudioPlayer);

            $colImgAudio.append($colAltImage);
            $colAudio = $("<div>")
              .addClass("row row-audio align-items-center")
              .html($colImgAudio)
              .append($colContentAudio);
            $questaoWrapper.append($colAudio);
          } else {
            $questaoWrapper.append($divAudioPlayer);
          }

          audioFunc["pod_" + (i + 1)] = function () {
            $("#questao-content_" + (i + 1)).slideDown(600);
            $("html, body").animate(
              {
                scrollTop:
                  $("#questao-content_" + (i + 1)).offset().top -
                  $("header").height(),
              },
              1000
            );
          };

          $divQuestao = $("<div>")
            .addClass("questao-content")
            .attr("id", "questao-content_" + (i + 1));
          $colNumPergunta = $("<div>")
            .addClass("numero-questao")
            .html("<p>" + (i + 1) + "</p>");
          $colTextPergunta = $("<div>")
            .addClass("pergunta-questao")
            .html("<p>Qual é sua resposta?</p>");
          $rowPergunta = $("<div>")
            .addClass("row")
            .addClass("pergunta-wrapper")
            .addClass("align-items-center")
            .html($colNumPergunta)
            .append($colTextPergunta);
          $divQuestao.append($rowPergunta);

          imagemLateral = defaults.imagemLateral;
          if (imagemLateral) {
            if (questao.imageInterativa) {
              $botaoDica = $("<button>")
                .addClass("btn-padrao")
                .attr("type", "button")
                .html("Precisa revisar suas anotações? Clique aqui!")
                .attr("data-bs-toggle", "modal")
                .attr("data-bs-target", "#modalF" + (i + 1));

              $modalBody = $("<div>").addClass("modal-body");
              $buttonFechar = $("<button>")
                .addClass("btn-close")
                .attr("data-bs-dismiss", "modal")
                .attr("aria-label", "Close");
              $modalHeader = $("<div>")
                .addClass("modal-header sem-imagem")
                .html($buttonFechar);
              $modalContent = $("<div>")
                .addClass("modal-content")
                .html($modalHeader)
                .append($modalBody);
              $modalDialog = $("<div>")
                .addClass("modal-dialog modal-dialog-centered")
                .html($modalContent);
              $modal = $("<div>")
                .addClass("modal fade")
                .attr("aria-hidden", true)
                .html($modalDialog);

              $modalTitleF = $("<h5>")
                .addClass("modal-title")
                .attr("id", "titleModalF" + (i + 1))
                .html("Anotações");
              $modal
                .attr("id", "modalF" + (i + 1))
                .attr("aria-labelledby", "titleModalF" + (i + 1));
              $modal.find(".modal-header").prepend($modalTitleF);
              $modal.find(".modal-body").append(questao.imageInterativa);
              $("body").append($modal);

              $colLateral = $("<div>")
                .addClass("col")
                .addClass("image-wrapper")
                .html($botaoDica);
            } else {
              $imgLateral = $("<img>")
                .addClass("img-fluid")
                .attr("src", "files/images/quiz/" + questao.image);
              $colLateral = $("<div>")
                .addClass("col")
                .addClass("image-wrapper")
                .addClass("image-bigger")
                .html($imgLateral);
            }

            $wrapperAlternativas = $("<div>")
              .addClass("col")
              .addClass("alternativasImage-wrapper");
            $rowLateral = $("<div>")
              .addClass("row")
              .addClass("row-image-alternativa")
              .addClass("align-items-stretch")
              .html($colLateral)
              .append($wrapperAlternativas);
            $divQuestao.append($rowLateral);
          } else {
            $wrapperAlternativas = $questaoWrapper;
          }

          if (_this.altSorteio != undefined) {
            alt_vez = _this.altSorteio[i].split(",");
            alt_temp = new Array();
            $.each(alt_vez, function (f, val) {
              alt_temp.push(questao.alternativas[val]);
            });
            questao.alternativasSorteadas = alt_temp;
          } else {
            randomAlternativa = defaults.randomAlternativa;
            if (randomAlternativa) {
              alt_temp = new Array();
              alt_numTemp = new Array();
              for (j = 0; j < questao.alternativas.length; j++) {
                alt_numTemp.push(j);
              }
              alt_numTemp.shuffleArray();
              saveAlts.push(alt_numTemp);

              $.each(alt_numTemp, function (f, val) {
                alt_temp.push(questao.alternativas[val]);
              });
              questao.alternativasSorteadas = alt_temp;
            } else {
              alt_numTemp = new Array();
              for (j = 0; j < questao.alternativas.length; j++) {
                alt_numTemp.push(j);
              }
              saveAlts.push(alt_numTemp);

              questao.alternativasSorteadas = questao.alternativas;
            }
          }

          for (let n = 0; n != questao.alternativasSorteadas.length; n++) {
            questao.alternativasSorteadas[n].letter = letters[n];

            $colLetterAlternativa = $("<div>")
              .addClass("col")
              .attr("role", "radio")
              .attr("aria-checked", false)
              .addClass("alternativa-letter")
              .html("<p>" + letters[n] + "</p>")
              .data("feed", questao.alternativasSorteadas[n].feed)
              .data("feedFinal", questao.alternativasSorteadas[n].feedFinal)
              .data("questao", questao.alternativasSorteadas[n].questao);
            $colContentAlternativa = $("<div>")
              .addClass("col")
              .addClass("alternativa-content")
              .html(questao.alternativasSorteadas[n].text);
            $rowAlternativa = $("<div>")
              .addClass("row")
              .attr("role", "radiogroup")
              .addClass("alternativas-wrapper")
              .html($colLetterAlternativa)
              .append($colContentAlternativa);

            if (defaults.feedbackIcone) {
              $colIconAlternativa = $("<div>")
                .addClass("col")
                .addClass("icon-feedback")
                .html(
                  '<div class="icon-certo"></div><div class="icon-errado"></div><div class="icon-neutro"></div'
                );
              $rowAlternativa.prepend($colIconAlternativa);
            }

            $wrapperAlternativas.append($rowAlternativa);
          }

          $buttonConfirmar = $("<button>")
            .addClass("btnConfirmar")
            .html("Confirmar");
          $colButtonBorder = $("<div>")
            .addClass("col")
            .addClass("button-content")
            .html($buttonConfirmar);
          $rowButtonWrapper = $("<div>")
            .addClass("row")
            .addClass("button-wrapper")
            .html($colButtonBorder);
          $divQuestao.append($rowButtonWrapper);

          $questaoWrapper.append($divQuestao);

          $contentQuestao = $("<section>")
            .attr("id", "sectionQuestao-" + addZero(z) + "_" + addZero(i + 1))
            .addClass("content-wrapper")
            .addClass("hidden")
            .html($questaoWrapper);

          if (defaults.botaoProxima) {
            $contentQuestao.addClass("content-fade");
          } else {
            $contentQuestao.addClass("completo");
          }

          if (imagemLateral) {
            $contentQuestao.addClass("quiz-imagem");
          }

          if (defaults.feedbackQuestao) {
            if (defaults.feedbackPopup) {
              $modalBody = $("<div>").addClass("modal-body");
              $buttonFechar = $("<button>")
                .attr("type", "button")
                .addClass("btn-close")
                .attr("data-bs-dismiss", "modal")
                .attr("aria-label", "Close");
              $modalHeader = $("<div>")
                .addClass("modal-header")
                .addClass("title-solo")
                .html($buttonFechar);
              $modalContent = $("<div>")
                .addClass("modal-content")
                .html($modalHeader)
                .append($modalBody);
              $modalDialog = $("<div>")
                .addClass("modal-dialog modal-dialog-centered")
                .html($modalContent);
              $modal = $("<div>")
                .addClass("modal fade modalFeed")
                .attr("aria-hidden", true)
                .html($modalDialog);

              $.each(questao.feedbacks, function (obj, val) {
                $modalF = $modal.clone();
                $modalF
                  .attr("id", "modal" + (i + 1) + "_" + obj)
                  .attr("aria-labelledby", "titleModal" + (i + 1) + "_" + obj);
                $modalF
                  .find(".modal-header")
                  .append('<h5 class="modal-title">O que aconteceu?</h5>');
                $modalF.find(".modal-body").append(val);
                $contentQuestao.append($modalF);
              });
            } else {
              $contentFeedPositivo = $("<div>")
                .addClass("feedback-wrapper")
                .addClass("feedback-positivo")
                .addClass("hidden")
                .html();
              $contentFeedNegativo = $("<div>")
                .addClass("feedback-wrapper")
                .addClass("feedback-negativo")
                .addClass("hidden")
                .html(questao.feedbacks.incorreto);
              $contentFeedNeutro = $("<div>")
                .addClass("feedback-wrapper")
                .addClass("feedback-neutro")
                .addClass("hidden")
                .html(questao.feedbacks.neutro);
              $contentQuestao
                .append($contentFeedPositivo)
                .append($contentFeedNegativo)
                .append($contentFeedNeutro);
            }
          }

          _this.find("#questaosLoaded_" + z).append($contentQuestao);

          // questaoS
          questao.num = addZero(i + 1);
          questao.elementId =
            "#sectionQuestao-" + addZero(z) + "_" + questao.num;
          questao.existIntro = questao.introducao != "";
        }

        _this.audioLoader();

        saveAlts = saveAlts.join("!");
        _this.sorteioAlternativas = saveAlts;

        montaQuiz();
      }

      // START QUIZ
      function montaQuiz() {
        if (dataLms.suspendData != "") {
          proximaQuestao();
          setData(getVarSuspendData("data"));
        } else {
          setVarSuspendData(
            "entrada",
            _this.sorteioQuestoes +
              "|" +
              _this.totalQuestoes +
              "|" +
              _this.sorteioAlternativas +
              "|" +
              defaults.imagemLateral +
              "|" +
              defaults.botaoProxima +
              "|" +
              defaults.feedbackIcone +
              "|" +
              defaults.feedbackQuestao
          );
          proximaQuestao(1);
        }
      }

      ///////////////////////////////////////////////////////////////
      // PROXIMA QUESTAO
      function proximaQuestao(numero) {
        for (let i = 0; i != _this.totalQuestoes; i++) {
          if (i == Number(numero) - 1) {
            mostraQuestao(_this.arraySorted[i].id);
            return false;
          }
        }
      }

      // SELECIONA QUESTAO DA VEZ
      function getQuestao(id) {
        for (let i = 0; i != _this.totalQuestoes; i++) {
          if (_this.arraySorted[i].id == id) {
            return _this.arraySorted[i];
          }
        }
        return false;
      }

      ///////////////////////////////////////////////////////////////
      // GERAL
      // MOSTRA QUESTÃO / CONFIRMAR
      function mostraQuestao(idQuestao) {
        _this.questao = getQuestao(idQuestao);

        if (_this.questao) {
          $(_this.questao.elementId)
            .removeClass("hidden")
            .hide()
            .delay(200)
            .fadeIn(600);

          let alternativas = $(_this.questao.elementId).find(
            ".alternativas-wrapper"
          );

          if (defaults.tipo == "tomada") {
            alternativas.off().on("click", function () {
              selecionaAlternativa(this, false);
            });
          }
        }

        $(_this.questao.elementId)
          .find(".button-wrapper button")
          .off()
          .on("click", function () {
            confirmarQuestao(idQuestao, true, defaults.botaoProxima);
          });
      }
      function confirmarQuestao(idQuestao, animate, btProxima) {
        if (_this.questao) {
          let alternativas = $(_this.questao.elementId).find(
            ".alternativas-wrapper"
          );

          if (defaults.tipo == "tomada") {
            $.each(alternativas, function (i, v) {
              $(this).off("click").addClass("disabled");

              if ($(this).hasClass("active")) {
                proximaQuestao_Id = $(this)
                  .find(".alternativa-letter")
                  .data("questao");
                feedFinal_Id = $(this)
                  .find(".alternativa-letter")
                  .data("feedFinal");
                feedInterno = $(this).find(".alternativa-letter").data("feed");
                _this.questao.alternativaSelecionada = $(this)
                  .find(".alternativa-letter")
                  .children()
                  .html();
              }
            });

            _this.questao.feedPopup = feedInterno;
          }

          _this.questao.isComplete = true;
          _this.questao.isCorrect = questaoCorreta();

          $(_this.questao.elementId)
            .find(".button-wrapper")
            .find(".btnConfirmar")
            .off("click")
            .css("cursor", "default")
            .hide();
          //$(_this.questao.elementId).find('.button-wrapper').hide();

          let positionFeedbackTop = 0;
          if (defaults.feedbackQuestao) {
            if (defaults.tipo == "tomada") {
              if (defaults.feedbackPopup) {
                $modalId =
                  "modal" + _this.questao.id + "_" + _this.questao.feedPopup;

                $feedPop = $("#" + $modalId);
                $feedPop.detach();
                $feedPop.appendTo("body");

                let modalFeed = new bootstrap.Modal(
                  document.getElementById($modalId)
                );
                modalFeed.show();
              } else {
                //$modalId = 'modal' + _this.questao.id + '_' + _this.questao.feedPopup;

                $(_this.questao.elementId)
                  .find(".feedback")
                  .removeClass("hidden");
                positionFeedbackTop =
                  $(_this).offset().top +
                  +$(_this.questao.elementId).position().top +
                  $(_this.questao.elementId).find(".feedback").position().top -
                  ($("header").height() + 30);
              }
            }
          }

          setVarSuspendData("data", getData());

          if (btProxima) {
            if (feedFinal_Id != "") {
              $buttonProxima = $("<button>")
                .addClass("btnProxima")
                .html("Finalizar")
                .on("click", function () {
                  if (defaults.tipo == "tomada") {
                    $(this).hide();
                    finalizaQuiz(feedFinal_Id);
                  }
                });
            } else {
              $buttonProxima = $("<button>")
                .addClass("btnProxima")
                .html("Próxima Questão")
                .on("click", function () {
                  if (defaults.tipo == "tomada") {
                    $(_this.questao.elementId).fadeOut(600, function () {
                      proximaQuestao(proximaQuestao_Id);

                      positionFeedbackTop =
                        $(".templateTomada").offset().top -
                        ($("header").height() + 30);
                      $("html, body")
                        .stop(true, true)
                        .animate({ scrollTop: positionFeedbackTop }, 1000);
                    });
                  }
                });
            }

            $(_this.questao.elementId)
              .find(".button-content")
              .append($buttonProxima);
          } else {
            if (animate) {
              if (defaults.feedbackPopup) {
                proximaQuestao();
              } else {
                $("html, body")
                  .stop(true, true)
                  .animate({ scrollTop: positionFeedbackTop }, 1000);
                setTimeout(function () {
                  proximaQuestao();
                }, 1000);
              }
            } else {
              proximaQuestao();
            }
          }
        }
      }
      function questaoCorreta() {
        let correto = null;

        if (_this.questao) {
          let alternativas = $(_this.questao.elementId).find(
            ".alternativas-wrapper"
          );

          if (defaults.tipo == "tomada") {
            for (let i = 0; i != alternativas.length; i++) {
              if ($(alternativas[i]).hasClass("active")) {
                if (alternativaCorreta(alternativas[i]) == "true") {
                  correto = "true";
                } else if (alternativaCorreta(alternativas[i]) == "false") {
                  correto = "false";
                } else if (alternativaCorreta(alternativas[i]) == "neutro") {
                  correto = "neutro";
                }
              }
            }
          }
        }

        return correto;
      }

      ///////////////////////////////////////////////////////////////
      // QUIZ
      // SELECIONA ALTERNATIVA DO QUIZ
      function selecionaAlternativa(alternativaSelecionada, animate) {
        if (_this.questao) {
          let alternativas = $(_this.questao.elementId).find(
            ".alternativas-wrapper"
          );
          for (let i = 0; i != alternativas.length; i++) {
            if (alternativas[i] == alternativaSelecionada) {
              $(alternativas[i])
                .addClass("active")
                .find(".alternativa-letter")
                .attr("aria-checked", true);
            } else {
              $(alternativas[i])
                .removeClass("active")
                .find(".alternativa-letter")
                .attr("aria-checked", false);
            }
          }
          $(_this.questao.elementId).find(".button-wrapper").fadeIn(600);

          if (animate) {
            let positionConfirmaTop =
              $(_this).offset().top +
              $(_this.questao.elementId).find(".questao-content").position()
                .top -
              ($("header").height() + 30);
            $("html, body").animate({ scrollTop: positionConfirmaTop }, 1000);
          }
        }
      }
      function alternativaCorreta(alternativa) {
        if (_this.questao) {
          let alternativaData = $(alternativa)
            .find(".alternativa-letter")
            .data("correto");

          for (
            let i = 0;
            i != _this.questao.alternativasSorteadas.length;
            i++
          ) {
            if (
              alternativaData == _this.questao.alternativasSorteadas[i].correto
            ) {
              return _this.questao.alternativasSorteadas[i].correto;
            }
          }
        }
        return "false";
      }

      ///////////////////////////////////////////////////////////////
      // FINALIZA A TOMADA
      function finalizaQuiz(feedName) {
        let feed = _this.data.feedback;

        textoFeedback = $("<div>")
          .addClass("feedTexto")
          .html(feed[feedName][0].textoLateral);
        imgField = $("<img>")
          .attr("src", "files/images/" + feed[feedName][0].imagemLateral)
          .attr("aria-labelledby", "imgFeedFinal");
        imagemFeedback = $("<div>").addClass("feedImagem").html(imgField);
        altImagemFeedback = $("<div>")
          .addClass("leitorTela")
          .attr("id", "imgFeedFinal")
          .html(feed[feedName][0].altImage);

        blocoFeedback = $("<div>")
          .addClass("blocoTexto")
          .html(feed[feedName][0].textoBloco);

        imagemFeedback.append(altImagemFeedback);
        $("#feedback-quiz")
          .find(".respostaFeed")
          .html(imagemFeedback)
          .append(textoFeedback)
          .append(blocoFeedback);

        $("#feedback-quiz").slideDown(600);
        let positionSectionEndTop =
          $("#feedback-quiz").offset().top - $("header").height();
        $("html, body").animate({ scrollTop: positionSectionEndTop }, 1000);


        //$('.feedbackQuiz').find('#medalhaQuiz').attr('src', 'assets/images/medalhaOuro.png');

        //console.log(_this.questao);
        // $('.feedbackQuiz').find('.textoFeedback').html($feedPontos);

        // for (let i = 0; i != _this.totalQuestoes; i++) {
        //     $('.feedbackQuiz').find('.feedPergunta').eq(i).find('.feed-header').addClass(_this.arraySorted[i].feedbackSelecionadoClass);
        //     $('.feedbackQuiz').find('.feedPergunta').eq(i).find('.feed-body').html(_this.arraySorted[i].feedbackSelecionado);
        // }

        // if (pontosTotais <= 4) {
        //     $('.feedbackQuiz').find('#medalhaQuiz').attr('src', 'assets/images/medalhaBronze.png');
        //     $feedMedalha = _this.data.feedback.bronze;
        //     $('.feedbackQuiz').find('.textoFeedback').append($feedMedalha);
        // } else if (pontosTotais > 4 && pontosTotais < 9) {
        //     $('.feedbackQuiz').find('#medalhaQuiz').attr('src', 'assets/images/medalhaPrata.png');
        //     $feedMedalha = _this.data.feedback.prata;
        //     $('.feedbackQuiz').find('.textoFeedback').append($feedMedalha);
        // } else if (pontosTotais == 9) {
        //     $('.feedbackQuiz').find('#medalhaQuiz').attr('src', 'assets/images/medalhaOuro.png');
        //     $feedMedalha = _this.data.feedback.ouro;
        //     $('.feedbackQuiz').find('.textoFeedback').append($feedMedalha);
        // }

        // if (defaults.feedbackPopup) {
        //     $('.modalFeed').last().on('hidden.bs.modal', function(){

        //     })
        // } else {
        //     $('#feedback-quiz').slideDown(600);
        //     let positionSectionEndTop = $('#feedback-quiz').offset().top - $('header').height();
        //     $('html, body').animate({ scrollTop: positionSectionEndTop }, 1000);
        // }

        $(".navegacaoSetas").removeClass("hidden");

        if (defaults.scorm) {
          if (inLMS) {
            setLessonStatus("completed");
          }
          salvaTempo();
        }
      }

      /////////////////////////////////////////////////////////////
      window.onbeforeunload = exitLMS;

      // SCORM
      function syncData() {
        if (inLMS) {
          pipwerks.SCORM.set(
            "cmi.core.lesson_location",
            dataLms.lessonLocation
          );
          pipwerks.SCORM.set("cmi.core.lesson_status", dataLms.lessonStatus);
          pipwerks.SCORM.set("cmi.core.session_time", dataLms.sessionTime);
          pipwerks.SCORM.set("cmi.suspend_data", dataLms.suspendData);
          pipwerks.SCORM.save();
        }
      }
      function setVarSuspendData(variable, value) {
        let suspendData = dataLms.suspendData,
          indexInit = suspendData.indexOf(variable + "=");

        if (indexInit <= -1) {
          suspendData +=
            suspendData === ""
              ? variable + "=" + value
              : ";" + (variable + "=" + value);
        } else {
          let indexEnd =
              suspendData.indexOf(";", indexInit) <= -1
                ? suspendData.length
                : suspendData.indexOf(";", indexInit),
            block = suspendData.substr(indexInit, indexEnd - indexInit);
          suspendData = suspendData.split(block).join(variable + "=" + value);
        }

        dataLms.suspendData = suspendData;
        //console.log(suspendData);
        syncData();
      }
      function getVarSuspendData(variable) {
        let output = "",
          suspendData = dataLms.suspendData,
          startPosition = suspendData.indexOf(variable + "=");

        if (startPosition > -1) {
          let endPosition =
            suspendData.indexOf(";", startPosition) == -1
              ? suspendData.length
              : suspendData.indexOf(";", startPosition);
          let block = suspendData.substr(
            startPosition,
            endPosition - startPosition
          );
          output = block.split("=")[1];
        }

        return output;
      }
      function salvaTempo() {
        let currentDate = "",
          elapsedSeconds = "",
          formattedTime = "";

        if (dataInicio !== 0) {
          currentDate = new Date();
          elapsedSeconds = (currentDate - dataInicio) / 1000;
          formattedTime = elapsedSeconds.toString().toHHMMSS();
        } else {
          formattedTime = "0000:00:00";
        }

        dataLms.sessionTime = formattedTime;
      }
      function setLessonStatus(status) {
        if (status == "completed" && dataLms.lessonStatus != "completed") {
          dataLms.lessonStatus = "completed";
        } else {
          dataLms.lessonStatus = status;
        }

        salvaTempo();
        syncData();
      }
      function getData() {
        let data = [];

        for (let i = 0; i != _this.arraySorted.length; i++) {
          if (_this.arraySorted[i].isComplete) {
            data.push({
              id: _this.arraySorted[i].id,
              s: _this.arraySorted[i].alternativaSelecionada,
              c: _this.arraySorted[i].isComplete,
            });
          }
        }

        data = JSON.stringify(data);
        data = data.split('"').join("|");
        //console.log(data);
        return data;
      }
      function setData(str) {
        str = str.split("|").join('"');

        let recoverData = JSON.parse(str),
          ultimoVisitado = null;

        for (let i = 0; i != recoverData.length; i++) {
          _this.questao = getQuestao(recoverData[i].id);

          if (_this.questao) {
            _this.questao.isComplete = recoverData[i].c;
            _this.questao.alternativaSelecionada = recoverData[i].s;

            ultimoVisitado = i;
          }
        }

        mostraQuestaoCompleta(ultimoVisitado);
      }

      // OPCOES NO SCORM
      function marcaOpcao(questao, opcaoSelecionada) {
        if (questao) {
          let alternativas = $(questao.elementId).find(".alternativas-wrapper");

          if (defaults.tipo == "quiz" || defaults.tipo == "full") {
            $.each(alternativas, function (i, v) {
              if (
                $(this).find(".alternativa-letter p").html() == opcaoSelecionada
              ) {
                $(this).addClass("active");
              }
            });
          } else if (defaults.tipo == "multipla") {
            $.each(alternativas, function (i, v) {
              _alt = $(this);
              $.each(opcaoSelecionada, function (j, val) {
                if (i == val) {
                  _alt
                    .find("input")
                    .prop("checked", true)
                    .attr("aria-checked", true);
                }
              });
            });
          } else if (defaults.tipo == "vouf") {
            $.each(alternativas, function (i, v) {
              _alt = $(this);
              _alt.find(".falso").attr("aria-checked", true);

              $.each(opcaoSelecionada, function (j, val) {
                if (i == val) {
                  _alt.find(".verdadeiro").attr("aria-checked", true);
                  _alt.find(".falso").attr("aria-checked", false);
                }
              });
            });
          }
        }
      }
      // MOSTRA OPCOES COMPLETAS
      function mostraQuestaoCompleta(idQuestao) {
        if (defaults.botaoProxima) $(_this).find(".questaosLoaded").hide();

        for (let i = 0; i <= idQuestao; i++) {
          _this.questao = getQuestao(_this.arraySorted[i].id);

          if (_this.questao) {
            $(_this.questao.elementId)
              .removeClass("hidden")
              .hide()
              .delay(200)
              .fadeIn(600);

            if (defaults.tipo == "quiz" || defaults.tipo == "full") {
              selecionaAlternativa(_this.questao.id, false);
            } else if (defaults.tipo == "multipla") {
              selecionaAlternativaMultipla(_this.questao, false);
            } else if (defaults.tipo == "vouf") {
              selecionaAlternativaVouF(_this.questao, false);
            }

            marcaOpcao(_this.questao, _this.questao.alternativaSelecionada);
            confirmarQuestao(_this.questao.id, false, defaults.botaoProxima);

            if (defaults.botaoProxima) $("button.btnProxima").trigger("click");
          }
        }

        setTimeout(function () {
          if (defaults.botaoProxima)
            $(_this).find(".questaosLoaded").delay(800).fadeIn(600);

          questaoVez = getQuestao(_this.arraySorted[idQuestao + 1].id);
          $("html, body").animate(
            { scrollTop: $(questaoVez.elementId).position().top - 95 },
            1000
          );
        }, 800);
      }

      function exitLMS() {
        if (inLMS) {
          pipwerks.SCORM.quit();
        }
      }
    });
  };
})(jQuery);
