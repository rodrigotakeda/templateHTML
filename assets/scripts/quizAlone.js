let inLMS = false,
    database = {},
    dataRecovery = null,
    dataInicio = 0,
    letters = null,
    quizFile = "assets/data/quizFull.json",
    currentQuestion = null,
    dataLms = { lessonLocation: 1, lessonStatus: "incomplete", sessionTime: "", scoreRaw: 0, suspendData: "" };
    
    let dataString = '[{|id|:1,|selected|:|A|,|completed|:true},{|id|:2,|selected|:|B|,|completed|:true},{|id|:3,|selected|:|A|,|completed|:true},{|id|:4,|selected|:|A|,|completed|:true}]';

function initQuizFull() {
    var ajaxLoader = $.getJSON(quizFile)
        .done(function (data) {
            inLMS = pipwerks.SCORM.init() ? true : false;
            
            dataInicio = new Date().getTime();
            
            if (inLMS) {
                var _lessonLocation = pipwerks.SCORM.get("cmi.core.lesson_location");
                if (_lessonLocation !== null && _lessonLocation !== undefined && _lessonLocation !== "null" && _lessonLocation !== "undefined" && _lessonLocation !== "") {
                    dataLms.lessonLocation = pipwerks.SCORM.get("cmi.core.lesson_location");
                } else {
                    dataLms.lessonLocation = "";
                }
                var _lessonStatus = pipwerks.SCORM.get("cmi.core.lesson_status");
                if (_lessonStatus !== null && _lessonStatus !== undefined && _lessonStatus !== "null" && _lessonStatus !== "undefined" && _lessonStatus !== "") {
                    dataLms.lessonStatus = pipwerks.SCORM.get("cmi.core.lesson_status");
                } else {
                    dataLms.lessonStatus = "";
                }
                var _suspendData = pipwerks.SCORM.get("cmi.suspend_data");
                if (_suspendData !== null && _suspendData !== undefined && _suspendData !== "null" && _suspendData !== "undefined" && _suspendData !== "") {
                    dataLms.suspendData = pipwerks.SCORM.get("cmi.suspend_data");
                } else {
                    dataLms.suspendData = "";
                }
            }
            
            dataRecovery = data;
            parseData(data);
        })
        .fail(function () {
            console.log("Load File Error");
        });
    window.onbeforeunload = exitLMS;
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
    var suspendData = dataLms.suspendData;
    var indexInit = suspendData.indexOf(variable + "=");

    if (indexInit <= -1) {
        suspendData += suspendData === "" ? variable + "=" + value : ";" + (variable + "=" + value);        
    } else {
        var indexEnd = suspendData.indexOf(";", indexInit) <= -1 ? suspendData.length : suspendData.indexOf(";", indexInit);
        var block = suspendData.substr(indexInit, indexEnd - indexInit);
        suspendData = suspendData.split(block).join(variable + "=" + value);
    }

    dataLms.suspendData = suspendData;
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
    var currentDate = "";
    var elapsedSeconds = "";
    var formattedTime = "";
    if (dataInicio !== 0) {
        currentDate = new Date().getTime();
        elapsedSeconds = (currentDate - this.dataInicio) / 1000;
        formattedTime = elapsedSeconds.toString().toHHMMSS();
    } else {
        formattedTime = "00:00:00";
    }
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

// SORTEIO DE DADOS
Array.prototype.shuffleArray = function(){ return this.sort(() => Math.random() - 0.5); }

// CONVERSAO DE TEMPO
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - hours * 3600) / 60);
    var seconds = sec_num - hours * 3600 - minutes * 60;
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ":" + minutes + ":" + seconds;
    return time;
};
var secondsToHhmmss = function (secs, withMMS) {
    var time = "00:00:00";
    var mms = (secs - Math.floor(secs)) * 100;
    mms = Math.floor(mms);
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = Math.floor((secs % 3600) % 60);
    if (withMMS == null || withMMS == false) {
        time = (h < 10 ? "0" + h.toString() + ":" : h.toString() + ":") + (m < 10 ? "0" + m.toString() : m.toString()) + ":" + (s < 10 ? "0" + s.toString() : s.toString());
    } else {
        time = (h < 10 ? "0" + h.toString() + ":" : h.toString() + ":") + (m < 10 ? "0" + m.toString() : m.toString()) + ":" + (s < 10 ? "0" + s.toString() : s.toString()) + ":" + (mms < 10 ? "0" + mms.toString() : mms.toString());
    }
    return time;
};
var hhmmssToSeconds = function (hms) {
    var a = hms.split(":");
    var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
    return seconds;
};

