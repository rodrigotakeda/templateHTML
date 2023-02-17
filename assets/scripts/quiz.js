(function ($) {
    $.fn.quizTae = function (options) {
        let defaults = {
            randomQuestoes: false,
            randomAlternativa: false,
            imagemLateral: false,
            feedbackIcone: true,
            feedbackQuestao: true,
            botaoProxima: false,
            maximoQuestoes: null,
            letters: 'letras',
            quizFile: "data/quiz.json",
            tipo: 'quiz',
            scorm: false,
            geraCertificado: false,
        };
        defaults = $.extend({}, defaults, options);

        // ADD ZERO
        function addZero(n) { return n <= 9 ? "0" + n : n; }

        // SORTEIO DE ARRAY
        Array.prototype.shuffleArray = function () { return this.sort(() => Math.random() - 0.5); }

        // CONVERSAO DE TEMPO
        String.prototype.toHHMMSS = function () {
            let sec_num = parseInt(this, 10),
                hours = Math.floor(sec_num / 3600),
                minutes = Math.floor((sec_num - hours * 3600) / 60),
                seconds = sec_num - hours * 3600 - minutes * 60;

            if (hours < 10) { hours = "000" + hours; }
            if (minutes < 10) { minutes = "0" + minutes; }
            if (seconds < 10) { seconds = "0" + seconds; }

            let time = hours + ":" + minutes + ":" + seconds;

            return time;
        };
        
        let inLMS = false,
            dataInicio = 0,
            dataLms = { lessonLocation: 1, lessonStatus: "incomplete", sessionTime: "", scoreRaw: 0, suspendData: "" };

        return this.each(function() {
            let _this = $(this),
                z = _this.index('.quiz');

            let ajaxLoader = $.getJSON(defaults.quizFile)
                .done(function (data) {
                    if (defaults.scorm) {
                        inLMS = pipwerks.SCORM.init() ? true : false;

                        dataInicio = new Date();

                        if (inLMS) {
                            let _lessonLocation = pipwerks.SCORM.get("cmi.core.lesson_location");
                            if (_lessonLocation !== null && _lessonLocation !== undefined && _lessonLocation !== "null" && _lessonLocation !== "undefined" && _lessonLocation !== "") {
                                dataLms.lessonLocation = pipwerks.SCORM.get("cmi.core.lesson_location");
                            } else {
                                dataLms.lessonLocation = ""; }

                            let _lessonStatus = pipwerks.SCORM.get("cmi.core.lesson_status");
                            if (_lessonStatus !== null && _lessonStatus !== undefined && _lessonStatus !== "null" && _lessonStatus !== "undefined" && _lessonStatus !== "") {
                                dataLms.lessonStatus = pipwerks.SCORM.get("cmi.core.lesson_status");
                            } else {
                                dataLms.lessonStatus = ""; }
                            
                            let _suspendData = pipwerks.SCORM.get("cmi.suspend_data");
                            if (_suspendData !== null && _suspendData !== undefined && _suspendData !== "null" && _suspendData !== "undefined" && _suspendData !== "") {
                                dataLms.suspendData = pipwerks.SCORM.get("cmi.suspend_data");
                            } else {
                                dataLms.suspendData = ""; }
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
                    case 'numeros':
                        letters = "123456789".split("");
                        break;
                    case 'letras':
                        letters = "ABCDEFGHI".split("");
                        break;
                    case 'romanos':
                        letters = "I,II,III,IV,V,VI,VII,VIII,IX,X".split(",");
                        break;
                    default:
                        letters = "ABCDEFGHI".split("");
                }
                
                renderGeneralTemplate();

                switch (defaults.tipo) {
                    case 'vouf':
                        renderTemplate_VouF();
                        break;
                    case 'multipla':
                        renderTemplate_Multipla();
                        break;
                    case 'full':
                        renderTemplate_Full();
                        break;
                    case 'quiz':
                        renderTemplate_Quiz();
                        break;
                    default:
                        renderTemplate_Quiz();
                }
            }

            function renderGeneralTemplate() {
                // CONTADOR
                $counterText = $('<p>').html('Acertos: <span class="questao-acertos"></span> | Questão <span class="questao-info"></span> | Evolução: <span class="progressao-info">0</span>%');
                $counterStep = $('<div>').addClass('counter-step').html($counterText);
                $counterWrapper = $('<div>').addClass('counter-wrapper').html($counterStep);

                // FEED FINAL
                $contentFeedFinal = $('<div>').addClass('final-quiz').addClass('hidden').html('<p>Você chegou ao fim do desafio e acertou <strong><span class="totalCerto">00</span></strong> questões das <strong><span class="totalQuestoes">00</span></strong> situações propostas.</p>');

                if (defaults.geraCertificado) {
                    $inputFeedFinal = $('<input>').attr('placeholder', 'Digite seu nome').attr('type', 'text').attr('name', 'txtNome').attr('id','txtNome');
                    $botaoFeedFinal = $('<button>').attr('id','botaoDown').html('Baixar Certificado').on('click', createPDF);
                    $contentFeedFinal.append($inputFeedFinal).append($botaoFeedFinal);
                }

                // QUESTOES
                $questaosLoaded = $('<div>').attr('id', 'questaosLoaded_' + z).addClass('questaoLoaded');
                _this.html($questaosLoaded).append($counterWrapper).append($contentFeedFinal);

                /////////////
                // RANDOM QUESTOES
                if (getVarSuspendData("entrada") != "") {
                    dataEntrada = getVarSuspendData("entrada").split('|');
                    dataSorteio = dataEntrada[0].split(',');
                    _this.arraySorted = new Array();
                    $.each(dataSorteio, function(i,v) { _this.arraySorted.push(_this.data.questoes[v-1]); })
                    _this.totalQuestoes = Number(dataEntrada[1]);
                    _this.altSorteio = dataEntrada[2].split('!');
                    defaults.imagemLateral = Boolean(JSON.parse((dataEntrada[3].toString()).toLowerCase()));
                    defaults.botaoProxima = Boolean(JSON.parse((dataEntrada[4].toString()).toLowerCase()));
                    defaults.feedbackIcone = Boolean(JSON.parse((dataEntrada[5].toString()).toLowerCase()));
                    defaults.feedbackQuestao = Boolean(JSON.parse((dataEntrada[6].toString()).toLowerCase()));
                } else {
                    randomQuestoes = defaults.randomQuestoes;
                    if (randomQuestoes) {
                        array_temp = new Array();
                        for (i = 0; i < _this.data.questoes.length; i++) { array_temp.push(_this.data.questoes[i]); }
                        _this.arraySorted = array_temp.shuffleArray();
                    } else {
                        _this.arraySorted = new Array();
                        for (i = 0; i < _this.data.questoes.length; i++) { _this.arraySorted.push(_this.data.questoes[i]); }
                    }

                    saveId = new Array();
                    $.each(_this.arraySorted, function(i,v){ saveId.push(v.id); });
                    _this.sorteioQuestoes = saveId;

                    // VERIFICA SE TEM MAXIMO DE QUESTOES A SEREM DISPONIBILIZADAS
                    if (defaults.maximoQuestoes != null) 
                        _this.totalQuestoes = defaults.maximoQuestoes;
                    else 
                        _this.totalQuestoes = _this.arraySorted.length;
                }
            }

            ////////////////////////////////////////////////

            function renderTemplate_Full() {
                data = _this.data;
                _this.removeAttr('class').addClass('quiz').addClass('templateFull');
                
                saveAlts = new Array();

                for (let i = 0; i != _this.totalQuestoes; i++) {
                    questao = _this.arraySorted[i];

                    $questaoWrapper = $('<div>').addClass('questao-wrapper').addClass('container');
                    if (questao.introducao != "") {
                        $introContent = $('<div>').addClass('questao-introducao').html(questao.introducao);
                        $questaoWrapper.append($introContent);
                    }

                    $colNumPergunta = $('<div>').addClass('col-3 col-md-2 col-lg-1').addClass('numero-questao').html('<p>' + addZero(i + 1) + '</p>');
                    $colTextPergunta = $('<div>').addClass('col-12 col-md-10 col-lg-11').addClass('pergunta-questao').html(questao.pergunta);
                    $rowPergunta = $('<div>').addClass('row').addClass('pergunta-wrapper').addClass('align-items-center').html($colNumPergunta).append($colTextPergunta);
                    $questaoWrapper.append($rowPergunta)

                    $wrapperAlternativas = $questaoWrapper; 
                
                    if(_this.altSorteio != undefined) {
                        alt_vez = _this.altSorteio[i].split(',');
                        alt_temp = new Array();
                        $.each(alt_vez, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                        questao.alternativasSorteadas = alt_temp;
                    } else {
                        randomAlternativa = defaults.randomAlternativa;
                        if (randomAlternativa) {
                            alt_temp = new Array();
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            alt_numTemp.shuffleArray();
                            saveAlts.push(alt_numTemp);

                            $.each(alt_numTemp, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                            questao.alternativasSorteadas = alt_temp;
                        } else {
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            saveAlts.push(alt_numTemp);

                            questao.alternativasSorteadas = questao.alternativas; }
                    }

                    for (let n = 0; n != questao.alternativasSorteadas.length; n++) {
                        questao.alternativasSorteadas[n].letter = letters[n];

                        $colLetterAlternativa = $('<div>').addClass('col').attr('role', 'radio').attr('aria-checked', false).addClass('alternativa-letter').html('<p>' + letters[n] + '</p>').data('correto', questao.alternativasSorteadas[n].correto);
                        $colContentAlternativa = $('<div>').addClass('col').addClass('alternativa-content').html(questao.alternativasSorteadas[n].text);
                        $rowAlternativa = $('<div>').addClass('row').attr('role', 'radiogroup').addClass('alternativas-wrapper').html($colLetterAlternativa).append($colContentAlternativa);

                        if (defaults.feedbackIcone) {
                            $colIconAlternativa = $('<div>').addClass('col').addClass('icon-feedback').html('<div class="icon-certo"></div><div class="icon-errado"></div><div class="icon-neutro"></div');
                            $rowAlternativa.prepend($colIconAlternativa)
                        }

                        $wrapperAlternativas.append($rowAlternativa);
                    }

                    $buttonConfirmar = $('<button>').html('Confirmar');
                    $colButtonBorder = $('<div>').addClass('col').addClass('button-content').html($buttonConfirmar);
                    $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
                    $questaoWrapper.append($rowButtonWrapper);

                    $imagemQuestao = $('<div>').addClass("image-parallax").attr('style', "background-image: url(files/images/quiz/" + questao.image + ");").data('image', 'files/images/quiz/' + questao.image);
                    $divisaoQuestao = $('<section>').attr('id', 'divisaoQuestao-' + addZero(z) + '_' + addZero(i + 1)).addClass("divisao-questao hidden").html($imagemQuestao);

                    $contentQuestao = $('<section>').attr('id', 'sectionQuestao-' + addZero(z) + '_' + addZero(i + 1)).addClass("content-wrapper").addClass('hidden').html($questaoWrapper);

                    if (defaults.botaoProxima) {
                        $contentQuestao.addClass('content-fade');
                    } else {
                        $contentQuestao.addClass('completo');
                    }

                    if (defaults.feedbackQuestao) {
                        $contentFeedPositivo = $('<div>').addClass('feedback-wrapper').addClass('feedback-positivo').addClass('hidden').html(questao.feedbacks.correto);
                        $contentFeedNegativo = $('<div>').addClass('feedback-wrapper').addClass('feedback-negativo').addClass('hidden').html(questao.feedbacks.incorreto);
                        $contentFeedNeutro = $('<div>').addClass('feedback-wrapper').addClass('feedback-neutro').addClass('hidden').html(questao.feedbacks.neutro);
                        $contentQuestao.append($contentFeedPositivo).append($contentFeedNegativo).append($contentFeedNeutro);
                    }

                    _this.find('#questaosLoaded_' + z).append($divisaoQuestao).append($contentQuestao);

                    // questaoS
                    questao.num = addZero(i + 1);
                    questao.elementImageId = "#divisaoQuestao-" + addZero(z) + '_' + questao.num;
                    questao.elementId = "#sectionQuestao-" + addZero(z) + '_' + questao.num;
                    questao.existIntro = questao.introducao != "";
                }

                saveAlts = saveAlts.join("!");
                _this.sorteioAlternativas = saveAlts;
                
                _this.parents('.wrapper').addClass('wrapper_quizFull');

                montaQuiz();
            }

            function renderTemplate_Quiz() {
                data = _this.data;
                _this.removeAttr('class').addClass('quiz').addClass('templateQuiz');

                saveAlts = new Array();

                for (let i = 0; i != _this.totalQuestoes; i++) {
                    questao = _this.arraySorted[i];

                    $questaoWrapper = $('<div>').addClass('questao-wrapper');
                    if (questao.introducao != "") {
                        $introContent = $('<div>').addClass('questao-introducao').html(questao.introducao);
                        $questaoWrapper.append($introContent);
                    }

                    $colNumPergunta = $('<div>').addClass('col-3 col-md-2 col-lg-1').addClass('numero-questao').html('<p>' + addZero(i + 1) + '</p>');
                    $colTextPergunta = $('<div>').addClass('col-12 col-md-10 col-lg-11').addClass('pergunta-questao').html(questao.pergunta);
                    $rowPergunta = $('<div>').addClass('row').addClass('pergunta-wrapper').addClass('align-items-center').html($colNumPergunta).append($colTextPergunta);
                    $questaoWrapper.append($rowPergunta)

                    imagemLateral = defaults.imagemLateral;
                    if (imagemLateral) {
                        $imgLateral = $('<img>').addClass('img-fluid').attr('src', 'files/images/quiz/' + questao.image);
                        $colLateral = $('<div>').addClass('col').addClass('image-wrapper').html($imgLateral);
                        $wrapperAlternativas = $('<div>').addClass('col').addClass('alternativasImage-wrapper');
                        $rowLateral = $('<div>').addClass('row').addClass('row-image-alternativa').addClass('align-items-stretch').html($colLateral).append($wrapperAlternativas);
                        $questaoWrapper.append($rowLateral);
                    } else {
                        $wrapperAlternativas = $questaoWrapper; 
                    }
                
                    if(_this.altSorteio != undefined) {
                        alt_vez = _this.altSorteio[i].split(',');
                        alt_temp = new Array();
                        $.each(alt_vez, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                        questao.alternativasSorteadas = alt_temp;
                    } else {
                        randomAlternativa = defaults.randomAlternativa;
                        if (randomAlternativa) {
                            alt_temp = new Array();
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            alt_numTemp.shuffleArray();
                            saveAlts.push(alt_numTemp);

                            $.each(alt_numTemp, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                            questao.alternativasSorteadas = alt_temp;
                        } else {
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            saveAlts.push(alt_numTemp);

                            questao.alternativasSorteadas = questao.alternativas; }
                    }

                    for (let n = 0; n != questao.alternativasSorteadas.length; n++) {
                        questao.alternativasSorteadas[n].letter = letters[n];

                        $colLetterAlternativa = $('<div>').addClass('col').attr('role', 'radio').attr('aria-checked', false).addClass('alternativa-letter').html('<p>' + letters[n] + '</p>').data('correto', questao.alternativasSorteadas[n].correto);
                        $colContentAlternativa = $('<div>').addClass('col').addClass('alternativa-content').html(questao.alternativasSorteadas[n].text);
                        $rowAlternativa = $('<div>').addClass('row').attr('role', 'radiogroup').addClass('alternativas-wrapper').html($colLetterAlternativa).append($colContentAlternativa);

                        if (defaults.feedbackIcone) {
                            $colIconAlternativa = $('<div>').addClass('col').addClass('icon-feedback').html('<div class="icon-certo"></div><div class="icon-errado"></div><div class="icon-neutro"></div');
                            $rowAlternativa.prepend($colIconAlternativa)
                        }

                        $wrapperAlternativas.append($rowAlternativa);
                    }

                    $buttonConfirmar = $('<button>').html('Confirmar');
                    $colButtonBorder = $('<div>').addClass('col').addClass('button-content').html($buttonConfirmar);
                    $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
                    $questaoWrapper.append($rowButtonWrapper);

                    $contentQuestao = $('<section>').attr('id', 'sectionQuestao-' + addZero(z) + '_' + addZero(i + 1)).addClass("content-wrapper").addClass('hidden').html($questaoWrapper);

                    if (defaults.botaoProxima) {
                        $contentQuestao.addClass('content-fade');
                    } else {
                        $contentQuestao.addClass('completo');
                    }

                    if (imagemLateral) { $contentQuestao.addClass('quiz-imagem'); }

                    if (defaults.feedbackQuestao) {
                        $contentFeedPositivo = $('<div>').addClass('feedback-wrapper').addClass('feedback-positivo').addClass('hidden').html(questao.feedbacks.correto);
                        $contentFeedNegativo = $('<div>').addClass('feedback-wrapper').addClass('feedback-negativo').addClass('hidden').html(questao.feedbacks.incorreto);
                        $contentFeedNeutro = $('<div>').addClass('feedback-wrapper').addClass('feedback-neutro').addClass('hidden').html(questao.feedbacks.neutro);
                        $contentQuestao.append($contentFeedPositivo).append($contentFeedNegativo).append($contentFeedNeutro);
                    }

                    _this.find('#questaosLoaded_' + z).append($contentQuestao);

                    // questaoS
                    questao.num = addZero(i + 1);
                    questao.elementId = "#sectionQuestao-" + addZero(z) + '_' + questao.num;
                    questao.existIntro = questao.introducao != "";
                }

                saveAlts = saveAlts.join("!");
                _this.sorteioAlternativas = saveAlts;

                montaQuiz();
            }

            function renderTemplate_Multipla() {
                data = _this.data;
                _this.removeAttr('class').addClass('quiz').addClass('templateMultipla');

                saveAlts = new Array();

                for (let i = 0; i != _this.totalQuestoes; i++) {
                    questao = _this.arraySorted[i];
                    $questaoWrapper = $('<div>').addClass('questao-wrapper');
                    if (questao.introducao != "") {
                        $introContent = $('<div>').addClass('questao-introducao').html(questao.introducao);
                        $questaoWrapper.append($introContent);
                    }

                    $colNumPergunta = $('<div>').addClass('col-3 col-md-2 col-lg-1').addClass('numero-questao').html('<p>' + addZero(i + 1) + '</p>');
                    $colTextPergunta = $('<div>').addClass('col-12 col-sm-10 col-md-11').addClass('pergunta-questao').html(questao.pergunta);
                    $rowPergunta = $('<div>').addClass('row').addClass('pergunta-wrapper').addClass('align-items-center').html($colNumPergunta).append($colTextPergunta);
                    $questaoWrapper.append($rowPergunta)

                    imagemLateral = defaults.imagemLateral;
                    if (imagemLateral) {
                        $imgLateral = $('<img>').addClass('img-fluid').attr('src', 'files/images/quiz/' + questao.image);
                        $colLateral = $('<div>').addClass('col').addClass('image-wrapper').html($imgLateral);
                        $wrapperAlternativas = $('<div>').addClass('col').addClass('alternativasImage-wrapper');
                        $rowLateral = $('<div>').addClass('row').addClass('row-image-alternativa').addClass('align-items-stretch').html($colLateral).append($wrapperAlternativas);
                        $questaoWrapper.append($rowLateral);
                    } else {
                        $wrapperAlternativas = $questaoWrapper; }

                    if(_this.altSorteio != undefined) {
                        alt_vez = _this.altSorteio[i].split(',');
                        alt_temp = new Array();
                        $.each(alt_vez, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                        questao.alternativasSorteadas = alt_temp;
                    } else {
                        randomAlternativa = defaults.randomAlternativa;
                        if (randomAlternativa) {
                            alt_temp = new Array();
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            alt_numTemp.shuffleArray();
                            saveAlts.push(alt_numTemp);

                            $.each(alt_numTemp, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                            questao.alternativasSorteadas = alt_temp;
                        } else {
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            saveAlts.push(alt_numTemp);

                            questao.alternativasSorteadas = questao.alternativas; }
                    }

                    for (let n = 0; n != questao.alternativasSorteadas.length; n++) {
                        $inputAlternativa = $('<input>').attr('id', 'optMult_' +  addZero(i + 1) + '_' + addZero(n + 1)).attr('type', 'checkbox').attr('aria-checked', false).attr('name', 'optGrupo_' + addZero(i + 1)).data('correto', questao.alternativasSorteadas[n].correto);
                        $labelAlternativa = $('<label>').attr('for', 'optMult_' + addZero(i + 1)+ '_' + addZero(n + 1)).html(questao.alternativasSorteadas[n].text);
                        $divCheckAlternativa = $('<div>').addClass('check-option').append($inputAlternativa).append($labelAlternativa);
                        
                        $colContentAlternativa = $('<div>').addClass('col').addClass('alternativa-content').html($divCheckAlternativa);
                        $rowAlternativa = $('<div>').addClass('row').addClass('alternativas-wrapper').html($colContentAlternativa);

                        if (defaults.feedbackIcone) {
                            $colIconAlternativa = $('<div>').addClass('col').addClass('icon-feedback').html('<div class="icon-certo"></div><div class="icon-errado"></div>');
                            $rowAlternativa.prepend($colIconAlternativa)
                        }

                        $wrapperAlternativas.append($rowAlternativa);
                    }

                    $buttonConfirmar = $('<button>').html('Confirmar');
                    $colButtonBorder = $('<div>').addClass('col-7 offset-5').addClass('button-content').html($buttonConfirmar);
                    $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
                    $questaoWrapper.append($rowButtonWrapper);

                    $contentQuestao = $('<section>').attr('id', 'sectionQuestao-' + addZero(z) + '_' + addZero(i + 1)).addClass("content-wrapper").addClass('hidden').html($questaoWrapper);

                    if (defaults.botaoProxima) {
                        $contentQuestao.addClass('content-fade');
                    } else {
                        $contentQuestao.addClass('completo');
                    }

                    if (imagemLateral) { $contentQuestao.addClass('quiz-imagem'); }

                    if (defaults.feedbackQuestao) {
                        $contentFeedPositivo = $('<div>').addClass('feedback-wrapper').addClass('feedback-positivo').addClass('hidden').html(questao.feedbacks.correto);
                        $contentFeedNegativo = $('<div>').addClass('feedback-wrapper').addClass('feedback-negativo').addClass('hidden').html(questao.feedbacks.incorreto);
                        $contentQuestao.append($contentFeedPositivo).append($contentFeedNegativo);
                    }

                    _this.find('#questaosLoaded_' + z).append($contentQuestao);

                    // questaoS
                    questao.num = addZero(i + 1);
                    questao.elementId = "#sectionQuestao-" + addZero(z) + '_' + questao.num;
                    questao.existIntro = questao.introducao != "";
                    //for (var n = 0; n != questao.alternativas.length; n++) { questao.alternativas[n].letter = letters[n]; }
                }

                saveAlts = saveAlts.join("!");
                _this.sorteioAlternativas = saveAlts;

                montaQuiz();
            }

            function renderTemplate_VouF() {
                data = _this.data;
                _this.removeAttr('class').addClass('quiz').addClass('templateVouF');

                saveAlts = new Array();

                for (let n = 0; n != _this.totalQuestoes; n++) {
                    questao = _this.arraySorted[n];

                    $questaoWrapper = $('<div>').addClass('questao-wrapper');
                    $colTextPergunta = $('<div>').addClass('col').addClass('pergunta-questao').html(questao.pergunta);
                    $rowPergunta = $('<div>').addClass('row').addClass('pergunta-wrapper').html($colTextPergunta);
                    $questaoWrapper.append($rowPergunta);

                    imagemLateral = defaults.imagemLateral;
                    if (imagemLateral) {
                        $imgLateral = $('<img>').addClass('img-fluid').attr('src', 'files/images/quiz/' + questao.image);
                        $colLateral = $('<div>').addClass('col').addClass('image-wrapper').html($imgLateral);
                        $wrapperAlternativas = $('<div>').addClass('col').addClass('alternativasImage-wrapper');
                        $rowLateral = $('<div>').addClass('row').addClass('row-image-alternativa').addClass('align-items-stretch').html($colLateral).append($wrapperAlternativas);
                        $questaoWrapper.append($rowLateral);
                    } else {
                        $wrapperAlternativas = $questaoWrapper; }

                    if(_this.altSorteio != undefined) {
                        alt_vez = _this.altSorteio[n].split(',');
                        alt_temp = new Array();
                        $.each(alt_vez, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                        questao.alternativasSorteadas = alt_temp;
                    } else {
                        randomAlternativa = defaults.randomAlternativa;
                        if (randomAlternativa) {
                            alt_temp = new Array();
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            alt_numTemp.shuffleArray();
                            saveAlts.push(alt_numTemp);

                            $.each(alt_numTemp, function(f, val){ alt_temp.push(questao.alternativas[val]); });
                            questao.alternativasSorteadas = alt_temp;
                        } else {
                            alt_numTemp = new Array();
                            for (j = 0; j < questao.alternativas.length; j++) { alt_numTemp.push(j); }
                            saveAlts.push(alt_numTemp);

                            questao.alternativasSorteadas = questao.alternativas; }
                    }

                    for (let i = 0; i != questao.alternativasSorteadas.length; i++) {
                        alternativa = questao.alternativasSorteadas[i];

                        $botaoTrue = $('<button>').addClass('verdadeiro').attr('name','optT'+i).attr('role','radio').val(true).attr('aria-checked',false).html('<p>V</p>');
                        $botaoFalse = $('<button>').addClass('falso').attr('name','optF'+i).attr('role','radio').val(false).attr('aria-checked',false).html('<p>F</p>');

                        $colContentAlternativa = $('<div>').addClass('col').addClass('alternativa-content').html($botaoTrue).append($botaoFalse).append(alternativa.text).attr('role', 'radiogroup');
                        $rowAlternativa = $('<div>').addClass('row').addClass('alternativas-wrapper').data('correto', alternativa.correto).html($colContentAlternativa);

                        if (defaults.feedbackIcone) {
                            $colIconAlternativa = $('<div>').addClass('col').addClass('icon-feedback').html('<div class="icon-certo"></div><div class="icon-errado"></div>');
                            $rowAlternativa.prepend($colIconAlternativa)
                        }

                        $wrapperAlternativas.append($rowAlternativa);
                    }

                    $buttonConfirmar = $('<button>').html('Confirmar');
                    $colButtonBorder = $('<div>').addClass('col-7 offset-5').addClass('button-content').html($buttonConfirmar);
                    $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
                    $questaoWrapper.append($rowButtonWrapper);

                    $contentQuestao = $('<section>').attr('id', 'sectionQuestao-' + addZero(z) + '_' + addZero(n+1)).addClass("content-wrapper").addClass('hidden').html($questaoWrapper);

                    if (defaults.botaoProxima) {
                        $contentQuestao.addClass('content-fade');
                    } else {
                        $contentQuestao.addClass('completo'); }

                    if (imagemLateral) { $contentQuestao.addClass('quiz-imagem'); }

                    if (defaults.feedbackQuestao) {
                        $contentFeedPositivo = $('<div>').addClass('feedback-wrapper').addClass('feedback-positivo').addClass('hidden').html(questao.feedbacks.correto);
                        $contentFeedNegativo = $('<div>').addClass('feedback-wrapper').addClass('feedback-negativo').addClass('hidden').html(questao.feedbacks.incorreto);
                        $contentQuestao.append($contentFeedPositivo).append($contentFeedNegativo);
                    }

                    _this.find('#questaosLoaded_' + z).append($contentQuestao);

                    // questaoS
                    questao.num = addZero(n+1);
                    questao.elementId = "#sectionQuestao-" + addZero(z) + '_' + questao.num;
                    questao.existIntro = questao.introducao != "";
                }

                if (_this.totalQuestoes > 1) _this.find('.counter-wrapper').remove();

                saveAlts = saveAlts.join("!");
                _this.sorteioAlternativas = saveAlts;

                montaQuiz();
            }

            // START QUIZ
            function montaQuiz() {
                if (dataLms.suspendData != "") {
                    proximaQuestao();
                    setData(getVarSuspendData("data"));
                    //setDataRecovery();
                } else {
                    //console.log(_this.sorteioAlternativas);
                    //_this.sorteioAlternativas = _this.sorteioAlternativas.split('"').join("!");
                    setVarSuspendData("entrada", _this.sorteioQuestoes +'|'+ _this.totalQuestoes +'|'+ _this.sorteioAlternativas +'|'+ defaults.imagemLateral +'|'+ defaults.botaoProxima +'|'+ defaults.feedbackIcone +'|'+ defaults.feedbackQuestao);
                    proximaQuestao(); 
                }
                
                if(defaults.tipo == "full") {
                    _this.unwrap().unwrap().unwrap();
                }
                //$().wrapInner(_this);
            }

            ///////////////////////////////////////////////////////////////
            // PROXIMA QUESTAO
            function proximaQuestao() {
                for (let i = 0; i != _this.totalQuestoes; i++) {
                    if (_this.arraySorted[i].isComplete != true) {
                        mostraQuestao(_this.arraySorted[i].id);
                        return false;
                    }
                }
                finalizaQuiz();
            }
            // SELECIONA QUESTAO DA VEZ
            function getQuestao(id) {
                for (let i = 0; i != _this.totalQuestoes; i++) {
                    if (_this.arraySorted[i].id == id) { return _this.arraySorted[i]; }
                }
                return false;
            }

            ///////////////////////////////////////////////////////////////
            // GERAL
            // MOSTRA QUESTÃO / CONFIRMAR 
            function mostraQuestao(idQuestao) {
                _this.questao = getQuestao(idQuestao);

                if (_this.questao) {
                    $(_this.questao.elementId).removeClass("hidden").hide().delay(200).fadeIn(600);
                    
                    let alternativas = $(_this.questao.elementId).find(".alternativas-wrapper");
                    if(defaults.tipo == "full") {
                        $(_this.questao.elementImageId).removeClass("hidden").hide().delay(200).fadeIn(600);
                        alternativas.off().on("click", function () { selecionaAlternativa(this, true); });
                    } else if(defaults.tipo == "quiz") {
                        alternativas.off().on("click", function () { selecionaAlternativa(this, true); });
                    } else if (defaults.tipo == "multipla") {
                        alternativas.find('label').off().on('click', function() { selecionaAlternativaMultipla(this, false); }); 
                    } else if(defaults.tipo == "vouf") {
                        alternativas.find('button').off().on("click", function () { selecionaAlternativaVouF(this, true); });
                    }

                    atualizaContador();
                }

                $(_this.questao.elementId).find(".button-wrapper button").off().on("click", function () {
                    confirmarQuestao(idQuestao, true, defaults.botaoProxima);
                });
            }
            function confirmarQuestao(idQuestao, animate, btProxima) {
                if (_this.questao) {
                    let alternativas = $(_this.questao.elementId).find(".alternativas-wrapper");

                    if(defaults.tipo == "full") {
                        $.each(alternativas, function(i,v){
                            $(this).off("click").addClass("disabled");

                            if ($(this).hasClass("active")) {
                                _this.questao.alternativaSelecionada = $(this).find('.alternativa-letter').children().html(); }

                            if (defaults.feedbackIcone) {
                                if (alternativaCorreta(this) == "true") {
                                    $(this).find(".icon-certo").fadeIn(600);
                                } else if (alternativaCorreta(this) == "false") {
                                    $(this).find(".icon-errado").fadeIn(600); 
                                } else if (alternativaCorreta(this) == "neutro") {
                                    $(this).find(".icon-neutro").fadeIn(600); 
                                }
                            }
                        });
                    } else if(defaults.tipo == "quiz") {
                        $.each(alternativas, function(i,v){
                            $(this).off("click").addClass("disabled");

                            if ($(this).hasClass("active")) {
                                _this.questao.alternativaSelecionada = $(this).find('.alternativa-letter').children().html(); }

                            if (defaults.feedbackIcone) {
                                if (alternativaCorreta(this) == "true") {
                                    $(this).find(".icon-certo").fadeIn(600);
                                } else if (alternativaCorreta(this) == "false") {
                                    $(this).find(".icon-errado").fadeIn(600); 
                                } else if (alternativaCorreta(this) == "neutro") {
                                    $(this).find(".icon-neutro").fadeIn(600); 
                                }
                            }
                        });
                    } else if (defaults.tipo == "multipla") {
                        arraySelecionada = new Array();
                        $.each(alternativas, function(i,v){
                            $(this).off("click").addClass("disabled");

                            alternativaInput = $(this).find('input:checkbox').prop('checked');
                            if(alternativaInput) arraySelecionada.push(i);

                            if (defaults.feedbackIcone) {
                                if (alternativaCorretaMultipla(this)) {
                                    $(this).find(".icon-certo").fadeIn(600);
                                } else {
                                    $(this).find(".icon-errado").fadeIn(600); }
                            }
                        })

                        _this.questao.alternativaSelecionada = arraySelecionada;
                    } else if (defaults.tipo == "vouf") {
                        arraySelecionada = new Array();
                        $.each(alternativas, function(i,v){
                            $(this).off("click").addClass("disabled");

                            alternativaInput = $(this).find('button').attr('aria-checked');
                            if(alternativaInput == 'true') arraySelecionada.push(i);

                            if (defaults.feedbackIcone) {
                                if (alternativaCorretVouF(this)) {
                                    $(this).find(".icon-certo").fadeIn(600);
                                } else {
                                    $(this).find(".icon-errado").fadeIn(600); }
                            }
                        })
                        _this.questao.alternativaSelecionada = arraySelecionada;
                    }

                    _this.questao.isComplete = true;
                    _this.questao.isCorrect = questaoCorreta();

                    let positionFeedbackTop = 0;
                    if (defaults.feedbackQuestao) {
                        if(defaults.tipo == "quiz" || defaults.tipo == "full") {
                            if (_this.questao.isCorrect == "true") {
                                $(_this.questao.elementId).find(".feedback-positivo").removeClass("hidden");
                                positionFeedbackTop = (($(_this).position().top + $(_this.questao.elementId).position().top) + $(_this.questao.elementId).find(".feedback-positivo").position().top) - ($('header').height() + 50);
                            } else if (_this.questao.isCorrect == "false") {
                                $(_this.questao.elementId).find(".feedback-negativo").removeClass("hidden");
                                positionFeedbackTop = (($(_this).position().top + $(_this.questao.elementId).position().top) + $(_this.questao.elementId).find(".feedback-negativo").position().top) - ($('header').height() + 50);
                            } else if (_this.questao.isCorrect == "neutro") {
                                $(_this.questao.elementId).find(".feedback-neutro").removeClass("hidden");
                                positionFeedbackTop = (($(_this).position().top + $(_this.questao.elementId).position().top) + $(_this.questao.elementId).find(".feedback-neutro").position().top) - ($('header').height() + 50);
                            }   
                        } else if (defaults.tipo == "multipla" || defaults.tipo == "vouf") {
                            if (_this.questao.isCorrect) {
                                $(_this.questao.elementId).find(".feedback-positivo").removeClass("hidden");
                                positionFeedbackTop = (($(_this).position().top + $(_this.questao.elementId).position().top) + $(_this.questao.elementId).find(".feedback-positivo").position().top) - ($('header').height() + 60);
                            } else if (!_this.questao.isCorrect) {
                                $(_this.questao.elementId).find(".feedback-negativo").removeClass("hidden");
                                positionFeedbackTop = (($(_this).position().top + $(_this.questao.elementId).position().top) + $(_this.questao.elementId).find(".feedback-negativo").position().top) - ($('header').height() + 50);
                            }
                        }
                    }

                    setVarSuspendData("data", getData());

                    $(_this.questao.elementId).find('.button-wrapper').find('button').off("click").css("cursor", "default");
                    $(_this.questao.elementId).find('.button-wrapper').hide();

                    if (btProxima) {
                        if (idQuestao == _this.totalQuestoes) {
                            finalizaQuiz();
                        } else {
                            $buttonProxima = $('<button>').addClass('btnProxima').html('Próxima Questão').on('click', function () {
                                if(defaults.tipo == "full") { $(_this.questao.elementImageId).fadeOut(600); }
                                $(_this.questao.elementId).fadeOut(600, function () { 
                                    proximaQuestao(); 
                                    positionFeedbackTop = $(_this).position().top - ($('header').height() + 20);
                                    $('html, body').stop( true, true ).animate({ scrollTop: positionFeedbackTop }, 1000);
                                });
                            });
                            $colButtonBorder = $('<div>').addClass('col').addClass('button-content').html($buttonProxima);
                            $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
                            $(_this.questao.elementId).append($rowButtonWrapper);

                            if(defaults.tipo == "full") { $rowButtonWrapper.wrap('<div class="container button-container"></div>'); }

                            $rowButtonWrapper.fadeIn(10);
                        }
                    } else {
                        if (animate) {
                            $('html, body').stop( true, true ).animate({ scrollTop: positionFeedbackTop }, 1000);
                            setTimeout(function() { proximaQuestao(); }, 1000);
                        } else {
                            proximaQuestao();
                        }
                    }
                }
            }
            function questaoCorreta() {
                let correto = null;

                if (_this.questao) {
                    let alternativas = $(_this.questao.elementId).find(".alternativas-wrapper");

                    if(defaults.tipo == "quiz" || defaults.tipo == "full") {
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
                    } else if (defaults.tipo == "multipla") {
                        let alternativaData,
                            alternativaInput,
                            countAcertos = 0;

                        $.each(alternativas, function(i,v){
                            alternativaData = $(this).find('input:checkbox').data('correto'),
                            alternativaInput = $(this).find('input:checkbox').prop('checked');

                            if (alternativaInput == alternativaData) {  countAcertos++; }
                        })

                        if (countAcertos == alternativas.length) { correto = true; }
                    } else if (defaults.tipo == "vouf") {
                        let alternativaData,
                            alternativaSel,
                            countAcertos = 0;

                        $.each(alternativas, function(i,v){
                            alternativaData = $(this).data('correto'),
                            alternativaSel = JSON.parse($(this).find('button[aria-checked=true]').val().toLowerCase());

                            if (alternativaData == alternativaSel) { countAcertos++; }
                        })
                        
                        _this.voufCorretos = countAcertos;
                        _this.voufQuestoes = alternativas.length;

                        if (countAcertos == alternativas.length) { correto = true; }
                    }
                }

                return correto;
            }

            ///////////////////////////////////////////////////////////////
            // QUIZ
            // SELECIONA ALTERNATIVA DO QUIZ
            function selecionaAlternativa(alternativaSelecionada, animate) {
                if (_this.questao) {
                    let alternativas = $(_this.questao.elementId).find(".alternativas-wrapper");
                    for (let i = 0; i != alternativas.length; i++) {
                        if (alternativas[i] == alternativaSelecionada) {
                            $(alternativas[i]).addClass("active").find('.alternativa-letter').attr('aria-checked', true);
                        } else {
                            $(alternativas[i]).removeClass("active").find('.alternativa-letter').attr('aria-checked', false);
                        }
                    }
                    $(_this.questao.elementId).find('.button-wrapper').fadeIn(600);

                    if (animate) {
                        let positionConfirmaTop = ($(_this).position().top + $(_this.questao.elementId).position().top) - ($('header').height() + 20);
                        $('html, body').animate({ scrollTop: positionConfirmaTop }, 1000);
                    }
                }
            }
            function alternativaCorreta(alternativa) {
                if (_this.questao) {
                    let alternativaData = $(alternativa).find('.alternativa-letter').data('correto');
                    
                    for (let i = 0; i != _this.questao.alternativasSorteadas.length; i++) {
                        if (alternativaData == _this.questao.alternativasSorteadas[i].correto) {
                            return _this.questao.alternativasSorteadas[i].correto;
                        }
                    }
                }
                return "false";
            }

            ///////////////////////////////////////////////////////////////
            // MULTIPLA ESCOLHA
            // SELECIONA ALTERNATIVA DA MULTIPLA ESCOLHA
            function selecionaAlternativaMultipla(alternativaSelecionada, animate) {
                if (_this.questao) {
                    parentAlternativa = $(alternativaSelecionada).parents('.alternativas-wrapper');

                    if (parentAlternativa.hasClass('active')) {
                        parentAlternativa.removeClass('active').find('input').attr('aria-checked', false);
                    } else {
                        parentAlternativa.addClass('active').find('input').attr('aria-checked', true); }

                    counterActive = 0;
                    $('.alternativas-wrapper').each(function(i,v){ if ($(this).hasClass('active')) counterActive++; })
                    if(counterActive != 0)
                        $(_this.questao.elementId).find('.button-wrapper').fadeIn(600);
                    else 
                        $(_this.questao.elementId).find('.button-wrapper').fadeOut(300);
                    

                    if (animate) {
                        let positionConfirmaTop = $(_this.questao.elementId).position().top - ($('header').height() + 20);
                        $('html, body').animate({ scrollTop: positionConfirmaTop }, 1000);
                    }
                }
            }
            function alternativaCorretaMultipla(alternativa) {
                if (_this.questao) {
                    let alternativaData = $(alternativa).find('input:checkbox').data('correto'),
                        alternativaInput = $(alternativa).find('input:checkbox').prop('checked');

                    for (let i = 0; i != _this.questao.alternativasSorteadas.length; i++) {
                        if (alternativaInput == alternativaData) { return true; }
                    }
                }
                return false;
            }

            ///////////////////////////////////////////////////////////////
            // MULTIPLA ESCOLHA
            // SELECIONA ALTERNATIVA DA MULTIPLA ESCOLHA
            function selecionaAlternativaVouF(alternativaSelecionada, animate) {
                if (_this.questao) {
                    parentAlternativa = $(alternativaSelecionada).parents('.alternativas-wrapper');

                    parentAlternativa.find('button').each(function(){
                        $(this).attr('aria-checked', false);
                    });
                    parentAlternativa.addClass('active');
                    $(alternativaSelecionada).attr('aria-checked', true);

                    counterActive = 0;
                    $(_this.questao.elementId).find('.alternativas-wrapper').each(function(i,v){ if ($(this).hasClass('active')) counterActive++; })
                    if(counterActive == $(_this.questao.elementId).find('.alternativas-wrapper').length) {
                        $(_this.questao.elementId).find('.button-wrapper').fadeIn(600);

                        if (animate) {
                            let positionConfirmaTop = $(_this.questao.elementId).position().top - ($('header').height() + 20);
                            $('html, body').animate({ scrollTop: positionConfirmaTop }, 1000);
                        }
                    }
                }
            }
            function alternativaCorretVouF(alternativa) {
                if (_this.questao) {
                    let alternativaData = $(alternativa).data('correto'),
                        alternativaSel = JSON.parse($(alternativa).find('button[aria-checked=true]').val().toLowerCase());

                    if (alternativaData == alternativaSel) { return true; }
                }
                return false;
            }

            ///////////////////////////////////////////////////////////////
            // FINALIZA O QUIZ
            function contagemCertos(obj) {
                let corretos = 0;

                for (let i = 0; i != obj.totalQuestoes; i++) {
                    if(defaults.tipo == "quiz" || defaults.tipo == "full") {
                        if (obj.arraySorted[i].isCorrect == "true") { corretos++; }
                    } else {
                        if (obj.arraySorted[i].isCorrect) { corretos++; }}
                }
                return corretos;
            }
            function finalizaQuiz(e) {
                atualizaContador();

                _this.find(".totalCerto").html(addZero(contagemCertos(_this)));
                _this.find(".totalQuestoes").html(addZero(_this.totalQuestoes));

                if (defaults.tipo == "vouf" && _this.totalQuestoes == 1) {
                    _this.find(".totalCerto").html(addZero(_this.voufCorretos));
                    _this.find(".totalQuestoes").html(addZero(_this.voufQuestoes));
                }

                _this.find(".final-quiz").removeClass("hidden");
                let positionSectionEndTop = ($(_this).position().top + _this.find('.final-quiz').position().top) - ($('header').height() + 20);
                $('html, body').animate({ scrollTop: positionSectionEndTop }, 1000);

                if (options.onFinish !== undefined) {
                    options.onFinish(e);
                }

                if (defaults.scorm) {
                    dataLms.scoreRaw = getPontuacao();
                    if (inLMS) { 
                        pipwerks.SCORM.set("cmi.core.score.raw", dataLms.scoreRaw); 
                        
                        if (dataLms.scoreRaw > 70)
                            setLessonStatus("passed");
                        else 
                            setLessonStatus("completed");
                    }
                    salvaTempo();
                }
            }

            ///////////////////////////////////////////////////////////////
            // CONTADOR
            function atualizaContador() {
                _this.find(".questao-acertos").html(addZero(contagemCertos(_this)));
                _this.find(".questao-info").html(_this.questao.num + " de " + addZero(_this.totalQuestoes));
                let currPorcentagem = { val: Number(_this.find(".progressao-info").html()), valTo: calculaPorc() };
                animateValue(_this.find(".progressao-info"), currPorcentagem.val, currPorcentagem.valTo, 600);

                //salvaTempo();
                
                if (defaults.scorm) salvaTempo();
            }
            function animateValue(obj, start, end, duration) {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    obj.html(Math.floor(progress * (end - start) + start));
                    if (progress < 1) { window.requestAnimationFrame(step); }
                };
                window.requestAnimationFrame(step);
            }
            function calculaPorc() {
                let percent = 0;
                let completeds = 0;
                for (let i = 0; i != _this.totalQuestoes; i++) {
                    if (_this.arraySorted[i].isComplete) { completeds++; }
                }
                percent = Math.floor((completeds * 100) / _this.totalQuestoes);
                return percent;
            }

            /////////////////////////////////////////////////////////////
            window.onbeforeunload = exitLMS;

            // PDF
            const jsPDF = window.jspdf.jsPDF;
            function createPDF() {
                const doc = new jsPDF("landscape");

                let width = doc.internal.pageSize.getWidth();
                let height = doc.internal.pageSize.getHeight();

                let imgCapa = 'data:image/jpeg;base64,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';
                doc.addImage(imgCapa, 'JPEG', 0, 0, width, height);
                
                let stringName = $('#txtNome').val();
                doc.setFont("helvetica", "bolditalic");
                doc.setFontSize(32);
                doc.setTextColor(0);
                doc.text(stringName, width / 2, height / 2, 'center');

                doc.save("Certificado.pdf");
            }

            // SCORM
            function syncData() {
                if (inLMS) {
                    pipwerks.SCORM.set("cmi.core.lesson_location", dataLms.lessonLocation);
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
                    suspendData += suspendData === "" ? variable + "=" + value : ";" + (variable + "=" + value);        
                } else {
                    let indexEnd = suspendData.indexOf(";", indexInit) <= -1 ? suspendData.length : suspendData.indexOf(";", indexInit),
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
                    let endPosition = suspendData.indexOf(";", startPosition) == -1 ? suspendData.length : suspendData.indexOf(";", startPosition);
                    let block = suspendData.substr(startPosition, endPosition - startPosition);
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
                    formattedTime = "0000:00:00"; }

                dataLms.sessionTime = formattedTime;
            }
            function setLessonStatus(status) {
                if (status == "completed" && dataLms.lessonStatus != "completed") {
                    dataLms.lessonStatus = "completed";
                } else {
                    dataLms.lessonStatus = status; }

                salvaTempo();
                syncData();
            }
            function getPontuacao() {
                let score = 0;                
                score = Math.floor(Math.floor(contagemCertos(_this) * 100) / _this.totalQuestoes);
                score = isNaN(score) ? 0 : score;
                return score;
            }
            function getData() {
                let data = [];

                for (let i = 0; i != _this.arraySorted.length; i++) {
                    if (_this.arraySorted[i].isComplete) { 
                        data.push({ 
                            id: _this.arraySorted[i].id, 
                            s: _this.arraySorted[i].alternativaSelecionada, 
                            c: _this.arraySorted[i].isComplete 
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
                    
                    if(defaults.tipo == "quiz" || defaults.tipo == "full") {
                        $.each(alternativas, function(i, v) {
                            if ($(this).find(".alternativa-letter p").html() == opcaoSelecionada) { $(this).addClass('active'); }
                        })
                    } else if (defaults.tipo == "multipla") {
                        $.each(alternativas, function(i, v) {
                            _alt = $(this);
                            $.each(opcaoSelecionada, function(j,val){
                               if (i == val) { _alt.find('input').prop('checked', true).attr('aria-checked', true); } 
                            });
                        })
                    } else if(defaults.tipo == "vouf") {
                        $.each(alternativas, function(i, v) {
                            _alt = $(this);
                            _alt.find('.falso').attr('aria-checked', true);

                            $.each(opcaoSelecionada, function(j,val){
                               if (i == val) { 
                                   _alt.find('.verdadeiro').attr('aria-checked', true); 
                                   _alt.find('.falso').attr('aria-checked', false); 
                                } 
                            });
                            
                        })
                    }
                }
            }
            // MOSTRA OPCOES COMPLETAS
            function mostraQuestaoCompleta(idQuestao) {
                if (defaults.botaoProxima)
                    $(_this).find('.questaosLoaded').hide();

                for (let i = 0; i <= idQuestao; i++) {
                    _this.questao = getQuestao(_this.arraySorted[i].id);

                    if (_this.questao) {
                        $(_this.questao.elementId).removeClass("hidden").hide().delay(200).fadeIn(600);

                        if(defaults.tipo == "quiz" || defaults.tipo == "full" ) {
                            selecionaAlternativa(_this.questao.id, false);
                        } else if (defaults.tipo == "multipla") {
                            selecionaAlternativaMultipla(_this.questao, false);
                        } else if(defaults.tipo == "vouf") {
                            selecionaAlternativaVouF(_this.questao, false);
                        }

                        marcaOpcao(_this.questao, _this.questao.alternativaSelecionada);
                        confirmarQuestao(_this.questao.id, false, defaults.botaoProxima);

                        if (defaults.botaoProxima) $('button.btnProxima').trigger('click');
                    }
                }
            
                setTimeout(function(){
                    if (defaults.botaoProxima) $(_this).find('.questaosLoaded').delay(800).fadeIn(600);

                    questaoVez = getQuestao(_this.arraySorted[idQuestao + 1].id);
                    $('html, body').animate({scrollTop : $(questaoVez.elementId).position().top - 95 }, 1000);
                }, 800);
            }
            
            function exitLMS() {
                if (inLMS) { pipwerks.SCORM.quit(); }
            }
        });
    }
}(jQuery));