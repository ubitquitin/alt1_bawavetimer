///<reference path="../../../runeappslib.js">
///<reference path="../../../imagedetect.js">
///<reference path="../../../alt1lib.js.js">
///<reference path="../../../imagelibs/chatbox.js">

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

var times = [];

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

function start() {

	if (window.alt1) {
        reader.find();

        //ul = document.createElement('ul');
        //document.getElementById('overview').appendChild(ul);
        var hasstart = false
        var counting_qs = false
        var timestring_end = ''
        var timestring_start = ''
        var wave_counter = 1
        var tick_counter = 0
        var isrecent = false
        var wave_regex = ''
		
		setInterval(function () {

            console.log('tick')
            if(counting_qs){tick_counter = tick_counter + 1}
            isrecent = false
            var opts = reader.read() || [];
            
			for (var a = 0; a < opts.length; a++) {

                console.log(opts[a].text);
                
				if (opts[a].text.match(/(Your application has been accepted|All roles have been cleared)/i)) { 

                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    if(isrecent){
                        times = [];
                        console.log('Reset!')
                        hasstart = false
                        wave_counter = 1
                        tick_counter = 0
                        counting_qs = false

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

                        isrecent = false
                    }
                }
                
                //opts[a].text.match(/.*Wave:*/i)
                //testing:  /You have set your game to.*/i
                if (opts[a].text.match(/You have set your game to.*/i)) { 


                    console.log('timer started...')
                    console.log(timestring_start)

                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    if(isrecent){
                        counting_qs = false
                        hasstart = true
                        timestring_start = opts[a].text.substring(1,9);
                        if(tick_counter > 0){
                            addQSRow(tick_counter);
                            tick_counter = 0 //reset counter
                        }
                        
                        isrecent = false
                    }

                    
                }

                //var minmatch = opts[a].text.match(/You have earned.*thaler.*/g);
                //testing: /You've set your role to.*/g
                var minmatch = opts[a].text.match(/You've set your role to.*/g);

				if (minmatch) {

                    msg_time = hmsToSeconds(opts[a].text.substring(1,9)) * 1000 //ms
                    system_tstring = new Date().toTimeString().substring(0,8); // 24:mm:ss 
                    system_time =  hmsToSeconds(system_tstring) * 1000 //ms
                    isrecent = (Math.abs(system_time - msg_time) < 2000)
                    console.log(isrecent)
                    console.log(system_tstring)
                    console.log(opts[a].text.substring(1,9))

                    if (hasstart && isrecent) {
                        console.log('entered math zone')

                        timestring_end = opts[a].text.substring(1,9)
                        var deltatime = secondsToHMS(hmsToSeconds(timestring_end) - hmsToSeconds(timestring_start))
                        time_output = deltatime

                        times.push(time_output);
                        var numberPattern = /\d+/g;
                        //wavecounter for testing, wave regex for prod
                        addWaveRow('Wave ' + wave_counter + ':', time_output)
                        wave_counter = wave_counter + 1
                        counting_qs = true

                        isrecent = false
                        }
                }
                
            }
            

            

            
		}, 600);
	} else {
		$("#overview").html('<a href="alt1://addapp/http://holycoil.nl/alt1/aod/appconfig.json">Click here to add this app</a>'); 
	}
}