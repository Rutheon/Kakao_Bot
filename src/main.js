const scriptName="main.js";
const botName = "민규봇";

var preSenders = null;
var preSendTime = null;
var preChat = null;

var coolDown = 5;
function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName, threadId){
    /*(이 내용은 길잡이일 뿐이니 지우셔도 무방합니다)
     *(String) room: 메시지를 받은 방 이름
     *(String) msg: 메시지 내용
     *(String) sender: 전송자 닉네임
     *(boolean) isGroupChat: 단체/오픈채팅 여부
     *replier: 응답용 객체. replier.reply("메시지") 또는 replier.reply("방이름","메시지")로 전송
     *(String) ImageDB.getProfileImage(): 전송자의 프로필 이미지를 Base64로 인코딩하여 반환
     *(String) packageName: 메시지를 받은 메신저의 패키지 이름. (카카오톡: com.kakao.talk, 페메: com.facebook.orca, 라인: jp.naver.line.android
     *(int) threadId: 현재 쓰레드의 순번(스크립트별로 따로 매김)     *Api,Utils객체에 대해서는 설정의 도움말 참조*/

    var nowTime = Date.now();
    var date = new Date();

    msg = msg.split(' ');

    if (msg[0] == "!"+botName) {
        //봇끼리의 도배 방지 부분
        if(preSenders == sender && (nowTime-preSendTime)/1000 <= coolDown)
        {
            return;
        }
        preSendTime = nowTime;
        preSenders = sender;

        if (msg[1] == null) {
            replier.reply(botName+"을 처음 만난다면 \"!"+botName+" 도움말\"을 입력해주세요.");
        }

        if (msg[1] == "도움말") {
            replier.reply(
                "도움말 - "+botName+"의 명령어를 출력합니다.\n" +
                "학식 [학식당] - 학식당의 메뉴를 출력합니다.(버그 수정중)\n" +
                "상태 - 구동환경의 상태를 출력합니다.\n" +
                "문제풀이 [사이트] [문제번호] - (임시 운영) 1학년 프로그래밍 과제에 대한 해설을 제공합니다.\n"+
                "코드는 제공하지 않습니다\n"
            );
        }

        if (msg[1] == "문제풀이") {
            switch(msg[2]) {
                case "boj":
                case "lavida":
                case "ascode":
                    break;

                default:
                replier.reply(
                    "풀이가 필요한 사이트를 입력해 주세요.\n" +
                    "백준온라인 - boj\n" +
                    "lavida - lavida\n" +
                    "ascode - ascode\n" +
                    "!"+botName+" [사이트] [문제번호]\n" +
                    "ex) !"+botName+" lavida 1000"
                );
                return;
            }
            
            if (msg[3] == null || parseInt(msg[3], 10) < 1000) {
                replier.reply(
                    "풀이가 필요한 번호를 입력해 주세요.\n" +
                    "!민규봇 [사이트] [문제번호]\n" +
                    "ex) !"+botName+" lavida 1000"
                );
                return;
            }
            else{
                if(msg[4] == "등록"){
                    data = msg.join(" ").replace(/^!해설봇.문제풀이 ((lavida)|(ascode)|(boj))\s([0-9]){4,}\s등록 /gi, "[해설] ");
                    DataBase.appendDataBase(msg[2]+"/"+msg[3], data);
                    return;
                }

                if(DataBase.getDataBase(msg[2]+"/"+msg[3]) == null){
                    replier.reply(
                        "아직 준비중인 기능입니다." + msg[3] + "번 데이터 추가 중"
                    );
                }
                else{
                    replier.reply(
                        DataBase.getDataBase(msg[2]+"/"+msg[3])
                    );
                }
            }
        }

        if (msg[1] == "상태") {
            replier.reply(
                "모델명: " + Device.getPhoneBrand() + " "+ Device.getPhoneModel() + "\n" + 
                "안드로이드 버전: " + Device.getAndroidVersionName() + "\n" +
                "배터리 잔량: " + Device.getBatteryLevel() + "%\n" +
                "배터리 온도: " + Device.getBatteryTemperature()/10 + "°C\n" +
                "충전 상태: " + Device.isCharging() 
            );
        }
    }
    
}

function onStartCompile(){
    /*컴파일 또는 Api.reload호출시, 컴파일 되기 이전에 호출되는 함수입니다.
     *제안하는 용도: 리로드시 자동 백업*/
    
}

//아래 4개의 메소드는 액티비티 화면을 수정할때 사용됩니다.
function onCreate(savedInstanceState,activity) {
    var layout=new android.widget.LinearLayout(activity);
    layout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    var txt=new android.widget.TextView(activity);
    txt.setText("액티비티 사용 예시입니다.");
    layout.addView(txt);
    activity.setContentView(layout);
}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}