///<reference path="../../../runeappslib.js">
///<reference path="../../../imagedetect.js">
///<reference path="../../../alt1lib.js.js">
///<reference path="../../../imagelibs/chatbox.js">

////============================================================================================================================
//utility functions

function hmsToSeconds(s) {
    var b = s.split(':');
    return b[0]*3600 + b[1]*60 + (+b[2] || 0);
}

function secondsToHMS(secs) {
    function z(n){return (n<10?'0':'') + n;}
    var sign = secs < 0? '-':'';
    secs = Math.abs(secs);
    return sign + z(secs/3600 |0) + ':' + z((secs%3600) / 60 |0) + ':' + z(secs%60);
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
        var timestring_end = ''       //wave ending timestamp to be captured
        var timestring_start = ''     //wave start timestamp to be captured
        var wave_counter = 1          //naive 1-9 counter, to be changed to regex matching later?
        var tick_counter = 0          //counter for # ticks passed during a qs
        var isrecent = false          //boolean for if a message captured is recent enough to be considered
        var elapsed_time = '00:00:00' //elapsed time variable
        
        //run following code on an interval of 600ms
		setInterval(function () {
            console.log('tick')
            if(counting_qs){tick_counter = tick_counter + 1}
            isrecent = false //default to false, just in case
            var opts = reader.read() || []; //read chatbox, new lines stored in opts
            
			for (var a = 0; a < opts.length; a++) { //loop through new lines

                console.log(opts[a].text);
                
                //regex match to reset times functionality
				if (opts[a].text.match(/(Your application has been accepted|All roles have been cleared)/i)) { 

                    //check if captured message is recent
                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    //if message is recent, reset all variables and clear tables. Reset elapsed time.
                    if(isrecent){
                        console.log('Reset!')

                        //reset variables
                        counting_wave = false
                        wave_counter = 1
                        tick_counter = 0
                        counting_qs = false
                        elapsed_time = '00:00:00'

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
                if (opts[a].text.match(/You have set your game to.*/i)) { 

                    console.log('timer started...')
                    console.log(timestring_start)

                    //check if captured message is recent
                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    //if message is recent, store the wave start timestamp
                    if(isrecent){
                        counting_qs = false
                        counting_wave = true
                        timestring_start = opts[a].text.substring(1,9); //wave start timestamp

                        //if tick counter has been running, add a row to the qs table with qs time.
                        if(tick_counter > 0){
                            addQSRow(tick_counter);
                            //add qs time to elapsed time
                            elapsed_time = secondsToHMS(hmsToSeconds(elapsed_time) + Math.round(tick_counter*0.6))
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
				if (opts[a].text.match(/You've set your role to.*/g)) {

                    //check if captured message is recent
                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    //is message is recent and we are counting wave time, get the timestamp difference and add row to wave table
                    if (counting_wave && isrecent) {
                        console.log('entered math zone')

                        //get the time delta of wave start and wave end
                        timestring_end = opts[a].text.substring(1,9)
                        var deltatime = secondsToHMS(hmsToSeconds(timestring_end) - hmsToSeconds(timestring_start))
                        time_output = deltatime

                        //add time delta to html table and update variables
                        addWaveRow('Wave ' + wave_counter + ':', time_output)
                        wave_counter = wave_counter + 1 //Wave X: on html table
                        counting_qs = true
                        
                        //update elapsed time with wave time
                        elapsed_time = secondsToHMS(hmsToSeconds(elapsed_time) + hmsToSeconds(deltatime))
                        document.getElementById("myText").innerHTML = elapsed_time;

                        isrecent = false //reset to false
                        }
                }   
            }
            

            

            
		}, 600);
	} else {
		$("#overview").html('<a href="alt1://addapp/http://holycoil.nl/alt1/aod/appconfig.json">Click here to add this app</a>'); 
	}
}