// ADD ZERO
function addZero(n) { return n <= 9 ? "0" + n : n; }

function parseData(data) {
    quizWrapper = $('.wrapper_quizFull').find('#quiz');
    
    if (data.type == "numeros") {
        letters = "123456789".split("");
    } else {
        letters = "ABCDEFGHI".split(""); }
    
    $counterText = $('<p>').html('Questão <span id="question-information"></span> | <span id="progress-information">0</span>%');
    $counterStep = $('<div>').addClass('counter-step').html($counterText);
    $counterWrapper = $('<div>').addClass('counter-wrapper').html($counterStep);

    $contentFeedFinal = $('<div>').addClass('col-xl-10 offset-xl-1').html('<p>Você chegou ao fim do desafio e acertou <strong><span id="total-wright-answers">00</span></strong> questões das <strong><span id="total-questions">00</span></strong> situações propostas.</p><p>Não se esqueça: influenciar é uma forma de fazer com que todos caminhem juntos para um mesmo objetivo!</p>');
    $rowFeedFinal = $('<div>').addClass('row').html($contentFeedFinal);
    $containerFeedFinal = $('<div>').addClass('container').html($rowFeedFinal);
    $sectionFinal = $('<section>').attr('id','final-quiz').addClass('hidden').html($containerFeedFinal);    

    $questionsLoaded = $('<div>').attr('id', 'questionsLoaded');

    randomQuestions = quizWrapper.attr('random');
    if (randomQuestions == 'true') {
        array_temp = new Array();
        for (i = 0; i < data.questions.length; i++) { array_temp.push(data.questions[i]); }
        arraySorted = array_temp.shuffleArray();
    } else {
        arraySorted = new Array();
        for (i = 0; i < data.questions.length; i++) { arraySorted.push(data.questions[i]); }
    }
    
    for (var i = 0; i != data.questions.length; i++) {
        questao = arraySorted[i];
        $imagemDivisao = $('<div>').addClass("image-parallax").attr('style', "background-image: url(files/images/quiz/" + questao.image + ");").data('image', 'files/images/quiz/' + questao.image);
        $divisaoQuestao = $('<section>').attr('id', 'divisao-questao-' + addZero(i + 1)).addClass("divisao-questao hidden").html($imagemDivisao);

        $questaoWrapper = $('<div>').addClass('col-xl-10 offset-xl-1').addClass('questao-wrapper');
        
        if (questao.introducao != '') {
            $introContent = $('<div>').addClass('questao-introducao').html(questao.introducao);
            $questaoWrapper.append($introContent);
        }

        $colNumPergunta = $('<div>').addClass('col-sm-2 col-lg-2').addClass('numero-questao').html('<p>' + addZero(i + 1) + '</p>');
        $colTextPergunta = $('<div>').addClass('col-sm-10 col-lg-10').addClass('pergunta-questao').html(questao.question);
        $rowPergunta = $('<div>').addClass('row').addClass('pergunta-wrapper').addClass('align-items-center').html($colNumPergunta).append($colTextPergunta);
        $questaoWrapper.append($rowPergunta);
        
        randomOptions = quizWrapper.attr('random_options');
        if (randomOptions == 'true') {
            opt_temp = new Array();
            for (j = 0; j < questao.alternatives.length; j++) { opt_temp.push(questao.alternatives[j]); }
            arrayAlternates = opt_temp.shuffleArray();
        } else {
            arrayAlternates = new Array();
            for (j = 0; j < questao.alternatives.length; j++) { arrayAlternates.push(questao.alternatives[j]); }
        }
        
        for (var n = 0; n != questao.alternatives.length; n++) {
            arrayAlternates[n].letter = letters[n];
            $colIconAlternativa = $('<div>').addClass('col-sm-2 col-lg-1').addClass('icon-feedback').html('<div class="icon-certo"></div><div class="icon-errado"></div>');
            $colLetterAlternativa = $('<div>').addClass('col-sm-2 col-lg-1').addClass('alternative-letter').html('<p>' + letters[n] + '</p>');
            $colContentAlternativa = $('<div>').addClass('col-sm-8 col-lg-10').addClass('alternative-content').html(arrayAlternates[n].text);
            $rowAlternativa = $('<div>').addClass('row').addClass('alternatives-wrapper').html($colIconAlternativa).append($colLetterAlternativa).append($colContentAlternativa);
            $questaoWrapper.append($rowAlternativa);
        }

        $rowContent = $('<div>').addClass('row').html($questaoWrapper);
        $containerContent = $('<div>').addClass('container').html($rowContent);
        $contentQuestao = $('<section>').attr('id', 'sectionQuestao-' + addZero(i + 1)).addClass("content-wrapper hidden").html($containerContent);

        $buttonConfirmar = $('<button>').html('Confirmar');
        $colButtonBorder = $('<div>').addClass('col-xl-10 offset-xl-1').addClass('button-border').html($buttonConfirmar);
        $rowButtonWrapper = $('<div>').addClass('row').addClass('button-wrapper').html($colButtonBorder);
        $containerContent.append($rowButtonWrapper);

        $colFeedPositivo = $('<div>').addClass('col-xl-10 offset-xl-1').html(questao.feedbacks.correct);
        $rowFeedPositivo = $('<div>').addClass('row').addClass('feedback-row').html($colFeedPositivo);
        $containerFeedPositivo = $('<div>').addClass('container').html($rowFeedPositivo);
        $contentFeedPositivo = $('<div>').addClass('feedback-wrapper').addClass('feedback-positivo').addClass('hidden').html($containerFeedPositivo);

        $colFeedNegativo = $('<div>').addClass('col-xl-10 offset-xl-1').html(questao.feedbacks.incorrect);
        $rowFeedNegativo = $('<div>').addClass('row').addClass('feedback-row').html($colFeedNegativo);
        $containerFeedNegativo = $('<div>').addClass('container').html($rowFeedNegativo);
        $contentFeedNegativo = $('<div>').addClass('feedback-wrapper').addClass('feedback-negativo').addClass('hidden').html($containerFeedNegativo);

        $contentQuestao.append($contentFeedPositivo).append($contentFeedNegativo);

        $questionsLoaded.append($divisaoQuestao).append($contentQuestao);
        
        // QUESTIONS
        questao.num = addZero(i + 1);
        questao.elementImageId = "#divisao-questao-" + questao.num;
        questao.elementId = "#sectionQuestao-" + questao.num;
        questao.existIntro = questao.introducao != "";
        for (var n = 0; n != questao.alternatives.length; n++) {
            questao.alternatives[n].letter = letters[n];
        }
    }
    database = arraySorted;

    quizWrapper.html($counterWrapper).append($questionsLoaded).append($sectionFinal);

    montaQuiz();
}
function getQuestion(id) {
    for (var i = 0; i != database.length; i++) {
        if (database[i].id == id) { return database[i]; }
    }
    return false;
}
function getData() {
    var data = [];
    for (var i = 0; i != database.length; i++) {
        if (database[i].isComplete) { data.push({ id: database[i].id, selected: database[i].alternativaSelecionada, completed: database[i].isComplete }); }
    }
    data = JSON.stringify(data);
    data = data.split('"').join("|");
    return data;
}
function setData(str) {
    str = str.split("|").join('"');

    let recoverData = JSON.parse(str),
        question = null,
        lastQuestionSeen = null;
    
    for (var i = 0; i != recoverData.length; i++) {
        question = getQuestion(recoverData[i].id);
        if (question) {
            question.isComplete = recoverData[i].completed;
            question.alternativaSelecionada = recoverData[i].selected;
            question.isCorrect = false;
            for (var n = 0; n != question.alternatives.length; n++) {
                if (question.alternatives[n].letter == question.alternativaSelecionada) {
                    if (question.alternatives[n].correct) {
                        question.isCorrect = true;
                    }
                }
            }

            lastQuestionSeen = question.id;
        }
    }

    showCompleteQuestion(lastQuestionSeen);

    atualizaContador();
}

