///<reference path="../../../runeappslib.js">
///<reference path="../../../imagedetect.js">
///<reference path="../../../alt1lib.js.js">
///<reference path="../../../imagelibs/chatbox.js">

////============================================================================================================================
//utility functions
function HMSToSeconds(s) {
    var b = s.split(':');
    return b[0]*3600 + b[1]*60 + (+b[2] || 0);
}

function MSToSeconds(s) {
    var b = s.split(':');
    return (parseFloat(b[0])*60) + parseFloat(b[1])
}

function secondsToHMS(secs) {
    function z(n){return (n<10?'0':'') + n;}
    var sign = secs < 0? '-':'';
    secs = Math.abs(secs);
    millis = Math.round(10*(secs - Math.floor(secs))); //.X
    return sign + z(Math.floor(secs/60))+ ':' + z(Math.floor(secs - (Math.floor(secs/60)*60))) + '.' + millis;
}

function addWaveRow(content,morecontent)
{
         if (!document.getElementById) return;
         var table = document.getElementById("overview");
         var row = table.insertRow(-1);
         var cell1 = row.insertCell(0);
         var cell2 = row.insertCell(1);
         cell1.innerHTML = content;
         cell2.innerHTML = morecontent;
}

function addQSRow(content)
{
         if (!document.getElementById) return;
         var table = document.getElementById("overview2");
         var row = table.insertRow(-1);
         var cell1 = row.insertCell(0);
         cell1.innerHTML = content;
}
//============================================================================================================================
//define alt1 chatbox reader
var reader = new ChatBoxReader();

reader.readargs = {
	colors: [
		a1lib.mixcolor(255, 0, 255),
		a1lib.mixcolor(0, 255, 255),
		a1lib.mixcolor(255, 0, 0),
		a1lib.mixcolor(255, 255, 255),
		a1lib.mixcolor(127, 169, 255)
	],
	backwards: true
};

//main function
function start() {

    if (window.alt1) {
        reader.find();

        //define variables
        var counting_wave = false     //are we currently counting wave time?
        var counting_qs = false       //are we currently counting qs time?
        //var timestring_end = ''       //wave ending timestamp to be captured
        //var timestring_start = ''     //wave start timestamp to be captured
        //var wave_number = 1           //naive 1-9 counter, to be changed to regex matching later?
        var wave_reg = 0               //variable to store current wave #
        var wave_counter = 0          //counter for #ticks passed during a wave
        var tick_counter = 0          //counter for # ticks passed during a qs
        var isrecent = false          //boolean for if a message captured is recent enough to be considered
        var elapsed_time = '00:00.0' //elapsed time variable
        
        //run following code on an interval of 600ms
	setInterval(function () {
            console.log('tick')
            if(counting_qs){tick_counter = tick_counter + 1}
            if(counting_wave){wave_counter = wave_counter + 1}
            isrecent = false //default to false, just in case
            var opts = reader.read() || []; //read chatbox, new lines stored in opts
            
	    for (var a = 0; a < opts.length; a++) { //loop through new lines

                console.log(opts[a].text);
                
                //regex match to reset times functionality
		if (opts[a].text.match(/(Your application has been accepted|All roles have been cleared)/i)) { 

                    //check if captured message is recent
                    msg_time = HMSToSeconds(opts[a].text.substring(1,9)) //hh:(mm:ss.0)
                    system_tstring = new Date().toTimeString().substring(0,8); //24:(mm:ss.0) 
                    system_time =  HMSToSeconds(system_tstring) 
                    isrecent = (Math.abs(system_time - msg_time) < 2)

                    //if message is recent, reset all variables and clear tables. Reset elapsed time.
                    if(isrecent){
                        console.log('Reset!')

                        //reset variables
                        counting_wave = false
                        wave_number = 1
                        tick_counter = 0
                        wave_counter = 0
                        counting_qs = false
                        elapsed_time = '00:00.0'

                        //remove all children from all tables
                        var table = document.getElementById("overview");
                        for(var i = table.rows.length - 1; i > 0; i--)
                        {
                            table.deleteRow(i);
                        }

                        var table = document.getElementById("overview2");
                        for(var i = table.rows.length - 1; i > 0; i--)
                        {
                            table.deleteRow(i);
                        }

                        //reset elapsed time
                        document.getElementById("myText").innerHTML = elapsed_time;
                        isrecent = false //reset to false
                    }
                }
                
                //deploy regex:   /.*Wave:*/i
                //testing regex:  /You have set your game to.*/i
                //regex match to WAVE START functionality
                if (opts[a].text.match(/.*Wave:*/i)) { 

                    //check if captured message is recent
                    msg_time = HMSToSeconds(opts[a].text.substring(1,9)) //hh:(mm:ss.0)
                    system_tstring = new Date().toTimeString().substring(0,8); //24:(mm:ss.0) 
                    system_time =  HMSToSeconds(system_tstring) 
                    isrecent = (Math.abs(system_time - msg_time) < 2)

                    //if message is recent, store the wave start timestamp
                    if(isrecent){
                        counting_qs = false
                        counting_wave = true
                        wave_reg = opts[a].text.substring(10).replace(/\D/g, "")
                        //if tick counter has been running, add a row to the qs table with qs time.
                        if(tick_counter > 0){
                            addQSRow(tick_counter);

                            //add qs time to elapsed time
                            elapsed_time = secondsToHMS(MSToSeconds(elapsed_time) + (tick_counter*0.6))
                            document.getElementById("myText").innerHTML = elapsed_time;

                            //reset tick counter
                            tick_counter = 0 
                        }
                        isrecent = false //reset to false
                    }
                }

                //deployment regex: /You have earned.*thaler.*/g
                //testing regex:    /You've set your role to.*/g
                //regex match to WAVE END functionality
		if (opts[a].text.match(/You have earned.*thaler.*/g)) {

                    //check if captured message is recent
                    msg_time = HMSToSeconds(opts[a].text.substring(1,9)) //hh:(mm:ss.0)
                    system_tstring = new Date().toTimeString().substring(0,8); //24:(mm:ss.0) 
                    system_time =  HMSToSeconds(system_tstring) 
                    isrecent = (Math.abs(system_time - msg_time) < 2)

                    //is message is recent and we are counting wave time, get the timestamp difference and add row to wave table
                    if (counting_wave && isrecent) {

                        counting_qs = true
                        counting_wave = false

                        //add time delta to html table and update variables
                        var deltatime = secondsToHMS(wave_counter*0.6)
                        addWaveRow('Wave ' + wave_reg + ':', deltatime)
                        //wave_number = wave_number + 1 //Wave X: on html table

                        //update elapsed time with wave time

                        elapsed_time = secondsToHMS(MSToSeconds(elapsed_time) + (wave_counter*0.6))
                        document.getElementById("myText").innerHTML = elapsed_time;

                        wave_counter = 0
                        isrecent = false //reset to false
                        }
                }   
            }
            

            

            
		}, 600);
	} else {
		$("#overview").html('<a href="alt1://addapp/http://holycoil.nl/alt1/aod/appconfig.json">Click here to add this app</a>'); 
	}
}
