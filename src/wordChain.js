const scriptName = "wordChain.js";
const botName = "민규봇";

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

var hash = function (s) {
    /* Simple hash function. */
    var a = 1,
        c = 0,
        h, o;
    if (s) {
        a = 0;
        for (h = s.length - 1; h >= 0; h--) {
            o = s.charCodeAt(h);
            a = (a << 6 & 268435455) + o + (o << 14);
            c = a & 266338304;
            a = c !== 0 ? a ^ c >> 21 : a;
        }
    }
    return String(a);
};

function permissionCheck(sender, hash) {
    var adminData;
    try {
        adminData = DataBase.getDataBase("admin.txt").split("}");
    } catch (e) {
        return false;
    }

    for (let index = 0; index < adminData.length; index++) {
        if (adminData[index].indexOf(hash) != -1) {
            if (adminData[index].split(",")[0] == sender) {
                return true;
            }
        }
    }
    return false;
}

function IsUsingWord(str) {
    var dicData = Utils.getWebText("https://stdict.korean.go.kr/api/search.do?key=4667CDAEBF929656EF78F007CCA0848A&q=" + str).replace(/\s\s/g, "");
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
// 끝말잇기
E_playroom = {};

function getDoumChar(lastChar) {
    let data = lastChar.charCodeAt() - 0xAC00;
    if (data < 0 || data > 11171) {
        return false;
    }

    const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
    const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
    const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];

    let onset = Math.floor(data / 28 / 21) + 0x1100,
        nucleus = (Math.floor(data / 28) % 21) + 0x1161,
        coda = (data % 28) + 0x11A7,
        isDoumChar = false,
        doumChar;

    if (onset == 4357) {
        isDoumChar = true;
        (RIEUL_TO_NIEUN.indexOf(nucleus) != -1) ? onset = 4354: (RIEUL_TO_IEUNG.indexOf(nucleus) != -1) ? onset = 4363 : isDoumChar = false;
    } else if (onset == 4354) {
        if (NIEUN_TO_IEUNG.indexOf(nucleus) != -1) {
            onset = 4363;
            isDoumChar = true;
        }
    }
    if (isDoumChar) {
        onset -= 0x1100;
        nucleus -= 0x1161;
        coda -= 0x11A7;
        doumChar = String.fromCharCode(((onset * 21) + nucleus) * 28 + coda + 0xAC00);
    }

    return doumChar;
}

