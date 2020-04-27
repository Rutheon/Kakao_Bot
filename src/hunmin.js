const scriptName = "hunmin.js";
const botName = "민규봇";

var preSenders = null;
var preSendTime = null;
var preChat = null;
var coolDown = 5;

function IsUsingWord(str) {
    var dicData = Utils.getWebText("https://stdict.korean.go.kr/api/search.do?key=4667CDAEBF929656EF78F007CCA0848A&q=" + str).replace(/\s\s/g,"");
    var data = [];
    try {
        data = [
            dicData.split("<total>")[1].split("</total>")[0],
            dicData.split("<word><![CDATA[")[1].split("]")[0],
            dicData.split("<pos>")[1].split("</pos>")[0],
            dicData.split("<definition><![CDATA[")[1].split("]")[0]
        ];
    } catch (e) {
        data[0] = 0;
    }

    if (parseInt(data[0]) == 0) {
        return false;
    } else {
        return data;
    }
}

// 훈민정음
h_playroom = {};

function Hunmin(strLen, timer, consonant) {
    cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    this.state = "wating"; // 게임 상태
    this.keywords = ""; // 제시어
    for (var i = 0; i < strLen; i++) {
        var temp = cho[parseInt(Utils.getWebText("http://dsg01.dothome.co.kr/api/rand.php?type=number&min=0&max=18").replace(/(<([^>]+)>)/ig, ""))];
        if (consonant) {
            while (["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"].indexOf(temp) != -1) {
                temp = cho[parseInt(Utils.getWebText("http://dsg01.dothome.co.kr/api/rand.php?type=number&min=0&max=18").replace(/(<([^>]+)>)/ig, ""))];
            }
        }
        this.keywords += temp;
    }
    this.timer = timer;
    this.nowPlaying = 0;
    this.user = [];
    this.used = [];

    this.ansCmp = function (str) {
        result = "";
        for (i = 0; i < str.length; i++) {
            code = str.charCodeAt(i) - 44032;
            if (code > -1 && code < 11172) {
                result += cho[Math.floor(code / 588)];
            }
        }
        if (result == this.keywords) {
            return IsUsingWord(str);
        } else {
            return false;
        }
    };
}