function showCompleteQuestion(idQuestao) {
    for (var i = 0; i <= idQuestao; i++) {
        question = getQuestion(i);

        if (question) {
            $(question.elementId).removeClass("hidden");
            $(question.elementImageId).removeClass("hidden");
            selecionaAlternativa(question.id, selecionaOpcao(question.id, question.alternativaSelecionada), false);
            confirmarQuestao(question.id, false);
        }
    }

    questionVez = getQuestion(idQuestao + 1);
    $('html, body').animate({scrollTop : $(questionVez.elementImageId).position().top - 95 }, 1000);
}

function montaQuiz() {
    if (dataLms.suspendData != "") {
        proximaQuestao();
        setData(getVarSuspendData("data"));
    } else {
        proximaQuestao();
        setData(dataString);
    }
}
function mostraQuestao(idQuestao) {
    var question = getQuestion(idQuestao);
    if (question) {
        currentQuestion = question;
        $(question.elementId).removeClass("hidden");
        $(question.elementImageId).removeClass("hidden");
        
        var img = new Image();
        img.src = $(question.elementImageId).find(".image-parallax").data("image");
        var alternatives = $(question.elementId).find(".alternatives-wrapper");
        for (var i = 0; i != alternatives.length; i++) {
            $(alternatives[i])
                .off("click")
                .on("click", function () {
                    selecionaAlternativa(idQuestao, this, true);
                });
        }
        atualizaContador();
    }

    $(question.elementId).find(".button-wrapper button").off().on("click", function () {
        confirmarQuestao(idQuestao, true);
    });
}
function selecionaOpcao(idQuestao, opcaoSelecionada) {
    var question = getQuestion(idQuestao);
    if (question) {
        var alternatives = $(question.elementId).find(".alternatives-wrapper");
        for (var i = 0; i != alternatives.length; i++) {
            if ($(alternatives[i]).find(".alternative-letter p").html() == opcaoSelecionada) {
                return alternatives[i];
            }
        }
    }
}
function selecionaAlternativa(idQuestao, alternativaSelecionada, animate) {
    var question = getQuestion(idQuestao);
    if (question) {
        var alternatives = $(question.elementId).find(".alternatives-wrapper");
        for (var i = 0; i != alternatives.length; i++) {
            if (alternatives[i] == alternativaSelecionada) {
                $(alternatives[i]).addClass("active");
            } else {
                $(alternatives[i]).removeClass("active");
            }
        }
        $(question.elementId).find('.button-wrapper').fadeIn(600);

        if (animate) {
            var positionConfirmButtomTop = $(question.elementId).position().top + $(question.elementId).find('.button-wrapper').position().top;
            $('html, body').animate({scrollTop : positionConfirmButtomTop }, 1000);
        }
    }
}
function confirmarQuestao(idQuestao, animate) {
    var question = getQuestion(idQuestao);
    if (question) {
        var alternatives = $(question.elementId).find(".alternatives-wrapper");
        for (var i = 0; i != alternatives.length; i++) {
            $(alternatives[i]).off("click");
            $(alternatives[i]).addClass("disabled");
            if ($(alternatives[i]).hasClass("active")) {
                question.alternativaSelecionada = $(alternatives[i]).find(".alternative-letter p").html();
            }
            if (alternativeIsCorrect(idQuestao, alternatives[i])) {
                $(alternatives[i]).find(".icon-certo").fadeIn(600);
            } else {
                $(alternatives[i]).find(".icon-errado").fadeIn(600); }
        }
        question.isComplete = true;
        question.isCorrect = questionIsCorrect(idQuestao);
        var positionFeedbackTop = 0;

        if (question.isCorrect) {
            $(question.elementId).find(".feedback-positivo").removeClass("hidden");
            positionFeedbackTop = $(question.elementId).position().top + $(question.elementId).find(".feedback-positivo").position().top;
        } else {
            $(question.elementId).find(".feedback-negativo").removeClass("hidden");
            positionFeedbackTop = $(question.elementId).position().top + $(question.elementId).find(".feedback-negativo").position().top;
        }
        atualizaContador();
        setVarSuspendData("data", getData());
        
        if (animate) {
            $('html, body').animate({scrollTop : positionFeedbackTop }, 1000, function() { proximaQuestao(); });
        } else {
            proximaQuestao(); }

        $(question.elementId).find('.button-wrapper').find('button').off("click").css("cursor", "default");
        $(question.elementId).find('.button-wrapper').hide();
    }
}
function questionIsCorrect(idQuestao) {
    var correct = false;
    var question = getQuestion(idQuestao);
    if (question) {
        var alternatives = $(question.elementId).find(".alternatives-wrapper");
        for (var i = 0; i != alternatives.length; i++) {
            if ($(alternatives[i]).hasClass("active")) {
                if (alternativeIsCorrect(idQuestao, alternatives[i])) {
                    correct = true;
                }
            }
        }
    }
    return correct;
}
function alternativeIsCorrect(idQuestao, alternative) {
    let question = getQuestion(idQuestao);
    if (question) {
        let alternativeLetter = $(alternative).find(".alternative-letter p").html();
        //var alternativeText = $(alternative).find(".alternative-content").html();
        for (var i = 0; i != question.alternatives.length; i++) {
            if (question.alternatives[i].letter == alternativeLetter) {
                return question.alternatives[i].correct;
            }
        }
    }
    return false;
}