function EndingWord(timer, mode, life) {
    this.state = "wating"; // 게임 상태
    this.timer = timer;
    this.lifeLimit = life;
    this.difficulty = "normal";
    if (mode) {
        this.difficulty = "noOneKill";
    }
    this.blackList = ["릇", "늬", "륨", "뮴", "늄", "듐", "튬", "슭", "즙", "꾼"];
    this.nowPlaying = 0;
    this.user = [];
    this.score = [];
    this.life = [];
    this.used = [];

    var startWord = Utils.getWebText("http://dsg01.dothome.co.kr/api/rand.php?type=word").replace(/(\s)+/g, "").replace(/(<([^>]+)>)/ig, "");
    this.used.push(startWord);
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
        msg = msg.split(' ');

        if (msg[0] == "!" + botName && msg[1] == "끝말잇기") {

            if (E_playroom[room]) {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "게임 중에는 다른 게임을 생성할 수 없습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
            } else {
                var timerSet = 20;
                var timer = 15;
                var life = 3;
                if (msg.indexOf("-t") != -1) {
                    timerSet = parseInt(msg[msg.indexOf("-t") + 1]);
                    if (isNaN(timerSet) == true || parseInt(timerSet) == 0) {
                        timerSet = 15;
                    }
                }

                if (msg.indexOf("-l") != -1) {
                    life = parseInt(msg[msg.indexOf("-l") + 1]);
                    if (isNaN(life) == true || parseInt(life) == 0) {
                        timerSet = 3;
                    }
                }

                var mode = true;
                if (msg.indexOf("-k") != -1) {
                    mode = false;
                }

                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    sender + "의 요청으로 게임이 시작됩니다.\n" +
                    "첫 시간 제한:" + timerSet + "\n" +
                    "life :" + life + "\n" +
                    "한방단어 제한:" + mode + "\n" +
                    "'/참가'를 입력하여 게임에 참여하실 수 있습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );

                E_playroom[room] = new EndingWord(timerSet, mode, life);
                E_playroom[room].user.push(sender);
                E_playroom[room].score.push(0);
                E_playroom[room].life.push(life);

                java.lang.Thread.sleep(timer * 1000);

                var lastChar = E_playroom[room].used[0].charAt(E_playroom[room].used[0].length - 1);
                var startSyllable = [];
                startSyllable[0] = lastChar;
                if (getDoumChar(lastChar)) {
                    startSyllable[1] = getDoumChar(lastChar);
                }

                var dicData = IsUsingWord(E_playroom[room].used[0]);


                E_playroom[room].state = "game";
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "게임이 시작됩니다.\n" +
                    "-=-=-=-=참가자 목록-=-=-=-=\n" +
                    E_playroom[room].user.join(",\n") +
                    "\n-=-=-=-=-=-=-=-=-=-=-=-="
                );

                shuffle(E_playroom[room].user);

                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "시작단어:" + E_playroom[room].used[0] + "\n" +
                    "[" + dicData[2] + "] " + dicData[1] + "\n" +
                    dicData[3] + "\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-=\n" +
                    "\""+E_playroom[room].user[0] + "\"의 차례입니다.\n" +
                    "\"" + startSyllable.join(" 또는 ") + "\"(으)로 시작하는 단어를 입력해 주세요\n" +
                    "제한시간 :" + E_playroom[room].timer + "초"
                );

                var checkWin = E_playroom[room].nowPlaying;
                java.lang.Thread.sleep(E_playroom[room].timer * 1000);

                if (E_playroom[room] && E_playroom[room].nowPlaying == checkWin) {
                    E_playroom[room].life[0]--;
                    return;
                }
            }
            return;
        }

        if (msg[0] == "/참가") {
            try {
                if (E_playroom[room].user.indexOf(sender) != -1) {
                    replier.reply("참가는 한 번 만 가능합니다");
                } else if (E_playroom[room].state == "wating") {
                    E_playroom[room].user.push(sender);
                    E_playroom[room].score.push(0);
                    E_playroom[room].life.push(E_playroom[room].lifeLimit);
                    replier.reply(sender + "(이)가 게임에 참여합니다");
                } else {
                    replier.reply("현재 게임에 참여하실 수 없습니다.");
                }
            } catch (e) {
                return;
            }
        }

        if (msg[0] == "/종료" && E_playroom[room]) {
            var check = permissionCheck(sender, hash(ImageDB.getProfileImage()));
    
            if (check == true) {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "관리자의 권한으로 게임이 중지됩니다\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
                delete E_playroom[room];
                return;
            } else {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    "Permission denied.\n" +
                    "게임을 중지할 권한이 업습니다.\n" +
                    "-=-=-=-=-=-=-=-=-=-=-=-="
                );
            }
        }

        if (E_playroom[room] != undefined) {
            if (E_playroom[room].state == "game" && E_playroom[room].user[E_playroom[room].nowPlaying % E_playroom[room].user.length] == sender) {

                var lastChar = E_playroom[room].used[E_playroom[room].nowPlaying].charAt(E_playroom[room].used[E_playroom[room].nowPlaying].length - 1);

                var startSyllable = [];
                startSyllable[0] = lastChar;
                if (getDoumChar(lastChar)) {
                    startSyllable[1] = getDoumChar(lastChar);
                }

                var dicData = IsUsingWord(msg.join(""));
                var score = msg.join("").length;

                if (E_playroom[room].used.indexOf(msg.join("")) != -1) {
                    replier.reply(
                        "-=-=-=-=-=안내-=-=-=-=-=\n" +
                        msg.join("") + "은(는) 이미 제출된 단어입니다.\n" +
                        "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    return;
                } else if (dicData != false) {
                    if (score == 1) {
                        replier.reply(
                            "-=-=-=-=-=안내-=-=-=-=-=\n" +
                            "한 글자를 적는 당신의 양심을 제작자가 가만히 보고 있을 수는 없었습니다.\n" +
                            "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "\n" +
                            "-=-=-=-=-=-=-=-=-=-=-=-="
                        );
                        return;
                    } else if (startSyllable.indexOf(msg.join("").charAt(0)) == -1) {
                        replier.reply(
                            "-=-=-=-=-=안내-=-=-=-=-=\n" +
                            startSyllable.join(" 또는 ") + "\"(으)로 시작하는 단어를 입력해주세요.\n" +
                            "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "\n" +
                            "-=-=-=-=-=-=-=-=-=-=-=-="
                        );
                        return;
                    }

                    if (E_playroom[room].difficulty == "noOneKill" && E_playroom[room].blackList.indexOf(msg.join("").charAt(msg.join("").length - 1)) != -1) {
                        replier.reply(
                            "-=-=-=-=-=안내-=-=-=-=-=\n" +
                            "한방단어 제한 모드입니다.\n" +
                            E_playroom[room].blackList.join(", ") +
                            "으로 끝 나는 단어는 사용 할 수 없습니다.\n" +
                            "-=-=-=-=-=-=-=-=-=-=-=-="
                        );
                        return;
                    }
                    
                    E_playroom[room].score[E_playroom[room].nowPlaying % E_playroom[room].user.length] += score;
                    E_playroom[room].nowPlaying++;
                    E_playroom[room].used.push(msg.join(""));

                    if (E_playroom[room].nowPlaying % E_playroom[room].user.length == 0) {

                        if (E_playroom[room].timer - 1 > 1) {
                            E_playroom[room].timer = E_playroom[room].timer - 1;
                        } else {
                            E_playroom[room].timer = 1;
                        }
                    }

                    lastChar = E_playroom[room].used[E_playroom[room].nowPlaying].charAt(E_playroom[room].used[E_playroom[room].nowPlaying].length - 1);

                    startSyllable = [];
                    startSyllable[0] = lastChar;
                    if (getDoumChar(lastChar)) {
                        startSyllable[1] = getDoumChar(lastChar);
                    }

                    replier.reply(
                        "-=-=-=-=-=안내-=-=-=-=-=\n" +
                        score + "점 획득!\n" +
                        "[" + dicData[2] + "] " + dicData[1] + "\n" +
                        dicData[3] + "\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-=\n" +
                        "\""+E_playroom[room].user[(E_playroom[room].nowPlaying % E_playroom[room].user.length)] + "\"의 차례\n" +
                        startSyllable.join(" 또는 ") + "(으)로 시작하는 단어를 입력해주세요.\n" +
                        "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "/" + E_playroom[room].timer + "초\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    
                    var checkWin;
                    while (E_playroom[room].life[E_playroom[room].nowPlaying % E_playroom[room].user.length] > 0) {
                        checkWin = E_playroom[room].nowPlaying;
                        java.lang.Thread.sleep(E_playroom[room].timer * 1000);

                        if (E_playroom[room] && E_playroom[room].nowPlaying == checkWin) {
                            E_playroom[room].life[E_playroom[room].nowPlaying % E_playroom[room].user.length]--;
                            E_playroom[room].used.push(E_playroom[room].used[E_playroom[room].nowPlaying]);
                            
                            E_playroom[room].nowPlaying++;
                            replier.reply(
                                "-=-=-=-=-=안내-=-=-=-=-=\n" +
                                "life 감소! 남은 life 수 : " + E_playroom[room].life[(E_playroom[room].nowPlaying-1) % E_playroom[room].user.length] +
                                "\n-=-=-=-=-=-=-=-=-=-=-=-=\n" +
                                "\""+E_playroom[room].user[(E_playroom[room].nowPlaying % E_playroom[room].user.length)] + "\"의 차례\n" +
                                startSyllable.join(" 또는 ") + "(으)로 시작하는 단어를 입력해주세요.\n" +
                                "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "/" + E_playroom[room].timer + "초\n" +
                                "-=-=-=-=-=-=-=-=-=-=-=-="
                                );
                        } else {
                            return;
                        }
                    }
                    var scoreboard = "";
                    for (let index = 0; index < E_playroom[room].user.length; index++) {
                        scoreboard += E_playroom[room].user[index] + " " + E_playroom[room].score[index] + "\n";
                    }
                    replier.reply(
                        "-=-=-=-=-=안내-=-=-=-=-=\n" +
                        "게임이 종료되었습니다.\n" +
                        E_playroom[room].user[(E_playroom[room].nowPlaying) % E_playroom[room].user.length] + "(이)가 게임에서 패배하였습니다.\n" +
                        "-=-=-=Length Score-=-=-=\n" +
                        scoreboard +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    delete E_playroom[room];
                    return;
                } else {
                replier.reply(
                    "-=-=-=-=-=안내-=-=-=-=-=\n" +
                    msg.join("") + "은(는) 사전에 등록되어 있지 않습니다.\n" +
                    "이전단어 : " + E_playroom[room].used[E_playroom[room].nowPlaying] + "\n" +
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