function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId) {
    /*(이 내용은 길잡이일 뿐이니 지우셔도 무방합니다)
     *(String) room: 메시지를 받은 방 이름
     *(String) msg: 메시지 내용
     *(String) sender: 전송자 닉네임
     *(boolean) isGroupChat: 단체/오픈채팅 여부
     *replier: 응답용 객체. replier.reply("메시지") 또는 replier.reply("방이름","메시지")로 전송
     *(String) ImageDB.getProfileImage(): 전송자의 프로필 이미지를 Base64로 인코딩하여 반환
     *(String) packageName: 메시지를 받은 메신저의 패키지 이름. (카카오톡: com.kakao.talk, 페메: com.facebook.orca, 라인: jp.naver.line.android
     *(int) threadId: 현재 쓰레드의 순번(스크립트별로 따로 매김)     *Api,Utils객체에 대해서는 설정의 도움말 참조*/
    try {
        var nowTime = Date.now();
    var date = new Date();

    msg = msg.split(' ');

    if (msg[0] == "!" + botName) {
        //봇끼리의 도배 방지 부분
        if (preSenders == sender && (nowTime - preSendTime) / 1000 <= coolDown) {
            return;
        }
        preSendTime = nowTime;
        preSenders = sender;

        if (msg[1] == "훈민정음") {
            if (h_playroom[room] || E_playroom[room]) {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "게임 중에는 다른 게임을 생성할 수 없습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
            } else {
                var wordLen = 2;
                var timerSet = 15;
                var consonant = false;
                if (msg.indexOf("-l") != -1) {
                    wordLen = parseInt(msg[msg.indexOf("-l") + 1]);
                    if (isNaN(wordLen) == true || parseInt(wordLen) == 0) {
                        wordLen = 2;
                    }
                }
                if (msg.indexOf("-t") != -1) {
                    timerSet = parseInt(msg[msg.indexOf("-t") + 1]);
                    if (isNaN(timerSet) == true || parseInt(timerSet) == 0) {
                        timerSet = 15;
                    }
                }
                if (msg.indexOf("-c") != -1) {
                    consonant = true;
                }
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    sender + "의 요청으로 게임이 시작됩니다.\n" +
                    "글자수:" + wordLen + "\n" +
                    "첫 시간 제한:" + timerSet + "\n" +
                    "쌍자음 제거: " + consonant + "\n" +
                    "'/참가'를 입력하여 게임에 참여하실 수 있습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
                h_playroom[room] = new Hunmin(wordLen, timerSet, consonant);
                h_playroom[room].user.push(sender);

                const timer = 15;
                java.lang.Thread.sleep(timer * 1000);
                h_playroom[room].state = "game";
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "게임이 시작됩니다. 초성 : " + h_playroom[room].keywords + "\n" +
                    "-=-=-=-=참가자 목록-=-=-=-=\n" +
                    h_playroom[room].user.join(",\n") +
                    "\n-=-=-=-=-=-=-=-=-=-=-=-="
                );
                replier.reply(h_playroom[room].user[0] + "의 차례입니다./제한시간 :" + h_playroom[room].timer + "초\n");

                var checkWin = h_playroom[room].nowPlaying;
                java.lang.Thread.sleep(h_playroom[room].timer * 1000);
                if (h_playroom[room].user[h_playroom[room].nowPlaying] != checkWin) {
                    return;
                }
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "게임이 종료되었습니다.\n" +
                    sender + "(이)가 게임에서 패배하였습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
                delete h_playroom[room];
            }
            return;
        }
    }

    try {
        if (msg[0] == "/참가") {
            if (h_playroom[room].user.indexOf(sender) != -1) {
                replier.reply("참가는 한 번 만 가능합니다");
            } else if (h_playroom[room].state == "wating") {
                h_playroom[room].user.push(sender);
                replier.reply(sender + "(이)가 게임에 참여합니다");
            } else {
                replier.reply("현재 게임에 참여하실 수 없습니다.");
            }
        }
    } catch (e) {
        return;
    }

    if (h_playroom[room] != undefined) {
        if (h_playroom[room].state == "game" && h_playroom[room].user[h_playroom[room].nowPlaying % h_playroom[room].user.length] == sender) {
            var dicData = h_playroom[room].ansCmp(msg.join(""));

            if (h_playroom[room].used.indexOf(msg.join("")) != -1) {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    msg.join("") + "은(는) 이미 제출된 단어입니다.\n" +
                    "초성 : " + h_playroom[room].keywords + "\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
            } else if (dicData != false) {
                h_playroom[room].nowPlaying++;
                h_playroom[room].used.push(msg.join(""));

                if (h_playroom[room].nowPlaying % h_playroom[room].user.length == 0) {

                    if (h_playroom[room].timer - 1 > 1) {
                        h_playroom[room].timer = h_playroom[room].timer - 1;
                    } else {
                        h_playroom[room].timer = 1;
                    }
                }

                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "[" + dicData[2] + "] " + dicData[1] + "\n" +
                    dicData[3] + "\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-=\n" +
                    h_playroom[room].user[(h_playroom[room].nowPlaying % h_playroom[room].user.length)] + "의 차례\n" +
                    "초성 : " + h_playroom[room].keywords + "/" + h_playroom[room].timer + "초\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
                var checkWin = h_playroom[room].nowPlaying;
                java.lang.Thread.sleep(h_playroom[room].timer * 1000);

                if (h_playroom[room]&&h_playroom[room].nowPlaying == checkWin) {
                    replier.reply(
                        "-=-=-=-=-=안내-=-=-=-=-=\n" +
                        "게임이 종료되었습니다.\n" +
                        h_playroom[room].user[checkWin % h_playroom[room].user.length] + "(이)가 게임에서 패배하였습니다.\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    delete h_playroom[room];
                    return;
                }

            } else {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    msg.join("") + "은(는) 제시된 초성과 다르거나 사전에 등록되어 있지 않습니다.\n" +
                    "초성 : " + h_playroom[room].keywords + "\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
            }
        }
    }

    } catch (e) {
        replier.reply(
            "-=-=-=-=-=Err Log-=-=-=-=-=\n" +
            e + "\n" +
            "-=-=-=-=-=-=-=-=-=-=-=-="
        );
    }
    

}


function onStartCompile() {
    /*컴파일 또는 Api.reload호출시, 컴파일 되기 이전에 호출되는 함수입니다.
     *제안하는 용도: 리로드시 자동 백업*/

}

//아래 4개의 메소드는 액티비티 화면을 수정할때 사용됩니다.
function onCreate(savedInstanceState, activity) {
    var layout = new android.widget.LinearLayout(activity);
    layout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    var txt = new android.widget.TextView(activity);
    txt.setText("액티비티 사용 예시입니다.");
    layout.addView(txt);
    activity.setContentView(layout);
}

function onResume(activity) {}

function onPause(activity) {}

function onStop(activity) {}