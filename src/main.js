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
            replier.reply(botName+"을 처음 만난다면 봇을 언급하고 도움말을 입력해주세요.");
        }

        if (msg[1] == "도움말") {
            replier.reply(
                "도움말 - "+botName+"의 명령어를 출력합니다.\n" +
                "학식 [학식당] - 학식당의 메뉴를 출력합니다.\n" +
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
                    botStartCmd+" [사이트] [문제번호]\n" +
                    "ex) "+botStartCmd+" lavida 1000"
                );
                return;
            }
            
            if (msg[3] == null || parseInt(msg[3], 10) < 1000) {
                replier.reply(
                    "풀이가 필요한 번호를 입력해 주세요.\n" +
                    botStartCmd+" [사이트] [문제번호]\n" +
                    "ex) "+botStartCmd+" lavida 1000"
                );
                return;
            }
            else{
                if(msg[4] == "등록"){
                    data = msg.join(" ").replace(/^!민규봇.문제풀이 ((lavida)|(ascode)|(boj))\s([0-9]){4,}\s등록 /gi, "[해설] ");
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
                return;
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

        if (msg[1] == "학식") {
            switch (msg[2]) {
                case "수덕전":
                    option1 = 1;
                    option2 = 1;                    
                    break;
                case "정보관":
                    option1 = 1;
                    option2 = 2;
                    break;
                case "기숙사":
                    option1 = 2;
                    option2 = 1;
                    break;
                        
                default:
                    if (msg[2] == null) {
                        replier.reply(
                            "조회할 학식당을 골라주세요\n" +
                            "정보관\n" +
                            "수덕전\n" +
                            "기숙사\n" +
                            "ex) "+botStartCmd+" 학식 정보관"
                        );    
                    }
                    else {
                        replier.reply("장소 입력이 잘못되었습니다.");
                    }
                    return;
            }
                
            // 날짜 설정
            var year = date.getFullYear(), mm = date.getMonth()+1, dd = date.getDate();
            if(dd<10){
                dd = '0' + dd;
            }
            if (mm < 10){
                mm = '0' + mm;
            }
            var today = String(year)+mm+dd;
            
            var link = "https://smart.deu.ac.kr/m/sel_dfood?date="+today+"&gubun1="+String(option1)+"&gubun2="+String(option2);
            var webData = Utils.getWebText(link).replace(/(<([^>]+)>)/ig,"");
            var menuJSON = JSON.parse(webData);

            var sendMSG = "";
            var menu = null; 
            switch (msg[2]) {
                case "기숙사":
                    if (menuJSON["기숙사 식당 조식"] != null) {
                        menu = menuJSON["기숙사 식당 조식"];
                        sendMSG = menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["기숙사 식당 중식"] != null) {
                        menu = menuJSON["기숙사 식당 중식"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["기숙사 식당 석식"] != null) {
                        menu = menuJSON["기숙사 식당 석식"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    break;
                case "수덕전":
                    if (menuJSON["수덕전 코너1"] != null) {
                        menu = menuJSON["수덕전 코너1"];
                        sendMSG = menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["수덕전 코너2"] != null) {
                        menu = menuJSON["수덕전 코너2"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["수덕전 코너3"] != null) {
                        menu = menuJSON["수덕전 코너3"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["수덕전 코너4"] != null) {
                        menu = menuJSON["수덕전 코너4"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    break;
                case "정보관":
                    if (menuJSON["정보공학관 코너1"] != null) {
                        menu = menuJSON["정보공학관 코너1"];
                        sendMSG = menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["정보공학관 코너2"] != null) {
                        menu = menuJSON["정보공학관 코너2"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["정보공학관 코너3"] != null) {
                        menu = menuJSON["정보공학관 코너3"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    if (menuJSON["정보공학관 코너4"] != null) {
                        menu = menuJSON["정보공학관 코너4"];
                        sendMSG = sendMSG + menu[0].kioskName + " ("+menu[0].menuTime+")\n" + menu[0].menuName+"\n\n";
                    }
                    break;
            
                default:
                    break;
            }

            if(sendMSG == "")
            {
                sendMSG = "업로드 된 학식단이 없습니다.";
            }
            else{
                sendMSG = sendMSG + "입니다..";
            }
            replier.reply(sendMSG);
            return;
        }

        if(msg[1] == "날씨"){
            cmd = msg.join(" ").substr(7);
            cmd.trim();
            try{
             var weatherStr ="";
             
             var weatherarea = org.jsoup.Jsoup.connect("https://m.search.naver.com/search.naver?query=" + cmd + "날씨").get().select("div.title_wrap").select("h2").text();
             
             if ( !weatherarea ) {
              replier.reply(cmd + " 의 날씨 정보를 가져올 수 없습니다.");
              return;
             }
             var weatherdata = org.jsoup.Jsoup.connect("https://m.search.naver.com/search.naver?query=" + cmd + "날씨").get().select("div.status_wrap");
             
             var weathertom = org.jsoup.Jsoup.connect("https://m.search.naver.com/search.naver?query=" + cmd + "날씨").get().select("div.inner_box");
             
             var wtmain = weatherdata.select("div.weather_main").get(0).text(); // 현재 날씨
             var nowtem = weatherdata.select("div.temperature_text").get(0).text().replace("현재 온도", "").replace("°", "") + " ℃"; // 현재 온도
             var uptem = weatherdata.select("dd.up_temperature").text().replace("°", "") + " ℃"; // 최고 온도
             var dntem = weatherdata.select("dd.down_temperature").text().replace("°", "") + " ℃"; // 최저 온도
             var fltem = weatherdata.select("dd.feeling_temperature").text().replace("체감", "").replace("°", "") + " ℃"; // 체감 온도
             
             var reportlist = weatherdata.select("ul.list_box");
             
             var rpsp = reportlist.select("li.type_report report8").select("span.figure_text").text();
             var rptext = reportlist.select("span.figure_text").text().split(" ");
             var rpresult = reportlist.select("span.figure_result").text().split(" ");
             
             var titlelist = [["미세먼지", "초미세먼지", "자외선", "습도", "바람"],["㎍/㎥", "㎍/㎥", "", "%", "m/s"]];
             
             weatherStr = weatherStr + "[ " + cmd + " ] 의 날씨 정보입니다.\n 위치 : " + weatherarea;
             weatherStr = weatherStr + "\n\n현재 날씨 : " + wtmain + "\n현재 온도 : " + nowtem + "\n최고 온도 : " + uptem + "\n최저 온도 : " + dntem + "\n체감 온도 : " + fltem + "\n";
          
             if (rptext.length > rpresult.length){
              weatherStr = weatherStr + "\n기상 특보 : " + rptext[0];
              for ( var i = 0; i < rpresult.length ; i ++) {
               weatherStr = weatherStr + "\n" + titlelist[0][i] + " : " + rptext[i+1] + "   " + rpresult[i] + " " + titlelist[1][i];
              }
             } else {
              for ( var i = 0; i < rptext.length ; i ++) {
               weatherStr = weatherStr + "\n" + titlelist[0][i] + " : " + rptext[i] + "   " + rpresult[i] + " " + titlelist[1][i];
              }
             }
             
             weatherStr = weatherStr + "\n\n내일 오전 날씨 : " + weathertom.select("div.weather_main").get(0).text() + ", " + weathertom.select("strong").get(0).text() + "\n        강수확률 : " + weathertom.select("strong").get(1).text();
             weatherStr = weatherStr + "\n\n내일 오후 날씨 : " + weathertom.select("div.weather_main").get(1).text() + ", " + weathertom.select("strong").get(2).text() + "\n        강수확률 : " + weathertom.select("strong").get(3).text();
             
             replier.reply(weatherStr);
            } catch(e) {
             replier.reply(cmd + " 의 날씨 정보를 가져올 수 없습니다.");
            }
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