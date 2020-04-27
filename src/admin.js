const scriptName = "admin.js";
const botName = "민규봇";

var preSenders = null;
var preSendTime = null;
var preChat = null;
var coolDown = 5;

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

certification = {};

function OTP(time) {
    var OTPchar = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    this.otp = "";
    this.time = time;
    for (let index = 0; index < 15; index++) {
        this.otp += OTPchar[parseInt(Utils.getWebText("http://dsg01.dothome.co.kr/api/rand.php?type=number&min=0&max=62").replace(/(<([^>]+)>)/ig, ""))];
    }
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

        if (msg[0] == "@" + botName) {
            //봇끼리의 도배 방지 부분
            if (preSenders == sender && (nowTime - preSendTime) / 1000 <= coolDown) {
                return;
            }
            preSendTime = nowTime;
            preSenders = sender;

            if (msg[1] == "등록") {
                checkadmin = permissionCheck(sender, hash(ImageDB.getProfileImage()));
                if(checkadmin) {
                    replier.reply(
                        "-=-=-=-=-=알림-=-=-=-=-=\n" +
                        "이미 관리자로 등록 되어 있습니다.\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    return;
                }

                if (certification[sender]) {
                    if (certification[sender].otp == msg[2]) {
                        DataBase.appendDataBase("admin.txt", sender + "," + hash(ImageDB.getProfileImage()) + "}\n");
                        replier.reply(
                            "-=-=-=-=-=알림-=-=-=-=-=\n" +
                            "관리자로 등록되었습니다\n" +
                            "-=-=-=-=-=-=-=-=-=-=-=-="
                        );
                        delete certification[sender];
                    }
                } else {
                    replier.reply(
                        "-=-=-=-=-=알림-=-=-=-=-=\n" +
                        "60초 이내에 인증 번호를 입력해 주세요\n" +
                        "@민규봇 등록 {인증키}\n" +
                        "-=-=-=-=-=-=-=-=-=-=-=-="
                    );
                    certification[sender] = new OTP(nowTime);
                    Log.clear();
                    Log.i(sender + "-" + certification[sender].otp, true);
                    java.lang.Thread.sleep(60 * 1000);
                    if (certification[sender]) {
                        delete certification[sender];
                    }
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