function proximaQuestao() {
    for (var i = 0; i != database.length; i++) {
        if (database[i].isComplete != true) {
            mostraQuestao(database[i].id);
            return false;
        }
    }
    finalizaQuiz();
}
function getPercent() {
    var percent = 0;
    var completeds = 0;
    for (var i = 0; i != database.length; i++) {
        if (database[i].isComplete) {
            completeds++;
        }
    }
    percent = Math.floor((completeds * 100) / database.length);
    return percent;
}
function getCorrects() {
    var corrects = 0;
    for (var i = 0; i != database.length; i++) {
        if (database[i].isCorrect) {
            corrects++;
        }
    }
    return corrects;
}
function getScore() {
    var score = 0;
    score = Math.floor(Math.floor(getCorrects() * 100) / database.length);
    score = isNaN(score) ? 0 : score;
    return score;
}
function getIncorrects() {
    return database.length - getCorrects();
}

function atualizaContador() {
    $("#question-information").html(currentQuestion.num + " de " + addZero(database.length));
    $("#total-wright-answers").html(addZero(getCorrects()));
    $("#total-questions").html(addZero(database.length));
    let currPercent = { val: Number($("#progress-information").html()), valTo: getPercent() };

    animateValue($("#progress-information"), currPercent.val, currPercent.valTo, 600);
    salvaTempo();
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

function finalizaQuiz() {
    $("#final-quiz").removeClass("hidden");
    var positionSectionEndTop = $("#final-quiz").position().top;
	$('html, body').animate({scrollTop : positionSectionEndTop }, 1000);

    dataLms.scoreRaw = getScore();
    if (inLMS) {
        pipwerks.SCORM.set("cmi.core.score.raw", dataLms.scoreRaw);
    }
    setLessonStatus("completed");

    salvaTempo();
}

function exitLMS() {
    if (inLMS) {
        pipwerks.SCORM.quit();
    }
}

$(function () {
    initQuizFull();

    $("#changeQuiz").change(function(){
		let valor = $(this).val().split('/');
        $('#quiz').attr('random', valor[0]).attr('random_options', valor[1]);

		parseData(dataRecovery);
	});
});